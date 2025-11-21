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
    sed -i "s|from '@supabase/\([^']*\)'|from '@supabase/\1.js'|g" index.mjs && \
    sed -i "s|from \"@supabase/\([^\"]*\)\"|from \"@supabase/\1.js\"|g" index.mjs && \
    sed -i "s|from 'node_modules/\([^']*\)'|from 'node_modules/\1.js'|g" index.mjs && \
    sed -i "s|from \"node_modules/\([^\"]*\)\"|from \"node_modules/\1.js\"|g" index.mjs && \
    echo "✓ Fixed ESM module paths for Supabase" && \
    cd /app; \
  fi

EXPOSE 8080

CMD ["node", ".zeabur/output/functions/__nitro.func/index.mjs"]
