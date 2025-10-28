const mongoose= require("mongoose");
const Schema= mongoose.Schema;

const reviewSchema = new Schema({
    comment: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    status: {
        type: String,
        enum: ["approved", "pending", "rejected"],
        default: "approved"
    },
    sentiment: {
        label: { type: String, enum: ["positive", "neutral", "negative"], default: "neutral" },
        score: { type: Number, default: 0 }
    }
    
}, {
    timestamps: true 
});


module.exports=mongoose.model("Review",reviewSchema);