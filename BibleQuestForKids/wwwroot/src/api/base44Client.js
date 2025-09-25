import { createClient } from '@base44/sdk';

// When the bundle is loaded inside the MAUI WebView (or when a static build is
// opened from disk/localhost) there is no Base44 auth proxy available. Trying
// to enforce auth in those environments immediately triggers the redirect that
// breaks the embedded experience. Detect that scenario up-front and disable the
// automatic redirect while still keeping it enabled for the hosted web build.
const isEmbeddedApp = typeof window !== 'undefined' && (() => {
  const { protocol } = window.location;
  const hostname = (window.location.hostname || '').toLowerCase();

  // Local WebView assets render with the file protocol or custom app schemes.
  if (protocol === 'file:' || protocol === 'app:' || protocol === 'appdata:') {
    return true;
  }

  // In debug the MAUI WebView rewrites requests to loopback addresses.
  const loopbackHosts = new Set(['', 'localhost', '127.0.0.1', '0.0.0.0']);
  if (loopbackHosts.has(hostname)) {
    return true;
  }

  // Android emulators often proxy through 10.0.2.2, and dev certificates use .local TLDs.
  if (hostname === '10.0.2.2' || hostname.endsWith('.local')) {
    return true;
  }

  // Only production (https + real domain) should hard-enforce Base44 auth.
  return protocol !== 'https:';
})();

export const base44 = createClient({
  appId: "68b5db021209c8588c31fed7",
  requiresAuth: !isEmbeddedApp
});
