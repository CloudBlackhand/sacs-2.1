# Dockerfile para rodar Node.js e Python juntos no Railway
FROM node:20-slim

# Instala Python, pip e utilitários necessários
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    bash \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copia arquivos de dependências primeiro (melhor cache)
COPY package*.json ./
COPY backend/node/package*.json ./backend/node/
COPY backend/python/requirements.txt ./backend/python/

# Instala dependências Node.js
RUN npm install --omit=dev || true
RUN cd backend/node && npm install --omit=dev || true

# Instala dependências Python
RUN pip3 install --break-system-packages --no-cache-dir --upgrade pip
RUN pip3 install --break-system-packages --no-cache-dir -r backend/python/requirements.txt

# Copia o resto do código
COPY . .

# Torna o script executável
RUN chmod +x start.sh

# Railway vai definir PORT dinamicamente
# Expõe apenas a porta principal (Node.js serve tudo)
EXPOSE ${PORT:-3000}

# Usa o script de inicialização
CMD ["./start.sh"]
