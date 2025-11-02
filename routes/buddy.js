const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const { isLoggedIn, isAdmin } = require("../middleware");
const Preference = require("../models/preference");
const Match = require("../models/match");
const BuddyRequest = require("../models/buddyRequest");
const BuddyMessage = require("../models/buddyMessage");
const BuddyListing = require("../models/buddyListing");
const Community = require("../models/community");
const User = require("../models/user");
const { findMatchesForUser, getMatchesForUser, calculateCompatibilityScore } = require("../utils/buddyMatchingEngine");
const { storage } = require("../cloudConfig");
const multer = require("multer");
const upload = multer({ storage });

// My Profile - View/Update
router.get("/profile", isLoggedIn, wrapAsync(async (req, res) => {
    const preference = await Preference.findOne({ user: req.user._id });
    const user = await User.findById(req.user._id);
    
    res.render("buddy/profile", {
        preference,
        user,
        title: "My Travel Buddy Profile"
    });
}));

router.post("/profile", isLoggedIn, upload.single("profilePicture"), wrapAsync(async (req, res) => {
    const updateData = {
        interests: Array.isArray(req.body.interests) ? req.body.interests : [req.body.interests].filter(Boolean),
        travelStyle: req.body.travelStyle,
        personalityTraits: Array.isArray(req.body.personalityTraits) ? req.body.personalityTraits : [req.body.personalityTraits].filter(Boolean),
        accommodationPreference: req.body.accommodationPreference,
        budgetRange: {
            min: parseInt(req.body.budgetMin) || 0,
            max: parseInt(req.body.budgetMax) || 50000
        },
        preferredDestinations: Array.isArray(req.body.preferredDestinations) 
            ? req.body.preferredDestinations 
            : req.body.preferredDestinations ? req.body.preferredDestinations.split(',').map(d => d.trim()) : [],
        languages: Array.isArray(req.body.languages) 
            ? req.body.languages 
            : req.body.languages ? req.body.languages.split(',').map(l => l.trim()) : [],
        dietaryRestrictions: Array.isArray(req.body.dietaryRestrictions) ? req.body.dietaryRestrictions : [req.body.dietaryRestrictions].filter(Boolean),
        smoking: req.body.smoking,
        ageRange: {
            min: parseInt(req.body.ageRangeMin) || 18,
            max: parseInt(req.body.ageRangeMax) || 99
        },
        preferredGender: req.body.preferredGender,
        bio: req.body.bio,
        lookingFor: req.body.lookingFor,
        updatedAt: new Date()
    };

    // Handle profile picture upload
    if (req.file) {
        await User.findByIdAndUpdate(req.user._id, {
            "travelBuddyProfile.profilePicture": {
                url: req.file.path,
                filename: req.file.filename
            }
        });
    }

    // Update user profile fields
    if (req.body.age) {
        await User.findByIdAndUpdate(req.user._id, {
            "travelBuddyProfile.age": parseInt(req.body.age),
            "travelBuddyProfile.gender": req.body.gender,
            "travelBuddyProfile.isActive": req.body.isActive === "true"
        });
    }

    // Update or create preference
    let preference = await Preference.findOne({ user: req.user._id });
    if (preference) {
        Object.assign(preference, updateData);
        await preference.save();
    } else {
        preference = await Preference.create({
            user: req.user._id,
            ...updateData
        });
    }

    req.flash("success", "Profile updated successfully!");
    res.redirect("/buddy/profile");
}));

// Find Matches
router.get("/matches", isLoggedIn, wrapAsync(async (req, res) => {
    const { refresh } = req.query;
    
    // Refresh matches if requested
    if (refresh === "true") {
        await findMatchesForUser(req.user._id);
    }

    const matches = await getMatchesForUser(req.user._id, req.query.status || null);
    const filters = {
        minScore: parseInt(req.query.minScore) || 0,
        interests: req.query.interests ? req.query.interests.split(',') : [],
        travelStyle: req.query.travelStyle || null
    };

    // Apply filters
    let filteredMatches = matches.filter(match => {
        if (match.compatibilityScore < filters.minScore) return false;
        if (filters.travelStyle && match.matchType !== filters.travelStyle && match.matchType !== 'both') return false;
        if (filters.interests.length > 0) {
            const hasCommonInterest = match.sharedInterests.some(i => filters.interests.includes(i));
            if (!hasCommonInterest) return false;
        }
        return true;
    });

    res.render("buddy/matches", {
        matches: filteredMatches,
        filters,
        title: "Find Travel Buddies"
    });
}));

