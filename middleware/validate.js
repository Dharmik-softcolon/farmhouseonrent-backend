const { body, param, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
        });
    }
    next();
};

const validateLogin = [
    body('email')
        .isEmail().withMessage('Please enter a valid email')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    handleValidationErrors
];

const validateFarmhouse = [
    body('title')
        .trim().notEmpty().withMessage('Title is required')
        .isLength({ max: 150 }).withMessage('Title cannot exceed 150 characters'),
    body('description')
        .trim().notEmpty().withMessage('Description is required')
        .isLength({ max: 3000 }).withMessage('Description cannot exceed 3000 characters'),
    body('priceWeekday')
        .isNumeric().withMessage('Weekday price must be a number')
        .custom(v => v >= 0).withMessage('Price cannot be negative'),
    body('priceWeekend')
        .isNumeric().withMessage('Weekend price must be a number')
        .custom(v => v >= 0).withMessage('Price cannot be negative'),
    body('location.city')
        .trim().notEmpty().withMessage('City is required'),
    body('location.fullAddress')
        .trim().notEmpty().withMessage('Full address is required'),
    body('images')
        .isArray({ min: 1 }).withMessage('At least one image URL is required'),
    body('images.*')
        .isURL().withMessage('Each image must be a valid URL'),
    body('maxGuests')
        .isInt({ min: 1 }).withMessage('Max guests must be at least 1'),
    body('contactNumber')
        .matches(/^[6-9]\d{9}$/).withMessage('Please enter a valid 10-digit Indian mobile number'),
    body('facilities')
        .optional()
        .isArray().withMessage('Facilities must be an array'),
    body('videos')
        .optional()
        .isArray().withMessage('Videos must be an array'),
    handleValidationErrors
];

const validateBooking = [
    body('farmhouseId')
        .notEmpty().withMessage('Farmhouse ID is required')
        .isMongoId().withMessage('Invalid farmhouse ID'),
    body('name')
        .trim().notEmpty().withMessage('Name is required')
        .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
    body('mobileNumber')
        .matches(/^[6-9]\d{9}$/).withMessage('Please enter a valid 10-digit Indian mobile number'),
    body('preferredDate')
        .isISO8601().withMessage('Please enter a valid date')
        .custom(value => {
            if (new Date(value) < new Date().setHours(0, 0, 0, 0)) {
                throw new Error('Preferred date cannot be in the past');
            }
            return true;
        }),
    body('message')
        .optional()
        .isLength({ max: 500 }).withMessage('Message cannot exceed 500 characters'),
    handleValidationErrors
];

const validateObjectId = [
    param('id').isMongoId().withMessage('Invalid ID format'),
    handleValidationErrors
];

module.exports = {
    validateLogin,
    validateFarmhouse,
    validateBooking,
    validateObjectId,
    handleValidationErrors
};