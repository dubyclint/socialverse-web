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
  
  hooks: {
    'build:done': async () => {
      const fs = await import('fs');
      const path = await import('path');
      
      const outputDir = '.zeabur/output/functions/__nitro.func';
      
      if (!fs.existsSync(outputDir)) return;
      
      console.log(`[Fix] Processing directory: ${outputDir}`);
      
      const files = fs.readdirSync(outputDir, { recursive: true });
      for (const file of files) {
        if (!file.endsWith('.mjs')) continue;
        
        const filePath = path.join(outputDir, file);
        let content = fs.readFileSync(filePath, 'utf-8');
        let modified = false;
        
        // Fix all imports missing .js extension
        const oldContent = content;
        content = content.replace(
          /from\s+['"](@supabase\/[^'"]+)(?<!\.js)(?<!\.mjs)(?<!\.json)['"]/g,
          "from '$1.js'"
        );
        
        if (content !== oldContent) {
          modified = true;
          console.log(`[Fix] Fixed imports in ${file}`);
        }
        
        if (modified) {
          fs.writeFileSync(filePath, content);
        }
      }
    },
  },
})
