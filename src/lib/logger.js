const pino = require('pino');
const config = require('../config');

module.exports = pino({
  level: config.logLevel,
  redact: ['req.headers["x-api-key"]', 'req.headers.authorization'],
});
