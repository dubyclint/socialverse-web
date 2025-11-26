// server/api/ml/feed.ts - ML FEED WITH LAZY TENSORFLOW
import { getTensorFlow, isTensorFlowAvailable } from '#utils/tensorflow-loader'

export default defineEventHandler(async (event) => {
  try {
    // Check if TensorFlow is needed for this request
    const query = getQuery(event)
    const useMl = query.ml === 'true'

    if (!useMl) {
      // Return basic feed without ML
      return {
        success: true,
        feed: [],
        ml: false
      }
    }

    // Load TensorFlow only if needed
    const tf = await getTensorFlow()

    // Your ML logic here
    const feedData = await generateMLFeed(tf)

    return {
      success: true,
      feed: feedData,
      ml: true
    }
  } catch (error: any) {
    console.error('[API] ML Feed error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message
    })
  }
})

async function generateMLFeed(tf: any) {
  // Example ML processing
  // This only runs if TensorFlow is loaded
  return []
}
