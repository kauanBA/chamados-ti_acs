const { auth } = require('../config/firebase');

async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const match = header.match(/^Bearer (.+)$/i);
    if (!match) return res.status(401).json({ error: 'Faça login para continuar.' });

    const decoded = await auth().verifyIdToken(match[1], true);
    req.user = {
      uid: decoded.uid,
      email: decoded.email || '',
      name: decoded.name || ''
    };
    next();
  } catch (error) {
    console.warn('Falha na autenticação:', error.code || error.message);
    res.status(401).json({ error: 'Sessão inválida ou expirada. Entre novamente.' });
  }
}

module.exports = { authenticate };
