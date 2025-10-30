if(process.env.NODE_ENV != "production"){
require('dotenv').config();
}

const ExpressError = require("./utils/ExpressError");

const Booking = require("./models/booking");
const Coupon = require("./models/coupon");
const Analytics = require("./models/analytics");


const express= require("express");
const app =express();
const mongoose= require("mongoose");
const Listing=require("./models/listing.js");
const path= require("path");
const methodOverride= require("method-override");
app.use(express.urlencoded({extended :true}));
app.use(express.json());
app.use(methodOverride("_method"));
const _ = require("lodash");
const moment = require("moment");
const axios = require("axios");


app.use((req, res, next) => {
    res.locals.searchQuery = req.query.q || "";
    next();
});
const ejsMAte= require("ejs-mate");
const wrapAsync= require("./utils/wrapAsync.js");
const{validateReview}= require("./middleware.js");
const { incrementListingViewCount, recordBooking, updateReviewStats, getDashboardOverview, getDashboardOverviewForUser } = require("./utils/analyticsHelper");
const hostNotificationService = require("./utils/hostNotificationService");
const { recommendSimilarListings, buildUserProfile, recommendForUser, suggestCouponForUser } = require("./utils/recommendationEngine");


const {storage}= require("./cloudConfig.js");

const Review=require("./models/review.js");

const multer  = require('multer');
const upload = multer({ storage });


const session=require("express-session");
const MongoStore=require("connect-mongo");
const flash=require("connect-flash");
const passport=require("passport");
const LocalStrategy=require("passport-local");
const User=require("./models/user.js");
const searchRouter = require("./routes/search");
const dbUrl= process.env.ATLASDB_URL;

const{isLoggedIn, isOwner, validateListing,isReviewAuthor, isAdmin, canViewAnalytics}=require("./middleware.js");
const{saveRedirectUrl}=require("./middleware.js");
app.engine("ejs",ejsMAte);
app.use(express.static(path.join(__dirname,"/public")));


const store= MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: "mysecret",
},
    touchAfter: 24*3600,
});

store.on("error",(err)=>{
    console.log("Error in Mongo Atlas",err);
});

const sessionOptions={
    store,
    secret: "mysecret",
    resave:false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now()+ 7*24*60*60*1000,
        maxAge:7*24*60*60*1000,
        httpOnly: true,
       
    }
}

app.use(session(sessionOptions));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// Analytics tracking middleware (simple request timing placeholder)
app.use((req, res, next) => {
    res.locals.requestTime = Date.now();
    next();
});

// Coupon extraction middleware: reads coupon code from body or query and loads coupon if valid
app.use(async (req, res, next) => {
    try {
        const code = (req.body && (req.body.couponCode || (req.body.coupon && req.body.coupon.code))) || req.query.couponCode;
        if (!code) return next();
        const coupon = await Coupon.findOne({ code: String(code).trim().toUpperCase(), isActive: true });
        if (coupon && coupon.isValidForUse()) {
            req.appliedCoupon = coupon;
        }
        return next();
    } catch (e) {
        return next();
    }
});

passport.use(new LocalStrategy(User.authenticate()));

// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use((req,res,next)=>{
    res.locals.success=req.flash("success");
    res.locals.error=req.flash("error");
    res.locals.currUser=req.user;
    next();
});


// const MONGO_URL= "mongodb://127.0.0.1:27017/wanderlust";

async function main(){
    await mongoose.connect(dbUrl);
};


main().then(()=>{
    console.log("Connected to DB");
}).catch((err)=>{
    console.log(err);
});




// app.get("/",(req,res)=>{
//     res.send("Server is workong");
// });




//Signup


app.get("/signup", (req,res)=>{
    res.render("users/signup.ejs");
});

app.post("/signup", wrapAsync(async(req,res)=>{
    try{
    let {username, email, password}=req.body;
    const desiredRole = (req.body.role || 'user').toLowerCase();
    const adminHint = (req.body.adminHint || '').trim() || null;
    const role = desiredRole === 'admin' ? 'admin' : 'user';
    const newUser= new User({email, username, role, adminHint});
    const registeredUser= await User.register(newUser,password);
    console.log(registeredUser);
    req.login(registeredUser, (err)=>{
        if(err){
            return next(err);
        }
        req.flash("success", `Welcome to Wanderlust! Logged in as ${registeredUser.role}.`);
        res.redirect("/listings");
    })
    
} catch(e){
    req.flash("error", e.message);
    res.redirect("/signup");
}

})
);

//Login

app.get("/login",(req,res)=>{
    res.render("users/login.ejs");
});

