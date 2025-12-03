const Preference = require("../models/preference");
const Match = require("../models/match");
const Booking = require("../models/booking");
const Listing = require("../models/listing");
const User = require("../models/user");

/**
 * AI-Powered Compatibility Matching Engine
 * Calculates compatibility scores based on multiple factors
 */

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Calculate geographic proximity score based on distance
 * <10km = 100%, <50km = 90%, <100km = 75%, <500km = 50%, else = 25%
 */
function calculateProximityScore(distanceInKm) {
    if (distanceInKm < 10) return 100 + 10; // Bonus: +10%
    if (distanceInKm < 50) return 90 + 5;   // Bonus: +5%
    if (distanceInKm < 100) return 75;
    if (distanceInKm < 500) return 50;
    return 25;
}

/**
 * Calculate route overlap score for multi-city trips
 */
function calculateRouteOverlapScore(user1Routes, user2Routes) {
    if (!user1Routes || !user2Routes || user1Routes.length === 0 || user2Routes.length === 0) {
        return 0;
    }

    let overlapScore = 0;
    let maxPossibleScore = 0;

    for (const route1 of user1Routes) {
        if (!route1.coordinates || route1.coordinates.length !== 2) continue;
        const [lon1, lat1] = route1.coordinates;

        for (const route2 of user2Routes) {
            if (!route2.coordinates || route2.coordinates.length !== 2) continue;
            const [lon2, lat2] = route2.coordinates;

            const distance = calculateDistance(lat1, lon1, lat2, lon2);
            maxPossibleScore += 100;

            // If routes are within 50km, they overlap
            if (distance < 50) {
                // Check if dates overlap
                const route1Start = route1.arrivalDate ? new Date(route1.arrivalDate) : null;
                const route1End = route1.departureDate ? new Date(route1.departureDate) : null;
                const route2Start = route2.arrivalDate ? new Date(route2.arrivalDate) : null;
                const route2End = route2.departureDate ? new Date(route2.departureDate) : null;

                if (route1Start && route2Start && route1End && route2End) {
                    // Check date overlap
                    if (!(route1End < route2Start || route1Start > route2End)) {
                        overlapScore += 100; // Perfect overlap
                    } else {
                        overlapScore += 50; // Same location, different time
                    }
                } else {
                    overlapScore += 75; // Same location, unknown dates
                }
            }
        }
    }

    return maxPossibleScore > 0 ? (overlapScore / maxPossibleScore) * 100 : 0;
}

/**
 * Calculate compatibility score between two users
 */
