const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const buddyRequestSchema = new Schema({
    from: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    to: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    listing: {
        type: Schema.Types.ObjectId,
        ref: "BuddyListing",
        required: true
    },
    message: {
        type: String,
        maxlength: 500
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'cancelled'],
        default: 'pending'
    },
    requestType: {
        type: String,
        enum: ['travel-buddy', 'roommate'],
        required: true
    },
    respondedAt: {
        type: Date
    },
    responseMessage: {
        type: String,
        maxlength: 500
    }
}, {
    timestamps: true
});

buddyRequestSchema.index({ from: 1, to: 1 });
buddyRequestSchema.index({ to: 1, status: 1 });
buddyRequestSchema.index({ listing: 1 });
buddyRequestSchema.index({ status: 1 });

module.exports = mongoose.model("BuddyRequest", buddyRequestSchema);

