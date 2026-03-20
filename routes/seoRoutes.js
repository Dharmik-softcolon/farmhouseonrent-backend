const express = require('express');
const router = express.Router();
const {
    getSitemap,
    getRobots,
    getSitemapIndex,
} = require('../controllers/seoController');

// ── Dynamic sitemap ──
router.get('/sitemap.xml', getSitemap);

// ── Dynamic robots.txt ──
router.get('/robots.txt', getRobots);

// ── Sitemap index (for future when you have 100+ farmhouses) ──
router.get('/sitemap-index.xml', getSitemapIndex);

module.exports = router;
