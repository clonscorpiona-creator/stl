const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireRole } = require('../middleware/auth');

// All admin routes require ADMIN role
router.use(requireRole(['ADMIN']));

// Dashboard
router.get('/', adminController.dashboard);

// Settings management
router.get('/settings', adminController.getSettings);
router.post('/settings', adminController.saveSettings);

// Modules management
router.get('/modules', adminController.getModules);
router.post('/modules/:moduleId/toggle', adminController.toggleModule);

// User management (optional extension)
router.get('/users', adminController.listUsers);
router.post('/users/:id/role', adminController.changeUserRole);

module.exports = router;
