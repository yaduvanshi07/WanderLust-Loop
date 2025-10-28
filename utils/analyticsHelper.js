const Analytics = require("../models/analytics");

async function incrementListingViewCount(listingId) {
    await Analytics.findOneAndUpdate(
        { listing: listingId },
        { $inc: { viewsCount: 1 } },
        { upsert: true, new: true }
    );
}

async function recordBooking(listingId, amount) {
    await Analytics.findOneAndUpdate(
        { listing: listingId },
        { $inc: { bookingsCount: 1, revenue: amount } },
        { upsert: true, new: true }
    );
}

async function updateReviewStats(listingId, newAverageRating, newReviewsCount) {
    await Analytics.findOneAndUpdate(
        { listing: listingId },
        { $set: { averageRating: newAverageRating, reviewsCount: newReviewsCount } },
        { upsert: true, new: true }
    );
}

async function getDashboardOverview() {
    const pipeline = [
        {
            $group: {
                _id: null,
                totalViews: { $sum: "$viewsCount" },
                totalBookings: { $sum: "$bookingsCount" },
                totalRevenue: { $sum: "$revenue" },
                averageRating: { $avg: "$averageRating" }
            }
        }
    ];
    const results = await Analytics.aggregate(pipeline);
    return results[0] || { totalViews: 0, totalBookings: 0, totalRevenue: 0, averageRating: 0 };
}

async function getDashboardOverviewForUser(userId) {
    const Listing = require("../models/listing");
    const userListings = await Listing.find({ owner: userId });
    const listingIds = userListings.map(l => l._id);
    
    const pipeline = [
        {
            $match: { listing: { $in: listingIds } }
        },
        {
            $group: {
                _id: null,
                totalViews: { $sum: "$viewsCount" },
                totalBookings: { $sum: "$bookingsCount" },
                totalRevenue: { $sum: "$revenue" },
                averageRating: { $avg: "$averageRating" }
            }
        }
    ];
    const results = await Analytics.aggregate(pipeline);
    return results[0] || { totalViews: 0, totalBookings: 0, totalRevenue: 0, averageRating: 0 };
}

module.exports = {
    incrementListingViewCount,
    recordBooking,
    updateReviewStats,
    getDashboardOverview,
    getDashboardOverviewForUser,
};


