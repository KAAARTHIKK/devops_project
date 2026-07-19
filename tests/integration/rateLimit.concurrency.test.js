const REAL_REDIS_URL = process.env.REDIS_URL;

process.env.ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'test-admin-token';
process.env.API_KEY_SALT = process.env.API_KEY_SALT || 'test-salt';
process.env.REDIS_URL = REAL_REDIS_URL || 'redis://localhost:6379';

const describeIfRedis = REAL_REDIS_URL ? describe : describe.skip;
if (!REAL_REDIS_URL) {
  console.log('Skipping tests/integration/rateLimit.concurrency.test.js: REDIS_URL not set');
}

describeIfRedis('rate limit concurrency (headline test)', () => {
  let request;
  let app;
  let apiKeyService;
  let redis;

  beforeAll(() => {
    request = require('supertest');
    app = require('../../src/app');
    apiKeyService = require('../../src/services/apiKeyService');
    ({ redis } = require('../../src/lib/redis'));
  });

  afterAll(async () => {
    if (redis) await redis.quit();
  });

  test('exactly capacity requests are allowed under a concurrent burst', async () => {
    const key = await apiKeyService.create({
      name: 'concurrency-itest',
      rateLimit: { capacity: 20, refillPerSec: 0 },
    });

    const requests = Array.from({ length: 50 }, () =>
      request(app).get('/v1/ping').set('x-api-key', key.apiKey));
    const results = await Promise.all(requests);

    const allowed = results.filter((r) => r.status === 200).length;
    const limited = results.filter((r) => r.status === 429).length;

    expect(allowed).toBe(20);
    expect(limited).toBe(30);
  }, 20000);
});
