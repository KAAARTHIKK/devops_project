const config = require('./config');
const app = require('./app');

const server = app.listen(config.port, () => {
  console.log(`Gateway listening on port ${config.port}`);
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});