app.post("/login", saveRedirectUrl, passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
}),
async (req, res, next) => {
    try {
        if (req.user && req.user.role === 'admin') {
            const providedHint = (req.body.adminHintVerify || '').trim();
            const savedHint = (req.user.adminHint || '').trim();
            if (!savedHint || !providedHint || providedHint !== savedHint) {
                req.logout(() => {});
                req.flash('error', 'Admin hint verification failed.');
                return res.redirect('/login');
            }
        }
        req.flash("successs", `Welcome back to WanderLust!`);
        let redirectUrl = "/listings";
        if (req.user && req.user.role === 'admin') {
            redirectUrl = "/admin";
        }
        if (res.locals.redirectUrl) {
            redirectUrl = res.locals.redirectUrl;
        }
        return res.redirect(redirectUrl);
    } catch (e) {
        return next(e);
    }
});



//Logout

app.get("/logout",(req,res,next)=>{
    req.logout((err)=>{
        if(err){
            return next(err);
        }
        req.flash("success","you are logged out!");
        res.redirect("/listings");
    })
})















app.set("view engine","ejs");
app.set("views", path.join(__dirname,"views"));

//Index route
// Listings Index Route with Search Support
app.get("/listings", wrapAsync(async (req, res) => {
    const searchQuery = req.query.q || "";

    // Fetch all listings from the DB
    let allListings = await Listing.find({});

    // Apply search filter if query is provided
    if (searchQuery) {
        allListings = allListings.filter(listing =>
            listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            listing.location.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }

    // Apply RL-based ranking using performance scores
    try {
        const listingPerformanceTracker = require('./utils/listingPerformanceTracker');
        
        // Update ranking scores for all listings (in background)
        setImmediate(() => {
            listingPerformanceTracker.updateAllListingScores().catch(console.error);
        });

        // Sort listings by ranking score (higher scores first)
        allListings.sort((a, b) => {
            const scoreA = a.rankingScore || 50;
            const scoreB = b.rankingScore || 50;
            return scoreB - scoreA;
        });

        // Add performance indicators to listings
        allListings = allListings.map(listing => {
            const listingObj = listing.toObject();
            const score = listing.rankingScore || 50;
            
            if (score >= 80) {
                listingObj.performanceBadge = { text: 'Top Performer', class: 'bg-success' };
            } else if (score >= 60) {
                listingObj.performanceBadge = { text: 'Good', class: 'bg-primary' };
            } else if (score <= 30) {
                listingObj.performanceBadge = { text: 'Needs Attention', class: 'bg-warning' };
            }
            
            return listingObj;
        });

    } catch (error) {
        console.error('Error applying RL ranking:', error);
        // Fallback to default sorting by creation date
        allListings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // Basic personalization suggestions
    let personalized = [];
    try {
        if (req.user) {
            const userBookings = await Booking.find({ guest: req.user._id }).populate('listing');
            const userReviews = await Review.find({ author: req.user._id }).populate('listing');
            const profile = buildUserProfile({ 
                bookings: userBookings.map(b => b.listing).filter(Boolean), 
                reviews: userReviews.map(r => r.toObject({ virtuals: true })) 
            });
            personalized = recommendForUser(allListings, profile, 6);
        }
    } catch(error) {
        console.error('Error in personalization:', error);
    }

    res.render("listings/index", {
        allListings,
        searchQuery,
        personalized
    });
}));



//new route
app.get("/listings/new",isLoggedIn,(req,res)=>{
    // if(!req.isAuthenticated()){
    //     req.flash("error","You must be logged in to create listing!!");
    //     return res.redirect("/login");
    // }
    res.render("listings/new.ejs");
});

//Show route
app.get("/listings/:id", wrapAsync(async(req,res)=>{
    let{id}= req.params;
    const listing= await Listing.findById(id).populate({path: "reviews", populate:{path: "author"},}).populate("owner");
    if(!listing){
        req.flash("error","Listing you are looking for does not exist!");
        res.redirect("/listings");
    }
    console.log(listing);
    // Track view count analytics
    try { await incrementListingViewCount(listing._id); } catch (_) {}
    // basic recommendations
    let recommendations = [];
    try {
        const all = await Listing.find({ _id: { $ne: listing._id } }).limit(20);
        recommendations = recommendSimilarListings(all, listing, 5);
    } catch(_){}
    // smart coupon suggestion
    let couponSuggestion = null;
    try {
        const basePrice = (listing.price||0);
        couponSuggestion = suggestCouponForUser(null, basePrice);
    } catch(_){}
    res.render("listings/show.ejs", {listing, recommendations, couponSuggestion});
}));


      



    //Create route

    app.post("/listings",isLoggedIn,upload.single("listing[image]"),validateListing, wrapAsync(async(req,res,next)=>{
      
        let url=req.file.path;
        let filename= req.file.filename;
    

        const newListing= new Listing(req.body.listing);
      newListing.owner= req.user._id;
      newListing.image={url,filename};
    await newListing.save();
   
   
    req.flash("success","New listing created!");
        res.redirect("/listings");
    
})
    );









//Create route

//     app.post("/listings", async(req,res,next)=>{
//         try{
//         //let{title, description, image, price, country, location}= req.body;
//         const newListing= new Listing(req.body.listing);
//         await newListing.save();
//         res.redirect("/listings");
//    }catch(err){
// next(err);
// }
// });




//Edit route
app.get("/listings/:id/edit", isLoggedIn,isOwner,wrapAsync(async(req,res)=>{
    let{id}= req.params;
    const listing= await Listing.findById(id);
    if(!listing){
        req.flash("error","Listing you are looking for does not exist!");
        res.redirect("/listings");
    }

    let originalImageUrl= listing.image.url;
   originalImageUrl= originalImageUrl.replace("/upload","/upload/h_200,w_300");
    res.render("listings/edit.ejs",{listing, originalImageUrl});
}));


//update route

app.put("/listings/:id",upload.single("listing[image]"), isLoggedIn,isOwner,validateListing,wrapAsync(async(req,res)=>{
    let{id}= req.params;
   let listing= await Listing.findByIdAndUpdate(id,{...req.body.listing});
    
   if(typeof req.file !== "undefined"){
   let url=req.file.path;
   let filename= req.file.filename;
   listing.image= {url,filename};
   await listing.save();
   req.flash("success"," Listing updated!");
    res.redirect(`/listings/${id}`);
   }
}));


//Delete route

app.delete("/listings/:id",isLoggedIn,isOwner,wrapAsync(async(req,res)=>{
    let{id}= req.params;
    let DelList= await Listing.findByIdAndDelete(id);
    console.log(DelList);
    req.flash("success","Listing deleted!");
    res.redirect("/listings");
}));




// Route to show user's bookings
app.get("/bookings", isLoggedIn, wrapAsync(async (req, res) => {
    try {
        // Bookings where current user is the guest (Trips)
        const userBookings = await Booking.find({ guest: req.user._id })
            .populate("listing")
            .populate("guest")
            .sort({ bookedAt: -1 });

        // Bookings for listings owned by current user (Host)
        const userListings = await Listing.find({ owner: req.user._id }, { _id: 1 });
        const listingIds = userListings.map(l => l._id);
        const hostBookings = listingIds.length
            ? await Booking.find({ listing: { $in: listingIds } })
                .populate("listing")
                .populate("guest")
                .sort({ bookedAt: -1 })
            : [];
        
        res.render("bookings/index", { 
            bookings: userBookings,
            hostBookings,
            user: req.user 
        });
    } catch (err) {
        console.error(err);
        req.flash("error", "Error fetching your bookings.");
        res.redirect("/listings");
    }
}));

// Cancel booking
app.patch("/bookings/:id/cancel", isLoggedIn, wrapAsync(async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id).populate("listing");
        
        if (!booking) {
            req.flash("error", "Booking not found.");
            return res.redirect("/bookings");
        }
        
        // Check if user owns this booking
        if (!booking.guest.equals(req.user._id)) {
            req.flash("error", "You can only cancel your own bookings.");
            return res.redirect("/bookings");
        }
        
        // Check if booking can be cancelled
        if (booking.status !== 'confirmed') {
            req.flash("error", "This booking cannot be cancelled.");
            return res.redirect("/bookings");
        }
        
        // Check cancellation policy
        const checkinDate = new Date(booking.checkin);
        const now = new Date();
        const hoursUntilCheckin = (checkinDate - now) / (1000 * 60 * 60);
        
        if (hoursUntilCheckin < 24) {
            req.flash("error", "Cannot cancel within 24 hours of check-in.");
            return res.redirect("/bookings");
        }
        
        // Update booking status
        booking.status = 'cancelled';
        booking.cancelledAt = new Date();
        booking.cancellationReason = 'Guest cancelled';
        await booking.save();
        
        req.flash("success", "Booking cancelled successfully!");
        res.redirect("/bookings");
    } catch (err) {
        console.error(err);
        req.flash("error", "Error cancelling booking.");
        res.redirect("/bookings");
    }
}));

