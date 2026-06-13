const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const authMiddleware = require('../middleware/authMiddleware');

// Public/Client routes
router.get('/slots', reservationController.getBookedSlots);
router.post('/', authMiddleware(['cliente', 'admin']), reservationController.createReservation);
router.get('/my-reservations', authMiddleware(['cliente', 'admin']), reservationController.getUserReservations);

// Admin routes
router.post('/assign-time', authMiddleware('admin'), reservationController.assignTableTime);
router.get('/', authMiddleware('admin'), reservationController.getAllReservations);
router.put('/:id', authMiddleware('admin'), reservationController.updateReservationStatus);

module.exports = router;
