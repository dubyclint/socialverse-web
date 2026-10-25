import { defineEventHandler, getQuery } from 'h3'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { loadProfiles } from '~/server/utils/pals'
import { rankPalSuggestions } from '~/server/utils/pal-suggestions'
import { requireUser } from '~/server/utils/auth'

/** PAL suggestions for the viewer, best first. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const limit = Math.min(Number(getQuery(event).limit ?? 20) || 20, 50)
  const service = getServiceClient()
  const ranked = await rankPalSuggestions(service, user.id, limit)

  const profiles = await loadProfiles(service, ranked.map(([id]) => id))

  return {
    success: true,
    suggestions: ranked
      .map(([id, meta]) => {
        const profile = profiles.get(id)
        return profile
          ? { ...profile, reasons: meta.reasons, mutuals: meta.mutuals, fromContacts: meta.fromContacts }
          : null
      })
      .filter(Boolean)
  }
})
