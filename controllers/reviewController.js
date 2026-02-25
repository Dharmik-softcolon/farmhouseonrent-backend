const Review = require('../models/Review');
const Farmhouse = require('../models/Farmhouse');
const { processAndUploadImages } = require('../middleware/upload');
const { deleteByUrl } = require('../utils/s3');

// POST /api/reviews
exports.createReview = async (req, res, next) => {
    try {
        const { farmhouseId, userName, userEmail, rating, title, reviewText, visitDate } = req.body;

        const farmhouse = await Farmhouse.findById(farmhouseId);
        if (!farmhouse) {
            return res.status(404).json({ success: false, message: 'Farmhouse not found' });
        }

        let imageUrls = [];

        // Upload images to S3 if files provided
        if (req.files && req.files.length > 0) {
            const uploadResults = await processAndUploadImages(req.files, 'reviews');
            imageUrls = uploadResults.map(r => r.url);
        }

        // Also accept pre-uploaded URLs from body
        if (req.body.imageUrls) {
            const bodyUrls = typeof req.body.imageUrls === 'string'
                ? JSON.parse(req.body.imageUrls)
                : req.body.imageUrls;
            imageUrls = [...imageUrls, ...bodyUrls];
        }

        const review = await Review.create({
            farmhouseId,
            userName,
            userEmail: userEmail || '',
            rating: Number(rating),
            title: title || '',
            reviewText,
            images: imageUrls.slice(0, 5),
            visitDate: visitDate || null,
        });

        const populatedReview = await Review.findById(review._id)
            .populate('farmhouseId', 'title');

        res.status(201).json({ success: true, data: populatedReview });
    } catch (error) {
        next(error);
    }
};

// GET /api/reviews/farmhouse/:farmhouseId
exports.getReviewsByFarmhouse = async (req, res, next) => {
    try {
        const { farmhouseId } = req.params;
        const { page = 1, limit = 10, sort = 'newest' } = req.query;
        const filter = { farmhouseId, isApproved: true };

        let sortOption = { createdAt: -1 };
        if (sort === 'oldest') sortOption = { createdAt: 1 };
        if (sort === 'highest') sortOption = { rating: -1, createdAt: -1 };
        if (sort === 'lowest') sortOption = { rating: 1, createdAt: -1 };
        if (sort === 'helpful') sortOption = { helpfulCount: -1, createdAt: -1 };

        const skip = (Number(page) - 1) * Number(limit);

        const [reviews, total] = await Promise.all([
            Review.find(filter).sort(sortOption).skip(skip).limit(Number(limit)).lean(),
            Review.countDocuments(filter),
        ]);

        const mongoose = require('mongoose');
        const stats = await Review.aggregate([
            { $match: { farmhouseId: new mongoose.Types.ObjectId(farmhouseId), isApproved: true } },
            {
                $group: {
                    _id: null,
                    avgRating: { $avg: '$rating' },
                    total: { $sum: 1 },
                    star5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
                    star4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
                    star3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
                    star2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
                    star1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
                },
            },
        ]);

        const ratingStats = stats.length > 0
            ? {
                average: Math.round(stats[0].avgRating * 10) / 10,
                total: stats[0].total,
                breakdown: { 5: stats[0].star5, 4: stats[0].star4, 3: stats[0].star3, 2: stats[0].star2, 1: stats[0].star1 },
            }
            : { average: 0, total: 0, breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };

        res.status(200).json({
            success: true,
            data: reviews,
            ratingStats,
            pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/reviews (Admin)
exports.getAllReviews = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, farmhouseId, approved } = req.query;
        const filter = {};
        if (farmhouseId) filter.farmhouseId = farmhouseId;
        if (approved !== undefined) filter.isApproved = approved === 'true';

        const skip = (Number(page) - 1) * Number(limit);
        const [reviews, total] = await Promise.all([
            Review.find(filter).populate('farmhouseId', 'title location images').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
            Review.countDocuments(filter),
        ]);

        res.status(200).json({
            success: true,
            data: reviews,
            pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
        });
    } catch (error) {
        next(error);
    }
};

// PUT /api/reviews/:id/approve
exports.toggleApproval = async (req, res, next) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
        review.isApproved = !review.isApproved;
        await review.save();
        res.status(200).json({ success: true, data: review });
    } catch (error) {
        next(error);
    }
};

// POST /api/reviews/:id/helpful
exports.markHelpful = async (req, res, next) => {
    try {
        const review = await Review.findByIdAndUpdate(req.params.id, { $inc: { helpfulCount: 1 } }, { new: true });
        if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
        res.status(200).json({ success: true, data: { helpfulCount: review.helpfulCount } });
    } catch (error) {
        next(error);
    }
};

// DELETE /api/reviews/:id (Admin)
exports.deleteReview = async (req, res, next) => {
    try {
        const review = await Review.findByIdAndDelete(req.params.id);
        if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

        // Delete images from S3
        if (review.images && review.images.length > 0) {
            await Promise.all(review.images.map(url => deleteByUrl(url)));
        }

        res.status(200).json({ success: true, message: 'Review deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// GET /api/reviews/photos/:farmhouseId
exports.getReviewPhotos = async (req, res, next) => {
    try {
        const { farmhouseId } = req.params;
        const reviews = await Review.find({
            farmhouseId,
            isApproved: true,
            images: { $exists: true, $ne: [] },
        }).select('images userName rating createdAt').sort({ createdAt: -1 }).lean();

        const photos = [];
        reviews.forEach(review => {
            review.images.forEach(img => {
                photos.push({ url: img, userName: review.userName, rating: review.rating, reviewId: review._id, date: review.createdAt });
            });
        });

        res.status(200).json({ success: true, data: photos, total: photos.length });
    } catch (error) {
        next(error);
    }
};