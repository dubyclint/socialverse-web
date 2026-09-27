# SocialVerse — DB/Codebase Unification & Enterprise Architecture Plan

Living document. Status legend: **[done]**, **[in progress]**, **[to do]**, **[needs decision]**, **[out of repo]** (platform/infra work that cannot be delivered by changing this codebase).

---

## 0. Where the project actually stands

Measured against the live Supabase project (`idguhsjzhfzamwrptncu`) on the current branch:

| Signal | Value |
| --- | --- |
| Live public tables + views | 50 |
| Distinct tables referenced by code (`.from('…')`) | 151 |
| Referenced but **not present** in the live DB | 113 |
| `nuxi typecheck` | 0 errors |
| Production build (`NITRO_PRESET=node-server`, no Supabase env) | green |

The 113 missing tables are the real remaining problem. They do not show up in typecheck because most of those call sites run through untyped server clients (`getSupabaseAdmin()` returns `any`). Every one of them fails at runtime with `relation does not exist`.

Most referenced missing tables (file count):

```
users(21) interests(9) user_wallets(7) universe_messages(7) user_interests(5)
pewgift_types(5) translations(4) stream_chat(4) premium_subscriptions(4)
policies(4) pals(4) filter_requests(4) escrow_trades(4) …
```

---

## 1. Completed

**Tooling / type safety**
- **[done]** Nuxt-aware checking (`nuxi prepare` + `nuxi typecheck`) instead of plain `tsc`.
- **[done]** Removed the broad `any` shims (Vue API override, module shims) and fixed the ~715 genuine errors they were hiding. Currently 0 errors.
- **[done]** `types/database.types.ts` is now generated from the live database, with **no** fallback index signature — so any reference to a table/column that does not exist is a typecheck failure, not silent `any`.
- **[done]** `cdn-manager.ts` migrated from the unusable `aws-sdk@1.18` pin to AWS SDK v3.
- **[done]** Build blockers fixed: `.nuxtignore` `dist` was unanchored and matched `node_modules/@nuxtjs/supabase/dist`, which is why `useSupabaseUser` could not be found during the Docker build.

**Authentication (single source of truth)**
- **[done]** `@nuxtjs/supabase` owns auth; SSR cookie (`sb-socialverse…`) is the only credential.
- **[done]** Removed the parallel token layer (`auth_token` cookie, manual `Authorization` injection on same-origin calls, duplicate `/api/auth/login`, fake `serverSupabaseClient()` stub).
- **[done]** `requireAuth`/`requirePermission` rewritten on `serverSupabaseUser(event)`, so every `/api/**` route was fixed at once.
- **[done]** `requireAdmin()` no longer returns a stub admin identity (it previously made every caller an admin).

**Database**
- **[done]** `db-gap-user-table.sql` — profile columns the app selects (`email`, `full_name`, `profile_completed`, rank/counters, …).
- **[done]** `db-rls-policies.sql` — owner/participant-scoped policies for ~35 tables that had RLS enabled and **no** policies (they were unreadable by every authenticated user).
- **[done]** `db-align-app-schema.sql` — `manager` role added to the `user_role` enum, per-user stream preferences, and the wallet feature tables `payment_methods`, `withdrawals`, `referrals` with RLS.
- **[done]** Code repointed at real tables/enums: admin panel (`pews`→`posts`, `user_balances`→`wallets`, `user_roles`→`user`, `content_reports`→`reports`), `pages/wallet.vue`, `pages/ads.vue` (status enum is uppercase), `pages/stream/history.vue` (`stream_sessions`→`streams`), `StreamAdOverlay` (`ads_campaigns` real columns, `ad_interactions.campaign_id`).
- **[done]** Admin balance adjustment moved off client-side writes (blocked by RLS anyway) to `POST /api/admin/balance-adjustment` using the service-role client.

**Frontend**
- **[done]** `useSocialFeed()` rebuilt against the live schema and against what `pages/feed.vue` actually destructures.
- **[done]** `<Icon>` resolves (`components/ui` registered without a path prefix).
- **[done]** Feed navigation/sidebar links to every feature index: p2p, escrow, streaming, chat, ads, support, monetization, universe, wallet, my-pocket, pewgift, match, pal, cross-meet, trade-listings.
- **[done]** Service-worker MIME/caching bug and the permanent app loader fixed; public pages no longer 401 (presence/discovery are gated on an authenticated user).

