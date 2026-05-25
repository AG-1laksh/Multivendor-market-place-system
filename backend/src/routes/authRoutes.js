const express = require('express');
const { register, login, me } = require('../controllers/authController');
const { registerValidator, loginValidator } = require('../validators/authValidator');
const { validateRequest } = require('../middleware/validateMiddleware');
const { authRateLimiter } = require('../middleware/rateLimitMiddleware');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', authRateLimiter, registerValidator, validateRequest, register);
router.post('/login', authRateLimiter, loginValidator, validateRequest, login);
router.get('/me', authenticate, me);

module.exports = router;
