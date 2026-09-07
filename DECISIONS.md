# Unification decision sheet — schema gaps, product spec, enterprise NFRs

Companion to `ARCHITECTURE-PLAN.md`. Nothing in here is executed until you approve.
Measured on the current branch: code references **140 distinct tables**, **109 of which do not exist**
in the live Supabase project (49 tables + 1 view + 9 functions exist).

Every row below is one of three actions:

- **REPOINT** — the feature works, the code just names the wrong table. Pure code edit, no migration, no risk.
- **BUILD** — the feature is real and has no home in the DB. Needs a migration + RLS.
- **RETIRE** — the code path is dead, duplicated, or contradicts the product model. Delete the route/UI.

---

## Group 1 — REPOINT (no decision needed, I'll just do it)

Zero schema change; these are the runtime `relation does not exist` errors a normal user hits.

| Code references | Live table | Files |
| --- | --- | --- |
| `users`, `user_profiles` | `user` (+ `profiles` view) | 32 |
| `user_wallets`, `pewgift_balance`, `wallet_transactions` | `wallets`, `wallet_ledger` | 26 |
| `chats`, `chat_conversations`, `chat_participants`, `chat_sessions` | `chat_rooms`, `chat_room_members`, `chat_messages` | 36 |
| `groups`, `group_chats`, `group_chat_members`, `group_chat_messages` | `chat_rooms` (group flag) + members/messages | 13 |
| `message_reactions`, `group_message_reactions`, `message_reads` | `chat_message_reactions`, `chat_read_receipts` | 5 |
| `statuses`, `user_status_legacy`, `status_views_legacy` | `user_statuses`, `status_views` | 17 |
| `likes` | `post_likes` | 2 |
| `hashtags` | `tags` / `trending_hashtags` | 1 |
| `friendships`, `connections`, `contacts`, `user_contacts` | `follows` / `user_follows` | 12 |
| `blocked_users` | `user_blocks` | 2 |
| `stream_chat` | `stream_chats` | 4 |
| `calls` | `call_sessions` | 10 |
| `pewgifts`, `pew_gifts`, `pewgift_transactions`, `gifts`, `pewgift_types` | `gift_transactions`, `gift_catalog` | 23 |
| `ads` | `ads_campaigns` | 1 |
| `escrow_deals` | `escrow_agreements` | 1 |
| `roles`, `permissions` | `user.role` enum | 2 |

**Counter columns** (`post_views`, `post_shares`, `stream_views`, `stream_viewers`, `profile_views`,
`engagements`, `engagement_stats`) are reads of counts that don't exist. Recommendation: add integer
counters to `posts` / `streams` / `user` rather than five new tables — cheaper and it's what the UI shows.

---

## Group 2 — BUILD, required by the product spec (§4.1–4.4)

This is the closed-loop credit system and the features you described. I recommend building all of it,
in this order, because each stage depends on the previous one.

### 2.1 Money core — Pewgift closed loop (spec §2, plan §4.1)

| New object | Why |
| --- | --- |
| `ledger_entries` (append-only, double-entry, monthly partitions) | Today balances live on `wallets` with no audit trail; nothing guarantees debits equal credits. This is the single biggest correctness gap in the app. |
| `deposits` | Records PSP reference, gross external amount, **rate snapshot at settlement**, fee breakdown, resulting Pewgift credit. Required by "converted at the live rate at the exact moment of deposit". |
| `fee_settings`, `country_tiers` | Already referenced by code (6 + 2 files) with no table. Drives the deposit-fee and app-% deduction. |
| `payment_providers` | Plug-and-play PSP registry (Stripe/Paystack/PayPal/…): enable, configure, order, per-route limits. |
| Idempotency keys on every money mutation | Prevents double-credit on PSP webhook retries. |
| `SECURITY DEFINER` functions with `SELECT … FOR UPDATE` | Pessimistic row locks so two concurrent gifts/trades can't double-spend. This is the part that actually prevents loss; Redlock (below) is an optimisation on top. |
| Seed `gift_catalog` with your tier matrix | Snowfall 0.067 → Planet Mars 5000, with `tier` (small/luxury), animation id and audio cue, and the `< 5 Pew` vs `≥ 5 Pew` threshold stored as data, not hard-coded. |

**Invariant to enforce in the DB, not the app:** Pewgift credits are non-transferable outside the
closed loop, balances never go negative, and every balance change has a matching ledger pair.

### 2.2 Deposit engine + P2P/B2P matching + escrow (spec §3, plan §4.2)

