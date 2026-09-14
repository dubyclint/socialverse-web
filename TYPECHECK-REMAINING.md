# Typecheck Remediation — Remaining Work (batched for local Devin)

Branch: `devin/typecheck-fixes-fresh`
Command: `npm install && npx nuxi prepare && npx nuxi typecheck` (Node 22 / npm 10 required)

Baseline when this doc was written: **341 errors** (down from ~715).
Strict typing rules apply: NO broad `any` shims, NO `@ts-ignore`, NO lowering `tsconfig` strictness. Add real interfaces, type `$fetch`/`api` generics, guard nullability.

---

## Error-code distribution (341 total)

| Code | Count | Meaning | Fix pattern |
|------|-------|---------|-------------|
| TS2339 | 164 | Property does not exist | Type empty `ref([])`/`ref(null)` with real interfaces; type API responses; add missing store/composable members |
| TS6133 | 47 | Declared but never read | Remove unused imports/vars/params (prefix intentionally-unused params with `_`) |
| TS7006 | 35 | Param implicitly `any` | Annotate callback/handler params |
| TS18046 | 26 | Value is `unknown` | Add generic to `$fetch<T>()` / `api<T>()` |
| TS2322 | 21 | Type not assignable | Mostly `string \| null \| undefined` → `?? undefined`; align prop types |
| TS18047 | 9 | Value possibly `null` | Add null guards / optional chaining |
| TS2769 | 8 | No overload matches | Fix argument shapes (often event-listener casts) |
| TS2345 | 7 | Arg not assignable | Align argument types |
| TS2307 | 5 | Cannot find module | Missing deps / wrong import path (see Batch F) |
| TS2304 | 5 | Cannot find name | Missing composable imports (see Batch E) |
| others | 14 | TS2538/2362/2532/18048/7030/7016/2551/2440 | Case-by-case |

---

## Batch A — Admin pages (untyped state + unknown responses) ~63 errors
Root pattern: `ref([])`/`ref(null)` collapse to `never`; `$fetch`/`api` results are `unknown`. Define per-page interfaces + type responses.
- `pages/admin/ad-analytics.vue` (18)
- `pages/admin/trust-dashboard.vue` (10)
- `pages/admin/fee-dashboard.vue` (10)
- `pages/admin/support-agents.vue` (9)
- `pages/admin/translations.vue` (7)
- `pages/admin/user-overrides.vue` (6)
- `pages/admin/users.vue` (5)
- `pages/admin/chat-monitor.vue` (5)
- `pages/admin/verified.vue` (3), `pages/admin/matches.vue` (3), `pages/admin/inference.vue` (3), `pages/admin/index.vue` (2), `pages/admin/escrow.vue` (1)

## Batch B — Profile / user pages ~30 errors
- `pages/profile/index.vue` (17): typed `ref(null)`, remove unused; fix modal `onClose` prop typing.
- `pages/profile/edit.vue` (11): `useProfileEdit` composable return shape missing `profileError`, `isUploadingAvatar`, `error`; `Not all code paths return a value` at 313.
- `pages/manager/dashboard.vue` (13): typed activity/report refs; `getUserPermissions` missing on rbac composable; typed `$fetch` response.
- `pages/manager/user.vue` (2), `pages/profile/complete.vue` (1)

## Batch C — Feed / posts / status pages ~40 errors
- `pages/posts/index.vue` (9), `pages/posts/create.vue` (7): template refs to missing methods `addGif`, `goBack`, `triggerFileInput`, `updateCharCount` (also `components/posts/create-post.vue` (2)); a `Type 'string' not assignable to 'null | undefined'` at create.vue:165.
- `pages/status.vue` (8), `pages/pal.vue` (11), `pages/match.vue` (4), `pages/notifications.vue` (5)
- `components/posts/PostInteractionToolbar.vue` (2): `likePost`/`commentPost` missing on `usePostInteractions` (or similar) composable.

