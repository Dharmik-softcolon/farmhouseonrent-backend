const express = require('express');
const router = express.Router();
const {
    getSitemap,
    getRobots,
} = require('../controllers/seoController');

// ── Dynamic sitemap ──
router.get('/sitemap.xml', getSitemap);

// ── Dynamic robots.txt ──
router.get('/robots.txt', getRobots);

module.exports = router;