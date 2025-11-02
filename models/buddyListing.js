const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const buddyListingSchema = new Schema({
    creator: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    title: {
        type: String,
        required: true,
        maxlength: 200
    },
    destination: {
        type: String,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    bio: {
        type: String,
        required: true,
        maxlength: 1000
    },
    interests: [{
        type: String
    }],
    travelStyle: {
        type: String,
        enum: ['budget', 'mid-range', 'luxury', 'flexible'],
        default: 'flexible'
    },
    lookingFor: {
        type: String,
        enum: ['travel-buddy', 'roommate', 'both'],
        required: true
    },
    maxPartners: {
        type: Number,
        default: 1,
        min: 1,
        max: 10
    },
    budgetPerPerson: {
        min: { type: Number, default: 0 },
        max: { type: Number, default: 50000 }
    },
    accommodationType: {
        type: String,
        enum: ['shared-room', 'private-room', 'hostel', 'hotel', 'airbnb', 'camping', 'flexible'],
        default: 'flexible'
    },
    status: {
        type: String,
        enum: ['active', 'filled', 'cancelled', 'completed'],
        default: 'active'
    },
    acceptedPartners: [{
        type: Schema.Types.ObjectId,
        ref: "User"
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

buddyListingSchema.index({ creator: 1 });
buddyListingSchema.index({ destination: 1 });
buddyListingSchema.index({ startDate: 1, endDate: 1 });
buddyListingSchema.index({ status: 1 });
buddyListingSchema.index({ interests: 1 });

module.exports = mongoose.model("BuddyListing", buddyListingSchema);

