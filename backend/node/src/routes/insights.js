const express = require('express');
const { verifyToken, requireAdmin } = require('../middlewares/auth');
const { getSummary, listMessagesBySentiment } = require('../services/catalog');

const router = express.Router();

router.get('/summary', verifyToken, requireAdmin, async (req, res) => {
  try {
    const data = await getSummary();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/messages', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { sentiment } = req.query;
    if (!sentiment) return res.status(400).json({ error: 'sentiment é obrigatório' });
    const data = await listMessagesBySentiment(sentiment);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;


