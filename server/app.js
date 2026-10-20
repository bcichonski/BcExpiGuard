const path = require('node:path');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');

const IMMUTABLE_CACHE = 'public, max-age=31536000, immutable';
const REVALIDATE_CACHE = 'no-cache';

function toOrigin(value) {
  if (!value) return null;
  try {
    return new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`).origin;
  } catch {
    return null;
  }
}

function buildCspDirectives({ auth0Domain, couchUrl, forceHttps }) {
  const auth0Origin = toOrigin(auth0Domain);
  const couchOrigin = toOrigin(couchUrl);
  if (!auth0Origin) console.error('Server: VITE_AUTH0_DOMAIN is not configured; CSP omits the Auth0 origin');
  if (!couchOrigin) console.error('Server: VITE_COUCH_URL is not configured; CSP omits the CouchDB origin');

  const directives = {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    fontSrc: ["'self'", 'data:'],
    imgSrc: ["'self'", 'data:', 'https:'],
    connectSrc: ["'self'", ...[auth0Origin, couchOrigin].filter(Boolean)],
    frameSrc: auth0Origin ? [auth0Origin] : ["'none'"],
    workerSrc: ["'self'"],
    manifestSrc: ["'self'"],
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    frameAncestors: ["'none'"],
    // helmet adds upgrade-insecure-requests by default; null removes it.
    upgradeInsecureRequests: forceHttps ? [] : null,
  };
  return directives;
}

/**
 * Express app factory.
 * @param {{staticDir: string, forceHttps?: boolean, auth0Domain?: string, couchUrl?: string}} options
 */
function createApp({ staticDir, forceHttps = false, auth0Domain = '', couchUrl = '' }) {
  const app = express();
  const indexHtml = path.join(staticDir, 'index.html');

  app.set('trust proxy', true);
  app.disable('x-powered-by');

  // Before any redirect so plain-HTTP probes always succeed.
  app.get('/healthz', (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.status(200).json({ status: 'ok' });
  });

  if (forceHttps) {
    app.use((req, res, next) => {
      if (req.secure) return next();
      res.redirect(308, `https://${req.hostname}${req.originalUrl}`);
    });
  }

  app.use(
    helmet({
      contentSecurityPolicy: { useDefaults: false, directives: buildCspDirectives({ auth0Domain, couchUrl, forceHttps }) },
      strictTransportSecurity: forceHttps ? { maxAge: 15552000, includeSubDomains: true } : false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.use(compression());

  app.use(
    express.static(staticDir, {
      index: false,
      setHeaders(res, filePath) {
        const rel = path.relative(staticDir, filePath).split(path.sep).join('/');
        res.set('Cache-Control', rel.startsWith('assets/') ? IMMUTABLE_CACHE : REVALIDATE_CACHE);
      },
    }),
  );

  // SPA fallback (Express 5: no '*' wildcard, so use a plain middleware).
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    if (path.extname(req.path) !== '' || !req.accepts('html')) return next();
    res.set('Cache-Control', REVALIDATE_CACHE);
    res.sendFile(indexHtml, (err) => (err ? next(err) : undefined));
  });

  return app;
}

module.exports = { createApp, buildCspDirectives };
