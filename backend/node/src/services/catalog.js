const { supabase } = require('./supabase');
const { logger } = require('../utils/logger');

async function saveMessageClassification(entry) {
  if (!supabase) {
    logger.info('DEV mode: mensagem catalogada apenas em log', entry);
    return;
  }
  const { from, body, sentiment, matched_pattern: matchedPattern, direction = 'inbound', chat_id: chatId, to } = entry;
  const { error } = await supabase
    .from('messages')
    .insert([{ from, body, sentiment, matched_pattern: matchedPattern, direction, chat_id: chatId, to }]);
  if (error) throw error;
}

async function getSummary() {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc('messages_summary');
  if (error) throw error;
  return data;
}

async function listMessagesBySentiment(sentiment) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('messages')
    .select('id, from, body, sentiment, matched_pattern, created_at')
    .eq('sentiment', sentiment)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return data;
}

module.exports = { saveMessageClassification, getSummary, listMessagesBySentiment };


