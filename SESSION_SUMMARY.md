# ARMageddon Workout Tracker — Session Summary
**Date:** March 29, 2026
**Session:** Initial build + WHOOP integration + PWA

---

## What Was Built

### Core Tracker (`workout_tracker_whoop.html`)
- Full weekly workout schedule (Mon-Sun) with 7 muscle group splits
- Exercise logging with scroll-picker inputs for weight and reps
- Weight tracking with Chart.js progress charts
- Meal timing guide with macro targets
- Dark theme with WHOOP-inspired yellow accent
- Mobile-optimized, responsive layout

### WHOOP Integration
- **OAuth 2.0** flow via Vercel serverless function (`api/whoop.js`)
- **v2 API** endpoints: cycle, recovery, sleep
- **Live metrics** in header: Recovery %, Sleep hours, Strain, HRV
- **Auto-refresh tokens** when access token expires
- **Recovery-based workout adjustments:**
  - Recovery >= 70% → Full intensity
  - Recovery >= 50% → Modified (reduced volume)
  - Recovery < 50% → Light workout
  - Sleep < 6hrs → Automatic light mode
- **Alert system** for low sleep, poor recovery, high strain
- **15-minute auto-sync** with manual sync button
- **7-day trend charts** (recovery vs strain)

### PWA
- `manifest.json` for Add to Home Screen
- `sw.js` service worker with offline caching
- iOS meta tags (`apple-mobile-web-app-capable`, status bar, icon)
- Generated app icons (180, 192, 512px)

### Infrastructure
- **GitHub repo:** `sturs49/armageddon-workout-tracker`
- **Live URL:** https://armageddon-workout-tracker.vercel.app/workout_tracker_whoop.html
- **Privacy policy:** https://armageddon-workout-tracker.vercel.app/privacy.html
- **Vercel env vars:** `WHOOP_CLIENT_ID`, `WHOOP_CLIENT_SECRET`, `REDIRECT_URI`

---

## Tonight's Updates (March 29)

### 1. Completion Logic Rework
- Day cards only turn green when explicitly marked complete via "Mark Complete" button
- Closing modal saves progress but does NOT mark as complete
- Exercise progress counter shows `X/Y exercises logged`
- Previously logged data loads back into pickers when reopening a workout

### 2. Scroll Picker Inputs
- Weight selector: 0-300 lbs in 2.5 lb increments (scroll snap)
- Reps selector: 0-50 (scroll snap)
- Touch-friendly for gym use on phone
- Highlight bar shows selected value
- Debounced scroll events for performance

### 3. Optimizations Applied
- Scroll picker debouncing (50ms) to prevent excessive DOM updates
- Service worker caches core assets for offline use
- Network-first strategy with cache fallback
- Non-http schemes filtered from cache (fixes chrome-extension errors)

---

## Issues Resolved

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| DNS error on OAuth | Wrong auth URL (`accounts.whoop.com`) | Changed to `api.prod.whoop.com` |
| `invalid_state` error | Missing `state` parameter | Generate random 32-char hex state |
| 405 on OAuth callback | WHOOP sends GET, handler expected POST | Handle code exchange on GET |
| `invalid_request` redirect mismatch | `VERCEL_URL` returns deployment-specific URL | Added `REDIRECT_URI` env var |
| 401 on all data fetches | v1 API is completely shut down | Migrated to v2 (`/developer/v2/`) |
| No refresh token returned | Missing `offline` scope | Added `offline` to OAuth scopes |
| Service worker cache error | Tried to cache `chrome-extension://` | Filter non-http schemes |

---

## Optimization Suggestions for Next Session

### High Priority

1. **Macro Tracking & Food Photo AI**
   - Add camera input to capture meals
   - Send photo to Claude API (vision) to estimate macros (protein, carbs, fat, calories)
   - Daily macro log with running totals vs targets
   - Meal history with photos stored in localStorage (base64 thumbnails)
   - Weekly nutrition trends chart

2. **Daily Composite Score**
   - Combine all metrics into a single 0-100 daily score:
     - Recovery (WHOOP): 30% weight
     - Sleep quality: 20% weight
     - Nutrition adherence (macros vs targets): 20% weight
     - Workout completion: 20% weight
     - Steps/activity: 10% weight
   - Display as a large dashboard metric with color coding
   - 7-day and 30-day trend lines

3. **Token Storage Improvement**
   - Move access/refresh tokens from localStorage to httpOnly cookies
   - Add server-side token storage (Vercel KV or Upstash Redis)
   - Eliminates token exposure in URL redirects

### Medium Priority

4. **Progressive Overload Tracking**
   - Track weight/reps per exercise over time
   - Show "last session" values when logging (auto-suggest +2.5 lbs)
   - Per-exercise progress charts
   - Volume calculation (sets x reps x weight) with weekly trends

5. **Chart.js Lazy Loading**
   - Only initialize charts when their tab is first opened
   - Destroy and recreate on tab switch to save memory
   - Add loading skeleton while charts render

6. **Data Sync Improvements**
   - Use Vercel KV or Upstash Redis for server-side data persistence
   - Cross-device sync (login with WHOOP = same data everywhere)
   - Conflict resolution for offline edits

7. **Workout Timer**
   - Rest timer between sets (configurable 60-180s)
   - Total workout duration tracking
   - Audible/vibration alert when rest is over

### Low Priority

8. **Export Enhancements**
   - PDF weekly report generation
   - CSV export for spreadsheet analysis
   - Share workout summary via native share API

