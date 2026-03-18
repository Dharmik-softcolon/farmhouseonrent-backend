const mongoose = require('mongoose');

const bookingLeadSchema = new mongoose.Schema({
    farmhouseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Farmhouse',
        required: [true, 'Farmhouse reference is required']
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    mobileNumber: {
        type: String,
        required: [true, 'Mobile number is required'],
        match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number']
    },
    preferredDate: {
        type: Date,
        required: [true, 'Preferred date is required']
    },
    message: {
        type: String,
        maxlength: [500, 'Message cannot exceed 500 characters'],
        default: ''
    },
    status: {
        type: String,
        enum: ['Inquiry', 'Ongoing', 'Booked'],
        default: 'Inquiry'
    }
}, {
    timestamps: true
});

bookingLeadSchema.index({ createdAt: -1 });
bookingLeadSchema.index({ farmhouseId: 1 });

module.exports = mongoose.model('BookingLead', bookingLeadSchema);