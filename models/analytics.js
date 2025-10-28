const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const analyticsSchema = new Schema({
    listing: {
        type: Schema.Types.ObjectId,
        ref: "Listing",
        required: true,
        index: true
    },
    viewsCount: {
        type: Number,
        default: 0
    },
    bookingsCount: {
        type: Number,
        default: 0
    },
    revenue: {
        type: Number,
        default: 0
    },
    averageRating: {
        type: Number,
        default: 0
    },
    reviewsCount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model("Analytics", analyticsSchema);


