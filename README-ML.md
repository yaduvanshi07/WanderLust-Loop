# QuickStay - ML Features Documentation

## Overview
QuickStay now includes several machine learning features:
1. **Multi-Armed Bandit (MAB)** for personalized search ranking
2. **Review Sentiment Analysis** using NLP
3. **Explainable AI** with recommendation reasons
4. **What-If Explorer** for counterfactual insights
5. **ML Performance Dashboard** for admin analytics

## Architecture

### Services
- **Node.js App** (Port 8080): Main application with Express
- **Bandit Service** (Port 8001): FastAPI service for Thompson Sampling
- **NLP Service** (Port 8002): FastAPI service for sentiment & risk scoring

### File Structure
```
QuickStay/
├── ml-services/
│   ├── bandit_service/
│   │   ├── app.py              # Thompson Sampling with explanations
│   │   └── requirements.txt
│   └── nlp_service/
│       ├── app.py              # Sentiment analysis & risk scoring
│       └── requirements.txt
├── routes/
│   └── search.js              # API routes for ranking & feedback
├── models/
│   ├── SearchInteraction.js   # Tracks user clicks/bookings
│   ├── listing.js            # Extended with CTR & conversion fields
│   └── review.js             # Extended with sentiment labels
└── views/
    ├── admin/
    │   └── ml-dashboard.ejs   # ML performance visualization
    └── listings/
        └── index.ejs          # Personalized ranking + What-If UI
```

## Setup Instructions

### 1. Install Node Dependencies
```bash
npm install
```

### 2. Start Bandit Service
```powershell
cd ml-services\bandit_service
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

### 3. Start NLP Service
```powershell
cd ml-services\nlp_service
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

### 4. Start Node App
```powershell
$env:BANDIT_SERVICE_URL='http://127.0.0.1:8001'
$env:NLP_SERVICE_URL='http://127.0.0.1:8002'
npm run dev
```

## Features

### 1. Personalized Search Ranking
- **Endpoint**: `POST /api/search/rank`
- Users see listings reordered by predicted engagement
- Top 3 listings get "Recommended" badges with explanation tooltips
- Factors shown: engagement rate, popularity, user similarity

### 2. Review Sentiment Analysis
- Automatically analyzes review comments on submission
- Displays sentiment badges (positive/neutral/negative) on reviews
- Endpoint: `POST /listings/:id/reviews`

### 3. Explainable AI
- Top recommended listings show tooltips explaining why
- Example: "High engagement rate (85%)" + "12 interactions from users like you"
- Confidence indicators (high/medium/low)

### 4. What-If Explorer
- Users can explore scenarios:
  - Budget adjustments → "If you increase by ₹5000, 50 more properties will match"
  - Extend stay → "Extending by 3 days unlocks 15% discounts"
  - Flexible dates → "Save up to ₹500/night"
- **Usage**: Click "What If Explorer" button on listings page

### 5. ML Performance Dashboard
- Admin-only page at `/admin/ml/dashboard`
- Shows:
  - CTR comparison (MAB vs random baseline)
  - Exploration vs exploitation ratio
  - Sentiment trends
  - Top recommended listings
- Access from Admin Dashboard → "ML Performance"

### 6. Cancellation Risk Scoring
- Endpoint: `POST /api/risk/score`
- Predicts booking cancellation likelihood
- Factors: price, days until checkin, new user status, prior cancellations
- Returns risk level (low/medium/high) and score

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/search/rank` | POST | Get personalized ranking with explanations |
| `/api/search/feedback` | POST | Log user interactions (clicks, bookings) |
| `/api/search/analytics` | GET | ML performance statistics |
| `/api/risk/score` | POST | Get cancellation risk score |
| `/api/search/whatif` | POST | Get counterfactual suggestions |
| `/admin/ml/dashboard` | GET | ML dashboard page |
| `/admin/ml/analytics` | GET | ML analytics JSON data |
| `/admin/ml/backfill-listing-fields` | POST | Initialize ML fields on old listings |

## Testing

### Test Personalization
1. Visit `/listings`
2. See top listings with "Recommended" badges
3. Hover over badge to see explanation tooltip

### Test What-If
1. Visit `/listings`
2. Click "What If Explorer" button
3. Enter budget increase: ₹5000
4. Enter extend stay: 3 days
5. Check "Flexible Dates"
6. Click "Explore Scenarios"
7. See suggested benefits

### Test Admin Dashboard
1. Login as admin
2. Go to `/admin`
3. Click "ML Performance" button
4. View CTR charts, exploration ratios, sentiment trends

### Test Sentiment
1. Post a review on any listing
2. Sentiment automatically analyzed
3. Badge appears on review: positive (green), neutral (gray), negative (red)

## Troubleshooting

### ML Services Not Responding
- Check if services are running on ports 8001 (bandit) and 8002 (NLP)
- Visit http://localhost:8001/health and http://localhost:8002/health
- If not responding, check firewall settings

### No Rankings Appearing
- Fallback: If bandit service is down, listings show in original order
- Check browser console for errors

### Duplicate "Personalized" Alerts
- Already fixed with client-side de-duplication script
- If still appears, refresh the page

## Production Deployment

1. **Environment Variables** (set in your hosting platform):
   - `BANDIT_SERVICE_URL` → Your bandit service URL
   - `NLP_SERVICE_URL` → Your NLP service URL
   - `PORT` → Node app port (default 8080)

2. **Python Services**:
   - Deploy FastAPI services using Docker or cloud platforms
   - Ensure they're accessible from your Node app

3. **MongoDB**:
   - Ensure SearchInteraction collection exists
   - Run `/admin/ml/backfill-listing-fields` once to initialize fields

## Future Enhancements
- [ ] Real-time WebSocket updates for ML metrics
- [ ] A/B testing framework for comparing algorithms
- [ ] Retrain models on schedule
- [ ] Image quality scoring with computer vision
- [ ] Demand forecasting with time series analysis
- [ ] Fraud detection using anomaly detection

---

## Quick Commands

```bash
# Start all services
# Terminal 1: Bandit Service
cd ml-services/bandit_service && python app.py

# Terminal 2: NLP Service  
cd ml-services/nlp_service && python app.py

# Terminal 3: Node App
npm run dev

# Backfill old listings (one-time)
curl -X POST http://localhost:8080/admin/ml/backfill-listing-fields

# Test ML services
curl http://localhost:8001/health
curl http://localhost:8002/health
```