async function calculateCompatibilityScore(user1Id, user2Id) {
    const [pref1, pref2, bookings1, bookings2, user1, user2] = await Promise.all([
        Preference.findOne({ user: user1Id }),
        Preference.findOne({ user: user2Id }),
        Booking.find({ guest: user1Id }).populate('listing'),
        Booking.find({ guest: user2Id }).populate('listing'),
        User.findById(user1Id),
        User.findById(user2Id)
    ]);

    if (!pref1 || !pref2) {
        return null;
    }

    const breakdown = {
        interestsMatch: 0,
        travelStyleMatch: 0,
        personalityMatch: 0,
        bookingHistoryMatch: 0,
        destinationMatch: 0,
        geographicProximity: 0,
        routeOverlap: 0
    };

    // 1. Interests Match (30% weight)
    if (pref1.interests && pref2.interests && pref1.interests.length > 0 && pref2.interests.length > 0) {
        const commonInterests = pref1.interests.filter(i => pref2.interests.includes(i));
        const totalUniqueInterests = new Set([...pref1.interests, ...pref2.interests]).size;
        breakdown.interestsMatch = totalUniqueInterests > 0 
            ? (commonInterests.length / totalUniqueInterests) * 100 
            : 0;
    }

    // 2. Travel Style Match (20% weight)
    if (pref1.travelStyle === pref2.travelStyle) {
        breakdown.travelStyleMatch = 100;
    } else if (pref1.travelStyle === 'flexible' || pref2.travelStyle === 'flexible') {
        breakdown.travelStyleMatch = 70;
    } else {
        // Calculate proximity (budget -> mid-range -> luxury)
        const styles = ['budget', 'mid-range', 'luxury'];
        const idx1 = styles.indexOf(pref1.travelStyle);
        const idx2 = styles.indexOf(pref2.travelStyle);
        const distance = Math.abs(idx1 - idx2);
        breakdown.travelStyleMatch = distance === 0 ? 100 : distance === 1 ? 60 : 30;
    }

    // 3. Personality Traits Match (20% weight)
    if (pref1.personalityTraits && pref2.personalityTraits) {
        const commonTraits = pref1.personalityTraits.filter(t => pref2.personalityTraits.includes(t));
        const totalTraits = new Set([...pref1.personalityTraits, ...pref2.personalityTraits]).size;
        breakdown.personalityMatch = totalTraits > 0 
            ? (commonTraits.length / totalTraits) * 100 
            : 50; // Neutral if no traits specified
    } else {
        breakdown.personalityMatch = 50;
    }

    // 4. Booking History Match (20% weight) - Similar destinations/bookings
    const destinations1 = bookings1.map(b => b.listing?.location || b.listing?.country).filter(Boolean);
    const destinations2 = bookings2.map(b => b.listing?.location || b.listing?.country).filter(Boolean);
    
    if (destinations1.length > 0 && destinations2.length > 0) {
        const commonDestinations = destinations1.filter(d => destinations2.includes(d));
        const allDestinations = new Set([...destinations1, ...destinations2]);
        breakdown.bookingHistoryMatch = allDestinations.size > 0 
            ? (commonDestinations.length / allDestinations.size) * 100 
            : 0;
    } else {
        breakdown.bookingHistoryMatch = 50; // Neutral if no booking history
    }

    // 5. Preferred Destinations Match (5% weight, reduced from 10%)
    if (pref1.preferredDestinations && pref2.preferredDestinations) {
        const commonDests = pref1.preferredDestinations.filter(d => 
            pref2.preferredDestinations.some(pd => 
                pd.toLowerCase().includes(d.toLowerCase()) || 
                d.toLowerCase().includes(pd.toLowerCase())
            )
        );
        const totalDests = new Set([...pref1.preferredDestinations, ...pref2.preferredDestinations]).size;
        breakdown.destinationMatch = totalDests > 0 
            ? (commonDests.length / totalDests) * 100 
            : 0;
    }

    // 6. Geographic Proximity (25% weight)
    if (user1?.location?.coordinates && user1.location.coordinates.length === 2 &&
        user2?.location?.coordinates && user2.location.coordinates.length === 2 &&
        user1.location.sharingEnabled && user2.location.sharingEnabled) {
        
        const [lon1, lat1] = user1.location.coordinates;
        const [lon2, lat2] = user2.location.coordinates;
        const distance = calculateDistance(lat1, lon1, lat2, lon2);
        breakdown.geographicProximity = calculateProximityScore(distance);
    } else {
        // If location not available, use neutral score
        breakdown.geographicProximity = 50;
    }

    // 7. Route Overlap (5% bonus on top of geographic proximity)
    if (user1?.travelRoutes && user2?.travelRoutes && 
        user1.travelRoutes.length > 0 && user2.travelRoutes.length > 0) {
        breakdown.routeOverlap = calculateRouteOverlapScore(user1.travelRoutes, user2.travelRoutes);
    }

    
    const compatibilityScore = 
        breakdown.interestsMatch * 0.25 +
        breakdown.travelStyleMatch * 0.15 +
        breakdown.personalityMatch * 0.15 +
        breakdown.bookingHistoryMatch * 0.15 +
        breakdown.destinationMatch * 0.05 +
        breakdown.geographicProximity * 0.25 +
        (breakdown.routeOverlap * 0.05); 

    return {
        score: Math.min(100, Math.round(compatibilityScore)),
        breakdown,
        sharedInterests: pref1.interests?.filter(i => pref2.interests?.includes(i)) || [],
        distance: user1?.location?.coordinates && user2?.location?.coordinates ? 
            calculateDistance(
                user1.location.coordinates[1], 
                user1.location.coordinates[0],
                user2.location.coordinates[1],
                user2.location.coordinates[0]
            ) : null
    };
}


