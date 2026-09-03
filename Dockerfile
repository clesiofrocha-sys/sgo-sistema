FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

# Garante que o arquivo de rotas fique acessível dentro da pasta servidor
RUN cp roteadores.ts servidor/ 2>/dev/null || true

EXPOSE 10000

ENV PORT=10000
ENV NODE_ENV=production

# Executa o servidor principal do projeto
CMD ["npx", "tsx", "servidor/riskCascade.ts"]
