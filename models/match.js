const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const matchSchema = new Schema({
    user1: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    user2: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    compatibilityScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    breakdown: {
        interestsMatch: { type: Number, default: 0 },
        travelStyleMatch: { type: Number, default: 0 },
        personalityMatch: { type: Number, default: 0 },
        bookingHistoryMatch: { type: Number, default: 0 },
        destinationMatch: { type: Number, default: 0 }
    },
    sharedInterests: [{
        type: String
    }],
    iceBreakers: [{
        type: String
    }],
    suggestedDestinations: [{
        type: String
    }],
    matchType: {
        type: String,
        enum: ['travel-buddy', 'roommate', 'both'],
        default: 'travel-buddy'
    },
    status: {
        type: String,
        enum: ['pending', 'viewed', 'contacted', 'archived'],
        default: 'pending'
    },
    matchedAt: {
        type: Date,
        default: Date.now
    },
    lastViewedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Ensure unique pairs (user1, user2) regardless of order
matchSchema.index({ user1: 1, user2: 1 }, { unique: true });
matchSchema.index({ user1: 1, compatibilityScore: -1 });
matchSchema.index({ user2: 1, compatibilityScore: -1 });
matchSchema.index({ compatibilityScore: -1 });

// Virtual to get the other user
matchSchema.virtual('otherUser', {
    ref: 'User',
    localField: 'user2',
    foreignField: '_id',
    justOne: true
});

module.exports = mongoose.model("Match", matchSchema);

