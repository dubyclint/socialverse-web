# Status against DECISIONS.md / ARCHITECTURE-PLAN.md

Branch `devin/typecheck-fixes-fresh` → PR #3. Live DB: `idguhsjzhfzamwrptncu`.

## DONE (applied to DB + code, committed)

| Area | Result |
| --- | --- |
| Strict TypeScript | 715 → **0** errors, no `any` shims, no `@ts-ignore` |
| Build | green (fixed `.nuxtignore` masking `@nuxtjs/supabase/dist`) |
| Auth | single source of truth = `@nuxtjs/supabase`; `auth_token` removed; fake `requireAdmin()` stub replaced with real RBAC |
| Group 1 – repoints | code repointed at tables that exist (`user`, `wallets`, `chat_rooms`, `gift_transactions`, `ads_campaigns`, statuses, calls, follows/blocks) |
| Group 2.1 – money core (§4.1) | PEW closed loop: wallet lock columns, `deposits`, `payment_providers`, `fee_settings`, `country_tiers`, `idempotency_keys`, row-locked `transfer_pewgift` / `send_pewgift` / `settle_deposit`, 11-gift catalogue seeded, duplicate legacy gift triggers dropped |
| Group 2.2 – P2P/escrow (§4.2) | `supported_assets` (20-crypto cap + 162 fiats), `seller_profiles`, `seller_payment_methods`, `p2p_listings`, `p2p_trades`, `security_alerts`, 3h listing freeze, server-derived pricing, `open/release/cancel/dispute/declare_paid` RPCs, `/p2p`, `/p2p/sell`, `/admin/p2p`; `/escrow` now reads real trades (demo data gone); old `escrow_trades`/`escrow_deals` paths retired |
| Group 2.3 – battles (§4.3) | `stream_matches`, participants, `stream_match_events`, `start/record/finalize` RPCs, 1-point tap rule + rate limit, gift-value scoring, tier animation threshold at 5 PEW |
| Group 2.4 – feed (§4.4) | live streams and active battles injected into “For You”, battles ranked above ordinary streams |
| Group 4a – in-repo NFRs | structured JSON logging + correlation IDs, request logging middleware, 5s timeout helper, circuit breaker, per-IP/per-user rate-limit abstraction, RBAC matrix, input validation |
| Emergency (this commit) | signup duplicate-key fixed; 8h inactivity expiry; **storage buckets created** (avatars/posts/chat-media/streams/gifts/ads/moderation/temp-uploads/uploads) with per-uid RLS; `file_uploads` accounting table; avatar upload + generic upload endpoints repaired |

## RETIRED / DELETED
- `swap_transactions` (in-app crypto swap) — contradicts zero-custody.
- Blockchain escrow contract calls in the admin escrow component.
- Demo/hard-coded escrow page data.
- `utils/supabase.ts` (4th Supabase client, threw on import).
- Custom `auth_token` cookie, duplicate `/api/auth/login`, manual bearer injection.

## TO DO (next, no decision needed)
1. **Profile identity format** — `user.user_id` vs `profiles.id` are used inconsistently in a few remaining callers; normalise on `user_id` (uuid = `auth.users.id`).
2. Feed feature wiring audit — walk every link in `feed.vue` and confirm each index page reads live tables (p2p, escrow, streaming, chat, ads, support, monetization, wallet, pewgift, universe, match, pals).
3. Retire remaining dead files: `server/models/escrow-trade.ts`, `server/controllers/escrow-controller.ts`.
4. Trade-chat authorisation tied to active trade participants, not just room membership.
5. Browser end-to-end run of the P2P escrow flow (seed data already in place).
6. `tests/storage.test.ts` — 5 pre-existing failures; eslint `no-undef` config fix (~1.9k errors, config-level).

## NEEDS YOUR DECISION (blocking those items only)
| # | Question | My recommendation |
| 1 | Premium subscriptions in v1? | defer to v2 |
| 2 | AML / sanctions screening in v1? | defer; closed loop lowers exposure |
| 3 | Retire A/B-testing + ML + ops-dashboard tables (feature-flag those admin pages off)? | retire |
| 4 | Queues: Supabase queues/pg_cron vs RabbitMQ vs Kafka | Supabase queues/pg_cron (no new infra) |
| 5 | Live FX rate provider (rates are admin-maintained today) | CoinGecko + openexchangerates |
| 6 | Redis/Redlock provider (limiter + locks are process-local today) | Upstash Redis |
| 7 | CDN, Sentry/APM, sharding, multi-region DR | platform programme, after launch |
| 8 | True end-to-end encryption policy | TLS + at-rest now; E2EE for DMs later |

Items 6–8 are infrastructure provisioning, not repo changes.
