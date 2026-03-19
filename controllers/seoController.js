const Farmhouse = require('../models/Farmhouse');

/**
 * @desc    Generate and serve dynamic sitemap.xml
 * @route   GET /sitemap.xml
 * @access  Public
 */
exports.getSitemap = async (req, res, next) => {
    try {
        const baseUrl = process.env.CLIENT_URL || 'https://farmhouseonrent.in';
        
        // Fetch all active farmhouses
        const farmhouses = await Farmhouse.find({ isActive: true })
            .select('_id updatedAt')
            .lean();

        // Start XML string
        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/farmhouses</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;

        // Add dynamic farmhouse pages
        farmhouses.forEach(farm => {
            const lastMod = farm.updatedAt ? farm.updatedAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
            xml += `
  <url>
    <loc>${baseUrl}/farmhouse/${farm._id}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
        });

        // Close XML string
        xml += `
</urlset>`;

        // Send response
        res.header('Content-Type', 'application/xml');
        res.status(200).send(xml);
    } catch (error) {
        next(error);
    }
};
