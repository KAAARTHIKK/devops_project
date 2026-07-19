const crypto = require('crypto');
const { redis } = require('../lib/redis');
const config = require('../config');

const INDEX_KEY = 'apikeys:index';

function generateId() {
  return `key_${crypto.randomBytes(12).toString('hex')}`;
}

function generateSecret() {
  return `sk_live_${crypto.randomBytes(32).toString('hex')}`;
}

function hashSecret(secret) {
  return crypto.createHash('sha256').update(config.apiKeySalt + secret).digest('hex');
}

function toMetadata(id, data) {
  return {
    id,
    name: data.name,
    status: data.status,
    rateLimit: {
      capacity: Number(data.capacity),
      refillPerSec: Number(data.refillPerSec),
    },
    createdAt: data.createdAt,
  };
}

async function create({ name, rateLimit }) {
  const id = generateId();
  const secret = generateSecret();
  const hash = hashSecret(secret);
  const createdAt = new Date().toISOString();

  await redis.hset(`apikey:${id}`, {
    hash,
    name,
    status: 'active',
    capacity: rateLimit.capacity,
    refillPerSec: rateLimit.refillPerSec,
    createdAt,
  });
  await redis.set(`apikey:lookup:${hash}`, id);
  await redis.sadd(INDEX_KEY, id);

  return {
    id,
    name,
    apiKey: secret,
    rateLimit: { capacity: rateLimit.capacity, refillPerSec: rateLimit.refillPerSec },
    createdAt,
    status: 'active',
  };
}

async function getById(id) {
  const data = await redis.hgetall(`apikey:${id}`);
  if (!data || !data.hash) return null;
  return toMetadata(id, data);
}

async function list() {
  const ids = await redis.smembers(INDEX_KEY);
  const items = await Promise.all(ids.map(getById));
  return items.filter(Boolean);
}

async function revoke(id) {
  const exists = await redis.exists(`apikey:${id}`);
  if (!exists) return null;
  await redis.hset(`apikey:${id}`, 'status', 'revoked');
  return { id, status: 'revoked' };
}

module.exports = { create, getById, list, revoke };