## Batch D — Streaming & chat components ~50 errors
- `components/universe-chat.vue` (13), `components/user-inbox.vue` (10)
- `components/streaming/mobile-stream-player.vue` (11), `components/streaming/stream-chat.vue` (4), `stream-controls.vue` (1), `mobile-camera-stream.vue` (1)
- `pages/stream.vue` (8), `pages/stream/index.vue` (2), `pages/support-chat.vue` (7)
- `components/emoji-picker.vue` (7), `components/chat/emoji-picker.vue` (4), `components/chat/universe-chat-window.vue` (3), `components/chat/group-chat.vue` (1), `components/chat/chat-layout.vue` (1), `components/group-chat.vue` (1), `components/create-group.vue` (1)

## Batch E — Missing composable auto-imports (TS2304) — quick wins, 5 errors
These reference composables that aren't imported (or don't exist — verify before creating):
- `components/EmailVerificationBanner.vue:113` `useAuthStore`
- `components/layout/footer.vue:88,89` `useAuthStore`, `useAuth`
- `components/auth/email-verification.vue:88` `useAuth`
- `middleware/admin.ts:3` `useSupabaseUser` (from `@nuxtjs/supabase` — add import)
Note: the canonical user store is `useUserStore` (`stores/user.ts`); map `useAuthStore`/`useAuth` to it unless a distinct auth composable is intended.

## Batch F — Missing modules / deps (TS2307/TS7016) — NEEDS USER DECISION, 6 errors
Do NOT blindly `npm install`. Confirm intent first:
- `axios` — dynamically imported in `push-engine.ts`, `server/services/geo-service.ts`, `server/services/sanctions-service.ts`. Either add `axios` as a dep, or replace with native `fetch`/`$fetch`.
- `@tensorflow/tfjs-node` — `server/ml/core/tensor-flow-model.ts`. Heavy native dep; confirm it's actually used at runtime.
- `aws-sdk` (TS7016, no types) — `server/utils/cdn-manager.ts`. Installed but no types; migrate to `@aws-sdk/*` v3 (typed) or add types.
- `~/models/Verification` — `components/verification-application-modal.vue:483`. Wrong path / missing module; find the real model location.
- `emoji-js` — has a hand-written shim in `types/ambient-shims.d.ts` but is not installed; confirm whether to add the runtime dep.
- `hls.js` — dynamically imported in `composables/use-streaming.ts`; confirm dep.

## Batch G — Financial / escrow / trade components ~20 errors
- `pages/escrow.vue` (6), `pages/ads/index.vue` (6), `pages/ads.vue` (1), `pages/pewgift.vue` (2), `pages/trade-listings.vue` (2)
- `components/admin/escrow-action-control.vue` (4), `components/admin/panel.vue` (3)
- `components/trade-message.vue` (3), `components/financial/gifts/pewgift-picker.vue` (3), `components/financial/escrow/escrow-message.vue` (3)
- `components/verification-application-modal.vue` (11 — includes Batch F module path)

## Batch H — Server / middleware ~26 errors
- `server/api/match/group.ts` (7): typed handler body/response.
- `server/api/ads/preview.ts` (3), `ads/metrics.ts` (2), `ads/ab-metrics.ts` (2)
- `server/api/stream/[id]*.ts` (8 files, 1 each): likely shared `db`/response typing.
- `server/services/*`, `server/utils/cdn-manager.ts`, `server/ml/*`, `server/error-handler.ts`, `middleware/language-check.ts`, `middleware/admin.ts` (Batch E overlap)

## Batch I — Misc / one-offs ~9 errors
- `pages/terms-and-policy.vue` (6), `pages/groups/[id].vue` (4)
- `pages/error.vue:29` TS2440 `defineProps` import conflicts with the compiler macro — remove the manual `defineProps` import.
- `components/ui/icon.vue` (1), `components/profile/avatar-upload.vue` (1), `composables/use-security.ts` (1)

---

### Suggested order for the local Devin
1. Batch E (quick TS2304 imports) and Batch I one-offs — fast wins.
2. Batch F — get the dependency decisions from the user, then apply.
3. Batch A + B + C (largest clusters, same `never`/`unknown` patterns).
4. Batch D, G, H.
5. Re-run `npx nuxi typecheck` after each batch; then `npm run lint`, `npm run build`, `npm run test`.
