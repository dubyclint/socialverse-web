FROM node:22 AS builder

LABEL "language"="nodejs"
LABEL "framework"="nuxt.js"

WORKDIR /src

COPY package.json package-lock.json* ./

RUN npm install

COPY . .

ENV NITRO_PRESET=node-server
ENV NODE_ENV=production

RUN NODE_OPTIONS="--max-old-space-size=4096" npm run build

FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

COPY --from=builder /src/.output ./.output

EXPOSE 8080

ENTRYPOINT ["node"]
CMD [".output/server/index.mjs"]
