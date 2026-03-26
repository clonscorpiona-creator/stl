const express = require('express');
const router = express.Router();
const workController = require('../controllers/workController');
const { requireAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Маршруты для авторизованных (должны быть ДО общих)
router.get('/create/new', requireAuth, workController.showCreate.bind(workController));
router.post('/create', requireAuth, upload.single('cover'), upload.validateUpload, workController.create.bind(workController));
router.post('/:id/like', requireAuth, workController.toggleLike.bind(workController));
router.get('/:id/edit', requireAuth, workController.showEdit.bind(workController));
router.post('/:id/update', requireAuth, upload.single('cover'), upload.validateUpload, workController.update.bind(workController));
router.delete('/:id', requireAuth, workController.destroy.bind(workController));

// Публичные маршруты (в конце)
router.get('/:id', workController.show.bind(workController));
router.get('/', workController.index.bind(workController));

module.exports = router;
