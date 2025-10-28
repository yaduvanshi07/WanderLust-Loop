/**
 * Host Scenario Predictor
 * 
 * This module provides predictive analytics for hosts to explore hypothetical scenarios
 * such as price adjustments, discounts, and policy changes, and their impact on
 * bookings, revenue, and ranking.
 * 
 * @module utils/hostScenarioPredictor
 */

const Listing = require("../models/listing");
const Analytics = require("../models/analytics");
const Booking = require("../models/booking");
const SearchInteraction = require("../models/SearchInteraction");

class HostScenarioPredictor {
    /**
     * Predict the impact of price changes on a listing
     * 
     * @param {string} listingId - The listing ID
     * @param {number} currentPrice - Current price per night
     * @param {number} newPrice - Proposed new price
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} Predicted impact metrics
     */
    async predictPriceImpact(listingId, currentPrice, newPrice, options = {}) {
        try {
            const priceChange = ((newPrice - currentPrice) / currentPrice) * 100;
            const listings = await Listing.find({ 
                price: { $gte: currentPrice * 0.8, $lte: newPrice * 1.2 } 
            }).select("price");
            
            const avgPrice = listings.length > 0 
                ? listings.reduce((sum, l) => sum + l.price, 0) / listings.length 
                : currentPrice;
            
            // Get current analytics
            const analytics = await Analytics.findOne({ listing: listingId });
            const currentViews = analytics?.viewsCount || 0;
            const currentBookings = analytics?.bookingsCount || 0;
            const currentRevenue = analytics?.revenue || 0;
            
            // Estimate price elasticity (demand decreases ~1.5% per 1% price increase)
            const priceElasticity = -1.5;
            const predictedDemandChange = (priceChange / 100) * priceElasticity;
            const demandMultiplier = 1 + predictedDemandChange;
            
            // Predicted metrics
            const predictedViews = Math.max(0, Math.round(currentViews * demandMultiplier));
            const predictedBookings = Math.max(0, Math.round(currentBookings * demandMultiplier));
            const predictedRevenue = predictedBookings * newPrice; // Simplified calculation
            
            // Get market position
            const marketPosition = await this.getMarketPosition(listingId, newPrice);
            
            return {
                currentPrice,
                newPrice,
                priceChange,
                impact: {
                    views: {
                        current: currentViews,
                        predicted: predictedViews,
                        change: predictedViews - currentViews,
                        changePercent: predictedViews > 0 
                            ? ((predictedViews - currentViews) / currentViews) * 100 
                            : 0
                    },
                    bookings: {
                        current: currentBookings,
                        predicted: predictedBookings,
                        change: predictedBookings - currentBookings,
                        changePercent: currentBookings > 0 
                            ? ((predictedBookings - currentBookings) / currentBookings) * 100 
                            : 0
                    },
                    revenue: {
                        current: currentRevenue,
                        predicted: predictedRevenue,
                        change: predictedRevenue - currentRevenue,
                        changePercent: currentRevenue > 0 
                            ? ((predictedRevenue - currentRevenue) / currentRevenue) * 100 
                            : 0
                    }
                },
                marketPosition,
                recommendation: this.getPriceRecommendation(priceChange, marketPosition)
            };
        } catch (error) {
            console.error('Error predicting price impact:', error);
            return null;
        }
    }

