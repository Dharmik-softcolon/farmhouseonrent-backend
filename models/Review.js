const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    farmhouseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Farmhouse',
        required: [true, 'Farmhouse reference is required']
    },
    userName: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    userEmail: {
        type: String,
        trim: true,
        lowercase: true,
        default: ''
    },
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot exceed 5']
    },
    title: {
        type: String,
        trim: true,
        maxlength: [150, 'Title cannot exceed 150 characters'],
        default: ''
    },
    reviewText: {
        type: String,
        required: [true, 'Review text is required'],
        trim: true,
        maxlength: [2000, 'Review cannot exceed 2000 characters']
    },
    images: {
        type: [String],
        default: [],
        validate: {
            validator: function (v) {
                return v.length <= 5;
            },
            message: 'Maximum 5 images allowed per review'
        }
    },
    visitDate: {
        type: Date,
        default: null
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    isApproved: {
        type: Boolean,
        default: true
    },
    helpfulCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

reviewSchema.index({ farmhouseId: 1, createdAt: -1 });
reviewSchema.index({ rating: 1 });

// Static method to calculate average rating for a farmhouse
reviewSchema.statics.calcAverageRating = async function (farmhouseId) {
    const stats = await this.aggregate([
        { $match: { farmhouseId, isApproved: true } },
        {
            $group: {
                _id: '$farmhouseId',
                avgRating: { $avg: '$rating' },
                totalReviews: { $sum: 1 },
                ratingBreakdown: {
                    $push: '$rating'
                }
            }
        }
    ]);

    if (stats.length > 0) {
        const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        stats[0].ratingBreakdown.forEach(r => { breakdown[r]++; });

        await mongoose.model('Farmhouse').findByIdAndUpdate(farmhouseId, {
            averageRating: Math.round(stats[0].avgRating * 10) / 10,
            totalReviews: stats[0].totalReviews,
            ratingBreakdown: breakdown
        });
    } else {
        await mongoose.model('Farmhouse').findByIdAndUpdate(farmhouseId, {
            averageRating: 0,
            totalReviews: 0,
            ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        });
    }
};

// Recalculate after save
reviewSchema.post('save', function () {
    this.constructor.calcAverageRating(this.farmhouseId);
});

// Recalculate after delete
reviewSchema.post('findOneAndDelete', function (doc) {
    if (doc) {
        doc.constructor.calcAverageRating(doc.farmhouseId);
    }
});

module.exports = mongoose.model('Review', reviewSchema);