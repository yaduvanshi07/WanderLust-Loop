const mongoose = require("mongoose");
const Community = require("../models/community");
const User = require("../models/user");
require('dotenv').config();

const dbUrl = process.env.ATLASDB_URL;

const defaultCommunities = [
    {
        name: "Foodie Travelers",
        description: "For travelers who love exploring cuisines and food culture around the world",
        category: "foodie",
        icon: "fa-utensils"
    },
    {
        name: "Adventure Seekers",
        description: "Connect with fellow adventure enthusiasts for extreme sports and outdoor activities",
        category: "adventure",
        icon: "fa-mountain"
    },
    {
        name: "Culture Explorers",
        description: "Discover and share cultural experiences with like-minded travelers",
        category: "culture",
        icon: "fa-monument"
    },
    {
        name: "Digital Nomads",
        description: "For remote workers and digital nomads traveling while working",
        category: "nomad",
        icon: "fa-laptop"
    },
    {
        name: "Budget Travelers",
        description: "Share tips and tricks for budget-friendly travel experiences",
        category: "budget",
        icon: "fa-wallet"
    },
    {
        name: "Luxury Travelers",
        description: "Connect with travelers who prefer premium and luxury experiences",
        category: "luxury",
        icon: "fa-gem"
    },
    {
        name: "Backpackers",
        description: "Community for backpackers exploring the world on a budget",
        category: "backpacking",
        icon: "fa-backpack"
    },
    {
        name: "Wellness & Yoga",
        description: "For travelers interested in wellness, yoga, and spiritual journeys",
        category: "wellness",
        icon: "fa-spa"
    },
    {
        name: "Photography Enthusiasts",
        description: "Share travel photography and connect with fellow photographers",
        category: "photography",
        icon: "fa-camera"
    },
    {
        name: "Music Lovers",
        description: "Connect over music festivals, concerts, and music culture",
        category: "music",
        icon: "fa-music"
    },
    {
        name: "Art & History",
        description: "For travelers passionate about art, museums, and historical sites",
        category: "art",
        icon: "fa-palette"
    },
    {
        name: "Wildlife & Nature",
        description: "Connect with nature lovers and wildlife enthusiasts",
        category: "wildlife",
        icon: "fa-tree"
    }
];

async function initializeCommunities() {
    try {
        await mongoose.connect(dbUrl);
        console.log("Connected to MongoDB");

        // Get first admin user or create a system user
        let adminUser = await User.findOne({ role: 'admin' });
        if (!adminUser) {
            // Create a system admin if none exists
            adminUser = await User.findOne();
            if (!adminUser) {
                console.log("No users found. Please create a user first.");
                process.exit(1);
            }
        }

        let created = 0;
        let skipped = 0;

        for (const communityData of defaultCommunities) {
            const existing = await Community.findOne({ name: communityData.name });
            if (!existing) {
                await Community.create({
                    ...communityData,
                    createdBy: adminUser._id,
                    members: [],
                    moderators: [adminUser._id],
                    isActive: true
                });
                created++;
                console.log(`Created: ${communityData.name}`);
            } else {
                skipped++;
                console.log(`Skipped (exists): ${communityData.name}`);
            }
        }

        console.log(`\nInitialization complete! Created: ${created}, Skipped: ${skipped}`);
        process.exit(0);
    } catch (error) {
        console.error("Error initializing communities:", error);
        process.exit(1);
    }
}

initializeCommunities();

