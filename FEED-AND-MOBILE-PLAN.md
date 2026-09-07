# Feed ranking + de-stubbing + cross-platform (web / Android / iOS / Electron)

Status key: **CONFIRMED** = observed working against the live DB or in a browser run ·
**DONE (untested)** = code written, typecheck/build green, no runtime proof ·
**TODO** = not built.

---

## 1. How posts are ranked and displayed today

Answering *what / which / when / how*, from the code as it actually is.

**Where it lives**

| Layer | File | Role |
|---|---|---|
| Ranking function | `server/utils/feed-ranker.ts` | scoring, ad interleave, external fallback |
| Main feed API | `server/api/feed/index.get.ts` | ads + ranked posts + external fallback |
| Posts-only API | `server/api/posts/feed.get.ts` | same ranking, no ad slots |
| Client | `composables/useSocialFeed.ts` → `pages/feed.vue` | `/api/feed`, infinite scroll |
| People discovery | `server/api/discovery/feed.get.ts` + `server/utils/ad-engine.ts` | *who* to follow, not *what* to read |
| Weights | `platform_configurations.feed_ranking` | tunable without deploy |

**When** — per request, at read time. There is no precomputed timeline, no fan-out-on-write,
no background job, and **no Redis anywhere in the repo** (verified: zero imports, zero config).

**Which posts are candidates** — newest `candidate_pool` (default 300) rows from `posts`
where `is_draft = false`, `scheduled_at is null`, `privacy in ('public','friends')`.
The `following` tab additionally restricts to authors the viewer follows.

**How each candidate scores**

```
engagement = likes*3 + comments*4 + shares*5            (weights from platform_configurations)
score      = (engagement + 1) / (ageHours + 2) ^ 1.5     (Hacker-News style gravity decay)
score     *= 2.0   if a post hashtag matches a viewer interest   → reason "interest"
score     *= 1.8   if the viewer recently interacted with the author → reason "affinity"
score     *= 2.5   if the viewer follows the author              → reason "following"
```
`trending` tab drops the decay and the boosts (raw engagement). Results are sorted by score
and sliced by `offset/limit`; each item carries its `reason` so the UI can label it.

**Where ads sit** — `interleave()` puts an item in a slot every `every_n_items` (default 5,
starting at `first_slot`): an **in-app** campaign first (`ads_campaigns`, `status=ACTIVE`,
`remaining_budget > 0`, inside its window, highest `bid_per_unit`), and only when in-app
inventory is exhausted an **external** slot (`external_ad_slots`, ranked by how many of its
`interest_ids` match the viewer, then `bid_per_mille`; untargeted slots are the house fallback).
This matches the order you specified: in-app ad → user feed → AdSense/Meta fallback.

### What is wrong with it (the honest gaps)

1. **The behaviour signal is dead.** `rankPosts` reads `user_interactions`, but *nothing in the
   codebase ever writes that table*. So `affinity_boost` never fires — "behaviour" ranking is
   currently interest + follow + engagement only.
2. **Interests are only matched by hashtag string.** `user_interests` → `interests.name` is
   compared against `posts.hashtags`. A post about football that isn't hashtagged `#football`
   scores nothing on interest.
3. **No dwell/impression signal**, so a post cannot be down-ranked after the viewer has already
   seen and skipped it, and the same top posts repeat across pages.
4. **No caching at all** — every scroll page re-reads 300 candidate rows plus authors plus likes.
5. **`services/*` are thin and partly broken**: `services/match.ts` and `services/interestsService.ts`
   reach for `globalThis.api` / `globalThis.$fetch` and throw outside a Nuxt request; `services/postService.ts`
   calls `/posts/feed/{type}`, a route that does not exist.

### Plan — make ranking real (Stage F)

| # | Change | Why |
|---|---|---|
| F1 | `POST /api/feed/track` writing `user_interactions` (view, dwell, like, comment, share, profile_open, hide) + client calls from the feed card (IntersectionObserver impression) and the interaction toolbar | turns on the affinity signal, enables seen-suppression |
| F2 | Seen-suppression: down-weight posts with a recent `view` interaction instead of dropping them | stops repeats without emptying the feed |
| F3 | Interest match on `posts.hashtags` **and** the author's `interest_tags`, plus a keyword match on `interests.name` in the post body | interest ranking that works for un-hashtagged posts |
| F4 | Cache the candidate pool + author lookups with Nitro's `defineCachedFunction` (60s, per-tab, keyed by viewer bucket) | removes the per-scroll re-read with **no new infrastructure**; a Redis driver can be swapped in later by config alone |
| F5 | Delete/repair the broken service shims; point every caller at the routes that exist | no `globalThis` hacks, no phantom routes |
| F6 | Surface `reason` in the UI ("Because you follow X" / "Based on your interests") | required for store review transparency and useful for debugging ranking |

