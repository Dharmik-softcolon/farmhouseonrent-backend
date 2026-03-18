const express = require('express');
const router = express.Router();
const {
    createBooking,
    getAllBookings,
    deleteBooking,
    updateBookingStatus
} = require('../controllers/bookingController');
const { protect, adminOnly } = require('../middleware/auth');
const { validateBooking, validateObjectId } = require('../middleware/validate');

router.post('/', validateBooking, createBooking);
router.get('/', protect, adminOnly, getAllBookings);
router.patch('/:id/status', protect, adminOnly, validateObjectId, updateBookingStatus);
router.delete('/:id', protect, adminOnly, validateObjectId, deleteBooking);

module.exports = router;