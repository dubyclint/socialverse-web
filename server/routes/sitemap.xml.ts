export default defineEventHandler((event) => {
  try {
    console.log('[sitemap.xml] Route handler called');
    setHeader(event, 'Content-Type', 'application/xml');
    
    const baseUrl = 'https://socialverse-web.zeabur.app';
    const today = new Date().toISOString().split('T')[0];
    
    const content = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/explore</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/feed</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;
    
    console.log('[sitemap.xml] Returning sitemap.xml content');
    return content;
  } catch (error) {
    console.error('[sitemap.xml] Error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      data: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});
