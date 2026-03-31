# Kova — Session Summary
**Updated:** March 30, 2026
**Repo:** `sturs49/armageddon-workout-tracker`
**Live URL:** https://armageddon-workout-tracker.vercel.app/
**Privacy:** https://armageddon-workout-tracker.vercel.app/privacy.html

---

## Brand

**Name:** Kova
**Icon:** Yellow "K." with recovery arc ring on black
**Home screen:** Shows "K." icon, app displays "Kova"

---

## Current App Functionality

### Onboarding (first visit)
- 4-step flow: Welcome → Stats (weight, goal, activity) → AI macro generation → WHOOP connect (optional)
- AI calls Claude Haiku to recommend cal/protein/carbs/fat based on user profile
- All values editable in Settings afterward
- Skipped on return visits (`onboardingDone` in localStorage)
- WHOOP connect during onboarding preserves onboarding state through OAuth redirect

### Schedule Tab ("Today")
- Today's workout fills the screen — no clutter, one focus
- Day pills (M T W T F S S) at top to switch days
- Today highlighted, completed days show green pill
- Per-day mode toggle: **Suggested Plan** (ARMageddon splits) vs **Custom** (build your own)
- Custom mode: 50+ exercises dropdown by muscle group, or type your own
- Stepper inputs: weight (5lb increments), reps (1 rep increments)
- **Progressive overload ghost text**: "last: 225 / last: 8" shown below each exercise from previous session
- Recovery-based adjustment: Full / Modified / Light / Rest based on WHOOP recovery %
- Recovery info shown inline (recovery %, sleep, strain) when WHOOP connected
- Manual cardio inputs: type (run/walk/bike/HIIT/stairmaster), duration, steps
- Weight logging per day
- Mark Complete / Undo button

### Progress Tab
- **Monthly heatmap calendar**: green (all goals hit), orange (some), red (0-1)
- Click any past day → detail modal showing: recovery/sleep/strain, weight, workout exercises with weights/reps, cardio, food log with macro totals
- Month navigation (< > arrows)
- **Weight progress chart** (Chart.js line chart) with start/current/lowest/goal stats
- **Weekly volume chart** (bar chart, weight x reps per day)

### Food Tab
- **AI-powered food logging**: type "2 eggs, toast and bacon" → Claude Haiku returns per-item calorie/protein/carb/fat breakdown
- Preview/confirm flow before adding to daily log
- Full macro tracking: calories, protein, carbs, fat with daily goal progress
- Remove individual entries
- **Suggested Meal Plan** (collapsible): breakfast/lunch/dinner timing with macro targets
- **Past 7 days** food history

### Settings Tab
- **Core settings** (visible): daily calorie/protein/carb/fat/step/sleep goals, recovery thresholds
- **Advanced settings** (collapsed): start/goal weight, AI macro re-suggestion, export data, clear data, re-run onboarding

### WHOOP Integration
- OAuth 2.0 via Vercel serverless function (`api/whoop.js`)
- v2 API: cycle, recovery, sleep
- Auto-refresh tokens when expired
- 15-minute auto-sync
- Recovery % shown in WHOOP pill (header)
- Recovery gradient: header bottom border shifts green → amber → red based on score
- Alert banners for low recovery (<30%) or low sleep (<6hrs)
- Currently in dev mode — only creator's WHOOP account works

### Daily Goals (header)
- Ring-style SVG progress indicators: Calories, Protein, Sleep, Steps, Workout status
- Color-coded: green (80%+), yellow (40%+), red (<40%)

### PWA
- Installable on iPhone home screen
- Service worker with offline caching
- iOS safe area support (Dynamic Island / notch)
- App icon: "K." with recovery ring

### Infrastructure
- **Single file app:** `index.html`
- **API endpoints:** `api/whoop.js` (OAuth + data sync), `api/food.js` (AI nutrition via Claude Haiku)
- **Vercel env vars:** `WHOOP_CLIENT_ID`, `WHOOP_CLIENT_SECRET`, `REDIRECT_URI`, `ANTHROPIC_API_KEY`
- **Legacy files:** `workout_tracker.html`, `workout_tracker_whoop.html` (can delete)

---

## Testing Plan (This Week)

### Daily Usage Tests
- [ ] Log a full workout with weights/reps using steppers
- [ ] Verify progressive overload ghost text shows last session data
- [ ] Log food via AI (breakfast, lunch, dinner) — check accuracy
- [ ] Check daily goal rings update in real-time
- [ ] Verify WHOOP sync updates recovery gradient and pill
- [ ] Mark workout complete, verify heatmap turns green/orange
- [ ] Check heatmap day detail modal (tap a past day)
- [ ] Test custom workout mode — add exercises, log, complete

### Edge Cases
- [ ] What happens with no internet? (offline mode)
- [ ] What happens if WHOOP token expires mid-week?
- [ ] Food AI with unusual inputs ("protein shake", "leftover pizza")
- [ ] Weight logging on non-workout days

### Share Test
- [ ] Send link to 1-2 friends
- [ ] Confirm onboarding works for new users
- [ ] Confirm app works without WHOOP connected
- [ ] Get UX feedback (what's confusing, what's missing)

---

## Future Plans

### Phase 1: Post-Testing Fixes (Next Session)
Based on this week's testing — bug fixes and UX friction points discovered during real gym use.

### Phase 2: Features
1. **Progressive overload tracking V2** — weekly comparison view, personal records per exercise
2. **Oura Ring support** — different API, same data model (for girlfriend / broader audience)
3. **Food photo AI** — upgrade text input to camera/vision model
4. **Unified daily score** — 0-100 composite from recovery + sleep + nutrition + workout
5. **Weekly recap** — summary of week's progress, trends, suggestions

### Phase 3: Scale (If Demand)
6. **Native app wrapper (Capacitor)** — enables HealthKit steps, widgets, push notifications
7. **Apple Health integration** — automatic step count
8. **Workout templates** — save/share custom workout plans
9. **Social features** — compare with friends, challenges
10. **White-label for trainers** — B2B angle

### Technical Debt
- Delete legacy files (`workout_tracker.html`, `workout_tracker_whoop.html`)
- Consider React/Next.js migration if features outgrow single-file
- Add error boundaries for API failures
- Rate limiting on AI food endpoint
- Real database (Supabase) if data outgrows localStorage

### WHOOP Production Access
- Currently dev mode (only creator account)
- Need to apply for production access at developer.whoop.com for multi-user support
- May require WHOOP app review process

---

## Competitive Landscape

| App | Wearable | AI Food | AI Workouts | Daily Score | Price |
|-----|----------|---------|-------------|-------------|-------|
| **Vora** | 500+ | Yes (photo) | Yes | No | Free/Pro |
| **Cora** | Multi | No | Yes | Partial | Sub |
| **Bevel** | AW (best) | Yes (photo) | No | No | Free/Paid |
| **Kova (us)** | WHOOP | Yes (text AI) | Yes | Planned | Free |

**Verdict:** Vora is closest competitor with more funding. Kova differentiates on gym-specific UX (steppers, progressive overload, per-day customization) and simplicity. Worth exploring monetization only if organic demand emerges from sharing.

---

## Files

| File | Purpose |
|------|---------|
| `index.html` | Main app (everything) |
| `api/whoop.js` | WHOOP OAuth + data sync |
| `api/food.js` | AI food analysis (Claude Haiku) |
| `manifest.json` | PWA manifest |
| `sw.js` | Service worker |
| `privacy.html` | Privacy policy |
| `icons/` | App icons (K. with ring, 180/192/512px) |
| `SESSION_SUMMARY.md` | This file |
