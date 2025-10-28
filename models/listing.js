const mongoose= require("mongoose");
const Schema= mongoose.Schema;
const Review =require("./review.js");

const listingSchema= new Schema({
  title:{
    type: String,
    required: true,
  },

  description: {
    type: String,
  },

  image:{
   url:String,
   filename:String,
  },

  price:{
    type: Number,
  },

  location:{
    type: String,
  },

  country:{
    type: String,
  },

  reviews:[
    {
    type: Schema.Types.ObjectId,
    ref:"Review",
  },
  ],

  owner:{
    type: Schema.Types.ObjectId,
    ref:"User",
  },

  clickThroughRate: { type: Number, default: 0 },
  conversionRate: { type: Number, default: 0 },
  smartPricingEnabled: { type: Boolean, default: false },
  rankingScore: { type: Number, default: 50 },
  lastRankingUpdate: { type: Date, default: Date.now },
  performanceStatus: { 
    type: String, 
    enum: ['excellent', 'good', 'average', 'poor', 'critical'],
    default: 'average'
  },

});

listingSchema.post("findOneAndDelete", async(listing)=>{
 if(listing){
  await Review.deleteMany({_id: {$in: listing.reviews}});
 }
});


const Listing =mongoose.model("Listing",listingSchema);
module.exports=Listing;