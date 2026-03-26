const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { requireAuth } = require('../middleware/auth');

// Все маршруты чата требуют авторизации
router.use(requireAuth);

// API маршруты должны быть ДО :slug (иначе :slug перехватит)
// API: получить сообщения канала
router.get('/api/:channelId/messages', chatController.getMessages);

// API: отправить сообщение (для резервного HTTP)
router.post('/api/:channelId/messages', chatController.sendMessage);

// Страница чата
router.get('/', chatController.chatPage);

// Конкретный канал (должен быть последним)
router.get('/:slug', chatController.channelPage);

module.exports = router;
