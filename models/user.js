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
            default: undefined // Don't set default - only set when coordinates exist
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
            default: undefined // Don't set default - only set when coordinates exist
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

// Pre-save hook to handle location field properly
// Remove location object if coordinates are not set (required for GeoJSON)
userSchema.pre('save', function(next) {
    // If location exists but coordinates are undefined/null/not an array, remove the location object
    if (this.location) {
        if (!this.location.coordinates || !Array.isArray(this.location.coordinates) || this.location.coordinates.length !== 2) {
            // Don't set location at all if coordinates are invalid
            this.location = undefined;
        } else {
            // Ensure type is set when coordinates are valid
            if (!this.location.type) {
                this.location.type = 'Point';
            }
        }
    }
    
    // Clean up travelRoutes - remove entries without valid coordinates and set type when valid
    if (this.travelRoutes && Array.isArray(this.travelRoutes)) {
        this.travelRoutes = this.travelRoutes.map(route => {
            if (route.coordinates && Array.isArray(route.coordinates) && route.coordinates.length === 2) {
                if (!route.type) {
                    route.type = 'Point';
                }
                return route;
            }
            return null;
        }).filter(route => route !== null);
    }
    
    next();
});

// Create 2dsphere index for geospatial queries on location (sparse - allows documents without location)
userSchema.index({ "location": "2dsphere" }, { sparse: true });
userSchema.index({ "travelRoutes": "2dsphere" }, { sparse: true });
userSchema.index({ "location.visibility": 1, "location.sharingEnabled": 1 });
userSchema.index({ "location.travelStatus": 1 });

module.exports = mongoose.model("User", userSchema);