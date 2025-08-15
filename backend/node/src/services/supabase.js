const { createClient } = require('@supabase/supabase-js');
const { config } = require('../config/env');
const { logger } = require('../utils/logger');

const useDevFakeAuth = process.env.DEV_FAKE_AUTH === '1';

let supabase = null;
if (config.supabaseUrl && config.supabaseAnonKey) {
  supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: true },
  });
} else {
  logger.warn('Supabase não configurado (SUPABASE_URL/SUPABASE_ANON_KEY ausentes). Persistência desativada.');
}

async function getWhitelistUser(username) {
  if (useDevFakeAuth) {
    // Usuário de desenvolvimento (whitelist/admin habilitados)
    if (username) {
      return { username: 'admin', password: 'senha123', whitelist: 1, admin: 1 };
    }
    return null;
  }

  const { data, error } = await supabase
    .from('users')
    .select('username, password, whitelist, admin')
    .eq('username', username)
    .single();
  if (error) throw error;
  return data;
}

module.exports = { supabase, getWhitelistUser };


