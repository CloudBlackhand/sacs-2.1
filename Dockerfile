FROM node:20-alpine

WORKDIR /app

# Copia package.json primeiro para cache
COPY package*.json ./

# Instala dependências
RUN npm ci --only=production

# Copia o resto do código
COPY . .

# Expõe a porta (Railway define dinamicamente)
EXPOSE 3000

# Comando simples e direto
CMD ["node", "server.js"]
