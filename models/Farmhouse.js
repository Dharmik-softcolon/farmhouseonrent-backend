const mongoose = require('mongoose');

const farmhouseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxlength: [150, 'Title cannot exceed 150 characters']
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        maxlength: [3000, 'Description cannot exceed 3000 characters']
    },
    priceWeekday: {
        type: Number,
        required: [true, 'Weekday price is required'],
        min: [0, 'Price cannot be negative']
    },
    priceWeekend: {
        type: Number,
        required: [true, 'Weekend price is required'],
        min: [0, 'Price cannot be negative']
    },
    location: {
        city: {
            type: String,
            required: [true, 'City is required'],
            trim: true
        },
        subLocation: {
            type: String,
            trim: true,
            default: ''
        },
        fullAddress: {
            type: String,
            required: [true, 'Full address is required'],
            trim: true
        },
        googleMapLink: {
            type: String,
            trim: true,
            default: ''
        }
    },
    images: {
        type: [String],
        validate: {
            validator: function (v) {
                return v.length > 0;
            },
            message: 'At least one image is required'
        }
    },
    videos: {
        type: [String],
        default: []
    },
    facilities: {
        type: [String],
        default: []
    },
    maxGuests: {
        type: Number,
        required: [true, 'Maximum guests is required'],
        min: [1, 'At least 1 guest required']
    },
    contactNumber: {
        type: String,
        required: [true, 'Contact number is required'],
        match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    // ─── NEW: Review/Rating Fields ───
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    totalReviews: {
        type: Number,
        default: 0,
        min: 0
    },
    ratingBreakdown: {
        type: Map,
        of: Number,
        default: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    }
}, {
    timestamps: true
});

farmhouseSchema.index({ 'location.city': 1 });
farmhouseSchema.index({ 'location.subLocation': 1 });
farmhouseSchema.index({ priceWeekday: 1 });
farmhouseSchema.index({ priceWeekend: 1 });
farmhouseSchema.index({ averageRating: -1 });
farmhouseSchema.index({ title: 'text', description: 'text', 'location.city': 'text' });

module.exports = mongoose.model('Farmhouse', farmhouseSchema);