process.env.ADMIN_TOKEN = 'test-admin-token';
process.env.API_KEY_SALT = 'test-salt';
process.env.REDIS_URL = 'redis://mock:6379';
process.env.RATE_LIMIT_ENABLED = 'true';
process.env.RATE_LIMIT_FAIL_OPEN = 'false';

const mockConsume = jest.fn();
jest.mock('../../src/lib/redis', () => ({ consume: mockConsume }));

const rateLimit = require('../../src/middleware/rateLimit');

function mockReqRes() {
  const req = {
    apiKey: { id: 'key_abc', capacity: 10, refillPerSec: 1 },
    id: 'req-1',
    log: { warn: jest.fn(), error: jest.fn() },
  };
  const res = { set: jest.fn(), status: jest.fn().mockReturnThis(), json: jest.fn() };
  const next = jest.fn();
  return { req, res, next };
}

describe('rateLimit middleware', () => {
  beforeEach(() => mockConsume.mockReset());

  test('allows a request within capacity and sets X-RateLimit-* headers', async () => {
    mockConsume.mockResolvedValue({ allowed: true, remaining: 7, retryAfter: 0 });
    const { req, res, next } = mockReqRes();
    await rateLimit(req, res, next);
    expect(res.set).toHaveBeenCalledWith('X-RateLimit-Limit', '10');
    expect(res.set).toHaveBeenCalledWith('X-RateLimit-Remaining', '7');
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('returns 429 with Retry-After when the bucket is empty', async () => {
    mockConsume.mockResolvedValue({ allowed: false, remaining: 0, retryAfter: 3 });
    const { req, res, next } = mockReqRes();
    await rateLimit(req, res, next);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.set).toHaveBeenCalledWith('Retry-After', '3');
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'RATE_LIMITED' }), retryAfter: 3 }),
    );
    expect(next).not.toHaveBeenCalled();
  });
});
