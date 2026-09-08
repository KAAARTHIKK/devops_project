const fs = require('fs');
const path = require('path');
const Redis = require('ioredis');
const config = require('../config');

const redis = new Redis(config.redisUrl, { maxRetriesPerRequest: 1 });

redis.on('error', (err) => {
  // ponytail: ioredis auto-reconnects; just log, don't crash the process
  console.error('redis connection error:', err.message);
});

redis.defineCommand('consumeToken', {
  numberOfKeys: 1,
  lua: fs.readFileSync(path.join(__dirname, 'tokenBucket.lua'), 'utf8'),
});

async function ping() {
  try {
    return (await redis.ping()) === 'PONG';
  } catch {
    return false;
  }
}

async function consume(id, capacity, refillPerSec, cost = 1) {
  const [allowed, remaining, retryAfter] = await redis.consumeToken(
    `bucket:${id}`,
    capacity,
    refillPerSec,
    Date.now(),
    cost,
  );
  return { allowed: allowed === 1, remaining, retryAfter };
}

module.exports = { redis, ping, consume };
