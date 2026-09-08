const { Router } = require('express');
const adminAuth = require('../middleware/adminAuth');
const apiKeyService = require('../services/apiKeyService');

const router = Router();

router.use('/admin/keys', adminAuth);

router.post('/admin/keys', async (req, res) => {
  const { name, rateLimit } = req.body || {};
  if (!name || !rateLimit || !rateLimit.capacity || !rateLimit.refillPerSec) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'name and rateLimit.{capacity,refillPerSec} are required',
      },
      requestId: req.id,
    });
  }
  const key = await apiKeyService.create({ name, rateLimit });
  res.status(201).json(key);
});

router.get('/admin/keys', async (req, res) => {
  const keys = await apiKeyService.list();
  res.json({ keys, count: keys.length });
});

router.get('/admin/keys/:id', async (req, res) => {
  const key = await apiKeyService.getById(req.params.id);
  if (!key) {
    return res.status(404).json({
      error: { code: 'KEY_NOT_FOUND', message: 'key not found' },
      requestId: req.id,
    });
  }
  res.json(key);
});

router.delete('/admin/keys/:id', async (req, res) => {
  const result = await apiKeyService.revoke(req.params.id);
  if (!result) {
    return res.status(404).json({
      error: { code: 'KEY_NOT_FOUND', message: 'key not found' },
      requestId: req.id,
    });
  }
  res.json(result);
});

module.exports = router;