// View Single Match
router.get("/matches/:matchId", isLoggedIn, wrapAsync(async (req, res) => {
    const match = await Match.findById(req.params.matchId)
        .populate("user1", "username email travelBuddyProfile")
        .populate("user2", "username email travelBuddyProfile");

    if (!match || (match.user1._id.toString() !== req.user._id.toString() && match.user2._id.toString() !== req.user._id.toString())) {
        req.flash("error", "Match not found");
        return res.redirect("/buddy/matches");
    }

    const otherUser = match.user1._id.toString() === req.user._id.toString() ? match.user2 : match.user1;
    
    // Mark as viewed
    match.lastViewedAt = new Date();
    match.status = match.status === 'pending' ? 'viewed' : match.status;
    await match.save();

    res.render("buddy/match-detail", {
        match,
        otherUser,
        title: "Match Details"
    });
}));

// Create Listing
router.get("/listings/new", isLoggedIn, wrapAsync(async (req, res) => {
    res.render("buddy/listing-new", {
        title: "Create Travel Buddy Listing"
    });
}));

router.post("/listings", isLoggedIn, wrapAsync(async (req, res) => {
    const listing = await BuddyListing.create({
        creator: req.user._id,
        title: req.body.title,
        destination: req.body.destination,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
        bio: req.body.bio,
        interests: Array.isArray(req.body.interests) ? req.body.interests : [req.body.interests].filter(Boolean),
        travelStyle: req.body.travelStyle,
        lookingFor: req.body.lookingFor,
        maxPartners: parseInt(req.body.maxPartners) || 1,
        budgetPerPerson: {
            min: parseInt(req.body.budgetMin) || 0,
            max: parseInt(req.body.budgetMax) || 50000
        },
        accommodationType: req.body.accommodationType,
        status: 'active'
    });

    req.flash("success", "Listing created successfully!");
    res.redirect(`/buddy/listings/${listing._id}`);
}));

// View Listings
router.get("/listings", isLoggedIn, wrapAsync(async (req, res) => {
    const listings = await BuddyListing.find({ status: 'active' })
        .populate("creator", "username email travelBuddyProfile")
        .sort({ createdAt: -1 });

    res.render("buddy/listings", {
        listings,
        title: "Travel Buddy Listings"
    });
}));

router.get("/listings/:id", isLoggedIn, wrapAsync(async (req, res) => {
    const listing = await BuddyListing.findById(req.params.id)
        .populate("creator", "username email travelBuddyProfile")
        .populate("acceptedPartners", "username email travelBuddyProfile");

    if (!listing) {
        req.flash("error", "Listing not found");
        return res.redirect("/buddy/listings");
    }

    // Check if user has already sent a request
    const existingRequest = await BuddyRequest.findOne({
        from: req.user._id,
        listing: listing._id
    });

    res.render("buddy/listing-detail", {
        listing,
        existingRequest,
        title: listing.title
    });
}));

// Send Request
router.post("/listings/:id/request", isLoggedIn, wrapAsync(async (req, res) => {
    const listing = await BuddyListing.findById(req.params.id);
    
    if (!listing) {
        req.flash("error", "Listing not found");
        return res.redirect("/buddy/listings");
    }

    if (listing.creator.toString() === req.user._id.toString()) {
        req.flash("error", "You cannot send a request to your own listing");
        return res.redirect(`/buddy/listings/${listing._id}`);
    }

    // Check if already sent
    const existing = await BuddyRequest.findOne({
        from: req.user._id,
        listing: listing._id
    });

    if (existing) {
        req.flash("error", "You have already sent a request for this listing");
        return res.redirect(`/buddy/listings/${listing._id}`);
    }

    await BuddyRequest.create({
        from: req.user._id,
        to: listing.creator,
        listing: listing._id,
        message: req.body.message,
        requestType: listing.lookingFor
    });

    req.flash("success", "Request sent successfully!");
    res.redirect(`/buddy/listings/${listing._id}`);
}));