---

## 2. Remaining unification work (staged)

### Stage A — golden-path correctness *(next)*
Fix the mismatches a signed-in user hits in normal use. Rename to the live table, or add the table when the feature genuinely has no home.

| Code reference | Live equivalent | Action |
| --- | --- | --- |
| `users`, `user_profiles` | `user` (+ `profiles` view) | rename |
| `user_wallets`, `wallet_transactions` | `wallets`, `wallet_ledger` / `transactions` | rename |
| `chats`, `chat_conversations`, `chat_participants`, `chat_sessions` | `chat_rooms`, `chat_room_members`, `chat_messages` | rename |
| `statuses`, `status_views_legacy` | `user_statuses`, `status_views` | rename |
| `likes`, `post_views`, `post_shares` | `post_likes` (+ counters on `posts`) | rename / add |
| `stream_chat`, `stream_viewers`, `stream_views` | `stream_chats`, counters on `streams` | rename / add |
| `pew_gifts`, `pewgifts`, `pewgift_transactions`, `pewgift_types`, `pewgift_balance` | `gift_catalog`, `gift_transactions`, `post_gifts`, `wallets` | rename (see §4.1) |
| `friendships`, `connections`, `blocked_users` | `follows` / `user_follows`, `user_blocks` | rename |
| `hashtags` | `tags`, `trending_hashtags` | rename |
| `notifications` | exists | verify shape |

### Stage B — features with no schema at all
Each needs a migration + RLS, or explicit removal of the dead UI: `interests`/`user_interests`, `universe_messages`, `pals`, `user_settings`, `user_presence`, `post_drafts`, `translations`, `policies`/`terms_and_policies`, `support_agents`, `badge_requests`/`verifications`/`verified_badges`, `premium_subscriptions`/`premium_access_rules`, `escrow_trades`/`escrow_deals` (vs the existing `escrow_agreements`), `trades`/`p2p_profiles` (vs `p2p_trades`), `fee_settings`, `country_tiers`, `global_settings`/`settings`. **[needs decision]** per feature: build or delete.

### Stage C — analytics/ML/admin surfaces
`ab_tests*`, `bandit_performance`, `incrementality_*`, `model_performance`, `ml_*`, `ad_analytics`/`ad_performance`/`ad_spend_log`, `server_health`, `load_balancer_logs`, `security_events`, `admin_actions`, `audit`-adjacent tables. Lowest user impact; largest surface. Recommendation: keep behind an admin feature flag until the tables exist rather than shipping pages that always error.

### Stage D — type-safety ratchet
Server routes still use untyped clients, which is why Stage A/B bugs are invisible to the compiler. Convert `getSupabaseAdmin()`/`getSupabaseClient()` to `SupabaseClient<Database>` so every remaining mismatch becomes a compile error, and delete the `db`/`supabase` permissive shims in `server/utils/database.ts`.

---

## 3. Enterprise NFRs — feasibility split

Roughly a third of the requested NFR list is application code; the rest is platform work that has to be provisioned and paid for, and cannot be delivered by editing this repository.

### Deliverable in this codebase
| Requirement | Plan | Status |
| --- | --- | --- |
| RBAC | Roles live on `user.role` (`user`/`moderator`/`manager`/`admin`) + RLS policies + `requireRole`. Needs a single server-side permission matrix; the client-side `use-rbac` calls must not be the enforcement point. | **[to do]** partially done |
| Sanitized input handling | Zod (or valibot) schemas on every `/api/**` handler via a shared `defineValidatedHandler`. | **[to do]** |
| Rate limiting | Nitro middleware keyed on IP + `user_id`, backed by Redis (falls back to in-memory in dev). | **[to do]** |
| Request timeouts / circuit breakers | Wrap outbound PSP/CDN/ML calls with an `AbortSignal.timeout(5s)` + breaker helper. | **[to do]** |
| Structured JSON logging + APM/Sentry | `@sentry/nuxt`, request-scoped correlation id, JSON log formatter. | **[needs decision]** (DSN/vendor) |
| Caching | Redis client + `cachedFunction` for rates, match scores, leaderboards; CDN headers on static/media routes. | **[needs decision]** (Redis host) |
| Queues | Producer abstraction + workers for emails, push, audit, fee calculation, media processing. | **[needs decision]** (Kafka vs RabbitMQ vs Supabase queues) |
| Distributed locks | Redlock around ledger writes, escrow balance mutations and active P2P sessions; plus `SELECT … FOR UPDATE` (pessimistic) inside the Postgres functions that move money. | **[to do]** — the DB-side locking is the part that actually prevents double-spend and should land first |
| Partitioning | Monthly range partitions on `transactions` / `wallet_ledger` / `ad_interactions` with a rollover job. | **[to do]** — doable on Supabase |

