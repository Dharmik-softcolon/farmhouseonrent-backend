const express = require('express');
const router = express.Router();
const { getSitemap } = require('../controllers/seoController');

// GET /sitemap.xml
router.get('/sitemap.xml', getSitemap);

module.exports = router;
