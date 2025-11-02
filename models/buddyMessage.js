const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const buddyMessageSchema = new Schema({
    sender: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    recipient: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    content: {
        type: String,
        required: true,
        maxlength: 2000
    },
    conversationId: {
        type: String,
        required: true,
        index: true
    },
    read: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Conversation ID is a sorted combination of user IDs
buddyMessageSchema.index({ conversationId: 1, createdAt: -1 });
buddyMessageSchema.index({ sender: 1, recipient: 1 });
buddyMessageSchema.index({ recipient: 1, read: 1 });

module.exports = mongoose.model("BuddyMessage", buddyMessageSchema);