// (Removed) Host bookings page — unified under /bookings

// Host performance dashboard
app.get("/host/performance", isLoggedIn, wrapAsync(async (req, res) => {
    try {
        const listingPerformanceTracker = require('./utils/listingPerformanceTracker');
        const hostNotificationService = require('./utils/hostNotificationService');
        
        // Get all listings owned by the user
        const userListings = await Listing.find({ owner: req.user._id });
        
        // Get performance data for each listing
        const listingPerformances = [];
        for (const listing of userListings) {
            const performance = await listingPerformanceTracker.getListingPerformance(listing._id, 30);
            if (performance) {
                listingPerformances.push({
                    listing,
                    performance
                });
            }
        }

        // Sort by performance score (worst first)
        listingPerformances.sort((a, b) => 
            a.performance.metrics.performanceScore - b.performance.metrics.performanceScore
        );

        // Get notifications for this host
        const notifications = await hostNotificationService.getHostNotifications(req.user._id, 5);

        res.render("host/performance", {
            listingPerformances,
            notifications,
            user: req.user
        });
    } catch (err) {
        console.error(err);
        req.flash("error", "Error fetching performance data.");
        res.redirect("/listings");
    }
}));

// Host cancel booking
app.patch("/bookings/:id/host-cancel", isLoggedIn, wrapAsync(async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id).populate("listing");
        
        if (!booking) {
            req.flash("error", "Booking not found.");
            return res.redirect("/host/bookings");
        }
        
        // Check if user owns the listing
        if (!booking.listing.owner.equals(req.user._id)) {
            req.flash("error", "You can only cancel bookings for your own listings.");
            return res.redirect("/host/bookings");
        }
        
        // Check if booking can be cancelled
        if (booking.status !== 'confirmed') {
            req.flash("error", "This booking cannot be cancelled.");
            return res.redirect("/host/bookings");
        }
        
        // Update booking status
        booking.status = 'cancelled';
        booking.cancelledAt = new Date();
        booking.cancellationReason = 'Host cancelled';
        await booking.save();
        
        req.flash("success", "Booking cancelled successfully!");
        res.redirect("/host/bookings");
    } catch (err) {
        console.error(err);
        req.flash("error", "Error cancelling booking.");
        res.redirect("/host/bookings");
    }
}));



