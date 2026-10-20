const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const request = require('supertest');
const { createApp } = require('./app');
const { loadConfig } = require('./config');

const AUTH0 = 'test.auth0.example';
const COUCH = 'https://couch.test/db/';
let dir;

before(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'expiguard-static-'));
  fs.mkdirSync(path.join(dir, 'assets'));
  fs.writeFileSync(path.join(dir, 'index.html'), '<!doctype html><title>fixture</title>');
  fs.writeFileSync(path.join(dir, 'manifest.json'), '{}');
  fs.writeFileSync(path.join(dir, 'assets', 'index-abc123.js'), `console.log("${'x'.repeat(20000)}");`);
});

after(() => fs.rmSync(dir, { recursive: true, force: true }));

const make = (extra = {}) => createApp({ staticDir: dir, auth0Domain: AUTH0, couchUrl: COUCH, ...extra });

test('healthz returns 200 without redirect even when HTTPS is forced', async () => {
  const res = await request(make({ forceHttps: true })).get('/healthz').set('X-Forwarded-Proto', 'http');
  assert.equal(res.status, 200);
});

test('forced HTTPS redirects insecure requests', async () => {
  const res = await request(make({ forceHttps: true })).get('/browse?a=1').set('X-Forwarded-Proto', 'http');
  assert.ok([301, 308].includes(res.status));
  assert.match(res.headers.location, /^https:\/\/.+\/browse\?a=1$/);
});

test('forced HTTPS lets secure requests through with HSTS and upgrade-insecure-requests', async () => {
  const res = await request(make({ forceHttps: true })).get('/').set('X-Forwarded-Proto', 'https');
  assert.equal(res.status, 200);
  assert.ok(res.headers['strict-transport-security']);
  assert.match(res.headers['content-security-policy'], /upgrade-insecure-requests/);
});

test('without FORCE_HTTPS there is no redirect, HSTS or upgrade-insecure-requests', async () => {
  const res = await request(make()).get('/browse').set('X-Forwarded-Proto', 'http');
  assert.equal(res.status, 200);
  assert.equal(res.headers['strict-transport-security'], undefined);
  assert.doesNotMatch(res.headers['content-security-policy'], /upgrade-insecure-requests/);
});

test('CSP contains configured Auth0 and CouchDB origins', async () => {
  const csp = (await request(make()).get('/')).headers['content-security-policy'];
  assert.match(csp, /connect-src [^;]*https:\/\/test\.auth0\.example/);
  assert.match(csp, /connect-src [^;]*https:\/\/couch\.test(?=[ ;])/);
  assert.match(csp, /frame-src https:\/\/test\.auth0\.example/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /object-src 'none'/);
});

test('deep link falls back to index.html with no-cache', async () => {
  const res = await request(make()).get('/browse').set('Accept', 'text/html');
  assert.equal(res.status, 200);
  assert.match(res.text, /fixture/);
  assert.equal(res.headers['cache-control'], 'no-cache');
});

test('hashed asset gets immutable cache header', async () => {
  const res = await request(make()).get('/assets/index-abc123.js');
  assert.equal(res.status, 200);
  assert.equal(res.headers['cache-control'], 'public, max-age=31536000, immutable');
});

test('non-hashed static file must revalidate', async () => {
  const res = await request(make()).get('/manifest.json');
  assert.equal(res.status, 200);
  assert.equal(res.headers['cache-control'], 'no-cache');
});

test('missing file-like path returns 404', async () => {
  const res = await request(make()).get('/nope.js');
  assert.equal(res.status, 404);
});

test('/api placeholder is gone', async () => {
  const res = await request(make()).get('/api').set('Accept', 'application/json');
  assert.notEqual(res.body.message, 'Hello from the custom server!');
  assert.equal(res.status, 404);
});

test('large asset is gzip compressed when requested', async () => {
  const res = await request(make()).get('/assets/index-abc123.js').set('Accept-Encoding', 'gzip');
  assert.equal(res.headers['content-encoding'], 'gzip');
});

test('loadConfig prefers env over env file and falls back to the file', () => {
  const file = path.join(dir, 'env.test');
  fs.writeFileSync(file, 'VITE_AUTH0_DOMAIN=file.example\nVITE_COUCH_URL=https://file.couch/\n');
  const fromFile = loadConfig({}, file);
  assert.equal(fromFile.auth0Domain, 'file.example');
  assert.equal(fromFile.couchUrl, 'https://file.couch/');
  const fromEnv = loadConfig({ VITE_AUTH0_DOMAIN: 'env.example', FORCE_HTTPS: 'true', PORT: '8080' }, file);
  assert.equal(fromEnv.auth0Domain, 'env.example');
  assert.equal(fromEnv.couchUrl, 'https://file.couch/');
  assert.equal(fromEnv.forceHttps, true);
  assert.equal(fromEnv.port, 8080);
});
