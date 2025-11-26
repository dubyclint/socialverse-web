FROM node:22-alpine
LABEL "language"="nodejs"
LABEL "framework"="nuxt"

WORKDIR /src

# Copy package.json only
COPY package.json ./

# Install dependencies (npm will install latest compatible versions)
RUN npm install

# Copy source code
COPY . .

# Build the Nuxt application
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --omit=dev

# Expose port 8080 (Zeabur default)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start the application
CMD ["npm", "run", "start"]
