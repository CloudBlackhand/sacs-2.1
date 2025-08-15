const express = require('express');
const { verifyToken } = require('../middlewares/auth');
const { supabase } = require('../services/supabase');
const { getClientInstance, getIsReady } = require('../services/whatsapp');

const router = express.Router();

// =============================
// Endpoints baseados no WhatsApp
// (definidos antes de rotas dinâmicas para evitar colisões)
// =============================

// Lista de chats diretamente do WhatsApp
router.get('/wa', verifyToken, async (req, res) => {
  try {
    if (!getIsReady()) return res.status(503).json({ error: 'WhatsApp não está pronto' });
    const client = getClientInstance();
    const chats = await client.getChats();
    const mapped = chats
      .filter((c) => !c.isGroup) // foco em conversas diretas neste MVP
      .map((c) => ({
        chat_id: c.id?._serialized || c.id,
        name: c.name || c.contact?.pushname || c.contact?.name || c.formattedTitle || c.id?.user,
        unreadCount: c.unreadCount || 0,
        isGroup: !!c.isGroup,
        lastMessageTimestamp: c.timestamp || c.lastMessage?._data?.t || null,
        lastMessage: c.lastMessage?.body || null,
      }));
    // ordenar por último timestamp desc
    mapped.sort((a, b) => (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0));
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Histórico de um chat via WhatsApp
router.get('/wa/:chatId', verifyToken, async (req, res) => {
  try {
    if (!getIsReady()) return res.status(503).json({ error: 'WhatsApp não está pronto' });
    const { chatId } = req.params;
    const client = getClientInstance();
    const chat = await client.getChatById(chatId);
    const msgs = await chat.fetchMessages({ limit: 50 });
    const history = msgs.map((m) => ({
      id: m.id?._serialized || m.id?.id || m.id,
      chat_id: chatId,
      body: m.body,
      fromMe: !!m.fromMe,
      from: m.from,
      to: m.to,
      direction: m.fromMe ? 'outbound' : 'inbound',
      timestamp: m.timestamp || m._data?.t || null,
    }));
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Informações detalhadas de um chat/contato (avatar, nome, número, about)
router.get('/wa/:chatId/info', verifyToken, async (req, res) => {
  try {
    if (!getIsReady()) return res.status(503).json({ error: 'WhatsApp não está pronto' });
    const { chatId } = req.params;
    const client = getClientInstance();
    const chat = await client.getChatById(chatId);
    const contact = await chat.getContact();
    const profilePicUrl = (typeof contact.getProfilePicUrl === 'function')
      ? await contact.getProfilePicUrl()
      : null;
    let about = null;
    if (typeof contact.getAbout === 'function') {
      try { about = await contact.getAbout(); } catch (e) { about = null; }
    }
    res.json({
      chat_id: chatId,
      name: contact.pushname || contact.name || chat.name || contact.number || chatId,
      number: contact.number || chat.id?._serialized || chatId,
      isBusiness: !!contact.isBusiness,
      isMyContact: !!contact.isMyContact,
      verifiedName: contact.verifiedName || null,
      shortName: contact.shortName || null,
      about,
      profilePicUrl,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lista de chats (última mensagem por chat_id) via Supabase
router.get('/', verifyToken, async (req, res) => {
  try {
    if (!supabase) return res.json([]);
    const { data, error } = await supabase
      .from('messages')
      .select('chat_id, created_at, body, direction, "from", "to"')
      .not('chat_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1000);
    if (error) throw error;
    // reduzir para último por chat_id
    const map = new Map();
    for (const row of data) {
      if (!map.has(row.chat_id)) map.set(row.chat_id, row);
    }
    res.json(Array.from(map.values()));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Histórico de um chat
router.get('/:chatId', verifyToken, async (req, res) => {
  try {
    if (!supabase) return res.json([]);
    const { chatId } = req.params;
    const { data, error } = await supabase
      .from('messages')
      .select('id, chat_id, created_at, body, direction, "from", "to", sentiment')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })
      .limit(2000);
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
 
module.exports = router;