// Apply coupon to a booking calculation preview
app.post("/bookings/:id/apply-coupon", async (req, res) => {
    const listingId = req.params.id;
    const { checkin, checkout, guests, couponCode } = req.body;
    const checkinDate = new Date(checkin);
    const checkoutDate = new Date(checkout);
    if (checkoutDate <= checkinDate) {
        req.flash("error", "Checkout date must be after check-in date.");
        return res.redirect(`/listings/${listingId}`);
    }
    const listing = await Listing.findById(listingId);
    const days = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
    const basePrice = (listing.price || 0) * days;
    const tax = basePrice * 0.18;
    const serviceFee = 200;
    let discount = 0;
    let couponApplied = null;
    if (couponCode) {
        const coupon = await Coupon.findOne({ code: String(couponCode).trim().toUpperCase(), isActive: true });
        if (coupon && coupon.isValidForUse()) {
            couponApplied = coupon;
            if (coupon.discountType === "percent") {
                discount = Math.min(basePrice, (basePrice * coupon.amount) / 100);
            } else {
                discount = Math.min(basePrice, coupon.amount);
            }
        } else {
            req.flash("error", "Invalid or expired coupon.");
        }
    }
    const total = basePrice - discount + tax + serviceFee;
    return res.render("listings/confirmation", { listing, checkin, checkout, guests, days, basePrice, tax, serviceFee, total, discount, couponApplied });
});

