const express = require('express');
const { getQrCodeDataUrl, getIsReady } = require('../services/whatsapp');
const { verifyToken, requireAdmin } = require('../middlewares/auth');

const router = express.Router();

router.get('/status', (req, res) => {
  res.json({ whatsappReady: getIsReady() });
});

router.get('/qr', (req, res) => {
  const dataUrl = getQrCodeDataUrl();
  if (!dataUrl) return res.status(404).json({ error: 'QR code não disponível' });
  res.json({ dataUrl });
});

module.exports = router;


