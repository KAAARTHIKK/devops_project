const { Router } = require('express');
const adminAuth = require('../middleware/adminAuth');
const apiKeyService = require('../services/apiKeyService');
const analyticsService = require('../services/analyticsService');

const router = Router();

router.get('/admin/analytics/:id', adminAuth, async (req, res) => {
  const key = await apiKeyService.getById(req.params.id);
  if (!key) {
    return res.status(404).json({
      error: { code: 'KEY_NOT_FOUND', message: 'key not found' },
      requestId: req.id,
    });
  }
  const analytics = await analyticsService.getById(req.params.id);
  res.json(analytics);
});

module.exports = router;
