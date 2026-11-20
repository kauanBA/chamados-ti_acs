const { db } = require('../config/firebase');

async function loadProfile(req, res, next) {
  try {
    const snap = await db().collection('usuarios').doc(req.user.uid).get();
    if (!snap.exists) return res.status(403).json({ error: 'Perfil de usuário não inicializado.' });
    req.profile = snap.data();
    next();
  } catch (error) {
    next(error);
  }
}

function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.profile || !roles.includes(req.profile.perfil)) {
      return res.status(403).json({ error: 'Você não tem permissão para esta operação.' });
    }
    next();
  };
}

module.exports = { loadProfile, allowRoles };
