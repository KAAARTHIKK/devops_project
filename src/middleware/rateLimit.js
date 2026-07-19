const { consume } = require('../lib/redis');
const config = require('../config');

module.exports = async function rateLimit(req, res, next) {
  if (!config.rateLimitEnabled) return next();

  const { id, capacity, refillPerSec } = req.apiKey;

  let result;
  try {
    result = await consume(id, capacity, refillPerSec, 1);
  } catch (err) {
    if (config.rateLimitFailOpen) {
      req.log.warn({ err }, 'rate limit check failed, failing open');
      return next();
    }
    return res.status(503).json({
      error: { code: 'RATE_LIMIT_UNAVAILABLE', message: 'rate limiting backend unavailable' },
      requestId: req.id,
    });
  }

  const { allowed, remaining, retryAfter } = result;
  const reset = Math.ceil((capacity - remaining) / refillPerSec);

  res.set('X-RateLimit-Limit', String(capacity));
  res.set('X-RateLimit-Remaining', String(remaining));
  res.set('X-RateLimit-Reset', String(reset));

  if (!allowed) {
    res.set('Retry-After', String(retryAfter));
    req.log.warn({ keyId: id, retryAfter, remaining }, 'rate limit exceeded');
    return res.status(429).json({
      error: { code: 'RATE_LIMITED', message: 'rate limit exceeded' },
      requestId: req.id,
      retryAfter,
    });
  }

  next();
};
