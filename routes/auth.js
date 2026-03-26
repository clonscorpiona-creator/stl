const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { guestOnly, requireAuth } = require('../middleware/auth');

// Маршруты авторизации
router.get('/login', guestOnly, (req, res) => {
  res.render('pages/login', {
    title: 'Вход',
    error: null
  });
});

router.post('/login', guestOnly, authController.login);

router.get('/register', guestOnly, (req, res) => {
  res.render('pages/register', {
    title: 'Регистрация',
    error: null,
    success: null
  });
});

router.post('/register', guestOnly, authController.register);

router.get('/logout', requireAuth, authController.logout);

module.exports = router;
