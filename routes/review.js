const express = require('express');
const router = express.Router();
const {
    createReview,
    getReviewsByFarmhouse,
    getAllReviews,
    toggleApproval,
    markHelpful,
    deleteReview,
    getReviewPhotos,
} = require('../controllers/reviewController');
const { protect, adminOnly } = require('../middleware/auth');
const { uploadReviewImages, handleUploadError } = require('../middleware/upload');
const { body } = require('express-validator');
const { handleValidationErrors, validateObjectId } = require('../middleware/validate');

const validateReview = [
    body('farmhouseId').notEmpty().withMessage('Farmhouse ID is required').isMongoId().withMessage('Invalid farmhouse ID'),
    body('userName').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('reviewText').trim().notEmpty().withMessage('Review text is required').isLength({ max: 2000 }),
    body('title').optional().isLength({ max: 150 }),
    handleValidationErrors,
];

// Public: create review (with optional image upload via multipart OR pre-uploaded URLs)
router.post(
    '/',
    uploadReviewImages.array('images', 5),
    handleUploadError,
    validateReview,
    createReview
);

router.get('/farmhouse/:farmhouseId', getReviewsByFarmhouse);
router.get('/photos/:farmhouseId', getReviewPhotos);
router.post('/:id/helpful', markHelpful);

// Admin
router.get('/', protect, adminOnly, getAllReviews);
router.put('/:id/approve', protect, adminOnly, validateObjectId, toggleApproval);
router.delete('/:id', protect, adminOnly, validateObjectId, deleteReview);

module.exports = router;