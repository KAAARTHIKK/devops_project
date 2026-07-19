const analyticsService = require('../services/analyticsService');

module.exports = function usage(req, res, next) {
  res.on('finish', () => {
    const id = req.apiKey && req.apiKey.id;
    if (!id) return;
    analyticsService
      .record(id, res.statusCode)
      .catch((err) => req.log.error({ err }, 'failed to record usage'));
  });
  next();
};
