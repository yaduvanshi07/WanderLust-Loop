const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const communitySchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        maxlength: 1000
    },
    category: {
        type: String,
        enum: ['foodie', 'adventure', 'culture', 'nomad', 'budget', 'luxury', 'backpacking', 'wellness', 'photography', 'sports', 'music', 'art', 'history', 'wildlife'],
        required: true
    },
    icon: {
        type: String,
        default: 'fa-users'
    },
    members: [{
        type: Schema.Types.ObjectId,
        ref: "User"
    }],
    moderators: [{
        type: Schema.Types.ObjectId,
        ref: "User"
    }],
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    memberCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Note: name field already has unique: true, which creates an index automatically
communitySchema.index({ category: 1 });
communitySchema.index({ members: 1 });

// Update member count before saving
communitySchema.pre('save', function(next) {
    this.memberCount = this.members.length;
    next();
});

module.exports = mongoose.model("Community", communitySchema);

