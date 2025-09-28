#!/usr/bin/env ruby
# frozen_string_literal: true

require 'openssl'
require 'base64'
require 'json'
require 'net/http'
require 'uri'

# Helper to fetch required environment variables.
def env!(name)
  ENV.fetch(name) do
    warn "Missing required environment variable: #{name}"
    exit 1
  end
end

# Pad signature components for App Store Connect JWT signing.
def pad_component(component)
  bytes = component.to_s(2)
  if bytes.bytesize < 32
    ("\x00" * (32 - bytes.bytesize)) + bytes
  elsif bytes.bytesize > 32
    bytes[-32, 32]
  else
    bytes
  end
end

# Build a JWT to interact with App Store Connect.
def build_token(private_key_pem, key_id, issuer_id)
  key = OpenSSL::PKey.read(private_key_pem)
  unless key.is_a?(OpenSSL::PKey::EC)
    warn 'App Store Connect key must be an EC private key'
    exit 1
  end

  header = { alg: 'ES256', kid: key_id, typ: 'JWT' }
  payload = { iss: issuer_id, exp: Time.now.to_i + 20 * 60, aud: 'appstoreconnect-v1' }
  segments = [header, payload].map { |part| Base64.urlsafe_encode64(part.to_json, padding: false) }
  signing_input = segments.join('.')
  digest = OpenSSL::Digest::SHA256.digest(signing_input)
  der_signature = key.dsa_sign_asn1(digest)
  asn1 = OpenSSL::ASN1.decode(der_signature)
  r_bn, s_bn = asn1.value.map(&:value)
  signature_raw = pad_component(r_bn) + pad_component(s_bn)
  signature_b64 = Base64.urlsafe_encode64(signature_raw, padding: false)
  "#{signing_input}.#{signature_b64}"
end

# Handle CI environment variables that may be Base64 without PEM headers.
def normalize_private_key(raw)
  expanded = raw.include?('-----BEGIN') ? raw : Base64.decode64(raw)
  expanded.gsub("\n", "\n")
end

bundle_id = env!('APP_IDENTIFIER')
private_key = normalize_private_key(env!('APP_STORE_CONNECT_PRIVATE_KEY'))
key_id = env!('APP_STORE_CONNECT_KEY_IDENTIFIER')
issuer_id = env!('APP_STORE_CONNECT_ISSUER_ID')

token = build_token(private_key, key_id, issuer_id)

api_host = 'https://api.appstoreconnect.apple.com'
apps_uri = URI("#{api_host}/v1/apps")
apps_uri.query = URI.encode_www_form('filter[bundleId]' => bundle_id, 'include' => 'betaAppReviewSubmissions')
apps_req = Net::HTTP::Get.new(apps_uri)
apps_req['Authorization'] = "Bearer #{token}"

apps_res = Net::HTTP.start(apps_uri.host, apps_uri.port, use_ssl: true) { |http| http.request(apps_req) }
unless apps_res.is_a?(Net::HTTPSuccess)
  warn "Failed to query App Store Connect apps: #{apps_res.code} #{apps_res.body}"
  exit 1
end

payload = JSON.parse(apps_res.body)
data = payload.fetch('data', [])
if data.empty?
  warn "No App Store Connect app found for bundle id #{bundle_id}"
  exit 1
end

review_resources = (payload['included'] || []).select { |resource| resource['type'] == 'betaAppReviewSubmissions' }
actionable = review_resources.select do |resource|
  %w[WAITING_FOR_REVIEW IN_REVIEW].include?(resource.dig('attributes', 'betaReviewState'))
end

if actionable.empty?
  puts 'No in-flight Beta App Review submissions to cancel.'
  exit 0
end

actionable.each do |submission|
  submission_id = submission.fetch('id')
  state = submission.dig('attributes', 'betaReviewState')
  puts "Cancelling Beta App Review submission #{submission_id} (state: #{state})"
  delete_uri = URI("#{api_host}/v1/betaAppReviewSubmissions/#{submission_id}")
  delete_req = Net::HTTP::Delete.new(delete_uri)
  delete_req['Authorization'] = "Bearer #{token}"
  delete_res = Net::HTTP.start(delete_uri.host, delete_uri.port, use_ssl: true) { |http| http.request(delete_req) }
  unless delete_res.is_a?(Net::HTTPNoContent)
    warn "Unable to cancel submission #{submission_id}: #{delete_res.code} #{delete_res.body}"
    exit 1
  end
end

puts "Cleared #{actionable.length} TestFlight beta review submission(s)."
