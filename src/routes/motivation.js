const express = require('express');
const router = express.Router();
const motivationController = require('../controllers/motivationController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, motivationController.getMotivation);
router.post('/refresh', requireAuth, motivationController.postRefreshMotivation);

module.exports = router;
