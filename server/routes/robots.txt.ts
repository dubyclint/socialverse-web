export default defineEventHandler((event) => {
  setHeader(event, 'Content-Type', 'text/plain')
  return `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api
Disallow: /auth
Sitemap: https://socialverse-web.zeabur.app/sitemap.xml`
})
