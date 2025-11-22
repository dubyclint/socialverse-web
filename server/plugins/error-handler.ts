// server/plugins/error-handler.ts
import type { NitroApp } from 'nitropack';

export default defineNitroPlugin((nitroApp: NitroApp) => {
  console.log('[Error Handler Plugin] Initializing global error handler');
  
  nitroApp.hooks.hook('error', (error, context) => {
    console.error('[Global Error Handler] Error caught:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      url: context?.event?.node?.req?.url,
      method: context?.event?.node?.req?.method,
      timestamp: new Date().toISOString()
    });
  });

  nitroApp.hooks.hook('request', (context) => {
    const url = context.event?.node?.req?.url;
    const method = context.event?.node?.req?.method;
    
    if (url?.includes('robots.txt') || url?.includes('sitemap.xml')) {
      console.log(`[Request] ${method} ${url}`);
    }
  });

  nitroApp.hooks.hook('afterResponse', (context) => {
    const url = context.event?.node?.req?.url;
    const method = context.event?.node?.req?.method;
    const statusCode = context.event?.node?.res?.statusCode;
    
    if (url?.includes('robots.txt') || url?.includes('sitemap.xml')) {
      console.log(`[Response] ${method} ${url} - Status: ${statusCode}`);
    }
  });
});
