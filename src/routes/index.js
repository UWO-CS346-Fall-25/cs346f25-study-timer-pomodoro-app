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

router.get('/', indexController.getHome);
router.get('/focus', indexController.getFocus);
router.get('/insights', indexController.getInsights);
router.get('/about', indexController.getAbout);
router.post('/focus/sessions', indexController.createSession);
router.get('/api/sessions', indexController.getSessionsJson);

module.exports = router;
