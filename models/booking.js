// models/booking.js

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookingSchema = new Schema({
    listing: {
        type: Schema.Types.ObjectId,
        ref: "Listing",
        required: true
    },
    guest: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    checkin: {
        type: Date,
        required: true
    },
    checkout: {
        type: Date,
        required: true
    },
    guests: {
        adults: { type: Number, required: true, min: 1, default: 1 },
        children: { type: Number, min: 0, default: 0 },
        infants: { type: Number, min: 0, default: 0 },
        pets: { type: Number, min: 0, default: 0 }
    },
    pricing: {
        basePrice: { type: Number, required: true },
        cleaningFee: { type: Number, default: 0 },
        serviceFee: { type: Number, required: true },
        taxes: { type: Number, required: true },
        discount: { type: Number, default: 0 },
        total: { type: Number, required: true }
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed', 'refunded'],
        default: 'pending'
    },
    bookingType: {
        type: String,
        enum: ['instant', 'request'],
        default: 'instant'
    },
    specialRequests: {
        type: String,
        maxlength: 500
    },
    cancellationPolicy: {
        type: String,
        enum: ['flexible', 'moderate', 'strict'],
        default: 'moderate'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'refunded', 'failed'],
        default: 'pending'
    },
    coupon: {
        type: Schema.Types.ObjectId,
        ref: "Coupon"
    },
    bookedAt: {
        type: Date,
        default: Date.now
    },
    confirmedAt: {
        type: Date
    },
    cancelledAt: {
        type: Date
    },
    cancellationReason: {
        type: String
    },
    hostNotes: {
        type: String,
        maxlength: 500
    },
    // Location tracking for travel routes
    routeLocations: [{
        // GeoJSON Point for each stop
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number] // [longitude, latitude]
        },
        city: String,
        country: String,
        arrivalDate: Date,
        departureDate: Date
    }]
});

// Virtual for total guests count
bookingSchema.virtual('guests.totalCount').get(function() {
    return this.guests.adults + this.guests.children + this.guests.infants;
});

// Virtual for nights calculation
bookingSchema.virtual('nights').get(function() {
    return Math.ceil((this.checkout - this.checkin) / (1000 * 60 * 60 * 24));
});

// Virtual for booking reference
bookingSchema.virtual('bookingRef').get(function() {
    return `WB${this._id.toString().slice(-8).toUpperCase()}`;
});

// Index for better query performance
bookingSchema.index({ listing: 1, checkin: 1, checkout: 1 });
bookingSchema.index({ guest: 1, bookedAt: -1 });
bookingSchema.index({ status: 1 });
// GeoJSON index for route locations
bookingSchema.index({ "routeLocations": "2dsphere" });

const Booking = mongoose.model("Booking", bookingSchema);
module.exports = Booking;
