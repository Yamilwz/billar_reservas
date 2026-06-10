const express = require('express');
const router = express.Router();
const tableController = require('../controllers/tableController');
const authMiddleware = require('../middleware/authMiddleware');

// Public route to view tables map
router.get('/', tableController.getAllTables);

// Admin route to change status
router.put('/:id', authMiddleware('admin'), tableController.updateTableStatus);

module.exports = router;
