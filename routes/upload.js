const express = require('express');
const router = express.Router();
const {
    uploadImages,
    uploadVideos,
    uploadReviewImages,
    deleteFile,
    deleteMultipleFiles,
} = require('../controllers/uploadController');
const { protect, adminOnly } = require('../middleware/auth');
const {
    uploadImages: multerImages,
    uploadVideos: multerVideos,
    uploadReviewImages: multerReviewImages,
    handleUploadError,
} = require('../middleware/upload');

// Admin: Upload farmhouse images (up to 10)
router.post(
    '/images',
    protect,
    adminOnly,
    multerImages.array('images', 10),
    handleUploadError,
    uploadImages
);

// Admin: Upload farmhouse videos (up to 5)
router.post(
    '/videos',
    protect,
    adminOnly,
    multerVideos.array('videos', 5),
    handleUploadError,
    uploadVideos
);

// Public: Upload review images (up to 5)
router.post(
    '/review-images',
    multerReviewImages.array('images', 5),
    handleUploadError,
    uploadReviewImages
);

// Admin: Delete single file
router.delete('/delete', protect, adminOnly, deleteFile);

// Admin: Delete multiple files
router.post('/delete-multiple', protect, adminOnly, deleteMultipleFiles);

module.exports = router;