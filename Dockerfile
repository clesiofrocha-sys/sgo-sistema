FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

EXPOSE 10000

ENV PORT=10000
ENV NODE_ENV=production

# Executa o ponto de entrada principal dentro da pasta server
CMD ["npx", "tsx", "server/routers.ts"]
