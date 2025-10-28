const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const searchInteractionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    listingId: { type: Schema.Types.ObjectId, ref: "Listing", required: true },
    action: { type: String, enum: ["view", "click", "book"], required: true },
    context: {
      filters: { type: Object, default: {} },
      timeOfDay: { type: String, default: null },
      query: { type: String, default: null },
    },
    reward: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SearchInteraction", searchInteractionSchema);


