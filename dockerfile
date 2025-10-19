FROM node:24-slim
LABEL "language"="nodejs"
LABEL "framework"="nuxt"

WORKDIR /app

RUN npm install -g pnpm

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 8080

ENV PORT=8080

CMD ["npm", "run", "preview"]
