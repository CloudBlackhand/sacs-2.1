const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { config } = require('../config/env');
const { getWhitelistUser } = require('../services/supabase');

async function loginHandler(req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Credenciais inválidas' });

    const user = await getWhitelistUser(username);
    if (!user || user.whitelist !== 1) return res.status(403).json({ error: 'Usuário não autorizado' });

    // Aceita senha em texto puro ou hash (compatibilidade)
    const isValid = user.password.startsWith('$2')
      ? await bcrypt.compare(password, user.password)
      : password === user.password;
    if (!isValid) return res.status(401).json({ error: 'Senha inválida' });

    const token = jwt.sign({ sub: user.username, admin: user.admin === 1 }, config.jwtSecret, {
      expiresIn: '12h',
    });
    return res.json({ token });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

function verifyToken(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.substring(7) : null;
  if (!token) {
    if (process.env.DEV_FAKE_AUTH === '1') {
      req.user = { sub: 'dev', admin: true };
      return next();
    }
    return res.status(401).json({ error: 'Token ausente' });
  }
  // Em DEV, aceita qualquer token para agilizar testes locais
  if (process.env.DEV_FAKE_AUTH === '1') {
    try {
      const payload = jwt.decode(token) || { sub: 'dev' };
      req.user = { ...payload, admin: true };
      return next();
    } catch (_) {
      req.user = { sub: 'dev', admin: true };
      return next();
    }
  }
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user?.admin) return res.status(403).json({ error: 'Acesso restrito a administradores' });
  return next();
}

module.exports = { loginHandler, verifyToken, requireAdmin };


