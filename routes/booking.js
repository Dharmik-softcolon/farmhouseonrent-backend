const express = require('express');
const router = express.Router();
const {
    createBooking,
    getAllBookings,
    deleteBooking
} = require('../controllers/bookingController');
const { protect, adminOnly } = require('../middleware/auth');
const { validateBooking, validateObjectId } = require('../middleware/validate');

router.post('/', validateBooking, createBooking);
router.get('/', protect, adminOnly, getAllBookings);
router.delete('/:id', protect, adminOnly, validateObjectId, deleteBooking);

module.exports = router;