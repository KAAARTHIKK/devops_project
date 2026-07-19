module.exports = function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;

  req.log.error({ err, statusCode }, err.message);

  res.status(statusCode).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: statusCode === 500 ? 'internal server error' : err.message,
    },
    requestId: req.id,
  });
};
