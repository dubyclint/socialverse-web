FROM node:22-alpine

LABEL language="nodejs"
LABEL framework="nuxt"

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Set environment
ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

EXPOSE 8080

# Start with proper Node.js ESM flags
CMD ["node", "--experimental-require-module", ".zeabur/output/functions/__nitro.func/index.mjs"]