    /**
     * Predict the impact of offering discounts
     * 
     * @param {string} listingId - The listing ID
     * @param {Object} discountOptions - Discount configuration
     * @returns {Promise<Object>} Predicted impact metrics
     */
    async predictDiscountImpact(listingId, discountOptions) {
        try {
            const listing = await Listing.findById(listingId);
            if (!listing) return null;
            
            const { discountPercent = 10, discountType = 'percent' } = discountOptions;
            const analytics = await Analytics.findOne({ listing: listingId });
            
            const currentPrice = listing.price;
            const currentBookings = analytics?.bookingsCount || 0;
            const currentRevenue = analytics?.revenue || 0;
            
            // Calculate discounted price
            let discountAmount, newPrice;
            if (discountType === 'percent') {
                discountAmount = (currentPrice * discountPercent) / 100;
                newPrice = currentPrice - discountAmount;
            } else {
                discountAmount = discountPercent;
                newPrice = currentPrice - discountAmount;
            }
            
            // Estimate that discounts increase bookings by 1.2x per 10% discount
            const bookingIncreaseFactor = 1 + (discountPercent / 10) * 0.2;
            const predictedBookings = Math.round(currentBookings * bookingIncreaseFactor);
            
            // Revenue per booking with discount
            const revenuePerBooking = newPrice; // Simplified
            const predictedRevenue = predictedBookings * revenuePerBooking;
            
            return {
                discountType,
                discountPercent,
                discountAmount,
                originalPrice: currentPrice,
                discountedPrice: newPrice,
                impact: {
                    bookings: {
                        current: currentBookings,
                        predicted: predictedBookings,
                        change: predictedBookings - currentBookings,
                        changePercent: currentBookings > 0 
                            ? ((predictedBookings - currentBookings) / currentBookings) * 100 
                            : 0
                    },
                    revenue: {
                        current: currentRevenue,
                        predicted: predictedRevenue,
                        change: predictedRevenue - currentRevenue,
                        changePercent: currentRevenue > 0 
                            ? ((predictedRevenue - currentRevenue) / currentRevenue) * 100 
                            : 0
                    },
                    estimatedBookingIncrease: Math.round((bookingIncreaseFactor - 1) * 100)
                }
            };
        } catch (error) {
            console.error('Error predicting discount impact:', error);
            return null;
        }
    }

    /**
     * Predict the impact of changing cancellation policy
     * 
     * @param {string} listingId - The listing ID
     * @param {string} currentPolicy - Current cancellation policy
     * @param {string} newPolicy - Proposed new policy
     * @returns {Promise<Object>} Predicted impact metrics
     */
    async predictPolicyImpact(listingId, currentPolicy, newPolicy) {
        try {
            // Get booking statistics
            const bookings = await Booking.find({ listing: listingId });
            const analytics = await Analytics.findOne({ listing: listingId });
            
            const currentBookings = analytics?.bookingsCount || 0;
            const currentCancellations = bookings.filter(b => b.status === 'cancelled').length;
            const cancellationRate = bookings.length > 0 
                ? (currentCancellations / bookings.length) * 100 
                : 0;
            
            // Policy impact factors
            const policyFlexibility = {
                'flexible': { bookingBoost: 1.15, cancellationRisk: 0.05 },
                'moderate': { bookingBoost: 1.05, cancellationRisk: 0.10 },
                'strict': { bookingBoost: 0.95, cancellationRisk: 0.20 }
            };
            
            const currentImpact = policyFlexibility[currentPolicy] || policyFlexibility['moderate'];
            const newImpact = policyFlexibility[newPolicy] || policyFlexibility['moderate'];
            
            const predictedBookings = Math.round(currentBookings * (newImpact.bookingBoost / currentImpact.bookingBoost));
            const estimatedCancellations = Math.round(predictedBookings * newImpact.cancellationRisk);
            
            return {
                currentPolicy,
                newPolicy,
                impact: {
                    bookings: {
                        current: currentBookings,
                        predicted: predictedBookings,
                        change: predictedBookings - currentBookings,
                        changePercent: currentBookings > 0 
                            ? ((predictedBookings - currentBookings) / currentBookings) * 100 
                            : 0
                    },
                    cancellations: {
                        current: currentCancellations,
                        predicted: estimatedCancellations,
                        change: estimatedCancellations - currentCancellations
                    },
                    cancellationRate: {
                        current: cancellationRate.toFixed(1),
                        predicted: (newImpact.cancellationRisk * 100).toFixed(1)
                    }
                }
            };
        } catch (error) {
            console.error('Error predicting policy impact:', error);
            return null;
        }
    }

