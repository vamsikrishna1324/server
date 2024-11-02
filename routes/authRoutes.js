const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register); // Ensure this function is defined
router.post('/login', authController.login); // Ensure this function is defined
router.get('/verify/:token', authController.verifyEmail);
module.exports = router;
