const BookingLead = require('../models/BookingLead');
const Farmhouse = require('../models/Farmhouse');

// POST /api/bookings
exports.createBooking = async (req, res, next) => {
    try {
        const { farmhouseId } = req.body;

        const farmhouse = await Farmhouse.findById(farmhouseId);
        if (!farmhouse) {
            return res.status(404).json({
                success: false,
                message: 'Farmhouse not found'
            });
        }

        const booking = await BookingLead.create(req.body);

        const populatedBooking = await BookingLead.findById(booking._id)
            .populate('farmhouseId', 'title contactNumber ownerContact location');

        res.status(201).json({
            success: true,
            data: populatedBooking
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/bookings (Admin)
exports.getAllBookings = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, farmhouseId } = req.query;

        const filter = {};
        if (farmhouseId) filter.farmhouseId = farmhouseId;

        const skip = (Number(page) - 1) * Number(limit);

        const [bookings, total] = await Promise.all([
            BookingLead.find(filter)
                .populate('farmhouseId', 'title contactNumber ownerContact location images')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            BookingLead.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            data: bookings,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error) {
        next(error);
    }
};

// DELETE /api/bookings/:id (Admin)
exports.deleteBooking = async (req, res, next) => {
    try {
        const booking = await BookingLead.findByIdAndDelete(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking lead not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Booking lead deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// PATCH /api/bookings/:id/status (Admin)
exports.updateBookingStatus = async (req, res, next) => {
    try {
        const { status } = req.body;

        if (!['Inquiry', 'Ongoing', 'Booked'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const booking = await BookingLead.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        ).populate('farmhouseId', 'title contactNumber ownerContact location');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking lead not found'
            });
        }

        res.status(200).json({
            success: true,
            data: booking
        });
    } catch (error) {
        next(error);
    }
};