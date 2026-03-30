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

**Bottom line:** See "Revised Profitability Assessment" below for updated analysis after competitor research.

---

## Competitor Deep Dive (March 29 Research)

### The Honest Truth: Bevel Exists

**Bevel** (bevel.health) is the closest direct competitor and is VC-backed by General Catalyst. It does:
- All-in-one health dashboard (sleep, recovery, strain, stress, nutrition, fitness)
- AI food photo logging with 5M+ verified food database
- Apple Watch / Oura / Garmin integration via Apple Health
- Daily scores and personalized insights
- Blood glucose monitor integration (Dexcom, Libre)
- Cycle tracking
- Free tier + paid premium

**This is sobering.** Bevel has funding, a team, and already covers most of what we described. However:

### Full Competitor Matrix (Deep Research)

| App | Wearable | AI Food Photo | AI Adaptive Workouts | Composite Score | Price |
|-----|----------|---------------|---------------------|----------------|-------|
| **Vora** | WHOOP, Oura, Garmin, AW, 500+ | Yes (photo, voice, barcode) | Yes (daily plans adapt) | No single score | Free / Pro TBD |
| **Cora** | WHOOP, Oura, Garmin, AW, Fitbit | No (text-based) | Yes (auto-adjusts) | Partial (Body Charge, no nutrition) | Subscription, iOS only |
| **Bevel** | AW (best), Oura/Garmin via AH | Yes (AI photo) | No (tracks, doesn't generate) | No (separate scores) | Free + paid |
| **SensAI** | WHOOP, Oura, Garmin, AW, Fitbit | Partial (chat-based) | Yes (adapts to HRV) | No | $2.99/mo |
| **Pivot** | WHOOP only | Yes | No (nutrition only) | Partial (nutrition score) | Free / $9.99/mo |
| **Hume** | AH, Garmin, Fitbit, own hardware | Broken (per reviews) | No | Yes (unified) | Free / $8.99/mo |
| **SnapCalorie** | None | Yes (best: 16% error) | No | No | Free |
| **Cal AI** | None | Yes (1M+ downloads) | No | No | Freemium |

### The Honest Assessment

**Vora (askvora.com) is the closest direct competitor.** It has WHOOP/Oura/500+ wearable integrations, AI food photo tracking, AND recovery-adaptive workout plans. Its gap: no unified composite score combining all pillars into one number.

**This changes the monetization calculus significantly.** Vora is well-funded and covers 3 of your 4 planned features.

### Where You Could Still Differentiate

1. **Unified daily composite score** — The one thing nobody does. A single 0-100 number combining recovery + sleep + nutrition + workout completion + activity.
2. **Gym-specific UX** — Per-exercise scroll pickers, progressive overload tracking, set/rep/weight history. Vora and Bevel are generalists.
3. **Local-first privacy** — Your data on your device. Vora/Bevel are cloud-first, VC-backed.
4. **Simplicity** — Vora has 500+ integrations. You have one goal: make today's workout match your body's readiness.
5. **Open/transparent** — Open source or at minimum transparent about what data goes where.

### Revised Competitive Position

The original thesis — "nobody does the full stack" — is **wrong**. Vora comes very close. The remaining gaps are: (1) the unified score, (2) serious lifter UX, and (3) privacy-first architecture. Whether those gaps justify a separate product is the real question.

---

## Revised Profitability Assessment

### Should You Monetize? Honest Framework

**FOR monetization:**
- Gym-specific + WHOOP/Oura niche is real and underserved
- Bevel validates market but targets different user (wellness generalist vs gym-focused)
- AI workout generation based on recovery is genuinely novel
- WHOOP users already pay $30/mo — proven spenders
- $15-20/mo defensible for "AI personal trainer" positioning

**AGAINST monetization:**
- Bevel has VC money and head start on generalist version
- Auth, payments, user management, support is real work
- API costs: ~$4.65/user/mo (food photos + workout generation)
- App Store review unpredictable, Apple takes 30%
- Solo founder vs funded teams

### Revised Revenue Projections (at $15/mo)

| Scenario | Users | Revenue/mo | Profit/mo | Timeline | Realistic? |
|----------|-------|-----------|----------|----------|------------|
| Personal + friends | 10 | $150 | $80 | Immediate | Yes |
| Niche launch | 100 | $1,500 | $850 | 2-3 months | Yes — Reddit posts |
| Small traction | 500 | $7,500 | $4,250 | 6-12 months | Possible w/ App Store |
| Real business | 2,000 | $30,000 | $17,000 | 12-18 months | Requires marketing |

### The Verdict

**Worth exploring as a focused side project. Not worth quitting your job for.**

1. Build it for yourself (already doing this)
2. Add Oura for your GF (validates multi-wearable)
3. Add AI food photos + recovery-adaptive workouts (the differentiation)
4. Use it for 3-4 weeks. If it changes your routine, keep going.
5. Post on Reddit. If 50 people sign up for a waitlist in a week, build payments.
6. If < 20 people care, keep it personal and enjoy your free custom fitness app.

Risk is low, downside is "you built a great personal app," upside is $1-5K/mo side income.

**Updated verdict after finding Vora:** The monetization case is weaker than originally assessed. Vora covers most of the same ground with real funding. However, building this as a personal tool remains 100% worthwhile — you'll have exactly the UX you want, privacy you control, and a product that fits your specific workflow. If the composite score + gym UX resonates with others, the opportunity is still there. But don't bet the farm on it.

### Things You Might Be Forgetting

1. **API TOS** — WHOOP and Oura APIs have commercial use restrictions. Read before charging.
2. **App Store fees** — Apple takes 30% (15% for < $1M). $15/mo becomes $10.50.
3. **GDPR** — EU users need real data handling procedures.
4. **Token security** — Multi-user requires real database, not localStorage.
5. **Rate limits** — WHOOP 120 req/min. 500 users syncing every 15 min needs batching.
6. **Food photo accuracy** — Claude Vision is good but not SnapCalorie-good (16% error). Manage expectations.
7. **Churn** — Fitness apps have 75% first-month churn. Daily food photos = retention lever.
8. **Liability** — "AI told me to lift heavy on bad recovery." You need disclaimers.
9. **Offline conflicts** — Two devices editing same workout offline = merge conflicts.
10. **Onboarding friction** — Every OAuth connection is a dropout point. Manual mode must be seamless.

---

## Brand Strategy

### Brand Name Options — Updated After Conflict Research

"ARMageddon" works for your personal arm-focused program but doesn't scale.

**Names researched and ELIMINATED:**
- **Vora** — DEAD. Vora AI health/daily plan app exists + drinkvora.com supplement brand
- **Edge** — DEAD. Microsoft Edge dominates all SEO. Edge Fitness Clubs chain exists.
- **FitEdge** — DEAD. FitEdge Training Inc, Fit Edge gym, USPTO trademark "THE FITNESS EDGE"
- **Edgr** — DEAD. edgr.app exists (adult tracker), edgr.io (investment research)

**Remaining viable options:**

| Name | Vibe | Status | Why It Works |
|------|------|--------|--------------|
| **Forge** | Strength, creation | CLEAN — no fitness app conflicts | "Forged in the gym." Works for lifting + holistic health. Strong single syllable. |
| **Tread** | Forward motion | Likely clean | Implies steady progress. Works across all fitness types. |
| **Reco** | Tech-forward, friendly | Needs verification | Short for "recovery" — the core differentiator. |
| **Kinetic** | Scientific, movement | Needs verification | Energy in motion. Smart, clean, gender-neutral. |
| **Verge** | Edge-adjacent, ambition | The Verge (publication) may cause SEO issues | "On the verge" — same energy as Edge without the conflicts. |

**Top recommendation: Forge.** Cleanest namespace, strongest imagery, domains likely available (forgefit.app, forge.health, getforge.app).

### Brand Colors

Based on market research, conversion data, and competitor analysis:

**Current (ARMageddon):** Black + Yellow (#FFFF00) — High energy, aggressive, very masculine. Works for a personal lifting app but alienates broader audience (women, yoga, recovery-focused users).

**What the data says:**
- Red/orange dominate fitness apps (energy, urgency) — but that means everyone looks the same
- Green is trending for health/wellness in 2026 (+20% trust scores with users under 35)
- High contrast ratio (6:1+) matters more than specific color for conversions
- Brand-consistent colors outperform trendy colors by 18% with repeat users

**Recommended palette for a multi-user product:**

| Role | Color | Hex | Rationale |
|------|-------|-----|-----------|
| Primary | Deep Black | #0A0A0A | Premium feel, lets data/metrics pop. Every wearable app uses dark mode. |
| Accent | Electric Teal | #00E5C3 | Differentiates from red/orange fitness crowd AND yellow WHOOP. Signals tech + health. High contrast on dark. |
| Secondary | Warm Coral | #FF6B6B | Energy, urgency. Use for CTAs, alerts, strain indicators. |
| Success | Vibrant Green | #22C55E | Recovery, completion, positive metrics. Universal "good" signal. |
| Warning | Amber | #F59E0B | Moderate states, attention needed. |
| Text | Off-White | #F0F0F0 | Softer than pure white, easier on eyes in dark mode. |

**Why teal as primary accent:** It's the "gap" color in fitness. WHOOP owns yellow/green. Oura owns white/silver. Strava owns orange. Apple Fitness owns neon rings. Teal is unclaimed, signals both tech sophistication and health/wellness, and tests well with both male and female audiences.

**Transition plan:** Keep black+yellow for now as your personal build. When/if you go multi-user, rebrand with new palette — it's just CSS variable swaps.

---

## AI Workout Plan Generation

### The Vision

Instead of hardcoded workout plans, let users describe their goals and have AI generate personalized programming.

### User Input Flow

1. **Onboarding questionnaire:**
   - Goal: Muscle gain / Fat loss / Strength / General fitness / Sport-specific
   - Experience level: Beginner / Intermediate / Advanced
   - Days available: 3-7 per week
   - Equipment: Full gym / Home gym / Bodyweight only
   - Injuries/limitations: Free text
   - Time per session: 30 / 45 / 60 / 90 min
   - Focus areas: Arms, chest, back, legs, shoulders, core (multi-select)

2. **AI generates a full weekly program** via Claude API
   - Exercise selection, sets, reps, rest periods
   - Progressive overload built in (week-over-week progression)
   - Deload weeks every 4-6 weeks
   - Adapts based on recovery data (WHOOP/Oura integration)

3. **Weekly auto-adjustment:**
   - After each completed week, AI reviews logged weights/reps + recovery scores
   - Suggests increases, deloads, or exercise swaps
   - "Your bench press has stalled for 2 weeks — try paused reps or switch to dumbbell press"

### Implementation Approach

- **Phase 1 (personal):** Keep hardcoded plans, add ability to edit exercises per day
- **Phase 2 (MVP):** Prompt Claude API with user inputs → generate JSON workout plan → render in app
- **Phase 3 (product):** Fine-tuned prompts with exercise database, periodization templates, injury awareness
- **Cost:** ~$0.02-0.05 per plan generation (one-time per week), negligible at scale

### Competitive Edge

Most "AI workout" apps just randomize from a database. Using an LLM means:
- Natural language injury/preference handling ("bad left shoulder, can't overhead press")
- Genuine periodization logic, not just randomization
- Can explain *why* each exercise was chosen
- Adapts to the specific equipment available

---

## Additional Product Optimization Ideas

### For Personal Use → Product Transition

1. **Onboarding Flow**
   - First-time user experience: connect wearable → set goals → generate plan
   - Skip-friendly (can use without wearable, manual entry works)
   - Takes < 60 seconds

2. **Multi-Wearable Architecture**
   - Abstract wearable data behind a common interface: `{ recovery, sleep, strain, hrv, steps }`
   - WHOOP adapter, Oura adapter, Apple Health adapter, manual adapter
   - User connects whichever they have — app doesn't care about the source
   - This is the real moat: being wearable-agnostic

3. **Apple Health Integration (Free, No API Key)**
   - iOS Web API can't access HealthKit directly, but a native wrapper (Capacitor/React Native) can
   - Pulls: steps, heart rate, sleep, workouts, weight
   - Covers users without WHOOP/Oura (massive market expansion)
   - Consider this for the app store version

4. **Offline-First Architecture**
   - All data works offline, syncs when connected
   - Critical for gym use (basements, poor signal)
   - IndexedDB instead of localStorage (larger storage, better performance)
   - Background sync API for deferred uploads

5. **Push Notifications (PWA)**
   - "Time to log your workout" reminders
   - "Recovery is 85% — go hard today"
   - "You haven't logged food since lunch"
   - Requires HTTPS + service worker (already have both)

6. **Social Proof / Waitlist Landing Page**
   - Simple page: hero image, 3 feature bullets, email capture
   - "Join the beta" — gauge interest before building payment infra
   - Use Vercel + a simple form → Notion/Airtable for emails
   - Share on Reddit (r/whoop, r/ouraring, r/fitness, r/bodybuilding)

7. **Data Privacy as a Feature**
   - "Your data stays on your device" is a genuine selling point
   - Most fitness apps harvest and sell data
   - Market the local-first architecture as a feature, not a limitation
   - If/when you add cloud sync, make it opt-in and encrypted

8. **Theming / White-Label Potential**
   - CSS variables already power the theme — adding user-selectable themes is trivial
   - Long-term: personal trainers could white-label it for their clients
   - Trainer creates workout plan → sends to client's app → client logs and trainer sees progress

---

## To Pick Up Tomorrow

1. **Macro tracking + food photo AI** — biggest feature add
2. **Daily composite score** — ties everything together
3. **Progressive overload tracking** — the gym bro feature
4. **Oura Ring integration** — validate multi-wearable support (for GF + monetization)
5. **Brand name decision** — pick a name, grab the domain
6. Test the WHOOP sync after a full night of sleep data
7. Add to iPhone home screen and test PWA experience