app.post("/bookings/:id", isLoggedIn, wrapAsync(async (req, res) => {
    const { checkin, checkout, guests, specialRequests, couponCode } = req.body;
    const listingId = req.params.id;
    const guestId = req.user._id;

    const checkinDate = new Date(checkin);
    const checkoutDate = new Date(checkout);

    // Validate: checkout must be after checkin
    if (checkoutDate <= checkinDate) {
        req.flash("error", "Checkout date must be after check-in date.");
        return res.redirect(`/listings/${listingId}`);
    }

    // Check for existing bookings in the same date range
    const existingBooking = await Booking.findOne({
        listing: listingId,
        status: { $in: ['confirmed', 'pending'] },
        $or: [
            { checkin: { $lte: checkinDate }, checkout: { $gt: checkinDate } },
            { checkin: { $lt: checkoutDate }, checkout: { $gte: checkoutDate } },
            { checkin: { $gte: checkinDate }, checkout: { $lte: checkoutDate } }
        ]
    });

    if (existingBooking) {
        req.flash("error", "These dates are not available. Please choose different dates.");
        return res.redirect(`/listings/${listingId}`);
    }

    const listing = await Listing.findById(listingId);
    if (!listing) {
        req.flash("error", "Listing not found.");
        return res.redirect("/listings");
    }

    // Check if user is trying to book their own listing
    if (listing.owner.equals(guestId)) {
        req.flash("error", "You cannot book your own listing.");
        return res.redirect(`/listings/${listingId}`);
    }

    const days = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
    const basePrice = (listing.price || 0) * days;
    const cleaningFee = 500; // Fixed cleaning fee
    const serviceFee = 200; // Fixed service fee
    const taxes = Math.round(basePrice * 0.18); // 18% GST

    // Coupon logic
    let discount = 0;
    let couponUsedId = null;
    if (couponCode) {
        const coupon = await Coupon.findOne({ code: String(couponCode).trim().toUpperCase(), isActive: true });
        if (coupon && coupon.isValidForUse()) {
            if (coupon.discountType === "percent") {
                discount = Math.min(basePrice, (basePrice * coupon.amount) / 100);
            } else {
                discount = Math.min(basePrice, coupon.amount);
            }
            coupon.uses += 1;
            await coupon.save();
            couponUsedId = coupon._id;
        } else {
            req.flash("error", "Invalid or expired coupon.");
            return res.redirect(`/listings/${listingId}`);
        }
    }

    const total = basePrice - discount + cleaningFee + serviceFee + taxes;

    // Create booking with new structure
    const booking = await Booking.create({
        listing: listingId,
        guest: guestId,
        checkin,
        checkout,
        guests: {
            adults: parseInt(guests.adults) || 1,
            children: parseInt(guests.children) || 0,
            infants: parseInt(guests.infants) || 0,
            pets: parseInt(guests.pets) || 0
        },
        pricing: {
            basePrice,
            cleaningFee,
            serviceFee,
            taxes,
            discount,
            total
        },
        specialRequests: specialRequests || '',
        status: 'confirmed', // Auto-confirm for now
        bookingType: 'instant',
        paymentStatus: 'paid', // Simulate payment success
        coupon: couponUsedId,
        confirmedAt: new Date()
    });

    // Record analytics for booking and revenue
    try { await recordBooking(listingId, total); } catch (_) {}

    res.render("listings/confirmation", {
        listing,
        booking,
        checkin,
        checkout,
        guests: guests,
        days,
        basePrice,
        cleaningFee,
        serviceFee,
        taxes,
        discount,
        total,
        couponApplied: couponUsedId ? true : false
    });
}));






//Review
//Post route

app.post("/listings/:id/reviews", isLoggedIn, validateReview, wrapAsync(async (req, res) => {
    const listing = await Listing.findById(req.params.id).populate("reviews");

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Count reviews on this listing in last 24 hours
    const recentApprovedReviews = listing.reviews.filter(review =>
        review.createdAt >= twentyFourHoursAgo && review.status === "approved"
    );

    // Check if user already posted a review for this listing in the last 24 hrs
    const existingUserReview = listing.reviews.find(review =>
        review.author.equals(req.user._id) && (now - review.createdAt < 24 * 60 * 60 * 1000)
    );

    if (existingUserReview) {
        req.flash("error", "You can only post one review for this listing every 24 hours.");
        return res.redirect(`/listings/${listing._id}`);
    }

    const newReview = new Review({
        comment: req.body.review.comment,
        rating: req.body.review.rating,
        author: req.user._id,
        listing: listing._id
    });

    // If too many reviews already, send to admin moderation
    if (recentApprovedReviews.length >= 5) {
        newReview.status = "pending";
        req.flash("info", "Review limit reached. Your review is pending admin approval.");
    } else {
        newReview.status = "approved";
        req.flash("success", "Your review was posted!");
    }

    // Sentiment analysis (best-effort)
    try {
        const NLP_BASE_URL = process.env.NLP_SERVICE_URL || "http://localhost:8002";
        const resp = await axios.post(`${NLP_BASE_URL}/sentiment`, { text: newReview.comment }, { timeout: 3000 });
        if (resp.data && resp.data.label) {
            newReview.sentiment = { label: resp.data.label, score: resp.data.score || 0 };
        }
    } catch(_) {}

    listing.reviews.push(newReview);
    await newReview.save();
    await listing.save();

    // Update analytics review stats
    try {
        const approvedReviews = listing.reviews.filter(r => (r.status || "approved") === "approved");
        const avg = approvedReviews.length ? _.meanBy(approvedReviews, r => r.rating || 0) : 0;
        await updateReviewStats(listing._id, avg, approvedReviews.length);
    } catch (_) {}

    res.redirect(`/listings/${listing._id}`);
}));

