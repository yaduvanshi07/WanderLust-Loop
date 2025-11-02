# QuickStay - Vacation Rental Platform with ML Features

## 📋 Project Overview

QuickStay is a full-stack vacation rental booking platform built with Node.js, Express, MongoDB, and integrated ML services. The platform features intelligent listing recommendations, sentiment analysis, performance tracking, and an analytics dashboard.

## 🚀 Key Features

### Core Features
- **User Authentication**: Secure login/signup system with Passport.js (local strategy)
- **Listing Management**: Create, read, update, and delete property listings
- **Booking System**: Complete booking workflow with date validation and conflict checking
- **Review & Rating System**: User reviews with sentiment analysis
- **Coupon/Discount System**: Admin-controlled coupon management
- **Image Upload**: Cloudinary integration for listing images
- **Search Functionality**: Real-time search across listings
- **Travel Buddy Finder**: AI-powered social compatibility matching for travelers

### Advanced Features

#### 1. **Machine Learning Integration**
- **Multi-Armed Bandit (Thompson Sampling)**: Personalized search ranking
- **NLP Sentiment Analysis**: Automated review sentiment detection
- **Recommendation Engine**: Intelligent listing suggestions based on user behavior
- **What-If Explorer**: Counterfactual analysis for booking decisions

#### 2. **Analytics & Performance Tracking**
- **Listing Performance Tracker**: CTR, conversion rates, engagement metrics
- **Analytics Dashboard**: Comprehensive data visualization
- **Host Notifications**: Automated alerts for low-performing listings
- **Revenue Tracking**: Detailed financial analytics
- **Host What-If Scenario Explorer**: Test hypothetical changes (price, discounts, policies) and see predicted impacts
  - Price elasticity predictions
  - Discount effectiveness analysis
  - Policy impact evaluation
  - Market position analysis
  - Risk level assessment

#### 3. **Travel Buddy Finder (AI-Powered Social Compatibility Matching)**
- **AI-Based Matching**: ML algorithms match users based on:
  - Booking history analysis
  - Travel interests compatibility
  - Personality trait matching
  - Destination preferences
  - Travel style alignment
- **Find Matches**: Discover compatible travel partners with compatibility scores
- **Listings**: Create/browse travel partner posts with destination, dates, bio, and preferences
- **Communities**: Join interest-based micro-communities (foodies, adventure lovers, nomads, etc.)
- **Requests System**: Send/receive connection requests with admin moderation
- **Inbox**: Real-time chat system (opens only after mutual acceptance)
- **Ice Breakers**: AI-suggested conversation starters based on shared interests
- **Modern UI**: Highly interactive interface with glassmorphism design, animations, and gradient themes

#### 4. **Admin Features**
- **Admin Dashboard**: Platform-wide overview
- **ML Performance Dashboard**: Track ML algorithm effectiveness
- **Coupon Management**: Create, enable, disable, and delete coupons
- **User Management**: Role-based access control
- **Analytics Dashboard**: Comprehensive analytics for all users

##  Architecture

### Tech Stack

**Backend:**
- Node.js & Express.js
- MongoDB with Mongoose ODM
- Passport.js for authentication
- Cloudinary for image storage
- Axios for HTTP requests

**Frontend:**
- EJS templating engine
- Bootstrap CSS framework
- Custom JavaScript for interactivity
- Chart.js for analytics visualization

**ML Services:**
- FastAPI (Python) for ML services
- Thompson Sampling algorithm
- Rule-based sentiment analysis
- Contextual bandit for ranking

### File Structure

