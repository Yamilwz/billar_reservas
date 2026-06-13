const express = require('express');
const router = express.Router();
const { getAllUsers, deleteUser } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// Solo el admin puede ver los usuarios
router.get('/', authMiddleware('admin'), getAllUsers);
router.delete('/:id', authMiddleware('admin'), deleteUser);

module.exports = router;
