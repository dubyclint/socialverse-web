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
RUN if [ -d ".zeabur/output/functions/__nitro.func" ]; then \
    cd .zeabur/output/functions/__nitro.func && \
    node -e "const fs = require('fs'); const path = require('path'); \
    const indexFile = 'index.mjs'; \
    if (fs.existsSync(indexFile)) { \
      let content = fs.readFileSync(indexFile, 'utf8'); \
      content = content.replace(/from\s+['\"]\.\.\/\.\.\/\.\.\/node_modules\//g, \"from 'node_modules/\"); \
      content = content.replace(/from\s+['\"]\.\.\/\.\.\/node_modules\//g, \"from 'node_modules/\"); \
      content = content.replace(/from\s+['\"]\.\.\/node_modules\//g, \"from 'node_modules/\"); \
      fs.writeFileSync(indexFile, content, 'utf8'); \
      console.log('✓ Fixed ESM module paths for Supabase'); \
    } \
    " && \
    cd /app; \
  fi

EXPOSE 8080

CMD ["node", ".zeabur/output/functions/__nitro.func/index.mjs"]