| New object | Why |
| --- | --- |
| `seller_listings` | Asset (fiat or crypto), currency, margin %, min/max per trade, status. There is no listing entity today. |
| `seller_payment_methods` | Method 1 bank/crypto (admin-verified, account name must match KYC identity) and Method 2 custom instructions (400-char, admin-approved). |
| `p2p_profiles` | Referenced by 4 files, doesn't exist. Sell privilege, margin bounds (default 0–3%, per-user override), verification badges. |
| Matching function | Your exact priority order: manager/admin sellers → asset match → lowest effective price (`rate + app% + deposit fee + margin`) → verified badge → secondary method match. |
| Listing freeze + admin alert | Price/margin/currency/method edits blocked during an active trade and flagged if made within 3h before it. |
| Reconcile `escrow_trades`/`trades` (12 + 9 files) | Live DB has `p2p_trades` + `escrow_agreements`/`_milestones`/`_disputes`/`_transactions`. Recommendation: **repoint** to the live escrow tables and add the missing lifecycle columns, rather than creating a parallel escrow model. |
| Bind trade chat to escrow | `chat_rooms` row per trade, released/closed with the trade. |

### 2.3 Live battles & gifting (spec §4, plan §4.3)

`stream_matches` (solo/team, server-authoritative timer, state), `stream_match_participants`
(teams/co-hosts), `stream_match_events` (gift + tap contributions, server timestamps).
Tug-of-war score is **derived** from events, never written by the client; the terminal
victory/defeat state is written once at 00:00 by the server.

### 2.4 Feed integration (spec §5, plan §4.4)

No new tables — add live streams and active battles as candidates in the "For You" ranking with a
recency + gift-velocity boost.

---

## Group 3 — BUILD or RETIRE (**your decision**, my recommendation in bold)

These have UI/routes today but no schema. Each one is "build the table" or "delete the feature".

| Feature | Code footprint | My recommendation |
| --- | --- | --- |
| Interests (`interests`, `user_interests`) | 22 files, incl. profile-completion UI and admin CRUD | **BUILD** — the signup flow already asks for interests and the feed algorithm needs them |
| Universe chat (`universe_messages`) | 15 files, sidebar link, filter API | **BUILD** — it's a shipped, linked feature |
| PALs (`pals`) | 10 files, sidebar link | **BUILD** — small table, already linked from the feed |
| User settings / presence (`user_settings`, `user_presence`, `profile_privacy_settings`, `social_links`) | 22 files, `/settings` page | **BUILD** — settings currently can't persist |
| Verification (`verifications`, `badge_requests`, `verified_badges`) | 16 files; feed shows "Verification ⏳ Pending" | **BUILD** — P2P seller ranking depends on verified badges |
| Support agents / live chat (`support_agents`, `agent_status`, `live_chat_configs`) | 17 files, `/support`, `/support-chat` | **BUILD** — the deposit spec requires a support-agent redirect route |
| Policies (`policies`, `terms_and_policies`) | 12 files, `/terms-and-policy` | **BUILD** — trade T&C acceptance is required before escrow lock |
| Translations (`translations`, `translation_logs`) | 8 files, admin page, chat translate | **BUILD** small, or **RETIRE** the admin page and keep local JSON. Cheaper: keep local files, retire the admin CRUD |
| Premium (`premium_subscriptions`, `premium_access_rules`, `premium_events`) | 17 files | **DECISION NEEDED** — is paid premium part of v1, or is monetisation only Pewgift/ads/P2P? |
| Ranks (`ranks`, `rank_config`) | 8 files; `user` already has rank columns | **REPOINT** to the existing `user` columns + one small `rank_config` table |
| Media (`file_uploads`, `media_files`) | 14 files, storage cleanup job | **BUILD** one `media_assets` table (both names are the same concept) |
| Match / cross-meet (`match_requests`, `match_events`) | 8 files, sidebar links | **BUILD** — otherwise `/match` and `/cross-meet` are permanently empty |
| Post drafts (`post_drafts`) | 4 files | **BUILD** — trivial |
| Wallet locks (`wallet_locks`, `balance_lock_logs`, `balance_adjustments`) | 7 files, admin lock toggle | **BUILD** — folds into the ledger work in 2.1 |
| Admin overrides / filters (`user_overrides`, `filter_requests`, `user_features`, `global_settings`, `settings`) | 24 files | **REPOINT** to the existing `platform_configurations` table instead of 5 new tables |
| Security/audit (`security_events`, `admin_actions`, `security_restrictions`, `flagged_content`, `user_sessions`) | 20 files | **BUILD** — required by the NFR audit-logging requirement; `audit_logs` already exists and can absorb most of it |
| Compliance (`sanctioned_entities`, `compliance_rules`, `user_compliance`) | 5 files | **DECISION NEEDED** — do you want AML/sanctions screening in v1? |
| **Crypto swap (`swap_transactions`)** | 1 model file | **RETIRE** — an in-app crypto swap directly contradicts your zero-custody closed-loop model |
| A/B testing + ML (`ab_tests`, `ab_test_assignments`, `ml_algorithm_config`, `ml_alerts`, `model_performance`, `bandit/incrementality`) | 14 files, admin pages | **RETIRE for now** (feature-flag the admin pages off) — large surface, zero user impact, can return later |
| Ops dashboards (`server_health`, `load_balancer_logs`) | 2 files | **RETIRE** — this data belongs in your APM/monitoring stack, not in Postgres |
| Ad analytics (`ad_analytics`, `ad_performance`, `ad_spend_log`, `post_analytics`, `profile_analytics`) | 11 files | **BUILD** one `analytics_events` table + views, rather than five per-surface tables |

