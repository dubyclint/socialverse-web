export default defineEventHandler((event) => {
  const baseUrl = process.env.NUXT_PUBLIC_SITE_URL || 'https://socialverse.app'
  
  const robots = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api
Disallow: /auth
Disallow: /*.json$
Disallow: /*?*sort=
Disallow: /*?*filter=

Sitemap: ${baseUrl}/sitemap.xml

User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /`

  setHeader(event, 'Content-Type', 'text/plain')
  return robots
})