// Communities
router.get("/communities", isLoggedIn, wrapAsync(async (req, res) => {
    const communities = await Community.find({ isActive: true })
        .populate("createdBy", "username")
        .sort({ memberCount: -1 });

    // Get user's communities
    const userCommunities = await Community.find({
        members: req.user._id,
        isActive: true
    });

    res.render("buddy/communities", {
        communities,
        userCommunities: userCommunities.map(c => c._id.toString()),
        title: "Travel Communities"
    });
}));

router.post("/communities/:id/join", isLoggedIn, wrapAsync(async (req, res) => {
    const community = await Community.findById(req.params.id);
    
    if (!community) {
        req.flash("error", "Community not found");
        return res.redirect("/buddy/communities");
    }

    if (!community.members.includes(req.user._id)) {
        community.members.push(req.user._id);
        await community.save();
        req.flash("success", `Joined ${community.name}!`);
    }

    res.redirect("/buddy/communities");
}));

router.post("/communities/:id/leave", isLoggedIn, wrapAsync(async (req, res) => {
    const community = await Community.findById(req.params.id);
    
    if (community && community.members.includes(req.user._id)) {
        community.members = community.members.filter(
            m => m.toString() !== req.user._id.toString()
        );
        await community.save();
        req.flash("success", `Left ${community.name}`);
    }

    res.redirect("/buddy/communities");
}));

// Requests
router.get("/requests", isLoggedIn, wrapAsync(async (req, res) => {
    let query;
    
    if (req.user.role === 'admin') {
        // Admin sees all requests
        query = {};
    } else {
        // Users see only their own requests
        query = {
            $or: [
                { from: req.user._id },
                { to: req.user._id }
            ]
        };
    }

    const requests = await BuddyRequest.find(query)
        .populate("from", "username email travelBuddyProfile")
        .populate("to", "username email travelBuddyProfile")
        .populate("listing", "title destination")
        .sort({ createdAt: -1 });

    const sentRequests = requests.filter(r => r.from._id.toString() === req.user._id.toString());
    const receivedRequests = requests.filter(r => r.to._id.toString() === req.user._id.toString());

    res.render("buddy/requests", {
        sentRequests,
        receivedRequests,
        allRequests: req.user.role === 'admin' ? requests : null,
        isAdmin: req.user.role === 'admin',
        title: "Travel Buddy Requests"
    });
}));

router.post("/requests/:id/accept", isLoggedIn, wrapAsync(async (req, res) => {
    const request = await BuddyRequest.findById(req.params.id)
        .populate("listing");

    if (!request) {
        req.flash("error", "Request not found");
        return res.redirect("/buddy/requests");
    }

    if (request.to.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        req.flash("error", "Unauthorized");
        return res.redirect("/buddy/requests");
    }

    if (request.status !== 'pending') {
        req.flash("error", "Request already processed");
        return res.redirect("/buddy/requests");
    }

    request.status = 'accepted';
    request.respondedAt = new Date();
    request.responseMessage = req.body.responseMessage || "";

    // Add to listing's accepted partners
    if (request.listing) {
        const listing = await BuddyListing.findById(request.listing._id);
        if (listing && !listing.acceptedPartners.includes(request.from._id)) {
            listing.acceptedPartners.push(request.from._id);
            
            // Check if listing is filled
            if (listing.acceptedPartners.length >= listing.maxPartners) {
                listing.status = 'filled';
            }
            
            await listing.save();
        }
    }

    await request.save();

    req.flash("success", "Request accepted!");
    res.redirect("/buddy/requests");
}));

router.post("/requests/:id/reject", isLoggedIn, wrapAsync(async (req, res) => {
    const request = await BuddyRequest.findById(req.params.id);

    if (!request) {
        req.flash("error", "Request not found");
        return res.redirect("/buddy/requests");
    }

    if (request.to.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        req.flash("error", "Unauthorized");
        return res.redirect("/buddy/requests");
    }

    request.status = 'rejected';
    request.respondedAt = new Date();
    await request.save();

    req.flash("success", "Request rejected");
    res.redirect("/buddy/requests");
}));

