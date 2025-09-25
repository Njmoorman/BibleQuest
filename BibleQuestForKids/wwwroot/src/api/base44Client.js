import { createClient } from '@base44/sdk';

// When the bundle is loaded inside the MAUI WebView (or when a static build is
// opened from disk/localhost) there is no Base44 auth proxy available. Trying
// to enforce auth in those environments immediately triggers the redirect that
// breaks the embedded experience. Detect that scenario up-front and disable the
// automatic redirect while still keeping it enabled for the hosted web build.
const isEmbeddedApp = typeof window !== 'undefined' && (
  window.location.protocol === 'file:' ||
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'
);

export const base44 = createClient({
  appId: "68b5db021209c8588c31fed7",
  requiresAuth: !isEmbeddedApp
});
