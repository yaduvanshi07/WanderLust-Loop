const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const couponSchema = new Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true
    },
    discountType: {
        type: String,
        enum: ["percent", "fixed"],
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    expiresAt: {
        type: Date,
        required: true
    },
    maxUses: {
        type: Number,
        default: 0 // 0 means unlimited
    },
    uses: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
}, { timestamps: true });

couponSchema.methods.isValidForUse = function () {
    if (!this.isActive) return false;
    const now = new Date();
    if (this.expiresAt && now > this.expiresAt) return false;
    if (this.maxUses && this.uses >= this.maxUses) return false;
    return true;
};

module.exports = mongoose.model("Coupon", couponSchema);