9. **Social/Accountability**
   - Weekly summary shareable as image (for Instagram stories etc.)
   - Streak counter for consecutive workout days

10. **Bundle Optimization**
    - Inline critical CSS, defer Chart.js load
    - Compress icons to WebP
    - Add `<link rel="preconnect">` for CDN and API domains
    - Consider moving to a build step (Vite) if complexity grows

---

## File Structure

```
Whoop:Workout App/
├── workout_tracker_whoop.html  # Main app (WHOOP integrated)
├── workout_tracker.html         # Original standalone version
├── privacy.html                 # Privacy policy for WHOOP
├── manifest.json                # PWA manifest
├── sw.js                        # Service worker
├── api/
│   └── whoop.js                 # Vercel serverless function
├── icons/
│   ├── icon-180.png             # iOS touch icon
│   ├── icon-192.png             # Android icon
│   └── icon-512.png             # Splash screen icon
└── SESSION_SUMMARY.md           # This file
```

---

## Monetization Analysis

### The Opportunity

The intersection of **wearable data + AI nutrition tracking** is a real market with paying customers. Here's the honest breakdown.

### What Exists Today (Competitors)

| App | What It Does | Price | Weakness |
|-----|-------------|-------|----------|
| MyFitnessPal | Manual food logging, barcode scan | $20/mo premium | Tedious manual entry, no wearable integration |
| MacroFactor | AI-assisted macro tracking | $12/mo | No WHOOP/Oura integration, no photo logging |
| Cronometer | Detailed nutrition tracking | $10/mo | Complex UI, not gym-focused |
| WHOOP Coach | Recovery + strain coaching | Included w/ WHOOP ($30/mo) | No nutrition, no workout logging |
| Oura | Sleep + readiness scoring | Included w/ Oura ($6/mo) | No workout tracking, no nutrition |
| Caliber | Workout tracking + coaching | $20/mo | No wearable integration, no nutrition |

**The gap:** No single app combines wearable recovery data (WHOOP/Oura) + AI food photo macro tracking + intelligent workout adjustments. Everyone does one piece.

### Your Unique Angle

ARMageddon could be the **glue layer** between:
- **Recovery data** (WHOOP, Oura, eventually Apple Watch, Garmin)
- **AI nutrition** (photo-to-macros via Claude/GPT Vision)
- **Smart workout programming** (auto-adjust based on all inputs)
- **Unified daily score** (the thing everyone wants but nobody aggregates)

The food photo AI feature alone is what people are actively searching for. Adding your girlfriend's Oura Ring support doubles the addressable market immediately — WHOOP has ~500K subscribers, Oura has ~2M+ users.

### Revenue Model Options

**Option A: Freemium SaaS ($9-15/mo)**
- Free: Manual workout tracking, basic schedule
- Paid: WHOOP/Oura sync, AI food photo analysis, daily composite score, trends
- AI food analysis has a real per-use cost (API calls to Claude Vision ~$0.01-0.05/photo), so a subscription makes sense

**Option B: One-Time Purchase ($30-50)**
- iOS/Android app via App Store
- Users bring their own AI API key (power user model)
- Lower recurring revenue but simpler

**Option C: Stay Personal, Open Source It**
- Build exactly what you want, share the repo
- No support burden, no customer expectations
- Still looks great on a portfolio

### Honest Profitability Assessment

**Costs to scale:**
- Claude API for food photos: ~$0.03/photo x 5 photos/day x 30 days = ~$4.50/user/month
- Vercel Pro: $20/mo (covers ~100 users on hobby, need Pro for more)
- Oura API access: Free developer tier
- Domain + misc: ~$15/mo
- Your time: The real cost

**Break-even math (Option A at $12/mo):**
- Per-user margin after API costs: ~$7/user/month
- 50 paying users = $350/mo profit
- 200 paying users = $1,400/mo profit
- 1,000 paying users = $7,000/mo profit

**Likelihood of getting there:**
- 50 users: Very achievable with a good Product Hunt launch + Reddit (r/whoop, r/ouraring, r/fitness)
- 200 users: Realistic within 3-6 months if the food photo feature works well
- 1,000 users: Requires sustained marketing effort, app store presence, or going viral

### Recommendation

**Build it for yourself first, but architect it for others.**

The food photo macro tracking is the killer feature that doesn't exist well in any competitor. If you and your girlfriend both use it daily for 2-3 weeks and it's genuinely useful, you have product-market fit in a sample of two — which is more than most startups start with.

Concrete next steps if exploring monetization:
1. Add Oura Ring integration (her use case validates multi-wearable demand)
2. Build food photo AI logging (the feature with the most pull)
3. Use it yourselves for 2-4 weeks
4. If it sticks, put up a landing page with a waitlist
5. Post on r/whoop and r/ouraring — gauge interest before building auth/payments

**Bottom line:** The personal use case is already valuable. The monetization angle is real but modest — this is more likely a solid $500-2K/mo side project than a venture-scale business. The food photo AI + multi-wearable aggregation angle is genuinely differentiated though, and the market is actively looking for it.

---

## To Pick Up Tomorrow

1. **Macro tracking + food photo AI** — biggest feature add
2. **Daily composite score** — ties everything together
3. **Progressive overload tracking** — the "gym bro" feature
4. **Oura Ring integration** — validate multi-wearable support (for GF + monetization)
5. Test the WHOOP sync after a full night of sleep data
6. Add to iPhone home screen and test PWA experience
