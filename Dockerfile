FROM node:20-slim

# Instala dependências do Chrome e Python
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    python3 \
    python3-pip \
    python3-venv \
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

# Instala Chrome
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copia package files primeiro para cache
COPY package*.json ./
COPY backend/node/package*.json ./backend/node/
COPY backend/python/requirements.txt ./backend/python/

# Instala dependências Node
RUN npm install --omit=dev 2>/dev/null || true
RUN cd backend/node && npm install --omit=dev

# Instala dependências Python
RUN python3 -m venv /app/venv
ENV PATH="/app/venv/bin:$PATH"
RUN pip install --no-cache-dir -r backend/python/requirements.txt

# Copia resto do código
COPY . .

# Cria diretório para sessão WhatsApp
RUN mkdir -p /data/.wwebjs_auth && chmod 777 /data/.wwebjs_auth

# Variáveis para Railway
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
ENV SESSION_PATH=/data/.wwebjs_auth
ENV CHROME_PATH=/usr/bin/google-chrome-stable

# Railway usa PORT dinâmico
EXPOSE ${PORT:-3000}
EXPOSE 8001

# Script de inicialização
CMD ["sh", "-c", "cd backend/node && node src/server.js & cd backend/python && /app/venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8001"]
