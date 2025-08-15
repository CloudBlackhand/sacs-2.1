const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const path = require('path');
const { config } = require('./config/env');
const { logger } = require('./utils/logger');
const { getClientInstance } = require('./services/whatsapp');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const messageRoutes = require('./routes/messages');
const chatsRoutes = require('./routes/chats');
const insightsRoutes = require('./routes/insights');

const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: '2mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
});
app.use(limiter);

app.get('/health', (req, res) => res.json({ status: 'ok', nodeEnv: config.nodeEnv }));

app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/messages', messageRoutes);
app.use('/chats', chatsRoutes);
app.use('/insights', insightsRoutes);

// Servir assets estáticos (sem index.html)
const frontendPublic = path.resolve(__dirname, '../../../frontend/public');
app.use('/', express.static(frontendPublic, { index: false }));

// Rota raiz gera HTML mínimo; UI é construída 100% via JavaScript
app.get('/', (_req, res) => {
  const html = `<!doctype html>
  <html lang="pt-br">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>SACS</title>
      <link rel="stylesheet" href="/styles.css" />
    </head>
    <body>
      <div id="root"></div>
      <script type="module" src="/main.js"></script>
    </body>
  </html>`;
  res.type('html').send(html);
});

// Inicializa WhatsApp client
getClientInstance();

app.use((err, req, res, next) => {
  logger.error(err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

app.listen(config.port, config.host, () => {
  logger.info(`SACS Node server rodando em http://${config.host}:${config.port}`);
});


