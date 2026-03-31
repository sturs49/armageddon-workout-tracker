# reKova — Session Summary
**Updated:** March 30, 2026
**Repo:** `sturs49/armageddon-workout-tracker`
**Live URL:** https://armageddon-workout-tracker.vercel.app/
**Privacy:** https://armageddon-workout-tracker.vercel.app/privacy.html

---

## What's Built (Current State)

### Single Consolidated App (`index.html`)
- Full weekly workout schedule (Mon-Sun) with ARMageddon splits
- **Per-day workout toggle**: Suggested Plan vs My Own Workout
- Custom exercise mode with dropdown of 50+ exercises by muscle group
- Stepper inputs for weight (5lb increments) and reps (1 rep increments)
- Weight tracking with Chart.js progress charts
- Dark theme, yellow accent, mobile-first

### WHOOP Integration
- OAuth 2.0 via Vercel serverless function (`api/whoop.js`)
- v2 API: cycle, recovery, sleep
- Live header metrics: Recovery %, Sleep, Strain, HRV
- Auto-refresh tokens, 15-min auto-sync
- Recovery-based workout adjustments (Full/Modified/Light/Rest)
- Alert system for low sleep, poor recovery, high strain

### AI Food Logging
- `api/food.js` serverless function using Claude Haiku
- Type "2 eggs, toast and bacon" → AI returns per-item calorie/protein/carb/fat
- Preview/confirm flow before adding to daily log
- Full macro tracking (calories, protein, carbs, fat) with daily goals
- "AI Suggest My Macros" in Settings based on weight, goal, activity level
- 7-day food history

### Progress Tracking
- **Monthly heatmap calendar** — green (all goals), orange (some), red (0-1)
- **Click into any day** to see workout details, food log, macros, recovery, weight
- Weight progress chart with start/current/lowest/goal stats
- Weekly volume chart (weight x reps per day)
- Daily goal progress bars: recovery, steps, calories, sleep, workout, weight

### Other Features
- Manual cardio inputs (run, walk, bike, HIIT, stairmaster + steps)
- Configurable settings: recovery thresholds, daily goals, start/goal weight
- Export all data as JSON
- PWA with home screen icon ("rK" logo with recovery arc)

### Infrastructure
- **One file:** `index.html` (consolidated from two separate files)
- **API:** `api/whoop.js` (WHOOP OAuth + data), `api/food.js` (AI nutrition)
- **Vercel env vars:** `WHOOP_CLIENT_ID`, `WHOOP_CLIENT_SECRET`, `REDIRECT_URI`, `ANTHROPIC_API_KEY`
- Service worker with offline caching

---

## Brand

**Name:** reKova (recovery → re-Kova-ry)
**Icon:** Yellow "rK" with recovery arc ring on black background
**Colors:** Black primary, #FFFF00 yellow accent

---

## Competitive Landscape

| App | Wearable | AI Food Photo | AI Workouts | Composite Score | Price |
|-----|----------|---------------|-------------|----------------|-------|
| **Vora** | 500+ integrations | Yes | Yes | No | Free/Pro |
| **Cora** | WHOOP, Oura, AW | No | Yes | Partial | Sub |
| **Bevel** | AW (best) | Yes | No | No | Free/Paid |
| **SensAI** | WHOOP, Oura, AW | Partial | Yes | No | $3/mo |
| **reKova (us)** | WHOOP (Oura next) | Text AI | Yes | Planned | Free |

**Vora is closest competitor.** Our differentiation: gym-specific UX (steppers, progressive overload), per-day workout customization, local-first privacy, unified composite score (planned).

---

## Monetization Assessment

**Revised verdict:** Vora covers similar ground with real funding. Monetization case is weaker than initially thought. However:
- Personal tool: 100% worth it
- Niche opportunity: serious lifters who want recovery-driven programming with great gym UX
- If composite score + gym UX resonates: $5-15/mo subscription viable
- 500 users @ $10/mo = $5K/mo (realistic if Apple Watch added)

---

## Next Session Priorities

### High Priority
1. **Progressive overload tracking** — show last week's weight/reps next to current inputs
2. **Oura Ring support** — different API, same data model (for girlfriend)
3. **Food photo AI** — upgrade text input to camera/vision model
4. **Unified daily score** — 0-100 composite from recovery + sleep + nutrition + workout

### Medium Priority
5. **Apple Health integration** — steps, heart rate (requires native wrapper or HealthKit JS)
6. **Weekly/monthly summary views** — email digest or in-app weekly recap
7. **Progressive web app improvements** — better offline support, push notifications
8. **Share workout** — generate shareable link or image of completed workout

### Low Priority / Nice to Have
9. **Social features** — compare with friends, challenges
10. **White-label for trainers** — B2B angle
11. **Dark/light theme toggle**
12. **Workout templates** — save custom workouts as reusable templates

### Technical Debt
- Consider React/Next.js migration if features grow beyond single-file manageability
- Add error boundaries and better offline handling
- Rate limiting on AI food endpoint
- Consider a real database (Supabase/Planetscale) if data grows beyond localStorage

---

## Files

| File | Purpose |
|------|---------|
| `index.html` | Main app (everything) |
| `api/whoop.js` | WHOOP OAuth + data sync |
| `api/food.js` | AI food analysis (Claude Haiku) |
| `manifest.json` | PWA manifest |
| `sw.js` | Service worker |
| `privacy.html` | Privacy policy for WHOOP |
| `icons/` | App icons (180, 192, 512px) |
| `workout_tracker.html` | Legacy (can delete) |
| `workout_tracker_whoop.html` | Legacy (can delete) |
