import { detectLanguageByIP } from '../../utils/detectLanguageByIP'

export default defineEventHandler(async (event) => {
  const ip = event.req.headers['x-forwarded-for'] || event.req.socket.remoteAddress
  const lang = await detectLanguageByIP(ip?.toString() || '')
  return { language: lang }
})
