const { Router } = require('express');
const { ping } = require('../lib/redis');

const router = Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

router.get('/health/ready', async (req, res) => {
  const up = await ping();
  if (up) {
    res.json({ status: 'ready', redis: 'up' });
  } else {
    res.status(503).json({ status: 'not_ready', redis: 'down' });
  }
});

module.exports = router;
