const { redis } = require('../lib/redis');

function statusClassField(statusCode) {
  return `${Math.floor(statusCode / 100)}xx`;
}

async function record(id, statusCode) {
  const rateLimited = statusCode === 429;
  await redis
    .multi()
    .hincrby(`usage:${id}`, 'requests', 1)
    .hincrby(`usage:${id}`, rateLimited ? 'rateLimited' : 'allowed', 1)
    .hincrby(`usage:${id}`, statusClassField(statusCode), 1)
    .hset(`usage:${id}`, 'lastSeenAt', new Date().toISOString())
    .exec();
}

async function getById(id) {
  const data = await redis.hgetall(`usage:${id}`);
  if (!data || Object.keys(data).length === 0) {
    return {
      id,
      totals: { requests: 0, allowed: 0, rateLimited: 0 },
      byStatusClass: { '2xx': 0, '4xx': 0, '5xx': 0 },
      lastSeenAt: null,
    };
  }
  return {
    id,
    totals: {
      requests: Number(data.requests) || 0,
      allowed: Number(data.allowed) || 0,
      rateLimited: Number(data.rateLimited) || 0,
    },
    byStatusClass: {
      '2xx': Number(data['2xx']) || 0,
      '4xx': Number(data['4xx']) || 0,
      '5xx': Number(data['5xx']) || 0,
    },
    lastSeenAt: data.lastSeenAt || null,
  };
}

module.exports = { record, getById };
