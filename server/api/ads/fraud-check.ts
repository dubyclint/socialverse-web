export default defineEventHandler(async (event) => {
  const { pixelsVisible, duration } = await readBody(event)
  const valid = pixelsVisible >= 0.5 && duration >= 1000
  return { valid }
})