---

## Group 4 — Enterprise NFRs

### 4a. I can do these now, in this repo, no decision needed
1. **DB-level money safety** — row locks + double-entry invariants inside `SECURITY DEFINER` functions (part of 2.1). *This is the one that actually prevents double-spend.*
2. **Input sanitisation** — a shared `defineValidatedHandler` with Zod schemas on every `/api/**` route.
3. **RBAC** — one server-side permission matrix + RLS; the client `use-rbac` becomes display-only, never the enforcement point.
4. **Rate limiting** — Nitro middleware keyed per IP and per `user_id` (in-memory now, swaps to Redis when you have one).
5. **Timeouts + circuit breakers** — 5s `AbortSignal.timeout` and a breaker around every outbound PSP/CDN/ML call.
6. **Structured JSON logging** with a request correlation id.
7. **Monthly partitioning** of `ledger_entries` / `transactions` / `ad_interactions` with a rollover job (works on Supabase).

### 4b. Needs a provider/credential from you before I can wire it
| Requirement | What I need |
| --- | --- |
| Redis (cache, rate-limit store, Redlock) | A Redis URL (Upstash free tier works, or Zeabur Redis) |
| Sentry / APM | A DSN |
| Queues (emails, push, audit, fee calc, media) | Pick one: **Supabase queues/pg_cron** (simplest, no new infra) · RabbitMQ · Kafka |
| CDN | Confirm the provider; the S3/CloudFront client is already v3 |

### 4c. Cannot be done by changing this repo — platform programme
- **Horizontal sharding by `user_id`** — Supabase is one Postgres. Sharding means Citus, multiple projects + a routing layer, or leaving Supabase. Partitioning (4a.7) gets you most of the write throughput without this; I'd defer sharding until it's actually needed.
- **L7 load balancing, autoscaling, multi-region snapshots, PITR, WAL archiving, failover drills** — Zeabur/Supabase plan configuration.
- **True end-to-end encryption** — TLS is already there. Client-held-key E2E would make server-side moderation, translation and escrow-chat evidence impossible. Recommendation: **keep TLS + encryption at rest**, and don't do client-side E2E.

---

## What I need from you

**Decision 1 — the big one.** Approve Groups 1 + 2 + 4a as a single work programme (repoints, money core, P2P/escrow, battles, feed, and the in-repo NFRs)? That's the bulk of the work and it all follows from what you've already specified.

**Decision 2 — Group 3 exceptions.** My recommendations are in the table. The three I will not decide for you:
- Premium subscriptions: in v1 or not?
- AML/sanctions screening: in v1 or not?
- Retiring A/B testing + ML + ops-dashboard tables (and feature-flagging those admin pages off): OK?

**Decision 3 — queues.** Supabase queues/pg_cron (no new infra) vs RabbitMQ vs Kafka.

**Decision 4 — access.** I'll need the new DB password when the migrations are ready to apply
(PostgREST can't run DDL). I don't need it before then.

## Order I'd execute in, once approved

1. Group 1 repoints + counter columns → the app stops erroring for a normal signed-in user.
2. Group 2.1 money core (ledger, deposits, fees, locks, seeded gift catalog).
3. Group 2.2 P2P/escrow/PSP.
4. Group 2.3 battles + 2.4 feed integration.
5. Group 4a NFR hardening, applied to the code written in 1–4.
6. Approved Group 3 builds, largest user impact first.
