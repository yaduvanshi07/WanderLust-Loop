# 🏠 StaySense - Where Intelligence Finds Home

<div align="center">

![StaySense Logo](https://img.shields.io/badge/StaySense-Intelligence%20Finds%20Home-blue?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-20.9+-green?style=for-the-badge&logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-brightgreen?style=for-the-badge&logo=mongodb)
![ML](https://img.shields.io/badge/ML-Powered-orange?style=for-the-badge)

**An intelligent vacation rental platform powered by Machine Learning, AI-driven recommendations, and real-time analytics**

[Features](#-key-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Tech Stack](#-tech-stack)

</div>

---

## 🌟 What is StaySense?

StaySense is not just another booking platform—it's an **intelligent ecosystem** that combines cutting-edge machine learning with real-time analytics to revolutionize how people find and book vacation rentals. Whether you're a traveler seeking the perfect stay or a host optimizing your property, StaySense uses AI to make smarter decisions.

### ✨ Why StaySense?

- 🤖 **AI-Powered Matching**: Find your perfect travel buddy using ML compatibility algorithms
- 📊 **Real-Time Analytics**: Track performance metrics and get actionable insights
- 🎯 **Smart Recommendations**: Personalized listings based on your behavior and preferences
- 💡 **What-If Scenarios**: Test decisions before making them with predictive analytics
- 🗺️ **Live Location Tracking**: Connect with nearby travelers in real-time
- 🎨 **Beautiful UI**: Modern glassmorphism design with smooth animations

---

## 🚀 Key Features

### 🎯 Core Platform Features

| Feature | Description |
|---------|-------------|
| 🔐 **Authentication** | Secure login/signup with Passport.js |
| 🏘️ **Listing Management** | Create, update, and manage property listings |
| 📅 **Booking System** | Complete booking workflow with date validation |
| ⭐ **Reviews & Ratings** | User reviews with AI sentiment analysis |
| 🎫 **Coupon System** | Admin-controlled discount management |
| 📸 **Image Upload** | Cloudinary integration for seamless media handling |
| 🔍 **Smart Search** | Real-time search with ML-powered ranking |

### 🤖 Machine Learning & AI Features

#### 1. **Intelligent Search Ranking**
- **Multi-Armed Bandit (Thompson Sampling)** for personalized recommendations
- Balances exploration vs. exploitation
- Provides explainable AI insights

#### 2. **Sentiment Analysis**
- Automated review sentiment detection
- Categorizes reviews as positive, neutral, or negative
- Helps surface quality issues automatically

#### 3. **Recommendation Engine**
- Profile-based recommendations
- Similar listing suggestions
- Price-range and location matching

#### 4. **What-If Explorer**
- **For Guests**: Test different budgets, dates, and preferences
- **For Hosts**: Predict impact of price changes, discounts, and policies
- Visual comparisons with actionable recommendations

### 📊 Analytics & Performance Tracking

- **Real-Time Dashboards**: Comprehensive analytics for users and hosts
- **Performance Scoring**: CTR, conversion rates, engagement metrics
- **Automated Alerts**: Host notifications for underperforming listings
- **Revenue Tracking**: Detailed financial analytics
- **Market Position Analysis**: Compare your pricing with market trends

### 👥 Travel Buddy Finder (AI-Powered Social Matching)

Find your perfect travel companion using advanced ML algorithms:

- **🎯 Compatibility Matching**: 
  - Booking history analysis
  - Travel interests compatibility
  - Personality trait matching
  - Destination preferences
  - Travel style alignment
  - Geographic proximity (25% weight)
  - Route overlap scoring for multi-city trips

- **🗺️ Real-Time Location Tracking**:
  - Browser-based geolocation
  - Privacy controls (exact, city, country, hidden)
  - Travel status updates
  - Interactive map with Leaflet.js
  - WebSocket real-time updates

- **💬 Social Features**:
  - Find matches with compatibility scores
  - Create/browse travel partner listings
  - Join interest-based communities
  - Secure messaging system
  - AI-suggested ice breakers

### 👨‍💼 Admin Features

- Platform-wide analytics dashboard
- ML performance monitoring
- Coupon management system
- User management with role-based access
- Global location map view
- Community management

---

## 🛠️ Tech Stack

### Backend
- **Node.js** & **Express.js** - Server framework
- **MongoDB** with **Mongoose** - Database (GeoJSON support)
- **Passport.js** - Authentication
- **Cloudinary** - Image storage
- **Socket.IO** - Real-time WebSocket communication

### Frontend
- **EJS** - Templating engine
- **Bootstrap 5** - CSS framework
- **Chart.js** - Analytics visualization
- **Leaflet.js** - Interactive maps
- **Font Awesome** - Icons

### ML Services
- **FastAPI (Python)** - ML microservices
- **Thompson Sampling** - Multi-armed bandit algorithm
- **Rule-based NLP** - Sentiment analysis

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20.9.0 or higher
- Python 3.8+
- MongoDB Atlas account
- Cloudinary account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yaduvanshi07/StaySense-Where-Intelligence-Finds-Home.git
   cd StaySense-Where-Intelligence-Finds-Home
   ```

2. **Install Node.js dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
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

4. **Start ML Services**

   **Bandit Service (Port 8001):**
   ```powershell
   cd ml-services\bandit_service
   py -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   python app.py
   ```

   **NLP Service (Port 8002):**
   ```powershell
   cd ml-services\nlp_service
   py -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   python app.py
   ```

5. **Start the application**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to `http://localhost:8080` 🎉

---

## 📁 Project Structure

```
StaySense/
├── app.js                          # Main application entry point
├── schema.js                       # Joi validation schemas
├── cloudConfig.js                  # Cloudinary configuration
├── package.json                    # Node dependencies
│
├── models/                         # Database models
│   ├── listing.js                  # Property listings with ML fields
│   ├── user.js                     # User authentication & profiles
│   ├── booking.js                  # Booking management
│   ├── review.js                   # Reviews with sentiment
│   ├── coupon.js                   # Coupon system
│   ├── analytics.js                # Analytics tracking
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
├── utils/                          # Helper utilities
│   ├── recommendationEngine.js    # Similar listing recommendations
│   ├── analyticsHelper.js          # Analytics calculations
│   ├── listingPerformanceTracker.js # Performance scoring
│   ├── hostNotificationService.js  # Host alerts
│   ├── hostScenarioPredictor.js   # What-If scenario predictions
│   └── buddyMatchingEngine.js      # AI travel buddy matching
│
├── views/                          # EJS templates
│   ├── layouts/                    # Layout templates
│   ├── listings/                   # Listing pages
│   ├── bookings/                   # Booking pages
│   ├── users/                      # Auth pages
│   ├── admin/                      # Admin dashboards
│   ├── analytics/                  # Analytics views
│   └── buddy/                      # Travel Buddy Finder pages
│
├── public/                         # Static assets
│   ├── css/                        # Stylesheets
│   └── js/                         # Client-side scripts
│
└── ml-services/                    # Python ML services
    ├── bandit_service/             # Thompson Sampling service
    └── nlp_service/                # Sentiment analysis service
```

---

## 📖 API Documentation

### 🔐 Authentication
- `GET /signup` - Signup page
- `POST /signup` - Create new user
- `GET /login` - Login page
- `POST /login` - Authenticate user
- `GET /logout` - Logout user

### 🏘️ Listings
- `GET /listings` - View all listings (with ML-powered search)
- `GET /listings/new` - Create listing form
- `POST /listings` - Create new listing
- `GET /listings/:id` - View listing details
- `GET /listings/:id/edit` - Edit listing form
- `PUT /listings/:id` - Update listing
- `DELETE /listings/:id` - Delete listing

### 📅 Bookings
- `GET /bookings` - User bookings
- `POST /listings/:id` - Create booking
- `PATCH /bookings/:id/cancel` - Cancel booking

### 👥 Travel Buddy Finder
- `GET /buddy/matches` - Find AI-matched travel buddies
- `GET /buddy/profile` - View/edit travel buddy profile
- `GET /buddy/listings` - Browse travel buddy listings
- `GET /buddy/map` - Interactive map showing nearby travelers
- `GET /buddy/inbox` - Messages inbox
- `POST /buddy/location/update` - Update user location (real-time)

### 📊 Analytics
- `GET /analytics/dashboard` - Analytics dashboard
- `GET /host/performance` - Host performance dashboard
- `GET /host/performance/:id/whatif` - What-If scenario explorer

### 👨‍💼 Admin
- `GET /admin` - Admin dashboard
- `GET /admin/ml/dashboard` - ML performance dashboard
- `GET /admin/map` - Admin map view
- `GET /coupons` - Coupon management

### 🤖 ML APIs
- `POST /api/search/rank` - Get personalized ranking
- `POST /api/search/feedback` - Log user interactions
- `POST /api/search/whatif` - Guest counterfactual analysis
- `POST /api/host/whatif` - Host scenario analysis

---

## 🎯 How It Works

### 1. Intelligent Search & Ranking

StaySense uses **Thompson Sampling** (Multi-Armed Bandit) to personalize search results:

- Learns from user interactions (clicks, bookings)
- Balances exploration (trying new listings) vs. exploitation (showing popular ones)
- Provides explanations for recommendations
- Continuously improves based on feedback

### 2. Sentiment Analysis

Automatically analyzes review sentiment:

- Categorizes reviews as positive, neutral, or negative
- Helps identify quality issues
- Improves user trust and decision-making

### 3. Travel Buddy Matching

Advanced ML algorithm matches users based on:

- **Interests Compatibility** (30% weight)
- **Travel Style Alignment** (25% weight)
- **Geographic Proximity** (25% weight)
- **Personality Traits** (20% weight)

Compatibility scores range from 0-100%, with detailed breakdowns.

### 4. What-If Scenarios

**For Hosts:**
- Test price changes and see predicted impact
- Analyze discount effectiveness
- Evaluate cancellation policy changes
- Get market position insights

**For Guests:**
- Explore different budgets and dates
- See alternative recommendations
- Compare options side-by-side

### 5. Real-Time Location Tracking

- Users can share their location (with privacy controls)
- Find nearby travelers on interactive map
- Real-time updates via WebSocket
- Distance-based compatibility boosts

---

## 🧪 Testing Guide

### Test Authentication
1. Sign up with a new account
2. Login with credentials
3. Verify session management

### Test ML Features
1. Browse listings to see personalized ranking
2. Click on listings to track interactions
3. Post a review to test sentiment analysis
4. Check admin ML dashboard for CTR metrics

### Test Travel Buddy Finder
1. Complete your travel buddy profile (`/buddy/profile`)
2. Find matches (`/buddy/matches`)
3. View match details and compatibility scores
4. Send connection requests
5. Use interactive map to find nearby travelers

### Test What-If Explorer

**For Hosts:**
1. Navigate to `/host/performance`
2. Click "What-If Explorer" on any listing
3. Test scenarios:
   - **Price**: Change from ₹2000 to ₹1800
   - **Discount**: Enter 10% discount
   - **Policy**: Select flexible/moderate/strict
4. Review predictions and recommendations

**For Guests:**
1. Visit `/listings`
2. Click "What If Explorer"
3. Adjust budget, stay duration, dates
4. View scenario suggestions

---

- ✅ Password hashing with Passport-Local-Mongoose
- ✅ Session-based authentication
- ✅ CSRF protection via method-override
- ✅ Role-based access control (Admin/User)
- ✅ Input validation with Joi
- ✅ MongoDB injection prevention
- ✅ Secure file uploads with Cloudinary

---

## 🎨 UI/UX Highlights

- **Modern Design**: Glassmorphism effects with gradient themes
- **Smooth Animations**: CSS transitions and keyframe animations
- **Responsive Layout**: Mobile-first design with Bootstrap
- **Interactive Maps**: Leaflet.js integration with custom markers
- **Real-Time Updates**: WebSocket for live location tracking
- **Visual Analytics**: Chart.js for data visualization

---

## 🚧 Current Limitations

- Sentiment analysis is rule-based (not transformer-based)
- ML services run locally (not cloud-deployed)
- No email/SMS notifications
- No payment gateway integration

---

## 🔮 Future Enhancements

- [ ] A/B testing framework
- [ ] Scheduled model retraining
- [ ] Computer vision for image quality
- [ ] Demand forecasting
- [ ] Fraud detection system
- [ ] Email/SMS notifications
- [ ] Payment gateway integration
- [ ] Push notifications for location-based matches
- [ ] Mobile app (React Native)

---

## 📊 Project Highlights

### What Makes StaySense Special?

1. **🤖 AI-Powered Everything**: From search to matching to recommendations
2. **📈 Real-Time Analytics**: Track everything, optimize continuously
3. **💡 Decision Support**: What-If scenarios for better choices
4. **👥 Social Features**: Find travel buddies with ML compatibility
5. **🗺️ Location Intelligence**: Real-time geolocation with privacy controls
6. **🎨 Beautiful UI**: Modern, responsive, and intuitive design
7. **⚡ Performance**: Optimized queries and caching
8. **🔐 Security**: Enterprise-grade authentication and validation

### Technical Achievements

- ✅ Full-stack web application with Express.js
- ✅ MongoDB with geospatial queries (2dsphere indexes)
- ✅ Machine learning integration (Python FastAPI)
- ✅ Real-time analytics and performance tracking
- ✅ WebSocket real-time communication (Socket.IO)
- ✅ Interactive map visualization (Leaflet.js)
- ✅ Predictive analytics for decision support
- ✅ Role-based authentication and authorization
- ✅ Cloud-based image storage (Cloudinary)
- ✅ RESTful API design

---

## 💼 Business Value

### For Travelers 🧳
- Personalized booking recommendations
- Sentiment-based review filtering
- Counterfactual analysis for better decisions
- Find compatible travel buddies through AI
- Join interest-based communities
- Connect with travelers securely
- Analytics dashboard for insights

### For Hosts 🏠
- Performance insights and tracking
- Automated recommendations for improvement
- What-If scenarios for strategic planning
- Market position analysis
- Revenue optimization tools
- Low-performance alerts

### For Admins 👨‍💼
- Platform-wide analytics
- ML performance monitoring
- Coupon management
- User management
- Full visibility of travel buddy connections
- Community management
- Comprehensive insights dashboard

---



---

## 👨‍💻 Author

**Student Project - Academic Development**

---

## 🔗 Repository

**GitHub**: [StaySense-Where-Intelligence-Finds-Home](https://github.com/yaduvanshi07/StaySense-Where-Intelligence-Finds-Home)

---

