const Listing = require("../models/listing");
const SearchInteraction = require("../models/SearchInteraction");
const Booking = require("../models/booking");
const Review = require("../models/review");
const Analytics = require("../models/analytics");

class ListingPerformanceTracker {
    constructor() {
        this.performanceCache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    }

    async getListingPerformance(listingId, days = 30) {
        const cacheKey = `${listingId}_${days}`;
        const cached = this.performanceCache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
            return cached.data;
        }

        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

        try {
            // Get all interactions for this listing
            const interactions = await SearchInteraction.find({
                listingId: listingId,
                createdAt: { $gte: startDate, $lte: endDate }
            });

            // Get bookings for this listing
            const bookings = await Booking.find({
                listing: listingId,
                bookedAt: { $gte: startDate, $lte: endDate }
            });

            // Get reviews for this listing
            const reviews = await Review.find({
                listing: listingId,
                createdAt: { $gte: startDate, $lte: endDate }
            });

            // Calculate metrics
            const totalViews = interactions.filter(i => i.action === 'view').length;
            const totalClicks = interactions.filter(i => i.action === 'click').length;
            const totalBookings = bookings.length;
            const totalReviews = reviews.length;

            // Calculate engagement rates
            const clickThroughRate = totalViews > 0 ? (totalClicks / totalViews) : 0;
            const conversionRate = totalClicks > 0 ? (totalBookings / totalClicks) : 0;
            const overallEngagement = totalViews > 0 ? (totalClicks + totalBookings) / totalViews : 0;

            // Calculate average rating
            const avgRating = reviews.length > 0 ? 
                reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

            // Calculate revenue
            const totalRevenue = bookings.reduce((sum, b) => sum + (b.pricing?.total || 0), 0);

            // Calculate performance score (0-100)
            const performanceScore = this.calculatePerformanceScore({
                clickThroughRate,
                conversionRate,
                overallEngagement,
                avgRating,
                totalBookings,
                totalRevenue
            });

            // Determine performance status
            const performanceStatus = this.getPerformanceStatus(performanceScore);

            const performance = {
                listingId,
                period: days,
                metrics: {
                    totalViews,
                    totalClicks,
                    totalBookings,
                    totalReviews,
                    totalRevenue,
                    clickThroughRate,
                    conversionRate,
                    overallEngagement,
                    avgRating,
                    performanceScore
                },
                status: performanceStatus,
                recommendations: this.getRecommendations(performanceStatus, {
                    clickThroughRate,
                    conversionRate,
                    avgRating,
                    totalViews,
                    totalBookings
                }),
                lastUpdated: new Date()
            };

            // Cache the result
            this.performanceCache.set(cacheKey, {
                data: performance,
                timestamp: Date.now()
            });

            return performance;
        } catch (error) {
            console.error('Error calculating listing performance:', error);
            return null;
        }
    }

    calculatePerformanceScore(metrics) {
        const weights = {
            clickThroughRate: 0.25,
            conversionRate: 0.30,
            overallEngagement: 0.20,
            avgRating: 0.15,
            bookings: 0.10
        };

        // Normalize metrics to 0-100 scale
        const normalizedCTR = Math.min(metrics.clickThroughRate * 100, 100);
        const normalizedConversion = Math.min(metrics.conversionRate * 100, 100);
        const normalizedEngagement = Math.min(metrics.overallEngagement * 100, 100);
        const normalizedRating = (metrics.avgRating / 5) * 100;
        const normalizedBookings = Math.min(metrics.totalBookings * 10, 100);

        const score = 
            normalizedCTR * weights.clickThroughRate +
            normalizedConversion * weights.conversionRate +
            normalizedEngagement * weights.overallEngagement +
            normalizedRating * weights.avgRating +
            normalizedBookings * weights.bookings;

        return Math.round(score);
    }

    getPerformanceStatus(score) {
        if (score >= 80) return 'excellent';
        if (score >= 60) return 'good';
        if (score >= 40) return 'average';
        if (score >= 20) return 'poor';
        return 'critical';
    }

    getRecommendations(status, metrics) {
        const recommendations = [];

        if (status === 'critical' || status === 'poor') {
            if (metrics.totalViews < 10) {
                recommendations.push({
                    type: 'visibility',
                    priority: 'high',
                    message: 'Your listing has very low visibility. Consider improving your title and description with relevant keywords.',
                    action: 'Update listing title and description with popular search terms'
                });
            }

            if (metrics.clickThroughRate < 0.05) {
                recommendations.push({
                    type: 'attractiveness',
                    priority: 'high',
                    message: 'Your listing photo is not attracting clicks. Consider adding a more appealing main photo.',
                    action: 'Upload a high-quality, eye-catching main photo'
                });
            }

            if (metrics.avgRating < 3.5) {
                recommendations.push({
                    type: 'quality',
                    priority: 'high',
                    message: 'Your listing has low ratings. Focus on improving the guest experience.',
                    action: 'Review guest feedback and improve amenities or service quality'
                });
            }

            if (metrics.conversionRate < 0.1) {
                recommendations.push({
                    type: 'pricing',
                    priority: 'medium',
                    message: 'Your listing gets clicks but few bookings. Consider adjusting your pricing strategy.',
                    action: 'Review your pricing compared to similar listings in your area'
                });
            }
        }

        if (status === 'average') {
            recommendations.push({
                type: 'optimization',
                priority: 'medium',
                message: 'Your listing is performing okay but has room for improvement.',
                action: 'Add more photos, improve descriptions, and consider promotional pricing'
            });
        }

        return recommendations;
    }

    async getLowPerformingListings(threshold = 40, days = 30) {
        try {
            const allListings = await Listing.find({});
            const lowPerformers = [];

            for (const listing of allListings) {
                const performance = await this.getListingPerformance(listing._id, days);
                if (performance && performance.metrics.performanceScore < threshold) {
                    lowPerformers.push({
                        listing,
                        performance,
                        owner: listing.owner
                    });
                }
            }

            return lowPerformers.sort((a, b) => 
                a.performance.metrics.performanceScore - b.performance.metrics.performanceScore
            );
        } catch (error) {
            console.error('Error getting low performing listings:', error);
            return [];
        }
    }

    async updateListingRankingScore(listingId) {
        try {
            const performance = await this.getListingPerformance(listingId, 30);
            if (!performance) return null;

            // Update the listing with the new ranking score
            await Listing.findByIdAndUpdate(listingId, {
                $set: {
                    rankingScore: performance.metrics.performanceScore,
                    lastRankingUpdate: new Date()
                }
            });

            return performance.metrics.performanceScore;
        } catch (error) {
            console.error('Error updating listing ranking score:', error);
            return null;
        }
    }

    async updateAllListingScores() {
        try {
            const allListings = await Listing.find({});
            const results = [];

            for (const listing of allListings) {
                const score = await this.updateListingRankingScore(listing._id);
                if (score !== null) {
                    results.push({ listingId: listing._id, score });
                }
            }

            console.log(`Updated ranking scores for ${results.length} listings`);
            return results;
        } catch (error) {
            console.error('Error updating all listing scores:', error);
            return [];
        }
    }

    clearCache() {
        this.performanceCache.clear();
    }
}

module.exports = new ListingPerformanceTracker();
