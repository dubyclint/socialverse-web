// Lightweight emoji data stub for typecheck/runtime compatibility.
// Replace with a full emoji dataset (e.g. from emoji-picker-element data) when needed.

export const EMOJIS: Array<{ emoji: string; name: string; shortcodes: string[] }> = []

export function searchEmojis(query: string): typeof EMOJIS {
  if (!query) return EMOJIS
  const lower = query.toLowerCase()
  return EMOJIS.filter(
    (e) =>
      e.name.toLowerCase().includes(lower) ||
      e.shortcodes.some((s) => s.toLowerCase().includes(lower))
  )
}
