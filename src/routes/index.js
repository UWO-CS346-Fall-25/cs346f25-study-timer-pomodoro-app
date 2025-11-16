/**
 * Index Routes
 *
 * Define routes for the main pages of your application here.
 * Routes connect HTTP requests to controller functions.
 *
 * Example usage:
 * const express = require('express');
 * const router = express.Router();
 * const indexController = require('../controllers/indexController');
 *
 * router.get('/', indexController.getHome);
 * router.get('/about', indexController.getAbout);
 *
 * module.exports = router;
 */

const express = require('express');

const router = express.Router();
const indexController = require('../controllers/indexController');
const { requireAuth } = require('../middleware/auth');

router.get('/', indexController.getHome);
router.get('/focus', requireAuth, indexController.getFocus);
router.get('/insights', requireAuth, indexController.getInsights);
router.get('/about', indexController.getAbout);
router.post('/focus/sessions', requireAuth, indexController.createSession);
router.post('/focus/goals', requireAuth, indexController.createGoal);
router.get('/api/sessions', requireAuth, indexController.getSessionsJson);
router.get('/api/goals', requireAuth, indexController.getGoalsJson);

module.exports = router;
