const {
    processAndUploadImages,
    processAndUploadVideos,
} = require('../middleware/upload');
const { deleteByUrl, deleteMultipleByUrls } = require('../utils/s3');

/**
 * POST /api/upload/images
 * Upload multiple images to S3 (admin only)
 */
exports.uploadImages = async (req, res, next) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No images provided',
            });
        }

        const folder = req.body.folder || 'farmhouses';
        const results = await processAndUploadImages(req.files, folder);

        if (results.length === 0) {
            return res.status(500).json({
                success: false,
                message: 'Failed to upload images. Check S3 configuration.',
            });
        }

        res.status(200).json({
            success: true,
            message: `${results.length} image(s) uploaded successfully`,
            data: results.map((r) => ({
                url: r.url,
                key: r.key,
                originalName: r.originalName,
                size: r.size,
            })),
            count: results.length,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/upload/videos
 * Upload multiple videos to S3 (admin only)
 */
exports.uploadVideos = async (req, res, next) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No videos provided',
            });
        }

        const folder = req.body.folder || 'farmhouses/videos';
        const results = await processAndUploadVideos(req.files, folder);

        if (results.length === 0) {
            return res.status(500).json({
                success: false,
                message: 'Failed to upload videos. Check S3 configuration.',
            });
        }

        res.status(200).json({
            success: true,
            message: `${results.length} video(s) uploaded successfully`,
            data: results.map((r) => ({
                url: r.url,
                key: r.key,
                originalName: r.originalName,
                size: r.size,
            })),
            count: results.length,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/upload/review-images
 * Upload review images to S3 (public — no auth)
 */
exports.uploadReviewImages = async (req, res, next) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No images provided',
            });
        }

        const results = await processAndUploadImages(req.files, 'reviews');

        if (results.length === 0) {
            return res.status(500).json({
                success: false,
                message: 'Failed to upload review images.',
            });
        }

        res.status(200).json({
            success: true,
            data: results.map((r) => ({
                url: r.url,
                key: r.key,
                originalName: r.originalName,
                size: r.size,
            })),
            count: results.length,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/upload/delete
 * Delete single file from S3 (admin only)
 */
exports.deleteFile = async (req, res, next) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({
                success: false,
                message: 'File URL is required',
            });
        }

        const deleted = await deleteByUrl(url);

        res.status(200).json({
            success: true,
            message: deleted ? 'File deleted successfully' : 'File may already be deleted',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/upload/delete-multiple
 * Delete multiple files from S3 (admin only)
 */
exports.deleteMultipleFiles = async (req, res, next) => {
    try {
        const { urls } = req.body;

        if (!urls || !Array.isArray(urls) || urls.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Array of URLs is required',
            });
        }

        await deleteMultipleByUrls(urls);

        res.status(200).json({
            success: true,
            message: `Deleted ${urls.length} file(s)`,
        });
    } catch (error) {
        next(error);
    }
};