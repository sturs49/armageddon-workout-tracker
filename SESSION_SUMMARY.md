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

## To Pick Up Tomorrow

1. **Macro tracking + food photo AI** — biggest feature add
2. **Daily composite score** — ties everything together
3. **Progressive overload tracking** — the "gym bro" feature
4. Test the WHOOP sync after a full night of sleep data
5. Add to iPhone home screen and test PWA experience
