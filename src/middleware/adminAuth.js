const { timingSafeEqual } = require('crypto');
const config = require('../config');

module.exports = function adminAuth(req, res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');

  const expected = Buffer.from(config.adminToken);
  const provided = Buffer.from(scheme === 'Bearer' && token ? token : '');

  const valid = expected.length === provided.length && timingSafeEqual(expected, provided);

  if (!valid) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'invalid or missing admin token' },
      requestId: req.id,
    });
  }
  next();
};
