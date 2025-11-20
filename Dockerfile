FROM node:22-alpine

LABEL language="nodejs"
LABEL framework="nuxt"

WORKDIR /app

# Install dependencies with legacy peer deps and force flag
COPY package*.json ./
RUN npm install --legacy-peer-deps --force

# Copy source code
COPY . .

# Build the application for Zeabur serverless
RUN npm run build

# Set environment
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080
# Start the Zeabur serverless function
CMD ["node", ".zeabur/output/functions/__nitro.func/index.mjs"]

