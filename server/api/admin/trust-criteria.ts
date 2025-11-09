import { getTrustCriteria, setTrustCriteria } from '~/server/utils/evaluateTrust'

export default defineEventHandler(async (event) => {
  if (event.req.method === 'GET') {
    return getTrustCriteria()
  }

  if (event.req.method === 'POST') {
    const body = await readBody(event)
    setTrustCriteria(body)
    return { success: true }
  }
})
