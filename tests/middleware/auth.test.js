process.env.ADMIN_TOKEN = 'test-admin-token';
process.env.API_KEY_SALT = 'test-salt';
process.env.REDIS_URL = 'redis://mock:6379';

const mockRedis = { get: jest.fn(), hgetall: jest.fn() };
jest.mock('../../src/lib/redis', () => ({ redis: mockRedis }));

const auth = require('../../src/middleware/auth');

function mockReqRes(headers = {}) {
  const req = { headers, id: 'test-request-id' };
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  const next = jest.fn();
  return { req, res, next };
}

describe('auth middleware', () => {
  beforeEach(() => {
    mockRedis.get.mockReset();
    mockRedis.hgetall.mockReset();
  });

  test('401 MISSING_API_KEY when header is absent', async () => {
    const { req, res, next } = mockReqRes();
    await auth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'MISSING_API_KEY' }) }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('401 INVALID_API_KEY when key is unknown', async () => {
    mockRedis.get.mockResolvedValue(null);
    const { req, res, next } = mockReqRes({ 'x-api-key': 'sk_live_bogus' });
    await auth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'INVALID_API_KEY' }) }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('403 KEY_REVOKED when key is revoked', async () => {
    mockRedis.get.mockResolvedValue('key_abc');
    mockRedis.hgetall.mockResolvedValue({ status: 'revoked', name: 'x', capacity: '10', refillPerSec: '1' });
    const { req, res, next } = mockReqRes({ 'x-api-key': 'sk_live_revoked' });
    await auth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'KEY_REVOKED' }) }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('valid key attaches req.apiKey and calls next()', async () => {
    mockRedis.get.mockResolvedValue('key_abc');
    mockRedis.hgetall.mockResolvedValue({ status: 'active', name: 'mobile', capacity: '10', refillPerSec: '1' });
    const { req, res, next } = mockReqRes({ 'x-api-key': 'sk_live_valid' });
    await auth(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.apiKey).toEqual({ id: 'key_abc', name: 'mobile', capacity: 10, refillPerSec: 1 });
  });
});
