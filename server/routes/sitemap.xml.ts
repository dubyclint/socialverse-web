export default defineEventHandler(async (event) => {
  const baseUrl = process.env.NUXT_PUBLIC_SITE_URL || 'https://socialverse.app'
  
  const urls = [
    { loc: '/', lastmod: new Date().toISOString().split('T')[0], changefreq: 'daily', priority: '1.0' },
    { loc: '/explore', lastmod: new Date().toISOString().split('T')[0], changefreq: 'daily', priority: '0.9' },
    { loc: '/auth/login', lastmod: new Date().toISOString().split('T')[0], changefreq: 'monthly', priority: '0.8' },
    { loc: '/auth/register', lastmod: new Date().toISOString().split('T')[0], changefreq: 'monthly', priority: '0.8' },
  ]

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${baseUrl}${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`

  setHeader(event, 'Content-Type', 'application/xml')
  return sitemap
})
