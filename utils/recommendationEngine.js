const _ = require("lodash");

function recommendSimilarListings(allListings, baseListing, limit = 5) {
    if (!baseListing) return _.take(allListings, limit);
    const byLocation = allListings.filter(l => (l.location||'').toLowerCase() === (baseListing.location||'').toLowerCase() && l._id.toString() !== baseListing._id.toString());
    const byCountry = allListings.filter(l => (l.country||'').toLowerCase() === (baseListing.country||'').toLowerCase() && l._id.toString() !== baseListing._id.toString());
    const byPrice = _.sortBy(allListings, l => Math.abs((l.price || 0) - (baseListing.price || 0)));
    const merged = _.uniqBy([...byLocation, ...byCountry, ...byPrice], l => l._id.toString());
    return _.take(merged, limit);
}

function buildUserProfile({ bookings = [], reviews = [] }) {
    const likedLocations = _.countBy([...bookings, ...reviews].map(x => (x.location || '').toLowerCase()).filter(Boolean));
    const topLocation = _.maxBy(Object.keys(likedLocations), k => likedLocations[k]);
    const avgPrice = _.mean([...
        bookings.map(b => b.listing?.price || 0),
        reviews.map(r => r.listing?.price || 0)
    ].filter(n => Number.isFinite(n)));
    return { favoriteLocation: topLocation || null, targetPrice: Number.isFinite(avgPrice) ? avgPrice : null };
}

function recommendForUser(allListings, userProfile, limit = 6) {
    if (!userProfile) return _.take(allListings, limit);
    const { favoriteLocation, targetPrice } = userProfile;
    let scored = allListings.map(l => {
        let score = 0;
        if (favoriteLocation && (l.location||'').toLowerCase() === favoriteLocation) score += 5;
        if (Number.isFinite(targetPrice)) score += Math.max(0, 3 - Math.abs((l.price||0) - targetPrice)/ (targetPrice||1));
        score += ((l.reviews?.length)||0) * 0.1; // popularity proxy
        return { item: l, score };
    });
    return _.take(_.map(_.orderBy(scored, ['score'], ['desc']), 'item'), limit);
}

function suggestCouponForUser(userProfile, basePrice) {
    if (!userProfile) return null;
    if (basePrice >= 3000) return { codeHint: 'SAVE10', suggestedType: 'percent', suggestedAmount: 10 };
    return { codeHint: 'FLAT100', suggestedType: 'fixed', suggestedAmount: 100 };
}

module.exports = { recommendSimilarListings, buildUserProfile, recommendForUser, suggestCouponForUser };


