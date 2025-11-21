FROM node:22-slim
LABEL "language"="nodejs"
LABEL "framework"="nuxt.js"

WORKDIR /app

RUN npm install -g pnpm@9

COPY . .

RUN pnpm install

RUN pnpm run build

# Post-build fix for ESM module resolution with Supabase
# Zeabur restructures Nitro output, breaking ESM imports
# This fix adds .js extensions to imports that are missing them
RUN if [ -d ".zeabur/output/functions/__nitro.func" ]; then \
    cd .zeabur/output/functions/__nitro.func && \
    node << 'EOF'
const fs = require('fs');
const path = require('path');

const indexFile = 'index.mjs';
if (fs.existsSync(indexFile)) {
  let content = fs.readFileSync(indexFile, 'utf8');
  
  // Fix 1: Add .js extension to imports that are missing it
  // Matches: from '@supabase/supabase-js/dist/main/lib/constants'
  // Becomes: from '@supabase/supabase-js/dist/main/lib/constants.js'
  content = content.replace(/from\s+(['"])(@supabase\/[^'"]+)(?<!\.js)(['"])/g, "from '$2.js'");
  
  // Fix 2: Fix relative path imports
  content = content.replace(/from\s+['"]\.\.\/\.\.\/\.\.\/node_modules\//g, "from 'node_modules/");
  content = content.replace(/from\s+['"]\.\.\/\.\.\/node_modules\//g, "from 'node_modules/");
  content = content.replace(/from\s+['"]\.\.\/node_modules\//g, "from 'node_modules/");
  
  // Fix 3: Ensure all node_modules imports have .js extension if they don't
  content = content.replace(/from\s+(['"])(node_modules\/[^'"]+)(?<!\.js)(['"])/g, "from '$2.js'");
  
  fs.writeFileSync(indexFile, content, 'utf8');
  console.log('✓ Fixed ESM module paths for Supabase');
  console.log('✓ Added .js extensions to imports');
}
EOF
  fi

EXPOSE 8080

CMD ["node", ".zeabur/output/functions/__nitro.func/index.mjs"]
