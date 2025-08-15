const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { verifyToken } = require('../middlewares/auth');
const { sendMessageToNumber, sendMediaToNumber } = require('../services/whatsapp');
const { saveMessageClassification } = require('../services/catalog');
const { config } = require('../config/env');

const uploadDir = path.resolve(__dirname, '../../../uploads');
// Garante diretório de upload
try { fs.mkdirSync(uploadDir, { recursive: true }); } catch (e) {}
const upload = multer({ dest: uploadDir });

const router = express.Router();

router.post('/send', verifyToken, async (req, res) => {
  try {
    const { number, chatId, message } = req.body;
    if ((!number && !chatId) || !message) {
      return res.status(400).json({ error: 'Informe number ou chatId e a message' });
    }
    const destination = number || chatId;
    await sendMessageToNumber(destination, message);
    // registra mensagem de saída
    const toChatId = chatId
      ? chatId
      : `${String(destination).replace(/\D/g, '')}@c.us`;
    await saveMessageClassification({ from: 'self', to: destination, body: message, sentiment: 'neutral', matched_pattern: null, direction: 'outbound', chat_id: toChatId });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/upload', verifyToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Arquivo não enviado' });
    const filePath = req.file.path;
    const { date_from: dateFrom, date_to: dateTo, limit } = req.query;
    const response = await axios.post(`${config.pythonServiceUrl}/normalize-excel`, {
      file_path: filePath,
      date_from: dateFrom,
      date_to: dateTo,
      limit: limit ? Number(limit) : 1000,
    }).catch((e) => ({ data: { error: 'python_unavailable', file_path: filePath, rows: [], total_rows: 0, valid_rows: 0, month_distribution: {} } }));
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Normaliza um arquivo já existente no servidor (ex.: diretório xlsx/)
router.post('/normalize', (req, res) => {
  try {
    const { file_path: filePath, date_from: dateFrom, date_to: dateTo, limit } = req.body || {};
    if (!filePath) return res.status(400).json({ error: 'file_path é obrigatório' });
    axios.post(`${config.pythonServiceUrl}/normalize-excel`, {
      file_path: filePath,
      date_from: dateFrom,
      date_to: dateTo,
      limit: limit ? Number(limit) : 1000,
    }).then(r => res.json(r.data))
      .catch((e) => res.json({ error: 'python_unavailable', file_path: filePath, rows: [], total_rows: 0, valid_rows: 0, month_distribution: {} }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/auto-reply', verifyToken, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Texto não enviado' });
    const response = await axios.post(`${config.pythonServiceUrl}/classify`, { text });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/send-batch', verifyToken, async (req, res) => {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows)) return res.status(400).json({ error: 'rows deve ser uma lista' });
    const results = [];
    for (const row of rows) {
      const number = String(row.number || '').trim();
      const message = String(row.message || '').trim();
      if (!number || !message) {
        results.push({ number, ok: false, error: 'dados inválidos' });
        continue;
      }
      try {
        await sendMessageToNumber(number, message);
        results.push({ number, ok: true });
        await new Promise((r) => setTimeout(r, 600)); // pequeno atraso para evitar bloqueio
      } catch (e) {
        results.push({ number, ok: false, error: e.message });
      }
    }
    res.json({ sent: results.filter(r => r.ok).length, total: results.length, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

// Upload e envio de mídia (imagem/pdf/etc.)
router.post('/send-media', verifyToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Arquivo não enviado' });
    const { number, chatId, caption } = req.body || {};
    const destination = number || chatId;
    if (!destination) return res.status(400).json({ error: 'Informe number ou chatId' });
    await sendMediaToNumber(destination, req.file.path, caption);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


