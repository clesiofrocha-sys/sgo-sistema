FROM node:20-alpine

WORKDIR /app

# Copia arquivos de dependências
COPY package*.json ./

# Instala todas as dependências do projeto
RUN npm install

# Instala o tsx globalmente para poder executar o TypeScript direto
RUN npm install -g tsx

# Copia todo o código da aplicação
COPY . .

EXPOSE 10000

ENV PORT=10000
ENV NODE_ENV=production

# Inicia o servidor direto pelo arquivo principal
CMD ["tsx", "server/routers.ts"]
