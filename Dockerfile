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
