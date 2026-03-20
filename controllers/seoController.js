const Farmhouse = require('../models/Farmhouse');

// ── This must be your FRONTEND domain, not API domain ──
const SITE_URL = 'https://farmhouseonrent.in';
const API_URL = process.env.API_URL || 'https://api.farmhouseonrent.in';

// ─── Helper: format date to YYYY-MM-DD ───
const formatDate = (date) => {
    return date
        ? new Date(date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
};

// ─── Helper: escape XML special characters ───
const escapeXml = (str) => {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
};

// ─── Helper: build <url> block ───
const buildUrl = ({ loc, lastmod, changefreq, priority, images = [] }) => {
    let block = `
  <url>
    <loc>${escapeXml(loc)}</loc>`;

    if (lastmod) {
        block += `
    <lastmod>${lastmod}</lastmod>`;
    }

    block += `
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>`;

    // ── Image sitemap ──
    images.forEach(img => {
        if (img && typeof img === 'string' && img.startsWith('http')) {
            block += `
    <image:image>
      <image:loc>${escapeXml(img)}</image:loc>
    </image:image>`;
        }
    });

    block += `
  </url>`;

    return block;
};

/**
 * @desc    Generate dynamic sitemap.xml
 * @route   GET /sitemap.xml
 * @access  Public
 */
exports.getSitemap = async (req, res, next) => {
    try {
        // ── Allow cross-origin (frontend domain needs this) ──
        res.set('Access-Control-Allow-Origin', SITE_URL);

        // ── Fetch all active farmhouses ──
        const farmhouses = await Farmhouse.find({ isActive: true })
            .select('_id title location images updatedAt')
            .lean();

        // ── Get unique cities from DB ──
        const cities = [
            ...new Set(
                farmhouses
                    .map(f => f.location?.city)
                    .filter(Boolean)
            )
        ];

        // ── Get unique Surat sub-locations ──
        const suratSubLocations = [
            ...new Set(
                farmhouses
                    .filter(f =>
                        f.location?.city?.toLowerCase() === 'surat' &&
                        f.location?.subLocation
                    )
                    .map(f => f.location.subLocation)
                    .filter(Boolean)
            )
        ];

        const today = new Date().toISOString().split('T')[0];

        // ── Most recently updated date ──
        const sortedFarms = [...farmhouses].sort(
            (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
        );
        const latestDate = sortedFarms[0]
            ? formatDate(sortedFarms[0].updatedAt)
            : today;

        // ════════════════════════════════════════
        // BUILD XML — All URLs point to FRONTEND
        // ════════════════════════════════════════
        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`;

        // ── 1. Homepage ──
        xml += buildUrl({
            loc: `${SITE_URL}/`,
            lastmod: latestDate,
            changefreq: 'daily',
            priority: '1.0',
        });

        // ── 2. All Farmhouses listing page ──
        xml += buildUrl({
            loc: `${SITE_URL}/farmhouses`,
            lastmod: latestDate,
            changefreq: 'daily',
            priority: '0.9',
        });

        // ── 3. City filter pages ──
        cities.forEach(city => {
            xml += buildUrl({
                loc: `${SITE_URL}/farmhouses?city=${encodeURIComponent(city)}`,
                lastmod: latestDate,
                changefreq: 'weekly',
                priority: '0.8',
            });
        });

        // ── 4. Surat sub-location pages ──
        suratSubLocations.forEach(subLoc => {
            xml += buildUrl({
                loc: `${SITE_URL}/farmhouses?city=Surat&subLocation=${encodeURIComponent(subLoc)}`,
                lastmod: latestDate,
                changefreq: 'weekly',
                priority: '0.7',
            });
        });

        // ── 5. Individual farmhouse detail pages ──
        farmhouses.forEach(farm => {
            const imageUrls = (farm.images || [])
                .slice(0, 5)
                .filter(img => img && img.startsWith('http'));

            xml += buildUrl({
                loc: `${SITE_URL}/farmhouse/${farm._id}`,
                lastmod: formatDate(farm.updatedAt),
                changefreq: 'weekly',
                priority: '0.7',
                images: imageUrls,
            });
        });

        xml += `
</urlset>`;

        // ── Headers ──
        res.set({
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600, s-maxage=43200',
            'X-Robots-Tag': 'noindex',
        });

        return res.status(200).send(xml);

    } catch (error) {
        console.error('❌ Sitemap generation error:', error);
        next(error);
    }
};

// ═══════════════════════════════════════
// GET /robots.txt
// ═══════════════════════════════════════
exports.getRobots = (req, res) => {
    const robotsTxt = `User-agent: *
Allow: /

Disallow: /admin/
Disallow: /admin/login
Disallow: /admin/dashboard
Disallow: /admin/add-farmhouse
Disallow: /admin/edit-farmhouse/
Disallow: /admin/bookings
Disallow: /admin/reviews
Disallow: /admin/bulk-upload
Disallow: /*?minPrice=
Disallow: /*?maxPrice=
Disallow: /*?sort=price_asc
Disallow: /*?sort=price_desc

Allow: /farmhouses
Allow: /farmhouses?city=
Allow: /farmhouse/

Crawl-delay: 1

Sitemap: ${SITE_URL}/sitemap.xml`;

    res.set({
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=86400',
    });

    return res.status(200).send(robotsTxt);
};