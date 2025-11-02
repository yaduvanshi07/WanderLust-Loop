const mongoose= require("mongoose");
const Schema= mongoose.Schema;

const passportLocalMongoose = require('passport-local-mongoose');

const userSchema=new Schema({
    email:{
        type: String,
        required: true,
    }
    ,
    role:{
        type: String,
        enum: ["user","admin"],
        default: "user"
    },
    adminHint:{
        type: String,
        default: null
    },
    // Travel Buddy Finder profile fields
    travelBuddyProfile: {
        isActive: {
            type: Boolean,
            default: false
        },
        age: {
            type: Number,
            min: 18,
            max: 99
        },
        gender: {
            type: String,
            enum: ['male', 'female', 'non-binary', 'prefer-not-to-say'],
            default: 'prefer-not-to-say'
        },
        profilePicture: {
            url: String,
            filename: String
        },
        verified: {
            type: Boolean,
            default: false
        }
    },
    // Real-time location tracking
    location: {
        // GeoJSON Point format for MongoDB geospatial queries
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            default: undefined
        },
        // Privacy level for location visibility
        visibility: {
            type: String,
            enum: ['exact', 'city', 'country', 'hidden'],
            default: 'hidden'
        },
        // Current travel status
        travelStatus: {
            type: String,
            enum: ['at-home', 'in-transit', 'at-destination', 'planning'],
            default: 'at-home'
        },
        // Last location update timestamp
        lastUpdated: {
            type: Date
        },
        // City name (for city-level visibility)
        city: {
            type: String
        },
        // Country name (for country-level visibility)
        country: {
            type: String
        },
        // Whether location sharing is enabled
        sharingEnabled: {
            type: Boolean,
            default: false
        }
    },
    // Multi-city travel routes
    travelRoutes: [{
        destination: {
            type: String
        },
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number] // [longitude, latitude]
        },
        arrivalDate: {
            type: Date
        },
        departureDate: {
            type: Date
        },
        status: {
            type: String,
            enum: ['planned', 'in-progress', 'completed'],
            default: 'planned'
        }
    }],
    // Geo-analytics
    geoAnalytics: {
        distanceCovered: {
            type: Number,
            default: 0 // in kilometers
        },
        nearbyMatches: {
            type: Number,
            default: 0
        },
        lastMatchCheck: {
            type: Date
        }
    }
})

userSchema.plugin(passportLocalMongoose);

// Create 2dsphere index for geospatial queries on location
userSchema.index({ "location": "2dsphere" });
userSchema.index({ "travelRoutes": "2dsphere" });
userSchema.index({ "location.visibility": 1, "location.sharingEnabled": 1 });
userSchema.index({ "location.travelStatus": 1 });

module.exports = mongoose.model("User", userSchema);