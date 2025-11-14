/**
 * User Routes
 *
 * Define routes related to user operations here.
 * This could include:
 * - User registration
 * - User login/logout
 * - User profile
 * - User management (admin)
 *
 * Example usage:
 * const express = require('express');
 * const router = express.Router();
 * const userController = require('../controllers/userController');
 *
 * router.get('/register', userController.getRegister);
 * router.post('/register', userController.postRegister);
 * router.get('/login', userController.getLogin);
 * router.post('/login', userController.postLogin);
 * router.post('/logout', userController.postLogout);
 *
 * module.exports = router;
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { redirectIfAuthenticated, requireAuth } = require('../middleware/auth');

router.get('/register', redirectIfAuthenticated, userController.getRegister);
router.post('/register', redirectIfAuthenticated, userController.postRegister);
router.get('/login', redirectIfAuthenticated, userController.getLogin);
router.post('/login', redirectIfAuthenticated, userController.postLogin);
router.get('/verify', userController.getVerifyStatus);
router.post('/logout', requireAuth, userController.postLogout);

module.exports = router;
