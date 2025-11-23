export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: false },
  ssr: true,
  hydration: {
    mismatchHandler: 'silent',
  },
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode',
    '@pinia/nuxt',
    '@nuxtjs/supabase',
  ],
  build: {
    transpile: ['@supabase/supabase-js'],
  },
  runtimeConfig: {
    public: {
      supabaseUrl: process.env.SUPABASE_URL || '',
      supabaseKey: process.env.SUPABASE_KEY || '',
    },
  },
  nitro: {
    esbuild: {
      options: {
        format: 'esm'
      }
    },
    externals: {
      inline: ['@supabase/supabase-js']
    },
    prerender: {
      crawlLinks: false,
    },
  },
  
  // ============================================================================
  // BUILD HOOKS FOR IMPORT FIXING
  // ============================================================================
  hooks: {
    'build:done': async () => {
      const fs = await import('fs');
      const path = await import('path');
      
      const outputDir = '.output/server';
      if (!fs.existsSync(outputDir)) return;
      
      const files = fs.readdirSync(outputDir, { recursive: true });
      for (const file of files) {
        if (!file.endsWith('.mjs')) continue;
        const filePath = path.join(outputDir, file);
        let content = fs.readFileSync(filePath, 'utf-8');
        
        // Fix Supabase imports - add .js extensions
        content = content.replace(
          /from ['\"](@supabase\/[^'\"]+)(?<!\\.js)['\"]/g,
          "from '$1.js'"
        );
        
        // Fix H3 imports
        content = content.replace(
          /from ['\"]h3(?<!\\.js)['\"]/g,
          "from 'h3'"
        );
        
        fs.writeFileSync(filePath, content);
      }
    },
  },
})


