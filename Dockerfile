FROM node:20-alpine

WORKDIR /app

# Copia dependências e instala tudo
COPY package*.json ./
RUN npm install

# Copia o código do projeto
COPY . .

# Compila o projeto
RUN npm run build || true

EXPOSE 10000

ENV PORT=10000
ENV NODE_ENV=production

# Executa a aplicação diretamente pelo ponto de entrada principal
CMD ["npx", "tsx", "server/index.ts"]
