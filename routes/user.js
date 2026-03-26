const express = require('express');
const router = express.Router();
const layoutController = require('../controllers/layoutController');
const { requireAuth } = require('../middleware/auth');

// Установка макета (AJAX)
router.post('/layout', requireAuth, layoutController.setLayout);

// Получение текущего макета (AJAX)
router.get('/layout', requireAuth, layoutController.getLayout);

module.exports = router;
