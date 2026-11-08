import { applyActingAs } from '~/utils/acting-as'
import { useContextStore } from '~/stores/context'

const RETRY_STATUS = [401, 408, 409, 425, 429, 500, 502, 503, 504]

// Every $fetch carries the active identity so the server can authorise Page actions.
// A 401 while a local session exists usually means the access-token cookie expired
// (app backgrounded, weak network); refresh it once and retry instead of failing.
export default defineNuxtPlugin(() => {
  const supabase = useSupabaseClient()
  let refreshing: Promise<boolean> | null = null
  const refreshOnce = () => {
    refreshing ??= supabase.auth.refreshSession()
      .then(({ data, error }) => !error && !!data.session)
      .catch(() => false)
      .finally(() => { setTimeout(() => { refreshing = null }, 5_000) })
    return refreshing
  }

  const base = globalThis.$fetch
  globalThis.$fetch = base.create({
    retryStatusCodes: RETRY_STATUS,
    retryDelay: ctx => (ctx.response?.status === 401 ? 400 : 0),
    onRequest({ options }) {
      applyActingAs(options as { headers?: HeadersInit })
    },
    async onResponseError({ response }) {
      if (response.status === 401 && useSupabaseUser().value) await refreshOnce()
    }
  }) as typeof globalThis.$fetch

  const supabaseUser = useSupabaseUser()
  const context = useContextStore()
  watch(() => supabaseUser.value?.id, (id) => {
    if (id) context.init().catch(e => console.error('[context] init failed', e))
    else context.reset()
  }, { immediate: true })
})
