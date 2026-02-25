const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('../models/Admin');
const Farmhouse = require('../models/Farmhouse');

dotenv.config();

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected for seeding...');

        // Seed Admin
        await Admin.deleteMany({});
        const admin = await Admin.create({
            name: 'Super Admin',
            email: process.env.ADMIN_EMAIL || 'admin@farmhouse.com',
            password: process.env.ADMIN_PASSWORD || 'Admin@123456',
            role: 'admin'
        });
        console.log('Admin seeded:', admin.email);

        // Seed Farmhouses
        await Farmhouse.deleteMany({});
        const farmhouses = await Farmhouse.insertMany([
            {
                title: 'Royal Garden Farmhouse',
                description: 'A luxurious farmhouse with a beautiful garden, swimming pool, and modern amenities. Perfect for family gatherings, birthday parties, and weekend getaways. Surrounded by lush greenery and equipped with all modern comforts.',
                priceWeekday: 8000,
                priceWeekend: 12000,
                location: {
                    city: 'Ahmedabad',
                    fullAddress: 'Nr. Shilaj Circle, Sardar Patel Ring Road, Ahmedabad, Gujarat 380058',
                    googleMapLink: 'https://maps.google.com/?q=23.0225,72.5714'
                },
                images: [
                    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
                    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
                    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
                    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800'
                ],
                videos: [],
                facilities: ['pool', 'garden', 'ac', 'kitchen', 'parking', 'wifi', 'bbq', 'music_system'],
                maxGuests: 30,
                contactNumber: '9876543210',
                isActive: true
            },
            {
                title: 'Sunset Villa Farmhouse',
                description: 'Experience the magic of sunsets at this premium farmhouse located on the outskirts of Surat. Features a private pool, game zone, and spacious lawns for events.',
                priceWeekday: 6000,
                priceWeekend: 9500,
                location: {
                    city: 'Surat',
                    fullAddress: 'Kamrej-Bardoli Road, Nr. Kamrej, Surat, Gujarat 394185',
                    googleMapLink: 'https://maps.google.com/?q=21.1702,72.8311'
                },
                images: [
                    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800',
                    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
                    'https://images.unsplash.com/photo-1599809275671-b5942cabc7a2?w=800'
                ],
                videos: [],
                facilities: ['pool', 'garden', 'ac', 'parking', 'wifi', 'indoor_games', 'outdoor_games', 'bonfire'],
                maxGuests: 25,
                contactNumber: '9876543211',
                isActive: true
            },
            {
                title: 'Green Acres Retreat',
                description: 'A serene retreat nestled among mango orchards. Ideal for nature lovers seeking peace and tranquility. Comes with organic farm experience and traditional Gujarati hospitality.',
                priceWeekday: 5000,
                priceWeekend: 7500,
                location: {
                    city: 'Vadodara',
                    fullAddress: 'Waghodia Road, Nr. Timbi Village, Vadodara, Gujarat 391760',
                    googleMapLink: 'https://maps.google.com/?q=22.3072,73.1812'
                },
                images: [
                    'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800',
                    'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800',
                    'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800'
                ],
                videos: [],
                facilities: ['garden', 'ac', 'kitchen', 'parking', 'pet_friendly', 'caretaker', 'power_backup'],
                maxGuests: 20,
                contactNumber: '9876543212',
                isActive: true
            },
            {
                title: 'Paradise Pool Villa',
                description: 'A stunning pool villa with waterpark features, perfect for large groups and celebrations. Modern architecture with traditional comfort. DJ setup available on request.',
                priceWeekday: 15000,
                priceWeekend: 22000,
                location: {
                    city: 'Ahmedabad',
                    fullAddress: 'Sanand-Nalsarovar Road, Sanand, Ahmedabad, Gujarat 382110',
                    googleMapLink: 'https://maps.google.com/?q=22.9927,72.3790'
                },
                images: [
                    'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800',
                    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',
                    'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800',
                    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800'
                ],
                videos: [],
                facilities: ['pool', 'waterpark', 'garden', 'ac', 'kitchen', 'parking', 'wifi', 'bbq', 'music_system', 'projector', 'security', 'power_backup'],
                maxGuests: 50,
                contactNumber: '9876543213',
                isActive: true
            },
            {
                title: 'Riverside Cottage Farm',
                description: 'A charming riverside cottage surrounded by farmland. Wake up to birds chirping and fresh country air. Perfect for couple retreats and small family picnics.',
                priceWeekday: 3500,
                priceWeekend: 5500,
                location: {
                    city: 'Rajkot',
                    fullAddress: 'Aji Dam Road, Nr. Nyari Dam, Rajkot, Gujarat 360007',
                    googleMapLink: 'https://maps.google.com/?q=22.3039,70.8022'
                },
                images: [
                    'https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=800',
                    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800',
                    'https://images.unsplash.com/photo-1600047508006-7f8ae4b6448c?w=800'
                ],
                videos: [],
                facilities: ['garden', 'ac', 'kitchen', 'parking', 'bonfire', 'pet_friendly', 'caretaker'],
                maxGuests: 10,
                contactNumber: '9876543214',
                isActive: true
            },
            {
                title: 'Mountain View Farmhouse',
                description: 'A breathtaking farmhouse with panoramic mountain views. Located at the foothills of Girnar, this property offers hiking trails, natural springs, and ultimate relaxation.',
                priceWeekday: 7000,
                priceWeekend: 11000,
                location: {
                    city: 'Junagadh',
                    fullAddress: 'Girnar Foothills, Nr. Bhavnath Temple, Junagadh, Gujarat 362001',
                    googleMapLink: 'https://maps.google.com/?q=21.5222,70.4579'
                },
                images: [
                    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
                    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
                    'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800'
                ],
                videos: [],
                facilities: ['garden', 'ac', 'kitchen', 'parking', 'wifi', 'bonfire', 'spa', 'gym', 'security'],
                maxGuests: 15,
                contactNumber: '9876543215',
                isActive: true
            }
        ]);
        console.log(`${farmhouses.length} farmhouses seeded successfully`);

        console.log('\n--- Seed Complete ---');
        console.log(`Admin Login: ${process.env.ADMIN_EMAIL || 'admin@farmhouse.com'}`);
        console.log(`Admin Password: ${process.env.ADMIN_PASSWORD || 'Admin@123456'}`);

        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
};

seedData();