const { Router } = require('express');
const auth = require('../middleware/auth');
const usage = require('../middleware/usage');
const rateLimit = require('../middleware/rateLimit');

const router = Router();

router.use('/v1', auth, usage, rateLimit);

router.get('/v1/ping', (req, res) => {
  res.json({ message: 'pong', keyId: req.apiKey.id, requestId: req.id });
});

router.get('/v1/echo', (req, res) => {
  res.json({ echo: req.query.msg, keyId: req.apiKey.id });
});

module.exports = router;