**Redis**: still not provisioned. F4 is deliberately written against Nitro storage so that
pointing it at Upstash/Redis later is a config change, not a rewrite. I will not claim Redis
until it exists.

---

## 2. De-stubbing (no fake data left in the product surface)

**CONFIRMED fixed this session** (browser-tested by the testing agent): profile settings persist,
avatar renders at avatar size and creates no post/status, chat send/receive/history/ticks work,
DM search is network-scoped.

**DONE (untested)** — landed after the test run, needs re-verification:
`/posts/create` publishes for real, `/posts` loads the ranked feed and resolves `CreatePost`/`PostCard`,
profile save with empty date of birth, dark chat bubbles, favicon.

**TODO — remaining stubs, each to be wired to a live route:**

| Surface | Stub | Fix |
|---|---|---|
| `pages/posts/[id].vue` | `mockPost` + `setTimeout` | `GET /api/posts/[id]` with author, likes, comments |
| `pages/match.vue` | `setTimeout(1000)` fake submit | `POST /api/match/submit` |
| `components/layout/wallet-widget.vue` | `setTimeout(1000)` | live wallet balance |
| `pages/admin/ranks.vue`, `admin/inference.vue`, `admin/verified.vue`, `admin/ad-analytics.vue` | mock rows | live tables, or feature-flag the page off if the table is on the RETIRE list |
| `components/general-settings-modal.vue`, `components/auth-form.vue` | leftover mock branches | remove |

---

## 3. Cross-platform: web + Android + iOS + Electron (Capacitor)

Ground rule: **the web build must not change**. Everything native is additive and gated on
`CAPACITOR_BUILD` at build time or `isNative` at runtime.

### Phase 1 — platform detection
- add `@capacitor/core`; `composables/use-device-platform.ts` exposing
  `isNative / isWeb / isAndroid / isIos / isElectron` from `Capacitor.getPlatform()`
- `plugins/platform-class.client.ts` adds `platform-web|android|ios|electron` to `<html>`
- `nuxt.config.ts`: `ssr: !process.env.CAPACITOR_BUILD` so SSR stays on for web and the
  Capacitor build is a static SPA in `.output/public`

### Phase 2 — native UI
- `--sat/--sab` safe-area variables; padding applied **only** under `.platform-ios/.platform-android`
- native-only: `user-select: none`, `-webkit-tap-highlight-color: transparent`,
  `overscroll-behavior-y: none`
- keep the web navbar/sidebar; render the bottom tab bar only when `isNative`

### Phase 3 — Capacitor project + graceful fallbacks
- `@capacitor/cli`, `@capacitor/android`, `@capacitor/ios`, `capacitor.config.ts` → `webDir: .output/public`
- every native plugin call behind a platform check with a web fallback
  (Preferences→`localStorage`, Camera→`<input type=file>`, Push→Web Notifications, Haptics→no-op)
- `@capacitor/app` deep-link listener pushing the path into vue-router

### Phase 4 — build pipeline
- `build:web` = `nuxt build`; `build:mobile` = `CAPACITOR_BUILD=true nuxi generate && npx cap sync`
- `npx cap add android|ios`; Electron via `@capacitor-community/electron`

### Phase 5 — store readiness
- `@capacitor/assets` + source art (`icon-only.png` 1024², adaptive fore/background, `splash.png` 2732², dark splash)
- `/.well-known/assetlinks.json` and `/.well-known/apple-app-site-association` served by Nuxt
- `/privacy`, `/terms`, and an in-app **Delete account** flow + public deletion request URL (both stores require this)
- Android `targetSdkVersion 35`, signed `.aab`
- `/store-assets/` for screenshots (iOS 6.7"/5.5", Android phone + 1024×500 feature graphic) and metadata

### Decisions you must make (store policy — I will not choose these for you)

1. **Apple IAP**: any digital goods sold in the iOS build — Pewgift top-ups included — must go
   through Apple IAP (30%/15%). Stripe/PSP checkout inside the iOS app is an automatic rejection.
   Options: (a) disable Pewgift purchase on iOS and let users top up on the web,
   (b) add RevenueCat/StoreKit for iOS purchases, (c) ship Android/web first.
   *P2P deposits between users are not digital goods and are unaffected.*
2. **Sign in with Apple** becomes mandatory on iOS the moment Google/Facebook login is offered.
3. **Crypto/P2P on the stores**: both stores restrict crypto exchange functionality; the
   closed-loop, zero-custody model helps, but the P2P surface may need to be
   region- or platform-gated. Needs your call before iOS submission.
4. **Bundle IDs + domain**: I need the production domain and the bundle identifiers
   (e.g. `com.socialverse.app`) before assetlinks/AASA and the native projects are meaningful.

### Execution order

F1–F6 (ranking real) → de-stub table → Capacitor Phases 1–4 → assets/deep links/legal (Phase 5) →
re-test in the browser and on the Android emulator. Committing after each step.