// Cancellation risk scoring API (for client-side previews)
app.post("/api/risk/score", wrapAsync(async (req, res) => {
    try {
        const { price, daysUntilCheckin, isNewUser, priorCancellations } = req.body || {};
        const NLP_BASE_URL = process.env.NLP_SERVICE_URL || "http://localhost:8002";
        const resp = await axios.post(`${NLP_BASE_URL}/risk`, {
            price,
            days_until_checkin: daysUntilCheckin,
            is_new_user: !!isNewUser,
            prior_cancellations: priorCancellations || 0
        }, { timeout: 3000 });
        return res.json(resp.data || { risk: "unknown", score: 0 });
    } catch (e) {
        return res.status(200).json({ risk: "unknown", score: 0 });
    }
}));

const hostScenarioPredictor = require("./utils/hostScenarioPredictor");

// Counterfactual "What If" API (Guest - for search)
app.post("/api/search/whatif", wrapAsync(async (req, res) => {
    try {
        const { baseResults = [], proposedChanges = {} } = req.body || {};

        const responses = [];

        // Budget-based suggestion using real listing data
        if (proposedChanges.maxBudget || proposedChanges.budgetIncrease) {
            const baseMax = Number(proposedChanges.maxBudget) || 0;
            const increasedBy = Number(proposedChanges.budgetIncrease) || 0;
            const newMax = baseMax > 0 ? baseMax + increasedBy : (increasedBy > 0 ? increasedBy : 0);

            if (newMax > 0) {
                const [currentCount, newCount] = await Promise.all([
                    baseMax > 0 ? Listing.countDocuments({ price: { $lte: baseMax } }) : Promise.resolve(0),
                    Listing.countDocuments({ price: { $lte: newMax } })
                ]);
                const delta = Math.max(0, newCount - currentCount);

                // Sample a few titles as examples
                const sample = await Listing.find({ price: { $lte: newMax } })
                    .select("title price")
                    .sort({ price: 1 })
                    .limit(6);

                responses.push({
                    type: "budget",
                    message: baseMax > 0
                        ? `Increasing your max budget from ₹${baseMax} to ₹${newMax} adds ${delta} more options (total ${newCount}).`
                        : `With a budget up to ₹${newMax}, you have ${newCount} matching properties.`,
                    impact: delta > 0 || baseMax === 0 ? "positive" : "neutral",
                    delta,
                    total: newCount,
                    examples: sample.map(s => ({ title: s.title, price: s.price }))
                });
            }
        }

        // Duration-based heuristic suggestion
        if (proposedChanges.extendStay) {
            const nights = Number(proposedChanges.extendStay) || 0;
            if (nights > 0) {
                const discount = nights >= 7 ? 18 : (nights >= 3 ? 12 : 8);
                responses.push({
                    type: "duration",
                    message: `Extending your stay by ${nights} ${nights === 1 ? 'night' : 'nights'} could unlock up to ${discount}% weekly-stay savings on many listings.`,
                    impact: "positive",
                    discount
                });
            }
        }

        // Flexible dates heuristic suggestion
        if (proposedChanges.flexibleDates) {
            // Approximate savings by shifting from weekend to weekday
            const estSavings = 10 + Math.floor(Math.random() * 8); // 10-18%
            const avgNightly = await Listing.aggregate([
                { $group: { _id: null, avg: { $avg: "$price" } } }
            ]);
            const avg = Math.round((avgNightly?.[0]?.avg || 3000) * (estSavings / 100));
            responses.push({
                type: "flexibility",
                message: `Using flexible dates (midweek) can save ~${estSavings}% (≈ ₹${avg}/night) versus popular weekend dates.`,
                impact: "positive",
                savingsPercent: estSavings,
                savingsPerNight: avg
            });
        }

        return res.json({ success: true, suggestions: responses });
    } catch (e) {
        return res.status(500).json({ success: false, error: e.message });
    }
}));

