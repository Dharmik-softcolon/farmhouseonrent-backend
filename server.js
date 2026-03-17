const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();
connectDB();

const app = express();

// Security
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(mongoSanitize());

// Rate limiting (higher for uploads)
// const apiLimiter = rateLimit({
//     windowMs: 15 * 60 * 1000,
//     max: 200,
//     message: { success: false, message: 'Too many requests' },
// });
// const uploadLimiter = rateLimit({
//     windowMs: 15 * 60 * 1000,
//     max: 50,
//     message: { success: false, message: 'Too many uploads, try again later' },
// });

// app.use('/api/upload', uploadLimiter);
// app.use('/api/', apiLimiter);

// CORS
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parser (larger limits for potential base64 fallback)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files (local uploads fallback)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/farmhouses', require('./routes/farmhouse'));
app.use('/api/bookings', require('./routes/booking'));
app.use('/api/reviews', require('./routes/review'));
app.use('/api/upload', require('./routes/upload'));

// Health check
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Farmhouse Booking API is running',
        timestamp: new Date().toISOString(),
        s3Bucket: process.env.AWS_BUCKET_NAME || 'not configured',
    });
});

// 404
app.use('*', (req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n🚀 Server running in ${process.env.NODE_ENV || 'development'} on port ${PORT}`);
    console.log(`📦 S3 Bucket: ${process.env.AWS_BUCKET_NAME || 'NOT CONFIGURED'}`);
    console.log(`🌍 Region: ${process.env.AWS_REGION || 'NOT CONFIGURED'}\n`);
});

module.exports = app;