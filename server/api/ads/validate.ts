export default defineEventHandler(async (event) => {
  const ad = await readBody(event)
  const violations = []

  if (ad.description?.includes('bannedword')) violations.push('Contains prohibited language')
  if (ad.image?.size > 2 * 1024 * 1024) violations.push('Image too large')

  return { valid: violations.length === 0, violations }
})
