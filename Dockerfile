FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# Instala dependências ignorando conflitos estritos de pares
RUN npm install --legacy-peer-deps

COPY . .

EXPOSE 10000

ENV PORT=10000
ENV NODE_ENV=production

CMD ["npx", "tsx", "server/routers.ts"]