router.delete("/requests/:id", isAdmin, wrapAsync(async (req, res) => {
    const request = await BuddyRequest.findByIdAndDelete(req.params.id);
    if (!request) {
        req.flash("error", "Request not found");
    } else {
        req.flash("success", "Request deleted");
    }
    res.redirect("/buddy/requests");
}));

// Inbox
router.get("/inbox", isLoggedIn, wrapAsync(async (req, res) => {
    // Get all conversations where user has accepted requests
    const acceptedRequests = await BuddyRequest.find({
        status: 'accepted',
        $or: [
            { from: req.user._id },
            { to: req.user._id }
        ]
    });

    const conversationIds = [];
    acceptedRequests.forEach(request => {
        const userIds = [request.from.toString(), request.to.toString()].sort();
        const conversationId = userIds.join('_');
        conversationIds.push(conversationId);
    });

    // Get messages for these conversations
    const conversations = [];
    for (const convId of [...new Set(conversationIds)]) {
        const [user1Id, user2Id] = convId.split('_');
        const otherUserId = user1Id === req.user._id.toString() ? user2Id : user1Id;
        const otherUser = await User.findById(otherUserId, "username email travelBuddyProfile");

        const messages = await BuddyMessage.find({ conversationId: convId })
            .populate("sender", "username travelBuddyProfile")
            .populate("recipient", "username travelBuddyProfile")
            .sort({ createdAt: -1 })
            .limit(1);

        const unreadCount = await BuddyMessage.countDocuments({
            conversationId: convId,
            recipient: req.user._id,
            read: false
        });

        conversations.push({
            conversationId: convId,
            otherUser,
            lastMessage: messages[0] || null,
            unreadCount
        });
    }

    conversations.sort((a, b) => {
        if (!a.lastMessage && !b.lastMessage) return 0;
        if (!a.lastMessage) return 1;
        if (!b.lastMessage) return -1;
        return b.lastMessage.createdAt - a.lastMessage.createdAt;
    });

    res.render("buddy/inbox", {
        conversations,
        title: "Messages"
    });
}));

router.get("/inbox/:conversationId", isLoggedIn, wrapAsync(async (req, res) => {
    const conversationId = req.params.conversationId;
    const [user1Id, user2Id] = conversationId.split('_');

    // Verify user is part of conversation
    if (user1Id !== req.user._id.toString() && user2Id !== req.user._id.toString()) {
        req.flash("error", "Unauthorized");
        return res.redirect("/buddy/inbox");
    }

    const otherUserId = user1Id === req.user._id.toString() ? user2Id : user1Id;
    const otherUser = await User.findById(otherUserId, "username email travelBuddyProfile");

    const messages = await BuddyMessage.find({ conversationId })
        .populate("sender", "username travelBuddyProfile")
        .populate("recipient", "username travelBuddyProfile")
        .sort({ createdAt: 1 });

    // Mark messages as read
    await BuddyMessage.updateMany(
        { conversationId, recipient: req.user._id, read: false },
        { read: true, readAt: new Date() }
    );

    res.render("buddy/chat", {
        conversationId,
        otherUser,
        messages,
        title: `Chat with ${otherUser.username}`
    });
}));

router.post("/inbox/:conversationId/message", isLoggedIn, wrapAsync(async (req, res) => {
    const conversationId = req.params.conversationId;
    const [user1Id, user2Id] = conversationId.split('_');

    // Verify user is part of conversation
    if (user1Id !== req.user._id.toString() && user2Id !== req.user._id.toString()) {
        req.flash("error", "Unauthorized");
        return res.redirect("/buddy/inbox");
    }

    const recipientId = user1Id === req.user._id.toString() ? user2Id : user1Id;

    await BuddyMessage.create({
        sender: req.user._id,
        recipient: recipientId,
        content: req.body.content,
        conversationId,
        read: false
    });

    res.redirect(`/buddy/inbox/${conversationId}`);
}));

module.exports = router;

