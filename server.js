const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'SACS 2.1 Simplified',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// WhatsApp Mock API (para testes)
app.get('/api/whatsapp/status', (req, res) => {
  res.json({
    connected: false,
    message: 'WhatsApp integration ready to configure'
  });
});

// Messages API
app.post('/api/messages/send', (req, res) => {
  const { number, message } = req.body;
  console.log(`Mensagem para ${number}: ${message}`);
  res.json({
    success: true,
    message: 'Mensagem enviada (modo demo)',
    data: { number, message, timestamp: new Date().toISOString() }
  });
});

// Excel Processing API
app.post('/api/excel/process', (req, res) => {
  res.json({
    success: true,
    message: 'Processamento Excel disponível',
    rows: []
  });
});

// Sentiment Analysis API
app.post('/api/analyze', (req, res) => {
  const { text } = req.body;
  
  // Análise simples de sentimento
  const negativePhrases = ['ruim', 'péssimo', 'horrível', 'problema', 'não funciona'];
  const positivePhrases = ['bom', 'ótimo', 'excelente', 'perfeito', 'funciona'];
  
  let sentiment = 'neutral';
  const lowerText = (text || '').toLowerCase();
  
  if (negativePhrases.some(phrase => lowerText.includes(phrase))) {
    sentiment = 'negative';
  } else if (positivePhrases.some(phrase => lowerText.includes(phrase))) {
    sentiment = 'positive';
  }
  
  res.json({
    sentiment,
    text,
    autoReply: sentiment === 'negative' 
      ? 'Lamentamos o problema. Nossa equipe entrará em contato.'
      : sentiment === 'positive'
      ? 'Ficamos felizes com seu feedback positivo!'
      : 'Obrigado pelo contato. Como posso ajudar?'
  });
});

// Rota catch-all para SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo deu errado!' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════╗
║         SACS 2.1 - Simplified         ║
╠════════════════════════════════════════╣
║  🚀 Servidor rodando na porta ${PORT}    ║
║  🌐 URL: http://localhost:${PORT}         ║
║  📊 Status: ATIVO                      ║
║  🔧 Modo: ${process.env.NODE_ENV || 'development'}              ║
╚════════════════════════════════════════╝
  `);
});

module.exports = app;