### Not deliverable here — platform decisions required
- **Horizontal sharding by `user_id`** — Supabase is a single Postgres. Sharding means either Citus, multiple projects with a routing layer, or moving off Supabase. This is a migration programme, not a code change. **[needs decision]**
- **Layer‑7 load balancing, auto-scaling tiers, multi-region DR/PITR/WAL archiving, failover drills** — provisioning on your hosting platform (currently Zeabur). Supabase Pro gives PITR; multi-region needs a plan/vendor decision. **[out of repo]**
- **End-to-end encryption of API traffic** — TLS is already in place; true E2E (client-held keys) changes the product (no server-side moderation of encrypted chat). **[needs decision]**

**Recommended order:** DB-level money-safety (locking + ledger invariants) → input validation → rate limiting → observability → caching → queues → partitioning → (only then) sharding.

---

## 4. Product specs vs. current schema

### 4.1 Pewgift closed-loop credit (1 Pew = $1.00)
Exists: `wallets`, `wallet_ledger`, `transactions`, `gift_catalog`, `gift_limits`, `gift_transactions`, `post_gifts`, RPC `process_pewgift`, RPC `atomic_transfer`.
Gaps: no deposit/settlement records, no fee configuration, no rate snapshotting, no non-transferable credit invariant, no double-entry guarantee, no idempotency keys, gift catalog is not seeded with the specified tier matrix (Snowfall 0.067 → Planet Mars 5000).
Plan: single `ledger_entries` table (double-entry, append-only, partitioned monthly), all mutations through `SECURITY DEFINER` functions holding row locks, `deposits` table capturing PSP reference + rate + fee breakdown at settlement time, `fee_settings` table driving the deduction, and a seeded `gift_catalog` with tier/animation/audio metadata (`< 5 Pew` = light animation, `≥ 5 Pew` = full-screen 3D + audio cue).

### 4.2 Deposit engine, P2P/B2P matching, escrow
Exists: `p2p_trades`, `escrow_agreements`, `escrow_milestones`, `escrow_disputes`, `escrow_transactions`.
Gaps: no PSP registry/config, no seller listings, no payment-method registry with admin verification, no ranking implementation, no sell-privilege model, no margin bounds, no anti-race freeze on listing edits, no trade chat binding.
Plan: `payment_providers` (plug-and-play PSP config), `seller_listings` (asset, currency, margin, min/max, status), `seller_payment_methods` (bank/crypto requiring admin KYC-name match; plus a 400-char custom-instructions variant requiring approval), matching function implementing the stated priority order (privileged sellers → asset match → lowest effective price `rate + app% + deposit fee + margin` → verified badge → secondary method match), escrow lock on acceptance, and a listing freeze + admin security notification for edits within 3h of / during an active trade.

### 4.3 Live battles & gifting
Exists: `streams`, `stream_chats`, `call_sessions`, `call_signaling_payloads`.
Gaps: no match/battle entity, no team membership, no score events, no timer authority, no victory/defeat state, no gift→score attribution.
Plan: `stream_matches` (mode solo/team, timer, state), `stream_match_participants`, `stream_match_events` (gift and tap contributions with server timestamps), server-authoritative countdown broadcast over Realtime, tug-of-war score derived from events, terminal state written once at 00:00.

### 4.4 Algorithmic feed integration
Exists: `feed_generation_logs`, `trending_hashtags`, `user_interactions`.
Gaps: live streams and active battles are not candidates in the "For You" ranking.
Plan: add live/battle candidates with a recency+velocity boost to the feed query, and surface them in `useSocialFeed`'s `for-you` tab.

---

## 5. Immediate next steps

1. Stage A renames + a runtime smoke pass of each feature route.
2. Signup → signin → feed → feature-route recorded test on the live project.
3. Rotate the exposed Supabase service-role key, JWT secret and DB password (they were pasted into chat).
4. Then pick one of: money-safety hardening (§3 + §4.1), or the P2P/escrow build-out (§4.2).