// Host What-If Scenario Explorer API
app.post("/api/host/whatif", isLoggedIn, wrapAsync(async (req, res) => {
    try {
        const { listingId, scenarios } = req.body || {};
        
        if (!listingId) {
            return res.status(400).json({ success: false, error: "listingId is required" });
        }
        
        // Verify listing ownership
        const listing = await Listing.findById(listingId);
        if (!listing) {
            return res.status(404).json({ success: false, error: "Listing not found" });
        }
        
        if (!listing.owner.equals(req.user._id)) {
            return res.status(403).json({ success: false, error: "Not authorized" });
        }
        
        // Analyze scenarios
        const analysis = await hostScenarioPredictor.analyzeScenario(listingId, scenarios);
        
        if (!analysis) {
            return res.status(500).json({ success: false, error: "Could not analyze scenario" });
        }
        
        return res.json({ success: true, data: analysis });
    } catch (e) {
        return res.status(500).json({ success: false, error: e.message });
    }
}));



//Delete review route

app.delete("/listings/:id/reviews/:reviewId", isLoggedIn,isReviewAuthor,wrapAsync(async(req,res)=>{
  let {id, reviewId}= req.params;

  await Listing.findByIdAndUpdate(id, {$pull: {reviews: reviewId}});

  await Review.findByIdAndDelete(reviewId);
  req.flash("success","Review Deleted!");
  res.redirect(`/listings/${id}`);
}))

// Coupon routes
app.get("/coupons", isAdmin, wrapAsync(async (req, res) => {
    const coupons = await Coupon.find({}).sort({ createdAt: -1 });
    res.render("coupons/index", { coupons, moment });
}));

app.post("/coupons", isAdmin, wrapAsync(async (req, res) => {
    const { code, discountType, amount, expiresAt, maxUses } = req.body;
    try {
        await Coupon.create({ code, discountType, amount, expiresAt, maxUses, createdBy: req.user?._id });
        req.flash("success", "Coupon created successfully");
    } catch (e) {
        req.flash("error", e.message || "Failed to create coupon");
    }
    res.redirect("/coupons");
}));

app.post('/coupons/:id/toggle', isAdmin, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const coupon = await Coupon.findById(id);
    if (!coupon) {
        req.flash('error', 'Coupon not found');
        return res.redirect('/coupons');
    }
    coupon.isActive = !coupon.isActive;
    await coupon.save();
    req.flash('success', `Coupon ${coupon.code} ${coupon.isActive ? 'enabled' : 'disabled'}`);
    res.redirect('/coupons');
}));

app.delete('/coupons/:id', isAdmin, wrapAsync(async (req, res) => {
    const { id } = req.params;
    await Coupon.findByIdAndDelete(id);
    req.flash('success', 'Coupon deleted');
    res.redirect('/coupons');
}));

// Analytics routes
app.get("/analytics/dashboard", isLoggedIn, wrapAsync(async (req, res) => {
    let overview, perListing;
    
    if (req.user.role === 'admin') {
        // Admin sees all listings
        overview = await getDashboardOverview();
        perListing = await Analytics.find({}).populate("listing").sort({ updatedAt: -1 }).limit(20);
    } else {
        // Regular users see only their own listings
        const userListings = await Listing.find({ owner: req.user._id });
        const listingIds = userListings.map(l => l._id);
        
        overview = await getDashboardOverviewForUser(req.user._id);
        perListing = await Analytics.find({ listing: { $in: listingIds } }).populate("listing").sort({ updatedAt: -1 }).limit(20);
    }
    
    res.render("analytics/dashboard", { overview, perListing, isAdmin: req.user.role === 'admin' });
}));

// Admin landing page
app.get('/admin', isAdmin, wrapAsync(async (req, res) => {
    const overview = await getDashboardOverview();
    const recentCoupons = await Coupon.find({}).sort({ createdAt: -1 }).limit(5);
    const topListings = await Analytics.find({}).populate('listing').sort({ viewsCount: -1 }).limit(5);
    res.render('admin/dashboard', { overview, recentCoupons, topListings });
}));

// Admin utility: backfill ML fields on listings
app.post('/admin/ml/backfill-listing-fields', isAdmin, wrapAsync(async (req, res) => {
    const filter = {
        $or: [
            { clickThroughRate: { $exists: false } },
            { conversionRate: { $exists: false } },
            { smartPricingEnabled: { $exists: false } },
        ]
    };
    const update = {
        $set: {
            clickThroughRate: 0,
            conversionRate: 0,
            smartPricingEnabled: false,
        }
    };
    const result = await Listing.updateMany(filter, update);
    return res.json({ matched: result.matchedCount ?? result.n, modified: result.modifiedCount ?? result.nModified });
}));

// ML Analytics Dashboard
app.get('/admin/ml/dashboard', isAdmin, wrapAsync(async (req, res) => {
    res.render('admin/ml-dashboard');
}));

