require('dotenv').config();

const required = ['REDIS_URL', 'ADMIN_TOKEN'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  throw new Error(`Missing required environment variable(s): ${missing.join(', ')}`);
}

module.exports = {
  port: Number(process.env.PORT) || 3000,
  redisUrl: process.env.REDIS_URL,
  adminToken: process.env.ADMIN_TOKEN,
  apiKeySalt: process.env.API_KEY_SALT || '',
  logLevel: process.env.LOG_LEVEL || 'info',
  rateLimitEnabled: process.env.RATE_LIMIT_ENABLED !== 'false',
  rateLimitFailOpen: process.env.RATE_LIMIT_FAIL_OPEN === 'true',
};
