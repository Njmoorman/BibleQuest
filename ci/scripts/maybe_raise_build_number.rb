#!/usr/bin/env ruby
# frozen_string_literal: true

require 'openssl'
require 'base64'
require 'json'
require 'net/http'
require 'uri'

# Utility to fetch environment variables with helpful errors for CI logs.
def env!(name)
  value = ENV[name]
  raise "Missing required environment variable #{name}" if value.nil? || value.empty?
  value
end

# Handles the case where CI secrets may store the private key without PEM headers.
def normalize_private_key(raw)
  return raw if raw.include?('-----BEGIN')

  Base64.decode64(raw)
end

# Build a JWT for App Store Connect.
def build_token(private_key_pem, key_id, issuer_id)
  key = OpenSSL::PKey.read(private_key_pem)
  raise 'App Store Connect key must be an EC private key' unless key.is_a?(OpenSSL::PKey::EC)

  header = { alg: 'ES256', kid: key_id, typ: 'JWT' }
  payload = { iss: issuer_id, exp: Time.now.to_i + 20 * 60, aud: 'appstoreconnect-v1' }
  segments = [header, payload].map { |part| Base64.urlsafe_encode64(part.to_json, padding: false) }
  signing_input = segments.join('.')
  digest = OpenSSL::Digest::SHA256.digest(signing_input)
  der_signature = key.dsa_sign_asn1(digest)
  asn1 = OpenSSL::ASN1.decode(der_signature)
  r_bn, s_bn = asn1.value.map(&:value)

  pad = lambda do |component|
    hex = component.to_s(16)
    hex = "0#{hex}" if hex.length.odd?
    [hex].pack('H*').rjust(32, "\x00")
  end

  signature_raw = pad.call(r_bn) + pad.call(s_bn)
  signature_b64 = Base64.urlsafe_encode64(signature_raw, padding: false)
  "#{signing_input}.#{signature_b64}"
end

bundle_id = env!('APP_IDENTIFIER')
target_version = env!('APP_DISPLAY_VERSION')
requested_build = ENV.fetch('APP_BUILD_NUMBER', '')

requested_numeric = begin
  Integer(requested_build)
rescue ArgumentError, TypeError
  nil
end

private_key_pem = normalize_private_key(env!('APP_STORE_CONNECT_PRIVATE_KEY'))
key_id = env!('APP_STORE_CONNECT_KEY_IDENTIFIER')
issuer_id = env!('APP_STORE_CONNECT_ISSUER_ID')

token = build_token(private_key_pem, key_id, issuer_id)

api_host = 'https://api.appstoreconnect.apple.com'
apps_uri = URI("#{api_host}/v1/apps")
apps_uri.query = URI.encode_www_form('filter[bundleId]' => bundle_id)
apps_req = Net::HTTP::Get.new(apps_uri)
apps_req['Authorization'] = "Bearer #{token}"

apps_res = Net::HTTP.start(apps_uri.host, apps_uri.port, use_ssl: true) { |http| http.request(apps_req) }
unless apps_res.is_a?(Net::HTTPSuccess)
  warn "Unable to query App Store Connect apps: #{apps_res.code} #{apps_res.body}"
  puts(requested_numeric || '')
  exit 0
end

payload = JSON.parse(apps_res.body)
app_data = payload.fetch('data', [])
if app_data.empty?
  warn "No App Store Connect app found for bundle id #{bundle_id}"
  puts(requested_numeric || '')
  exit 0
end

app_id = app_data.first.fetch('id')

def fetch_build_numbers(uri, token)
  req = Net::HTTP::Get.new(uri)
  req['Authorization'] = "Bearer #{token}"

  res = Net::HTTP.start(uri.host, uri.port, use_ssl: true) { |http| http.request(req) }
  return nil unless res.is_a?(Net::HTTPSuccess)

  payload = JSON.parse(res.body)
  payload.fetch('data', []).map do |item|
    begin
      Integer(item.dig('attributes', 'buildVersion'))
    rescue ArgumentError, TypeError
      nil
    end
  end.compact
end

builds_uri = URI("#{api_host}/v1/builds")
params = {
  'filter[app]' => app_id,
  'sort' => '-buildVersion',
  'limit' => '10'
}
params['filter[preReleaseVersion.version]'] = target_version unless target_version.to_s.empty?
builds_uri.query = URI.encode_www_form(params)

build_numbers = fetch_build_numbers(builds_uri, token)

if build_numbers.nil?
  warn "Unable to query App Store Connect builds: request failed"
  puts(requested_numeric || '')
  exit 0
end

if build_numbers.empty? && !target_version.to_s.empty?
  warn 'No existing builds found for target marketing version; falling back to global max'
  fallback_uri = URI("#{api_host}/v1/builds")
  fallback_params = {
    'filter[app]' => app_id,
    'sort' => '-buildVersion',
    'limit' => '10'
  }
  fallback_uri.query = URI.encode_www_form(fallback_params)
  fallback_numbers = fetch_build_numbers(fallback_uri, token)
  build_numbers = fallback_numbers if fallback_numbers&.any?
end

max_remote = build_numbers&.max

recommended = if max_remote
  if requested_numeric && requested_numeric > max_remote
    requested_numeric
  else
    max_remote + 1
  end
else
  requested_numeric || 1
end

puts recommended
