const Redis = require('ioredis');
const config = require('../config');

const redis = new Redis(config.redisUrl, { maxRetriesPerRequest: 1 });

redis.on('error', (err) => {
  // ponytail: ioredis auto-reconnects; just log, don't crash the process
  console.error('redis connection error:', err.message);
});

async function ping() {
  try {
    return (await redis.ping()) === 'PONG';
  } catch {
    return false;
  }
}

module.exports = { redis, ping };
