import { detectLanguageByIP } from '../../utils/detect-language-by-ip'

export default defineEventHandler(async (event) => {
  const ip = event.req.headers['x-forwarded-for'] || event.req.socket.remoteAddress
  const lang = await detectLanguageByIP(ip?.toString() || '')
  return { language: lang }
})
