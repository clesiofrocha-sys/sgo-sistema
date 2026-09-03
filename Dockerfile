FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

EXPOSE 10000

ENV PORT=10000
ENV NODE_ENV=production

# Lista os arquivos existentes no log e tenta rodar o arquivo na raiz ou em subpasta
CMD ["sh", "-c", "ls -la && ls -la servidor 2>/dev/null || true && npx tsx riskCascade.ts || npx tsx servidor/riskCascade.ts || npx tsx roteadores.ts"]