```
QuickStay/
├── app.js                          # Main application entry point
├── schema.js                       # Joi validation schemas
├── cloudConfig.js                  # Cloudinary configuration
├── package.json                    # Node dependencies
│
├── models/                         # Database models
│   ├── listing.js                  # Property listings with ML fields
│   ├── user.js                     # User authentication (with travelBuddyProfile)
│   ├── booking.js                  # Booking management
│   ├── review.js                   # Reviews with sentiment
│   ├── coupon.js                   # Coupon system
│   ├── analytics.js                # Analytics tracking
│   ├── SearchInteraction.js        # ML interaction data
│   ├── preference.js               # Travel preferences
│   ├── match.js                    # AI compatibility matches
│   ├── buddyRequest.js             # Connection requests
│   ├── buddyMessage.js             # Chat messages
│   ├── buddyListing.js             # Travel buddy listings
│   └── community.js                # Interest-based communities
│
├── routes/                         # API routes
│   ├── search.js                   # ML search endpoints
│   └── buddy.js                    # Travel Buddy Finder routes
│
├── controllers/                    # Business logic (currently inline)
│   └── listing.js                  # Listing operations
│
├── middleware.js                   # Auth & validation middleware
│
├── utils/                          # Helper utilities
│   ├── recommendationEngine.js    # Similar listing recommendations
│   ├── analyticsHelper.js          # Analytics calculations
│   ├── listingPerformanceTracker.js # Performance scoring
│   ├── hostNotificationService.js  # Host alerts
│   ├── hostScenarioPredictor.js   # What-If scenario predictions
│   └── buddyMatchingEngine.js      # AI travel buddy matching algorithm
│
├── views/                          # EJS templates
│   ├── layouts/                    # Layout templates
│   ├── listings/                   # Listing pages
│   ├── bookings/                   # Booking pages
│   ├── users/                      # Auth pages
│   ├── admin/                      # Admin dashboards
│   ├── analytics/                  # Analytics views
│   ├── coupons/                    # Coupon management
│   └── buddy/                      # Travel Buddy Finder pages
│       ├── matches.ejs             # Find matches page
│       ├── match-detail.ejs        # Match details
│       ├── listings.ejs            # Browse listings
│       ├── listing-detail.ejs      # Listing details
│       ├── communities.ejs         # Communities page
│       ├── requests.ejs            # Connection requests
│       ├── inbox.ejs               # Messages inbox
│       └── chat.ejs                # Chat interface
│
├── public/                         # Static assets
│   ├── css/                        # Stylesheets
│   └── js/                         # Client-side scripts
│
└── ml-services/                    # Python ML services
    ├── bandit_service/
    │   ├── app.py                  # Thompson Sampling service
    │   └── requirements.txt
    └── nlp_service/
        ├── app.py                  # Sentiment analysis service
        └── requirements.txt
```

## 🔧 Setup Instructions

### Prerequisites
- Node.js 20.9.0 or higher
- Python 3.8+
- MongoDB Atlas account
- Cloudinary account

### 1. Install Node.js Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file in the root directory:
```env
ATLASDB_URL=your_mongodb_atlas_connection_string
CLOUD_NAME=your_cloudinary_cloud_name
CLOUD_API_KEY=your_cloudinary_api_key
CLOUD_API_SECRET=your_cloudinary_api_secret
BANDIT_SERVICE_URL=http://127.0.0.1:8001
NLP_SERVICE_URL=http://127.0.0.1:8002
PORT=8080
```

### 3. Start ML Services

#### Bandit Service (Port 8001):
```powershell
cd ml-services\bandit_service
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

#### NLP Service (Port 8002):
```powershell
cd ml-services\nlp_service
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

### 4. Start Node Application
```bash
npm run dev
```

The application will run on `http://localhost:8080`

## 📖 API Endpoints

### Authentication
- `GET /signup` - Signup page
- `POST /signup` - Create new user
- `GET /login` - Login page
- `POST /login` - Authenticate user
- `GET /logout` - Logout user

### Listings
- `GET /listings` - View all listings (with search)
- `GET /listings/new` - Create listing form
- `POST /listings` - Create new listing
- `GET /listings/:id` - View listing details
- `GET /listings/:id/edit` - Edit listing form
- `PUT /listings/:id` - Update listing
- `DELETE /listings/:id` - Delete listing

### Bookings
- `GET /bookings` - User bookings
- `POST /listings/:id` - Create booking
- `PATCH /bookings/:id/cancel` - Cancel booking

### Reviews
- `POST /listings/:id/reviews` - Create review
- `DELETE /listings/:id/reviews/:reviewId` - Delete review

### Analytics
- `GET /analytics/dashboard` - Analytics dashboard (Available in user/admin dropdown)
- `GET /listings/:id/analytics` - Listing analytics
- `GET /host/performance` - Host performance dashboard

