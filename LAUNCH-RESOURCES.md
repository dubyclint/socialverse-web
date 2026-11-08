# Viorp launch resources: 100k to 10M users

These are planning estimates for the current stack (Nuxt 3/Nitro on Zeabur, Supabase Postgres + Auth + Realtime + Storage, Upstash Redis, Cloudflare Stream/TURN, Resend, Didit, Flutterwave/Paystack/NowPayments). They assume about 20% of registered users are active each day (DAU), and about 5% of DAU are online at peak. Load-test each stage before moving up to it.

## 1. Load assumptions per stage

| Registered users | DAU | Peak concurrent | Peak API req/s | Peak sockets | Concurrent LIVE viewers |
|---|---|---|---|---|---|
| 100k | 20k | 1–2k | 300–600 | 2k | 500 |
| 500k | 100k | 5–8k | 1.5–3k | 8k | 3k |
| 1M | 200k | 10–15k | 3–6k | 15k | 6k |
| 5M | 1M | 50–75k | 15–30k | 75k | 30k |
| 10M | 2M | 100–150k | 30–60k | 150k | 60k |

A single active session generates about 0.3 req/s on average: feed pages, Veep events, heartbeats, chat and notifications.

## 2. Hosting (web/API: Nuxt Nitro)

| Stage | App instances (2 vCPU / 4 GB) | Region | Notes |
|---|---|---|---|
| 100k | 2–3 behind a load balancer | 1 (closest to Lagos, e.g. eu-west / af-south) | Zeabur works; turn on autoscale |
| 1M | 8–15 | 1 primary + CDN | Move to a container platform with HPA (Zeabur Dedicated, Fly.io, GKE/EKS) |
| 10M | 40–80 | 2–3 (EU, Africa, US) | Kubernetes with HPA on CPU and RPS; blue/green deploys |

- Serve all static assets, `/_nuxt/*`, images and HLS through the Cloudflare CDN, which should absorb at least 85% of bytes.
- Keep `/.well-known/assetlinks.json` and `apple-app-site-association` cache-safe and outside the auth redirects.
- Run background jobs on separate worker instances (section 8), not on web pods.

## 3. Database (Supabase Postgres)

### Expected size

| Data | Per user per year | 100k | 1M | 10M |
|---|---|---|---|---|
| Profiles, settings, devices, follows/PALs | ~15 KB | 1.5 GB | 15 GB | 150 GB |
| Posts, comments, likes, hashtags | ~60 KB | 6 GB | 60 GB | 600 GB |
| Chat messages (text rows; media in storage) | ~80 KB | 8 GB | 80 GB | 800 GB |
| Feed/Veep interactions, views, ad events | ~120 KB (pruned or rolled up after 90 days) | 12 GB | 120 GB | 1.2 TB raw |
| Wallet, ledger, withdrawals, P2P, KYC metadata | ~10 KB (never deleted) | 1 GB | 10 GB | 100 GB |
| Indexes (about 40%) | | ~11 GB | ~110 GB | ~1.1 TB |
| **Total in year 1** | | **~40 GB** | **~400 GB** | **~4 TB** |

### Compute

| Stage | Primary | Read replicas | Pooler |
|---|---|---|---|
| 100k | Supabase Large/XL (4–8 vCPU, 16–32 GB) | 0–1 | Supavisor transaction mode, about 200 pooled connections |
| 1M | 4XL–8XL (16–32 vCPU, 64–128 GB) | 2 (feed and search reads) | 1,000+ |
| 10M | 16XL+ or self-managed Postgres/Aurora/AlloyDB | 4–6, plus an analytics replica | PgBouncer fleet |

### Required work before 1M
- Partition `feed_interactions`, `veep_events`, `ad_revenue_events`, `chat_messages` and `notifications` by month. Roll up older months into daily aggregates.
- Keep every money operation in `security definer` RPCs with row locks (`request_withdrawal`, `process_pewgift`, `settle_deposit`, P2P), as they are now.
- Point-in-time recovery (PITR) for at least 7 days, a nightly logical backup kept off-site, and a restore drill every quarter.
- At 10M, move chat history and event logs out of the primary, to Cassandra/ScyllaDB or ClickHouse for analytics.

## 4. Caching and cookies

- **Redis (Upstash, or Redis Cloud at 1M+):**
  - Feed candidate lists for 60 s per user/tab.
  - Trending and hashtag lists for 30–60 s.
  - Fee settings and platform configuration for 60 s.
  - Rate-limit counters, presence, device heartbeats, OTP/lockout counters.
  - Sizing: 100k about 1 GB; 1M about 8 GB; 10M a 64 GB cluster with replicas.
- **CDN:** `Cache-Control: public, max-age=31536000, immutable` for hashed assets, `s-maxage=30` for public profile/Page/post endpoints, and no-store for wallet, KYC, admin and chat.
- **Client:**
  - Feed and status snapshots in IndexedDB/localStorage, which the feed already does.
  - The device ID in `viorp:device-id`.
  - Service-worker cache for the app shell (PWA).
- **Cookies:**
  - Supabase auth cookies with `Secure`, `SameSite=Lax`, `HttpOnly` where server-set, and the `.viorp.com` domain.
  - Keep the access-token lifetime at 1 h with silent refresh. Network errors must never sign the user out.
  - Add a cookie consent banner for EU users before launching there.

## 5. WebRTC, LIVE and sockets

