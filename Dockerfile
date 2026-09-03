FROM node:20-alpine

WORKDIR /app

# Copiar declaração de dependências
COPY package*.json ./

# Instalar TODAS as dependências (incluindo devDependencies)
RUN npm install

# Copiar o restante do código
COPY . .

# Construir o projeto
RUN npm run build || true

EXPOSE 10000

ENV PORT=10000
ENV NODE_ENV=production

CMD ["npm", "start"]
