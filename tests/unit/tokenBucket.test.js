process.env.ADMIN_TOKEN = 'test-admin-token';
process.env.API_KEY_SALT = 'test-salt';
process.env.REDIS_URL = 'redis://mock:6379';

jest.mock('ioredis', () => require('ioredis-mock'));

const { consume } = require('../../src/lib/redis');

describe('token bucket (Lua script)', () => {
  test('allows a request within capacity and decrements tokens', async () => {
    const result = await consume('bucket-test-1', 5, 1, 1);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  test('caps tokens at capacity even with a fast refill rate', async () => {
    const id = 'bucket-test-2';
    await consume(id, 3, 1000000, 1); // 3 -> 2 tokens
    const result = await consume(id, 3, 1000000, 0); // read-only; huge refill must still cap at capacity
    expect(result.remaining).toBe(3);
  });

  test('denies once the bucket is empty and reports retryAfter', async () => {
    const id = 'bucket-test-3';
    const first = await consume(id, 1, 0.0001, 1);
    expect(first.allowed).toBe(true);
    expect(first.remaining).toBe(0);

    const second = await consume(id, 1, 0.0001, 1);
    expect(second.allowed).toBe(false);
    expect(second.remaining).toBe(0);
    expect(second.retryAfter).toBeGreaterThan(0);
  });

  test('a zero refill rate denies without dividing by zero', async () => {
    const id = 'bucket-test-4';
    await consume(id, 1, 0, 1);
    const denied = await consume(id, 1, 0, 1);
    expect(denied.allowed).toBe(false);
    expect(denied.retryAfter).toBe(-1);
  });
});
