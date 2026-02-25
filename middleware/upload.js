const multer = require('multer');
const sharp = require('sharp');
const {
    uploadToS3,
    ALLOWED_IMAGE_TYPES,
    ALLOWED_VIDEO_TYPES,
    MAX_IMAGE_SIZE,
    MAX_VIDEO_SIZE,
} = require('../utils/s3');

// Memory storage — files go to buffer then S3
const memoryStorage = multer.memoryStorage();

// File filters
const imageFilter = (req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid image format. Allowed: JPG, PNG, WebP, GIF'), false);
    }
};

const videoFilter = (req, file, cb) => {
    if (ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid video format. Allowed: MP4, WebM, MOV, AVI'), false);
    }
};

const mediaFilter = (req, file, cb) => {
    if ([...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES].includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file format'), false);
    }
};

// Multer instances
const uploadImages = multer({
    storage: memoryStorage,
    fileFilter: imageFilter,
    limits: { fileSize: MAX_IMAGE_SIZE, files: 10 },
});

const uploadVideos = multer({
    storage: memoryStorage,
    fileFilter: videoFilter,
    limits: { fileSize: MAX_VIDEO_SIZE, files: 5 },
});

const uploadReviewImages = multer({
    storage: memoryStorage,
    fileFilter: imageFilter,
    limits: { fileSize: MAX_IMAGE_SIZE, files: 5 },
});

/**
 * Process images with Sharp + upload to S3
 */
const processAndUploadImages = async (files, folder = 'farmhouses') => {
    const results = [];

    for (const file of files) {
        try {
            let processedBuffer;
            let outputMime = 'image/jpeg';
            const isGif = file.mimetype === 'image/gif';

            if (isGif) {
                processedBuffer = file.buffer;
                outputMime = 'image/gif';
            } else {
                // Optimize: resize, convert to progressive JPEG
                processedBuffer = await sharp(file.buffer)
                    .resize(1600, 1200, { fit: 'inside', withoutEnlargement: true })
                    .jpeg({ quality: 85, progressive: true, mozjpeg: true })
                    .toBuffer();
            }

            const result = await uploadToS3(
                processedBuffer,
                file.originalname,
                outputMime,
                folder
            );
            results.push(result);

            console.log(`✅ Uploaded: ${file.originalname} → ${result.url} (${(result.size / 1024).toFixed(1)}KB)`);
        } catch (error) {
            console.error(`❌ Failed to process ${file.originalname}:`, error.message);

            // Fallback: upload original without processing
            try {
                const result = await uploadToS3(file.buffer, file.originalname, file.mimetype, folder);
                results.push(result);
                console.log(`⚠️ Uploaded original: ${file.originalname}`);
            } catch (uploadErr) {
                console.error(`❌ Failed to upload ${file.originalname}:`, uploadErr.message);
            }
        }
    }

    return results;
};

/**
 * Upload videos to S3 (no processing)
 */
const processAndUploadVideos = async (files, folder = 'farmhouses/videos') => {
    const results = [];

    for (const file of files) {
        try {
            const result = await uploadToS3(file.buffer, file.originalname, file.mimetype, folder);
            results.push(result);
            console.log(`✅ Video uploaded: ${file.originalname} → ${result.url}`);
        } catch (error) {
            console.error(`❌ Video upload failed ${file.originalname}:`, error.message);
        }
    }

    return results;
};

/**
 * Multer error handler
 */
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        const messages = {
            LIMIT_FILE_SIZE: 'File too large. Images: max 10MB, Videos: max 100MB.',
            LIMIT_FILE_COUNT: 'Too many files uploaded.',
            LIMIT_UNEXPECTED_FILE: `Unexpected field: ${err.field}`,
        };
        return res.status(400).json({
            success: false,
            message: messages[err.code] || `Upload error: ${err.message}`,
        });
    }
    if (err) {
        return res.status(400).json({
            success: false,
            message: err.message || 'File upload failed',
        });
    }
    next();
};

module.exports = {
    uploadImages,
    uploadVideos,
    uploadReviewImages,
    processAndUploadImages,
    processAndUploadVideos,
    handleUploadError,
};