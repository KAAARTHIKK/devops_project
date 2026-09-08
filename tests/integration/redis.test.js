const REAL_REDIS_URL = process.env.REDIS_URL;

process.env.ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'test-admin-token';
process.env.API_KEY_SALT = process.env.API_KEY_SALT || 'test-salt';
process.env.REDIS_URL = REAL_REDIS_URL || 'redis://localhost:6379';

const describeIfRedis = REAL_REDIS_URL ? describe : describe.skip;
if (!REAL_REDIS_URL) {
  console.log('Skipping tests/integration/redis.test.js: REDIS_URL not set');
}

describeIfRedis('redis integration', () => {
  let apiKeyService;
  let redis;

  beforeAll(() => {
    apiKeyService = require('../../src/services/apiKeyService');
    ({ redis } = require('../../src/lib/redis'));
  });

  afterAll(async () => {
    if (redis) await redis.quit();
  });

  test('create -> lookup -> revoke round-trips through real Redis', async () => {
    const key = await apiKeyService.create({
      name: 'itest',
      rateLimit: { capacity: 5, refillPerSec: 1 },
    });

    const found = await apiKeyService.getById(key.id);
    expect(found.status).toBe('active');

    const revoked = await apiKeyService.revoke(key.id);
    expect(revoked.status).toBe('revoked');

    const after = await apiKeyService.getById(key.id);
    expect(after.status).toBe('revoked');
  });
});
