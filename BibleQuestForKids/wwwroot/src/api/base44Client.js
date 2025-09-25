import { createClient } from '@base44/sdk';

// MAUI TestFlight builds run in an isolated WebView without the Base44 login
// redirect flow. Allow the requirement to be toggled at build time so we can
// keep exercising the UI while the auth experience is still under
// construction. Vite only exposes environment variables prefixed with `VITE_`.
const rawRequireAuth = import.meta.env?.VITE_BASE44_REQUIRE_AUTH;
const requiresAuth = rawRequireAuth
  ? !['false', '0', 'no'].includes(String(rawRequireAuth).toLowerCase())
  : true;

if (!requiresAuth) {
  // eslint-disable-next-line no-console
  console.info('Base44 auth disabled – using unauthenticated TestFlight mode');
}

export const base44 = createClient({
  appId: '68b5db021209c8588c31fed7',
  requiresAuth
});

export const BASE44_REQUIRES_AUTH = requiresAuth;
