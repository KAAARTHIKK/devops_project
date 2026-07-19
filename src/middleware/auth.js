const { redis } = require('../lib/redis');
const { hashSecret } = require('../services/apiKeyService');

module.exports = async function auth(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(401).json({
      error: { code: 'MISSING_API_KEY', message: 'x-api-key header is required' },
      requestId: req.id,
    });
  }

  const id = await redis.get(`apikey:lookup:${hashSecret(apiKey)}`);
  if (!id) {
    return res.status(401).json({
      error: { code: 'INVALID_API_KEY', message: 'unknown api key' },
      requestId: req.id,
    });
  }

  const data = await redis.hgetall(`apikey:${id}`);
  if (data.status === 'revoked') {
    return res.status(403).json({
      error: { code: 'KEY_REVOKED', message: 'api key has been revoked' },
      requestId: req.id,
    });
  }

  req.apiKey = {
    id,
    name: data.name,
    capacity: Number(data.capacity),
    refillPerSec: Number(data.refillPerSec),
  };
  next();
};
