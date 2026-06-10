const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware('admin'), saleController.createSale);
router.get('/daily', authMiddleware('admin'), saleController.getDailySales);

module.exports = router;
