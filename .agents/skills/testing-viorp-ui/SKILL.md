---
name: testing-viorp-ui
description: How to run end-to-end browser testing of the Viorp/SocialVerse Nuxt app (profile, posts, feed ads, chat/DM, Pewgift, streaming, branding) against the live Supabase project, including two-user setups and fixtures that have no admin UI.
---

# Testing the Viorp (socialverse-web) UI end to end

## Starting the app
```bash
export PATH="$HOME/.nvm/versions/node/v22.23.1/bin:$PATH"
cd /home/ubuntu/repos/socialverse-web
nohup npm run dev > /tmp/dev.log 2>&1 &   # http://localhost:3000
```
- `.env` in the repo root holds the live Supabase URL/anon/service-role keys; Nuxt loads it automatically.
- Prod entrypoint is `npm start` (`node scripts/start-server.mjs`, maps `SUPABASE_*` → `NUXT_PUBLIC_*`). `.output` may hold a static Capacitor SPA build — do not test against it, use the dev server.
- `/tmp/dev.log` shows every request line (`"method":"POST","path":"/api/feed/track","status":200`), which is the easiest way to assert that background API calls fired without opening devtools.

## Two authenticated users
- Use two Chrome profiles (main `/home/ubuntu/.browser_data_dir`, second `/tmp/chrome-userb`) and sign each into a different account via `/signin`. Email confirmation is off, so `/signup` can create fresh accounts.
- DM search (`/api/chat/people`) is **network-scoped** (follows/followers/contacts/existing partners). Two brand-new accounts therefore cannot DM each other and there is no in-UI way to connect them — use a pre-existing pair that already has a conversation.
- To show receipts/typing side by side, tile the two windows with `wmctrl` instead of alt-tabbing (typing indicators expire in a few seconds):
  ```bash
  wmctrl -lG                      # get window ids
  wmctrl -i -r <id> -b remove,maximized_vert,maximized_horz
  wmctrl -i -r <idA> -e 0,0,0,800,1150
  wmctrl -i -r <idB> -e 0,800,0,800,1150
  ```
  Type in one window and zoom on the other window's chat header to capture "… is typing...".

## Fixtures without an admin UI
- Ad-before-posts ordering needs a row in `ads_campaigns` with `status=ACTIVE`, `remaining_budget > 0` and a valid date window; the in-app ads submit flow only creates `PENDING_REVIEW`, and the ads manage page uses mock data. Seed (and delete afterwards) via service-role REST:
  ```bash
  set -a; . ./.env; set +a
  curl -s -X POST "$SUPABASE_URL/rest/v1/ads_campaigns" \
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" -d '{"title":"QA Sponsored Campaign","status":"ACTIVE",...}'
  ```
  `platform_configurations.ad_serving` controls placement (`first_slot: 0` ⇒ ad renders above the first ranked post).
- Wallet balances are visible in the `/feed` left sidebar ("Wallet Balance PEW x.xx"), so gift debits/credits can be asserted purely in the UI (send from a post's Gift button → gift picker → "Send Gift (1 PEW)").

## UI paths worth knowing
- The `/feed` avatar only **navigates** to `/profile`; the composer's Photo/Video/Feeling/Poll buttons go to `/posts/create`. The actual avatar upload is the camera button on `/profile` (or `/profile/edit` → Profile Picture).
- Post creation: `/posts/create` (real insert via `/api/posts/create`) and the inline composer on `/posts`.
- Feed impressions batch and flush ~4s after scrolling → `POST /api/feed/track`.

## Known fragile areas to re-check
- `/posts` list rendering may show the author object as raw JSON and `Invalid Date` while `/feed` and `/posts/[id]` render the same post fine.
- `/stream/broadcast` can hang on "Preparing..." on a box with no camera/mic, and its panels may render light-on-light instead of the Aurora Night theme.
- `DotVLoader` logs Vue warnings about setting `width`/`height` props on an `<svg>`; harmless but noisy.
- Profile save used to 500 with an empty Date of Birth (`invalid input syntax for type date: ""`) — always retest saving with the field blank.

## Devin Secrets Needed
- None beyond the repo `.env` (Supabase URL, anon key, service-role key). `SUPABASE_DB_URL` exists as a secret if direct SQL is needed.
