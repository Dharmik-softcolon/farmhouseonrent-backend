const Farmhouse = require('../models/Farmhouse');
const Review = require('../models/Review');
const BookingLead = require('../models/BookingLead');
const { deleteMultipleByUrls } = require('../utils/s3');

// GET /api/farmhouses
exports.getAllFarmhouses = async (req, res, next) => {
    try {
        const {
            city, subLocation, minPrice, maxPrice, facilities, maxGuests,
            search, sort, page = 1, limit = 12,
        } = req.query;

        const filter = { isActive: true };

        if (city) filter['location.city'] = { $regex: new RegExp(city, 'i') };

        // Sub-location filter (only meaningful for Surat)
        if (subLocation && subLocation.trim()) {
            filter['location.subLocation'] = { $regex: new RegExp(subLocation.trim(), 'i') };
        }

        if (minPrice || maxPrice) {
            filter.priceWeekday = {};
            if (minPrice) filter.priceWeekday.$gte = Number(minPrice);
            if (maxPrice) filter.priceWeekday.$lte = Number(maxPrice);
        }

        if (facilities) {
            const arr = facilities.split(',').map((f) => f.trim().toLowerCase());
            filter.facilities = { $all: arr };
        }

        if (maxGuests) filter.maxGuests = { $gte: Number(maxGuests) };
        if (search) filter.$text = { $search: search };

        let sortOption = { createdAt: -1 };
        if (sort === 'price_asc') sortOption = { priceWeekday: 1 };
        if (sort === 'price_desc') sortOption = { priceWeekday: -1 };
        if (sort === 'newest') sortOption = { createdAt: -1 };
        if (sort === 'guests') sortOption = { maxGuests: -1 };
        if (sort === 'rating') sortOption = { averageRating: -1 };

        const skip = (Number(page) - 1) * Number(limit);

        const [farmhouses, total] = await Promise.all([
            Farmhouse.find(filter).sort(sortOption).skip(skip).limit(Number(limit)).lean(),
            Farmhouse.countDocuments(filter),
        ]);

        res.status(200).json({
            success: true,
            data: farmhouses,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / Number(limit)),
            },
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/farmhouses/:id
exports.getFarmhouse = async (req, res, next) => {
    try {
        const farmhouse = await Farmhouse.findById(req.params.id).lean();
        if (!farmhouse) {
            return res.status(404).json({ success: false, message: 'Farmhouse not found' });
        }
        res.status(200).json({ success: true, data: farmhouse });
    } catch (error) {
        next(error);
    }
};

// POST /api/farmhouses (Admin)
exports.createFarmhouse = async (req, res, next) => {
    try {
        const farmhouse = await Farmhouse.create(req.body);
        res.status(201).json({ success: true, data: farmhouse });
    } catch (error) {
        next(error);
    }
};

// PUT /api/farmhouses/:id (Admin)
exports.updateFarmhouse = async (req, res, next) => {
    try {
        // Get old farmhouse to compare images
        const oldFarmhouse = await Farmhouse.findById(req.params.id);
        if (!oldFarmhouse) {
            return res.status(404).json({ success: false, message: 'Farmhouse not found' });
        }

        const farmhouse = await Farmhouse.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        // Delete removed images from S3 (non-blocking)
        if (req.body.images) {
            const removedImages = oldFarmhouse.images.filter(
                (img) => !req.body.images.includes(img)
            );
            if (removedImages.length > 0) {
                deleteMultipleByUrls(removedImages).catch((err) =>
                    console.error('Failed to cleanup old images:', err.message)
                );
            }
        }

        // Delete removed videos from S3 (non-blocking)
        if (req.body.videos) {
            const removedVideos = (oldFarmhouse.videos || []).filter(
                (vid) => !req.body.videos.includes(vid)
            );
            if (removedVideos.length > 0) {
                deleteMultipleByUrls(removedVideos).catch((err) =>
                    console.error('Failed to cleanup old videos:', err.message)
                );
            }
        }

        res.status(200).json({ success: true, data: farmhouse });
    } catch (error) {
        next(error);
    }
};

// DELETE /api/farmhouses/:id (Admin)
exports.deleteFarmhouse = async (req, res, next) => {
    try {
        const farmhouse = await Farmhouse.findById(req.params.id);
        if (!farmhouse) {
            return res.status(404).json({ success: false, message: 'Farmhouse not found' });
        }

        // Collect all S3 URLs to delete
        const urlsToDelete = [
            ...(farmhouse.images || []),
            ...(farmhouse.videos || []),
        ];

        // Delete related reviews and their images
        const reviews = await Review.find({ farmhouseId: farmhouse._id });
        reviews.forEach((review) => {
            if (review.images && review.images.length > 0) {
                urlsToDelete.push(...review.images);
            }
        });

        // Delete farmhouse
        await Farmhouse.findByIdAndDelete(req.params.id);

        // Delete related reviews and booking leads
        await Promise.all([
            Review.deleteMany({ farmhouseId: req.params.id }),
            BookingLead.deleteMany({ farmhouseId: req.params.id }),
        ]);

        // Cleanup S3 files (non-blocking)
        if (urlsToDelete.length > 0) {
            deleteMultipleByUrls(urlsToDelete).catch((err) =>
                console.error('S3 cleanup error:', err.message)
            );
        }

        res.status(200).json({
            success: true,
            message: 'Farmhouse and all related data deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/farmhouses/cities/list
exports.getCities = async (req, res, next) => {
    try {
        const cities = await Farmhouse.distinct('location.city', { isActive: true });
        res.status(200).json({ success: true, data: cities.sort() });
    } catch (error) {
        next(error);
    }
};

// GET /api/farmhouses/sublocations/list?city=Surat
exports.getSubLocations = async (req, res, next) => {
    try {
        const { city } = req.query;
        const cityFilter = city
            ? { isActive: true, 'location.city': { $regex: new RegExp(city, 'i') } }
            : { isActive: true };
        const subLocations = await Farmhouse.distinct('location.subLocation', cityFilter);
        // Filter out empty strings
        const filtered = subLocations.filter(s => s && s.trim()).sort();
        res.status(200).json({ success: true, data: filtered });
    } catch (error) {
        next(error);
    }
};