    /**
     * Get comprehensive scenario analysis
     * 
     * @param {string} listingId - The listing ID
     * @param {Object} scenarios - Scenario parameters
     * @returns {Promise<Object>} Complete scenario analysis
     */
    async analyzeScenario(listingId, scenarios) {
        try {
            const listing = await Listing.findById(listingId);
            if (!listing) return null;
            
            const results = {
                listingId,
                listingTitle: listing.title,
                timestamp: new Date(),
                scenarios: {}
            };
            
            // Price scenario
            if (scenarios.price && scenarios.price.newPrice) {
                results.scenarios.price = await this.predictPriceImpact(
                    listingId,
                    listing.price,
                    scenarios.price.newPrice
                );
            }
            
            // Discount scenario
            if (scenarios.discount) {
                results.scenarios.discount = await this.predictDiscountImpact(
                    listingId,
                    scenarios.discount
                );
            }
            
            // Policy scenario
            if (scenarios.policy && scenarios.policy.newPolicy) {
                results.scenarios.policy = await this.predictPolicyImpact(
                    listingId,
                    'moderate', // Default
                    scenarios.policy.newPolicy
                );
            }
            
            // Overall recommendation
            results.overallRecommendation = this.getOverallRecommendation(results.scenarios);
            
            return results;
        } catch (error) {
            console.error('Error analyzing scenario:', error);
            return null;
        }
    }

    /**
     * Get market position of the listing
     * 
     * @param {string} listingId - The listing ID
     * @param {number} price - Price to evaluate
     * @returns {Promise<string>} Market position
     */
    async getMarketPosition(listingId, price) {
        try {
            const listing = await Listing.findById(listingId);
            if (!listing) return 'unknown';
            
            // Get similar listings in the same location
            const similarListings = await Listing.find({
                location: listing.location,
                _id: { $ne: listingId }
            }).select("price");
            
            if (similarListings.length === 0) return 'no_comparison';
            
            const avgPrice = similarListings.reduce((sum, l) => sum + l.price, 0) / similarListings.length;
            const priceDiff = ((price - avgPrice) / avgPrice) * 100;
            
            if (priceDiff < -15) return 'below_market';
            if (priceDiff < 15) return 'at_market';
            return 'above_market';
        } catch (error) {
            return 'unknown';
        }
    }

    /**
     * Get price change recommendation
     * 
     * @param {number} priceChange - Percentage price change
     * @param {string} marketPosition - Market position
     * @returns {string} Recommendation
     */
    getPriceRecommendation(priceChange, marketPosition) {
        if (priceChange > 20 && marketPosition === 'above_market') {
            return 'Caution: High increase may significantly reduce demand';
        }
        if (priceChange < -20 && marketPosition === 'below_market') {
            return 'Underpriced: Consider price increase';
        }
        if (priceChange > 0 && priceChange < 15) {
            return 'Moderate increase should maintain demand';
        }
        if (priceChange < 0 && priceChange > -15) {
            return 'Price decrease may increase bookings';
        }
        return 'Monitor performance after change';
    }

    /**
     * Get overall recommendation based on all scenarios
     * 
     * @param {Object} scenarios - All scenario results
     * @returns {Object} Overall recommendation
     */
    getOverallRecommendation(scenarios) {
        const recommendations = [];
        
        if (scenarios.price) {
            const { revenue } = scenarios.price.impact;
            if (revenue.changePercent > 10) {
                recommendations.push('Price increase shows strong revenue potential');
            } else if (revenue.changePercent < -10) {
                recommendations.push('Price change may negatively impact revenue');
            }
        }
        
        if (scenarios.discount) {
            const { bookings } = scenarios.discount.impact;
            if (bookings.changePercent > 15) {
                recommendations.push('Discounts can significantly boost bookings');
            }
        }
        
        if (scenarios.policy) {
            recommendations.push('Consider impact on cancellation rates');
        }
        
        return {
            summary: recommendations.length > 0 
                ? recommendations.join('. ') 
                : 'No significant impact predicted',
            riskLevel: this.assessRiskLevel(scenarios)
        };
    }

    /**
     * Assess overall risk level of scenarios
     * 
     * @param {Object} scenarios - All scenario results
     * @returns {string} Risk level
     */
    assessRiskLevel(scenarios) {
        let riskScore = 0;
        
        if (scenarios.price) {
            const { revenue } = scenarios.price.impact;
            if (revenue.changePercent < -20) riskScore += 2;
            else if (revenue.changePercent < -10) riskScore += 1;
        }
        
        if (scenarios.policy) {
            const { cancellationRate } = scenarios.policy.impact;
            if (parseFloat(cancellationRate.predicted) > 15) riskScore += 1;
        }
        
        if (riskScore === 0) return 'low';
        if (riskScore < 2) return 'medium';
        return 'high';
    }
}

module.exports = new HostScenarioPredictor();

