FROM node:20-alpine

WORKDIR /app

# Copia arquivos de dependências
COPY package*.json ./

# Instala todas as dependências (incluindo tsx/typescript para o build)
RUN npm install

# Copia todo o código-fonte
COPY . .

# Compila o projeto (Gera a pasta dist)
RUN npm run build

EXPOSE 10000

ENV PORT=10000
ENV NODE_ENV=production

# Executa o servidor compilado
CMD ["node", "dist/index.js"]
