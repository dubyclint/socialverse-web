// Populates `event.context.user` from the Supabase SSR session for every
// `/api/**` request. Registered here (not via `nitro.handlers`) because only
// `server/middleware/*` is guaranteed to run on every request.
export { default } from '~/server/gateway/auth/auth-header'
