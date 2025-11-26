FROM node:22-alpine
LABEL "language"="nodejs"
LABEL "framework"="nuxt"

WORKDIR /src

# Copy package.json only
COPY package.json ./

# Install ALL dependencies (including dev) for build
RUN npm install

# Copy source code
COPY . .

# Build the Nuxt application
RUN npm run build

# Verify build output exists
RUN test -f .output/server/index.mjs || (echo "Build failed: .output/server/index.mjs not found" && exit 1)

# Remove dev dependencies to reduce image size
RUN npm prune --omit=dev

# Expose port 8080 (Zeabur default)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start the application
CMD ["npm", "run", "start"]
