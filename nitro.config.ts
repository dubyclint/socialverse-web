// ============================================================================
// FILE: /nitro.config.ts - PRODUCTION CONFIGURATION WITH ESM FIX
// ============================================================================
// Nitro configuration with build hook to fix ESM imports for Supabase
// ============================================================================

export default defineNitroConfig({
  // CRITICAL: Explicitly set preset to node-server for Zeabur compatibility
  preset: 'node-server',
  
  // ============================================================================
  // SOURCE DIRECTORY
  // ============================================================================
  srcDir: 'server',
  
  // ============================================================================
  // EXTERNAL MODULES - PREVENT SUPABASE BUNDLING ISSUES
  // ============================================================================
  externals: {
    inline: [],
    traceInclude: [],
  },
  
  // ============================================================================
  // PUBLIC ASSETS CONFIGURATION
  // ============================================================================
  publicAssets: [
    {
      baseURL: '/',
      dir: './public',
    },
    {
      baseURL: '/_nuxt/',
      dir: './.output/public/_nuxt',
      maxAge: 60 * 60 * 24 * 365,
    },
  ],
  
  // ============================================================================
  // COMPRESSION CONFIGURATION
  // ============================================================================
  compressPublicAssets: {
    brotli: true,
    gzip: true,
  },
  
  // ============================================================================
  // SECURITY HEADERS
  // ============================================================================
  headers: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  },
  
  // ============================================================================
  // ROUTE RULES - CACHING & MIME TYPES
  // ============================================================================
  routeRules: {
    '/_nuxt/**': {
      cache: {
        maxAge: 60 * 60 * 24 * 365,
      },
    },
    '/api/**': {
      cache: false,
    },
  },
  
  // ============================================================================
  // LOGGING
  // ============================================================================
  logging: {
    level: 'info',
  },
  
  // ============================================================================
  // BUILD HOOK - FIX ESM IMPORTS FOR SUPABASE
  // ============================================================================
  // THIS IS THE CRITICAL FIX FOR THE SUPABASE MODULE ERROR
  // Runs after Nitro build completes to fix ESM import paths
  hooks: {
  'build:done': async () => {
    const fs = await import('fs');
    const path = await import('path');
    
    const outputDir = '.zeabur/output/functions/__nitro.func';
    if (!fs.existsSync(outputDir)) return;
    
    const files = fs.readdirSync(outputDir, { recursive: true });
    for (const file of files) {
      if (!file.endsWith('.mjs')) continue;
      const filePath = path.join(outputDir, file);
      let content = fs.readFileSync(filePath, 'utf-8');
      
      // Fix Supabase imports - add .js extensions
      content = content.replace(
        /from ['"](@supabase\/[^'"]+)(?<!\.js)['"]/g,
        "from '$1.js'"
      );
      
      fs.writeFileSync(filePath, content);
    }
  },
},

  
