const express = require('express');
const router = express.Router();
const { getAllUsers } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// Solo el admin puede ver los usuarios
router.get('/', authMiddleware('admin'), getAllUsers);

module.exports = router;
