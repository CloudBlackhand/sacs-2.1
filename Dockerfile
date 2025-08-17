# Dockerfile para rodar Node.js e Python juntos no Railway
FROM node:20

# Instala Python, pip e todas as dependências necessárias para Chrome/Puppeteer
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    procps \
    # Dependências essenciais para Chrome/Puppeteer
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copia todos os arquivos do projeto
COPY . .

# Instala dependências Node.js na raiz e no backend/node
RUN npm install || true
RUN cd backend/node && npm install || true

# Cria indicador de que estamos no Docker
RUN touch /.dockerenv

# Instala dependências Python com --break-system-packages
RUN pip3 install --break-system-packages --no-cache-dir --upgrade pip
RUN pip3 install --break-system-packages --no-cache-dir -r backend/python/requirements.txt

# Expõe as portas (usa variável PORT para o Node se disponível)
EXPOSE 3000 8001 8080

# Inicia ambos os servidores (Node e Python)
CMD ["npx", "concurrently", "-k", "-n", "NODE,PY", "cd backend/node && npm start", "cd backend/python && bash run_py.sh"]
