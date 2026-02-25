const express = require('express');
const router = express.Router();
const { login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validateLogin } = require('../middleware/validate');

router.post('/login', validateLogin, login);
router.get('/me', protect, getMe);

module.exports = router;