function generateIceBreakers(sharedInterests, preferences1, preferences2) {
    const iceBreakers = [];

    if (sharedInterests.length > 0) {
        sharedInterests.forEach(interest => {
            const templates = {
                'foodie': `I see you're into ${interest} too! What's your favorite cuisine to explore while traveling?`,
                'adventure': `Fellow ${interest} enthusiast! Have you tried any extreme sports on your travels?`,
                'culture': `Love that you're into ${interest}! Any must-visit cultural sites on your bucket list?`,
                'beach': `Beach lovers unite! What's your favorite beach destination so far?`,
                'mountains': `Mountain enthusiast here! Any challenging hikes you've conquered?`,
                'photography': `Photography is amazing! What's your favorite subject to capture while traveling?`,
                'budget': `Budget travelers know how to make the most of every rupee! Any money-saving tips?`,
                'nomad': `Fellow digital nomad! How do you balance work and travel?`
            };
            
            if (templates[interest]) {
                iceBreakers.push(templates[interest]);
            } else {
                iceBreakers.push(`I noticed we both share an interest in ${interest}! What draws you to it?`);
            }
        });
    }

    // Generic ice-breakers
    if (iceBreakers.length === 0) {
        iceBreakers.push("Hey! I saw we might be compatible travel partners. Want to chat about travel plans?");
        iceBreakers.push("Looking for someone to explore with! Interested in connecting?");
    }

    return iceBreakers.slice(0, 3); // Return max 3
}

/**
 * Find and create matches for a user
 */
async function findMatchesForUser(userId, limit = 20) {
    const userPreference = await Preference.findOne({ user: userId });
    if (!userPreference) {
        return [];
    }

    // Get all other active users with preferences
    const allPreferences = await Preference.find({ 
        user: { $ne: userId },
        interests: { $exists: true, $ne: [] }
    }).populate('user');

    const matches = [];

    for (const otherPref of allPreferences) {
        // Check if match already exists
        const existingMatch = await Match.findOne({
            $or: [
                { user1: userId, user2: otherPref.user._id },
                { user1: otherPref.user._id, user2: userId }
            ]
        });

        if (existingMatch) {
            continue;
        }

        // Calculate compatibility
        const compatibility = await calculateCompatibilityScore(userId, otherPref.user._id);
        
        if (!compatibility || compatibility.score < 40) {
            continue; // Skip low compatibility matches
        }

        // Generate ice-breakers
        const iceBreakers = generateIceBreakers(
            compatibility.sharedInterests,
            userPreference,
            otherPref
        );

        // Determine match type
        const matchType = userPreference.lookingFor === otherPref.lookingFor 
            ? userPreference.lookingFor 
            : 'both';

        // Create match
        const match = await Match.create({
            user1: userId,
            user2: otherPref.user._id,
            compatibilityScore: compatibility.score,
            breakdown: compatibility.breakdown,
            sharedInterests: compatibility.sharedInterests,
            iceBreakers: iceBreakers,
            matchType: matchType,
            status: 'pending'
        });

        matches.push(match);
    }

    // Sort by compatibility score and return top matches
    matches.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
    return matches.slice(0, limit);
}

/**
 * Get matches for a user (existing matches)
 */
async function getMatchesForUser(userId, status = null) {
    const query = {
        $or: [
            { user1: userId },
            { user2: userId }
        ]
    };

    if (status) {
        query.status = status;
    }

    const matches = await Match.find(query)
        .populate('user1', 'username email travelBuddyProfile')
        .populate('user2', 'username email travelBuddyProfile')
        .sort({ compatibilityScore: -1 });

    // Return matches with the other user identified
    return matches.map(match => {
        const otherUser = match.user1._id.toString() === userId.toString() 
            ? match.user2 
            : match.user1;
        
        return {
            ...match.toObject(),
            otherUser,
            isUser1: match.user1._id.toString() === userId.toString()
        };
    });
}

module.exports = {
    calculateCompatibilityScore,
    generateIceBreakers,
    findMatchesForUser,
    getMatchesForUser
};

