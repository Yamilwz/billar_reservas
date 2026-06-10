const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');

// Get all products (Admin for inventory, could be used for POS as well)
router.get('/', authMiddleware(['admin']), productController.getAllProducts);
router.post('/', authMiddleware(['admin']), productController.createProduct);
router.put('/:id', authMiddleware(['admin']), productController.updateProduct);
router.delete('/:id', authMiddleware(['admin']), productController.deleteProduct);

module.exports = router;
