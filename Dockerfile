FROM node:22-alpine
LABEL "language"="nodejs"
LABEL "framework"="nuxt"

WORKDIR /src

COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./

RUN npm install

COPY . .

RUN npm run build

RUN test -f .output/server/index.mjs || (echo "Build failed: .output/server/index.mjs not found" && exit 1)

RUN npm prune --omit=dev

# ✅ FIXED: Expose port 8080 (matches environment variable)
EXPOSE 8080

# ✅ FIXED: Ensure PORT environment variable is set to 8080
ENV PORT=8080
ENV HOST=0.0.0.0
ENV NODE_ENV=production

CMD ["node", ".output/server/index.mjs"]
