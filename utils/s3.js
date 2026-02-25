const {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
    DeleteObjectsCommand,
    HeadObjectCommand,
} = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Initialize S3 Client
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME;
const REGION = process.env.AWS_REGION;

// Allowed types
const ALLOWED_IMAGE_TYPES = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
];

const ALLOWED_VIDEO_TYPES = [
    'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm',
];

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;   // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;  // 100MB

/**
 * Build public URL for an S3 object
 */
const getPublicUrl = (key) => {
    return `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${key}`;
};

/**
 * Generate unique S3 key
 */
const generateKey = (folder, originalName, fileType) => {
    const ext = path.extname(originalName).toLowerCase() || `.${fileType.split('/')[1]}`;
    const uniqueId = uuidv4();
    const timestamp = Date.now();
    return `${folder}/${timestamp}-${uniqueId}${ext}`;
};

/**
 * Upload buffer to S3 (NO ACL — bucket policy handles public read)
 */
const uploadToS3 = async (fileBuffer, originalName, mimeType, folder = 'general') => {
    const key = generateKey(folder, originalName, mimeType);

    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
        CacheControl: 'public, max-age=31536000, immutable',
        Metadata: {
            originalName: encodeURIComponent(originalName),
            uploadedAt: new Date().toISOString(),
        },
        // NO ACL — bucket policy handles public read access
    });

    await s3Client.send(command);

    return {
        url: getPublicUrl(key),
        key,
        bucket: BUCKET_NAME,
        originalName,
        mimeType,
        size: fileBuffer.length,
    };
};

/**
 * Delete single file from S3
 */
const deleteFromS3 = async (key) => {
    try {
        const command = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        });
        await s3Client.send(command);
        return true;
    } catch (error) {
        console.error('S3 delete error:', error.message);
        return false;
    }
};

/**
 * Delete multiple files from S3
 */
const deleteMultipleFromS3 = async (keys) => {
    if (!keys || keys.length === 0) return true;

    try {
        const command = new DeleteObjectsCommand({
            Bucket: BUCKET_NAME,
            Delete: {
                Objects: keys.map((key) => ({ Key: key })),
                Quiet: true,
            },
        });
        await s3Client.send(command);
        return true;
    } catch (error) {
        console.error('S3 bulk delete error:', error.message);
        return false;
    }
};

/**
 * Extract S3 key from public URL
 */
const extractKeyFromUrl = (url) => {
    try {
        if (!url || !url.includes('amazonaws.com')) return null;
        const urlObj = new URL(url);
        return urlObj.pathname.substring(1); // Remove leading /
    } catch {
        return null;
    }
};

/**
 * Delete file by its public URL
 */
const deleteByUrl = async (url) => {
    const key = extractKeyFromUrl(url);
    if (!key) return false;
    return await deleteFromS3(key);
};

/**
 * Delete multiple files by their public URLs
 */
const deleteMultipleByUrls = async (urls) => {
    const keys = urls
        .map((url) => extractKeyFromUrl(url))
        .filter(Boolean);
    if (keys.length === 0) return true;
    return await deleteMultipleFromS3(keys);
};

/**
 * Check if file exists in S3
 */
const fileExists = async (key) => {
    try {
        await s3Client.send(new HeadObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
        return true;
    } catch {
        return false;
    }
};

module.exports = {
    s3Client,
    BUCKET_NAME,
    REGION,
    ALLOWED_IMAGE_TYPES,
    ALLOWED_VIDEO_TYPES,
    MAX_IMAGE_SIZE,
    MAX_VIDEO_SIZE,
    getPublicUrl,
    generateKey,
    uploadToS3,
    deleteFromS3,
    deleteMultipleFromS3,
    extractKeyFromUrl,
    deleteByUrl,
    deleteMultipleByUrls,
    fileExists,
};