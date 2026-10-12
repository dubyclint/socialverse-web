import { applyActingAs } from '~/utils/acting-as'
import { useContextStore } from '~/stores/context'

// Every $fetch carries the active identity so the server can authorise Page actions.
export default defineNuxtPlugin(() => {
  const base = globalThis.$fetch
  globalThis.$fetch = base.create({
    onRequest({ options }) {
      applyActingAs(options as { headers?: HeadersInit })
    }
  }) as typeof globalThis.$fetch

  const supabaseUser = useSupabaseUser()
  const context = useContextStore()
  watch(() => supabaseUser.value?.id, (id) => {
    if (id) context.init().catch(e => console.error('[context] init failed', e))
    else context.reset()
  }, { immediate: true })
})
