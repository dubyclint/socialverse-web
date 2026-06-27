export default defineEventHandler((event) => {
  try {
    console.log('[robots.txt] Route handler called');
    setHeader(event, 'Content-Type', 'text/plain');
    
    const content = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api
Disallow: /auth
Sitemap: https://socialverse-web.zeabur.app/sitemap.xml`;
    
    console.log('[robots.txt] Returning robots.txt content');
    return content;
  } catch (error) {
    console.error('[robots.txt] Error:', {
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

