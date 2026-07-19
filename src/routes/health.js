const { Router } = require('express');

const router = Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

router.get('/health/ready', (req, res) => {
  // ponytail: stubbed 200 until Phase 3 wires the real Redis PING
  res.json({ status: 'ready', redis: 'stub' });
});

module.exports = router;
