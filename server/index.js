const { createApp } = require('./app');
const { loadConfig } = require('./config');

const config = loadConfig();
const app = createApp(config);

const server = app.listen(config.port, () => {
  console.error(
    `Server: listening on port ${config.port} (HTTPS enforcement ${config.forceHttps ? 'on' : 'off'})`,
  );
});

let shuttingDown = false;
function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.error(`Server: ${signal} received, shutting down`);
  const timer = setTimeout(() => {
    console.error('Server: shutdown timed out, forcing exit');
    process.exit(1);
  }, 5000);
  timer.unref();
  server.close(() => process.exit(0));
  server.closeIdleConnections();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