### Travel Buddy Finder
- `GET /buddy/matches` - Find AI-matched travel buddies
- `GET /buddy/matches/:id` - View match details
- `GET /buddy/listings` - Browse travel buddy listings
- `GET /buddy/listings/new` - Create new listing
- `GET /buddy/listings/:id` - View listing details
- `POST /buddy/listings/:id/request` - Send connection request
- `GET /buddy/communities` - Browse/join communities
- `POST /buddy/communities/:id/join` - Join community
- `POST /buddy/communities/:id/leave` - Leave community
- `GET /buddy/requests` - View sent/received requests (Admin sees all)
- `POST /buddy/requests/:id/accept` - Accept request
- `POST /buddy/requests/:id/reject` - Reject request
- `DELETE /buddy/requests/:id` - Delete request (Admin only)
- `GET /buddy/inbox` - Messages inbox
- `GET /buddy/inbox/:id` - Chat conversation
- `POST /buddy/inbox/:id/message` - Send message

### Admin
- `GET /admin` - Admin dashboard
- `GET /admin/ml/dashboard` - ML performance dashboard
- `GET /admin/ml/analytics` - ML analytics API
- `POST /admin/ml/backfill-listing-fields` - Initialize ML fields
- `GET /coupons` - Coupon management
- `POST /coupons` - Create coupon
- `POST /coupons/:id/toggle` - Toggle coupon status
- `DELETE /coupons/:id` - Delete coupon

### ML APIs
- `POST /api/search/rank` - Get personalized ranking
- `POST /api/search/feedback` - Log user interactions
- `POST /api/risk/score` - Get cancellation risk score
- `POST /api/search/whatif` - Guest counterfactual analysis
- `POST /api/host/whatif` - Host scenario analysis (price, discount, policy predictions)

##  How It Works

### 1. Listing Performance Tracking

The `listingPerformanceTracker.js` module calculates performance scores based on:
- **Click-Through Rate (CTR)**: Views vs. clicks
- **Conversion Rate**: Clicks vs. bookings
- **Overall Engagement**: Total user interactions
- **Average Rating**: Review feedback
- **Total Revenue**: Financial performance

Scores are calculated using weighted metrics and cached for performance.

### 2. Machine Learning Integration

#### Multi-Armed Bandit (Thompson Sampling)
- Uses Beta distribution to model listing success rates
- Balances exploration vs. exploitation
- Provides explanations for recommendations
- Tracks CTR history for analytics

#### NLP Sentiment Analysis
- Rule-based sentiment detection
- Categorizes reviews as positive, neutral, or negative
- Helps surface quality issues

#### Recommendation Engine
- Profile-based recommendations
- Similar listing suggestions
- Price-range matching
- Location preferences

### 3. Booking Flow

1. User searches/browses listings
2. Selects listing and checks availability
3. Enters guest details and dates
4. Applies coupon (optional)
5. System validates dates and availability
6. Creates booking with pricing breakdown
7. Tracks analytics and records interactions

### 4. Host Performance Monitoring

- Scheduled checks every 6 hours
- Identifies listings with score < 40
- Generates recommendations for improvement
- Sends notifications to hosts

### 5. Host What-If Scenario Explorer

A sophisticated decision-support tool that enables hosts to test hypothetical changes:

**Price Impact Analysis**
- Predicts how price changes affect bookings and revenue
- Uses price elasticity theory (-1.5% demand per 1% price change)
- Provides market position analysis (above/at/below market)
- Shows recommendations based on elasticity

**Discount Impact Analysis**
- Estimates booking increases from offering discounts
- Calculates total revenue impact
- Uses formula: 1.2x booking boost per 10% discount
- Shows percentage increase predictions

**Policy Impact Analysis**
- Predicts how cancellation policies affect bookings
- Estimates cancellation rates
- Evaluates booking boost vs. cancellation risk
- Provides risk level assessment

**Features**:
- Visual comparisons (current vs. predicted metrics)
- Color-coded indicators (↗️ positive, ↘️ negative, → neutral)
- Risk level badges (low/medium/high)
- Market position display
- Actionable recommendations

**Usage**: Navigate to `/host/performance` → Click "What-If Explorer" on any listing → Enter scenarios → Review predictions

## 📊 Data Models

### Listing Model
```javascript
{
  title, description, price, location, country,
  image: { url, filename },
  owner: ObjectId,
  reviews: [ObjectId],
  clickThroughRate, conversionRate,
  rankingScore, performanceStatus,
  smartPricingEnabled
}
```

### Booking Model
```javascript
{
  listing, guest, checkin, checkout,
  guests: { adults, children, infants, pets },
  pricing: { basePrice, cleaningFee, serviceFee, taxes, discount, total },
  status, bookingType, paymentStatus, coupon
}
```

