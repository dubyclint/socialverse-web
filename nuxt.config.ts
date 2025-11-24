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
      inline: []
    },
    prerender: {
      crawlLinks: false,
    },
  },
  
  // ============================================================================
  // BUILD HOOKS FOR IMPORT FIXING - FIXED FOR ZEABUR
  // ============================================================================
  hooks: {
    'build:done': async () => {
      const fs = await import('fs');
      const path = await import('path');
      
      // Check both possible output directories
      const possibleDirs = [
        '.zeabur/output/functions/__nitro.func',
        '.output/server',
      ];
      
      for (const outputDir of possibleDirs) {
        if (!fs.existsSync(outputDir)) continue;
        
        console.log(`[Supabase Fix] Processing directory: ${outputDir}`);
        
        const files = fs.readdirSync(outputDir, { recursive: true });
        for (const file of files) {
          if (!file.endsWith('.mjs')) continue;
          
          const filePath = path.join(outputDir, file);
          let content = fs.readFileSync(filePath, 'utf-8');
          let modified = false;
          
          // Fix Supabase imports - add .js extensions where missing
          const supabaseRegex = /from\s+['"](@supabase\/[^'"]+)(?<!\.js)['"]/g;
          if (supabaseRegex.test(content)) {
            content = content.replace(supabaseRegex, "from '$1.js'");
            modified = true;
            console.log(`[Supabase Fix] Fixed Supabase imports in ${file}`);
          }
          
          // Fix other ESM imports that might need .js extension
          const esmRegex = /from\s+['"](@supabase\/[^'"]+)(?<!\.js)(?<!\.mjs)(?<!\.json)['"]\s*$/gm;
          const matches = content.match(esmRegex);
          if (matches) {
            // Only fix specific known packages
            content = content.replace(
              /from\s+['"]h3(?<!\.js)['"]/g,
              "from 'h3.js'"
            );
            modified = true;
          }
          
          if (modified) {
            fs.writeFileSync(filePath, content);
          }
        }
      }
    },
  },
})
