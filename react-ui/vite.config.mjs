import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // Automatic JSX runtime (React 19 warns about the classic transform).
  plugins: [
    react(),
    // The service worker is irrelevant under Vitest; skip the plugin to keep test runs fast.
    ...(process.env.VITEST ? [] : [VitePWA({
      strategies: 'generateSW',
      // Same file name and scope as CRA's Workbox 4 worker, so browsers treat it as an update of the
      // existing registration instead of installing a second worker next to the stale one.
      filename: 'service-worker.js',
      scope: '/',
      registerType: 'autoUpdate',
      // Registration happens from src/index.jsx via virtual:pwa-register.
      injectRegister: false,
      // public/manifest.json is the hand-written manifest; do not generate another one.
      manifest: false,
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        // Precache the built bundle plus everything copied from public/ (icons, favicon, manifest).
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,txt,woff,woff2}'],
        // The main bundle is larger than Workbox's 2 MiB default limit; it must be precached for offline use.
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        // SPA fallback for app routes, as CRA did; skip /__* paths and URLs that look like files.
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/_/, /\/[^/?]+\.[^/]+$/],
      },
    })]),
  ],
  // PouchDB 7 (and some of its CJS deps) reference Node's `global`, which Vite does not polyfill.
  define: {
    global: 'globalThis',
  },
  server: {
    port: 3000,
  },
  preview: {
    port: 3000,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.js'],
    // spinners-react is type:module but its "main" is a UMD file; let Vite resolve its ESM "module" entry.
    // MUI v7 is inlined so Vite (not Node) resolves its ESM imports.
    server: { deps: { inline: ['spinners-react', /@mui\//] } },
    include: ['src/**/*.test.{js,jsx}'],
    // Test values so the suite never depends on .env.production / .env.local.
    env: {
      VITE_COUCH_URL: 'https://couch.test/db/',
      VITE_AUTH0_DOMAIN: 'test.auth0.example',
      VITE_AUTH0_CLIENT_ID: 'test-client-id',
      VITE_AUTH0_AUDIENCE: 'https://api.test/',
    },
  },
  build: {
    // server/index.js and Heroku serve react-ui/build
    outDir: 'build',
  },
});