| Need | 100k | 1M | 10M |
|---|---|---|---|
| Supabase Realtime (chat, typing, presence, LIVE chat/likes) | Pro plan, 10k concurrent connections | Team/Enterprise, 50k+ | Self-hosted Realtime or Centrifugo/Ably cluster, 150k+ |
| LIVE delivery to viewers | Cloudflare Stream (WHIP in, WHEP/HLS out) | Cloudflare Stream | Cloudflare Stream plus a second CDN for failover |
| Guests/co-hosts (up to 8/4) | SFU needed past 4 people: Cloudflare Calls or LiveKit Cloud | LiveKit/Calls | LiveKit self-hosted cluster |
| TURN for 1:1 calls and guests | Cloudflare TURN | Cloudflare TURN | Cloudflare TURN plus coturn fallback |
| Veep/feed video | HLS via Cloudflare Stream or R2 + transcoder | same | same, with multi-bitrate ladders |

- **Bandwidth:** each LIVE viewer at 720p uses about 1.5 Mbps, so 6k concurrent viewers is about 9 Gbps of egress. This must be CDN egress, never the app servers.
- **Cost guide:** Cloudflare Stream is about $1 per 1,000 minutes delivered. 1M users watching 10 min/day comes to roughly $3k/month.
- Browser-mesh LIVE only suits about 20 viewers. Keep it as a dev-only fallback.

## 6. Storage and media

- Supabase Storage or Cloudflare R2 for uploads. R2 has no egress fees and suits 1M+.
- **Expected size:** about 150 MB per active user per year (photos, videos, statuses, chat media). That is about 3 TB at 100k, 30 TB at 1M and 300 TB at 10M. Expire statuses after 24 h and delete their media after 30 days.
- Transcode videos server-side to H.264/HLS. Generate WebP/AVIF thumbnails. Strip EXIF location.

## 7. Security

- Cloudflare WAF and bot management in front of everything, with API rate limits per IP and per user. Login lockout already exists.
- TOTP 2FA, Devices page (one device / approved devices), session revocation and an audit log of admin actions.
- RLS on every public table, and the service role used only on the server. Rotate keys every quarter and whenever one leaks (for example the Didit key once committed in Sutoi.md).
- KYC (Didit and manual) before any withdrawal. Velocity limits on withdrawals and direct-PEW (500/30 days by default). Hold for manual review above admin thresholds.
- PCI: card data stays with Flutterwave/Paystack only. Verify webhook signatures for every gateway and for Didit.
- Encryption: TLS 1.2+ everywhere, Postgres encryption at rest, and KYC documents in a private bucket behind signed URLs that expire in 5 minutes or less.
- Compliance:
  - NDPR (Nigeria) and GDPR (EU): privacy policy, data export and account deletion with a retention window.
  - CBN/AML: transaction monitoring and suspicious-activity reporting for P2P and wallets.
- Content moderation: report queues, automatic nudity/violence detection on uploads (e.g. AWS Rekognition or Hive) at 1M+, and CSAM hash matching (PhotoDNA) before 1M.
- Yearly penetration test, and a bug bounty from 1M.

## 8. Jobs and queues

| Job | Schedule | Tool |
|---|---|---|
| Creator payout statements (7-day period) | daily | pg_cron or worker |
| Deposit/withdrawal reconciliation with gateways | every 10 min | worker + gateway APIs |
| P2P escrow timeouts (45 min) and dispute escalation | every minute | pg_cron |
| Feed/trending rollups, hashtag scores | every 1–5 min | worker + Redis |
| Event-table partition creation and pruning | monthly | pg_cron |
| Status expiry and media cleanup | hourly | worker |
| Account deletion purge after the retention window | daily | worker |
| Push, email and SMS fan-out | continuous | Queue (Upstash QStash, BullMQ on Redis, or SQS) |
| Video transcoding | on upload | Cloudflare Stream or a GPU/FFmpeg worker pool |

## 9. Observability and operations

- **Errors:** Sentry for web, Android and iOS, with release tracking.
- **Metrics/logs:** Grafana Cloud or Datadog for API latency (p50/p95/p99), DB load, Realtime connections, LIVE stream health and queue depth.
- **Uptime:** Better Uptime or Pingdom on `/`, `/api/health`, assetlinks.json and the payment webhooks.
- **On-call:** PagerDuty or Opsgenie from 1M, with runbooks for database failover, gateway outage and a leaked key.
- **Targets:** feed first paint under 1.5 s on 4G, p95 API under 300 ms, and 99.9% uptime.

## 10. Rough monthly cost (USD)

| Item | 100k | 1M | 10M |
|---|---|---|---|
| App hosting | 150–400 | 1.5k–3k | 15k–30k |
| Database (+ replicas, PITR) | 400–1k | 4k–8k | 30k–60k |
| Redis | 50–100 | 400–800 | 3k–6k |
| Realtime/sockets | 25–600 | 2k–5k | 15k–30k |
| Storage + CDN (R2/Cloudflare) | 100–300 | 1k–3k | 10k–25k |
| LIVE/Stream/TURN | 300–1k | 3k–8k | 30k–80k |
| Email/SMS/push | 50–200 | 500–2k | 5k–15k |
| KYC (Didit, per verification) | usage | usage | usage |
| Monitoring/security (Sentry, WAF, moderation) | 100–300 | 1.5k–4k | 10k–25k |
| **Total** | **~1.2k–4k** | **~14k–34k** | **~120k–270k** |

## 11. Team

| Stage | People |
|---|---|
| 100k | 2–4 engineers, 1 support/moderation |
| 1M | 8–12 engineers (backend, mobile, SRE, security), 5–10 moderation/support, a compliance officer |
| 10M | 30+ engineers, 24/7 SRE, a trust and safety team, legal/compliance per country |
