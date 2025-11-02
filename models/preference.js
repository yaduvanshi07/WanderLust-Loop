const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const preferenceSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    interests: [{
        type: String,
        enum: ['foodie', 'adventure', 'culture', 'beach', 'mountains', 'city', 'nature', 'nightlife', 'budget', 'luxury', 'backpacking', 'wellness', 'photography', 'sports', 'music', 'art', 'history', 'wildlife', 'nomad', 'solo-travel']
    }],
    travelStyle: {
        type: String,
        enum: ['budget', 'mid-range', 'luxury', 'flexible'],
        default: 'flexible'
    },
    personalityTraits: [{
        type: String,
        enum: ['introverted', 'extroverted', 'adventurous', 'laid-back', 'organized', 'spontaneous', 'early-riser', 'night-owl', 'social', 'independent']
    }],
    accommodationPreference: {
        type: String,
        enum: ['shared-room', 'private-room', 'hostel', 'hotel', 'airbnb', 'camping', 'flexible'],
        default: 'flexible'
    },
    budgetRange: {
        min: { type: Number, default: 0 },
        max: { type: Number, default: 50000 }
    },
    preferredDestinations: [{
        type: String
    }],
    languages: [{
        type: String
    }],
    dietaryRestrictions: [{
        type: String,
        enum: ['vegetarian', 'vegan', 'halal', 'kosher', 'gluten-free', 'dairy-free', 'none']
    }],
    smoking: {
        type: String,
        enum: ['yes', 'no', 'occasionally'],
        default: 'no'
    },
    ageRange: {
        min: { type: Number, default: 18 },
        max: { type: Number, default: 99 }
    },
    preferredGender: {
        type: String,
        enum: ['any', 'male', 'female', 'non-binary'],
        default: 'any'
    },
    bio: {
        type: String,
        maxlength: 1000
    },
    lookingFor: {
        type: String,
        enum: ['travel-buddy', 'roommate', 'both'],
        default: 'travel-buddy'
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Note: user field already has unique: true, which creates an index automatically
preferenceSchema.index({ interests: 1 });
preferenceSchema.index({ travelStyle: 1 });

module.exports = mongoose.model("Preference", preferenceSchema);

