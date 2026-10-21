/**
 * Configuration module that reads environment variables at build time.
 * Missing variables are logged as console errors but do not throw.
 */

// Read environment variables from import.meta.env (Vite inlines these at build time)
const couchUrlRaw = import.meta.env.VITE_COUCH_URL;
const auth0Domain = import.meta.env.VITE_AUTH0_DOMAIN;
const auth0ClientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
const auth0Audience = import.meta.env.VITE_AUTH0_AUDIENCE;

// Validate required variables and log errors for missing ones
if (!couchUrlRaw) {
  console.error('Missing required environment variable: VITE_COUCH_URL');
}
if (!auth0Domain) {
  console.error('Missing required environment variable: VITE_AUTH0_DOMAIN');
}
if (!auth0ClientId) {
  console.error('Missing required environment variable: VITE_AUTH0_CLIENT_ID');
}
if (!auth0Audience) {
  console.error('Missing required environment variable: VITE_AUTH0_AUDIENCE');
}

/**
 * Normalize CouchDB URL to have exactly one trailing slash
 */
function normalizeCouchUrl(url: string | undefined): string | undefined {
  if (!url) return url;
  // Remove all trailing slashes, then add exactly one
  return url.replace(/\/+$/, '') + '/';
}

// Export the configuration
export const REMOTE_API_ADDRESS = normalizeCouchUrl(couchUrlRaw);
export const AUTH0_DOMAIN = auth0Domain;
export const AUTH0_CLIENT_ID = auth0ClientId;
export const AUTH0_AUDIENCE = auth0Audience;