// ML Analytics API
app.get('/admin/ml/analytics', isAdmin, wrapAsync(async (req, res) => {
    try {
        const interactions = await SearchInteraction.find({});
        const totalInteractions = interactions.length;
        const clicks = interactions.filter(i => i.action === 'click').length;
        const bookings = interactions.filter(i => i.action === 'book').length;
        const avgReward = interactions.length > 0 ? interactions.reduce((sum, i) => sum + (i.reward || 0), 0) / interactions.length : 0;
        
        // Calculate realistic CTR metrics
        const currentCTR = totalInteractions > 0 ? (clicks / totalInteractions) : 0.02;
        const baselineCTR = 0.015; // Realistic baseline
        const ctrDiff = ((currentCTR - baselineCTR) / baselineCTR) * 100;
        
        // Mock data for demo (replace with real calculations)
        const mockTopListings = [
            { id: '1', title: 'Luxury Apartment', expectedReward: 0.85, confidence: 'high', factors: [{ message: 'High engagement rate' }] },
            { id: '2', title: 'Beach Villa', expectedReward: 0.78, confidence: 'high', factors: [{ message: 'Popular with users like you' }] },
            { id: '3', title: 'Mountain Cabin', expectedReward: 0.72, confidence: 'medium', factors: [{ message: 'Good reviews' }] },
        ];
        
        return res.json({
            success: true,
            ctrDiff: Math.round(ctrDiff * 10) / 10, // Round to 1 decimal
            explorationRate: 0.23,
            sentimentTrend: 0.08,
            revenueLift: 45000,
            topListings: mockTopListings,
            ctrData: {
                current: currentCTR,
                baseline: baselineCTR,
                improvement: ctrDiff
            },
            stats: {
                totalInteractions,
                clicks,
                bookings,
                avgReward
            }
        });
    } catch(e) {
        return res.status(500).json({ success: false, error: e.message });
    }
}));

// Proxy Bandit CTR stats to avoid browser CORS issues
app.get('/admin/ml/bandit-ctr', isAdmin, wrapAsync(async (req, res) => {
    try {
        const BANDIT_URL = process.env.BANDIT_SERVICE_URL || 'http://127.0.0.1:8001';
        const resp = await axios.get(`${BANDIT_URL}/stats/ctr`, { timeout: 3000 });
        return res.json(resp.data || {});
    } catch (e) {
        return res.status(200).json({ success: false, error: 'bandit_unavailable' });
    }
}));

app.get("/listings/:id/analytics", isLoggedIn, canViewAnalytics, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    const stats = await Analytics.findOne({ listing: id });
    res.render("listings/analytics", { listing, stats });
}));

// app.get("/listing",async(req,res)=>{
//     let sampleListing= new Listing({
//         title: "My Home",
//         description: "Sweet",
//         price: 7777777,
//         location: "Panchkoshi",
//         country:"India",

//     });
//     await sampleListing.save();
//     console.log("Saved successfully..");
//     res.send("Success");
// });


app.all("*",(req,res,next)=>{
    next( new ExpressError(404,"Page not found"));
})

app.use((err,req,res,next)=>{
    let{statusCode=500,message="Something went wrong"}= err;
res.status(statusCode).render("error.ejs",{err});
    // res.status(statusCode).send(message);
})




const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, ()=>{
console.log(`Server is listening to port ${PORT}`);
});

server.on("error", (err)=>{
    if (err && err.code === "EADDRINUSE"){
        console.error(`Port ${PORT} is already in use. Set PORT env var to a free port or stop the existing process.`);
        process.exit(1);
    }
    throw err;
});

// Manual trigger for performance check (for testing)
app.post("/admin/trigger-performance-check", isAdmin, wrapAsync(async (req, res) => {
    try {
        await hostNotificationService.triggerPerformanceCheck();
        req.flash("success", "Performance check triggered successfully!");
        res.redirect("/admin");
    } catch (error) {
        console.error('Error triggering performance check:', error);
        req.flash("error", "Error triggering performance check.");
        res.redirect("/admin");
    }
}));

// Start the host notification service
hostNotificationService.schedulePerformanceCheck();
console.log('Host notification service started - checking for low performing listings every 6 hours');














// API routers
app.use("/api/search", searchRouter);

// create List

       //let{title, description, image, price, country, location}= req.body;
      
    //   if(!req.body.listing){
    //     throw new ExpressError(400,"Send data for listing");
    //   }
    //   if(!newListing.title){
    //     throw new ExpressError(400,"Title is missing");
    //   }
    //   if(!newListing.description){
    //     throw new ExpressError(400,"Description is missing");
    //   }
    //   if(!newListing.price){
    //     throw new ExpressError(400,"Price is missing");
    //   }