process.env.ADMIN_TOKEN = 'test-admin-token';
process.env.API_KEY_SALT = 'test-salt';
process.env.REDIS_URL = 'redis://mock:6379';

jest.mock('ioredis', () => require('ioredis-mock'));

const apiKeyService = require('../../src/services/apiKeyService');
const { redis } = require('../../src/lib/redis');

describe('apiKeyService', () => {
  test('create() returns an id/secret in the documented format', async () => {
    const key = await apiKeyService.create({ name: 'test', rateLimit: { capacity: 10, refillPerSec: 1 } });
    expect(key.id).toMatch(/^key_[0-9a-f]+$/);
    expect(key.apiKey).toMatch(/^sk_live_[0-9a-f]+$/);
    expect(key.status).toBe('active');
  });

  test('stores only the hash in Redis, never the plaintext secret', async () => {
    const key = await apiKeyService.create({ name: 'test', rateLimit: { capacity: 10, refillPerSec: 1 } });
    const stored = await redis.hgetall(`apikey:${key.id}`);
    expect(stored.hash).toBeDefined();
    expect(stored.hash).not.toBe(key.apiKey);
    expect(JSON.stringify(stored)).not.toContain(key.apiKey);
  });

  test('getById() never returns the secret or hash', async () => {
    const key = await apiKeyService.create({ name: 'test', rateLimit: { capacity: 10, refillPerSec: 1 } });
    const meta = await apiKeyService.getById(key.id);
    expect(meta.apiKey).toBeUndefined();
    expect(meta.hash).toBeUndefined();
  });

  test('revoke() sets status to revoked', async () => {
    const key = await apiKeyService.create({ name: 'test', rateLimit: { capacity: 10, refillPerSec: 1 } });
    const result = await apiKeyService.revoke(key.id);
    expect(result.status).toBe('revoked');
    const meta = await apiKeyService.getById(key.id);
    expect(meta.status).toBe('revoked');
  });

  test('revoke() returns null for an unknown id', async () => {
    const result = await apiKeyService.revoke('key_doesnotexist');
    expect(result).toBeNull();
  });
});
