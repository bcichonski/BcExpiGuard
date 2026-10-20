const fs = require('node:fs');
const path = require('node:path');
const { parseEnv } = require('node:util');

const DEFAULT_STATIC_DIR = path.resolve(__dirname, '../react-ui/build');
const DEFAULT_ENV_FILE = path.resolve(__dirname, '../react-ui/.env.production');

/**
 * Resolves runtime configuration. VITE_* values come from the environment and,
 * when unset, from react-ui/.env.production (the same values the Vite build uses).
 * Already-set environment variables win.
 */
function loadConfig(env = process.env, envFile = DEFAULT_ENV_FILE) {
  let fileValues = {};
  try {
    fileValues = parseEnv(fs.readFileSync(envFile, 'utf8'));
  } catch {
    // Missing env file is fine; env vars alone may be enough.
  }
  const pick = (name) => env[name] || fileValues[name] || '';

  return {
    port: Number(env.PORT) || 5000,
    forceHttps: env.FORCE_HTTPS === 'true',
    staticDir: DEFAULT_STATIC_DIR,
    auth0Domain: pick('VITE_AUTH0_DOMAIN'),
    couchUrl: pick('VITE_COUCH_URL'),
  };
}

module.exports = { loadConfig, DEFAULT_STATIC_DIR, DEFAULT_ENV_FILE };
