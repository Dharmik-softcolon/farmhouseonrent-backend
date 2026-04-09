/**
 * One-time migration: add slug to all existing Farmhouse records.
 *
 * Usage:
 *   cd server
 *   node scripts/addSlugs.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Farmhouse = require('../models/Farmhouse');

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const farms = await Farmhouse.find({ slug: { $in: [null, '', undefined] } });
    console.log(`Found ${farms.length} farm(s) without a slug`);

    let updated = 0;
    let skipped = 0;

    for (const farm of farms) {
        try {
            // Trigger the pre-validate hook by calling save()
            await farm.save();
            console.log(`  ✔ ${farm.title} → ${farm.slug}`);
            updated++;
        } catch (err) {
            console.error(`  ✘ ${farm.title}: ${err.message}`);
            skipped++;
        }
    }

    console.log(`\nDone. Updated: ${updated}, Skipped: ${skipped}`);
    await mongoose.disconnect();
}

run().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
});