### Analytics Model
```javascript
{
  listing, viewsCount, bookingsCount,
  revenue, averageRating, reviewsCount
}
```

## 🧪 Testing the Application

### Test Authentication
1. Sign up with a new account
2. Login with credentials
3. Logout and verify session cleared

### Test ML Features
1. Browse listings to see personalized ranking
2. Click on listings to track interactions
3. Post a review to test sentiment analysis
4. Check admin ML dashboard for CTR metrics

### Test Guest What-If Explorer
1. Visit `/listings`
2. Click "What If Explorer" button
3. Adjust budget, stay duration, dates
4. View scenario suggestions

### Test Host What-If Scenario Explorer
1. Navigate to `/host/performance` dashboard
2. Click "What-If Explorer" button next to any listing
3. Test scenarios:
   - **Price Scenario**: Enter new price (e.g., change from ₹2000 to ₹1800)
   - **Discount Scenario**: Enter discount percentage (e.g., 10%)
   - **Policy Scenario**: Select cancellation policy (flexible/moderate/strict)
4. Click "Analyze Scenario"
5. Review predictions showing current vs. predicted metrics:
   - Views, Bookings, Revenue changes
   - Market position analysis
   - Risk level assessment
   - Actionable recommendations

## 🔐 Security Features

- Password hashing with Passport-Local-Mongoose
- Session-based authentication
- CSRF protection via method-override
- Admin-only routes with role verification
- Input validation with Joi
- MongoDB injection prevention

## 🚧 Limitations & Future Enhancements

### Current Limitations
- Sentiment analysis is rule-based (not transformer-based)
- ML services run locally
- No email notifications
- No payment integration

### Future Enhancements
- Real-time WebSocket updates
- A/B testing framework
- Scheduled model retraining
- Computer vision for image quality
- Demand forecasting
- Fraud detection
- Email/SMS notifications
- Payment gateway integration

## 🎯 Project Highlights

### What Makes This Project Special

1. **Intelligent Search Ranking**: ML-driven personalized listing recommendations
2. **Sentiment Analysis**: Automated review sentiment detection
3. **Performance Analytics**: Real-time listing performance tracking with automated host notifications
4. **What-If Scenarios**: Both guests and hosts can explore counterfactual decisions
5. **Host Decision Support**: Price elasticity and policy impact predictions
6. **Explainable AI**: Recommendations come with explanations
7. **Automated Notifications**: Hosts receive alerts for underperforming listings
8. **Travel Buddy Finder**: AI-powered social compatibility matching system connecting like-minded travelers
9. **Modern Interactive UI**: Glassmorphism design with smooth animations and gradient themes
10. **Comprehensive Analytics**: Analytics dashboard accessible to both users and admins

### Key Technical Achievements

- ✅ Full-stack web application with Express.js
- ✅ MongoDB database with complex relationships
- ✅ Machine learning integration (Python FastAPI services)
- ✅ Real-time analytics and performance tracking
- ✅ Predictive analytics for decision support
- ✅ Role-based authentication and authorization
- ✅ Image upload with Cloudinary
- ✅ RESTful API design
- ✅ Responsive UI with Bootstrap
- ✅ Session-based authentication with Passport.js

### Business Value

**For Users**:
- Personalized booking recommendations
- Sentiment-based review filtering
- Counterfactual analysis for better decisions
- Find compatible travel buddies through AI matching
- Join interest-based communities
- Connect with travelers through secure messaging
- Analytics dashboard for performance insights

**For Hosts**:
- Performance insights and tracking
- Automated recommendations for improvement
- What-If scenarios for strategic planning
- Market position analysis

**For Admins**:
- Platform-wide analytics
- ML performance monitoring
- Coupon management
- User management
- Full visibility of all travel buddy requests and connections
- Community management
- Analytics dashboard with comprehensive insights

## 📝 License

ISC

## 👨‍💻 Author

Student Project - Academic Development

---

**Repository**: [https://github.com/yaduvanshi07/Quickstay-Advance-ML-AI-.git](https://github.com/yaduvanshi07/Quickstay-Advance-ML-AI-.git)

**Note**: This project demonstrates full-stack development with machine learning integration, real-time analytics, and intelligent decision-support systems. All features are production-ready and fully documented.

