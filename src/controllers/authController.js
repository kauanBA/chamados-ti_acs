const { db } = require('../config/firebase');
const { httpError } = require('../utils/httpError');

const adminEmails = () => (process.env.ADMIN_EMAILS || '')
  .split(',').map(email => email.trim().toLowerCase()).filter(Boolean);

async function bootstrap(req, res, next) {
  try {
    const ref = db().collection('usuarios').doc(req.user.uid);
    const snap = await ref.get();

    if (!snap.exists) {
      const email = (req.user.email || '').toLowerCase();
      const nome = String(req.body.nome || req.user.name || email.split('@')[0] || 'Usuário').trim();
      const perfil = adminEmails().includes(email) ? 'admin' : 'user';
      const profile = {
        uid: req.user.uid,
        nome,
        email,
        perfil,
        criadoEm: new Date().toISOString()
      };
      await ref.create(profile);
      return res.json({ usuario: profile, criado: true });
    }

    const profile = snap.data();
    // Sincroniza apenas dados básicos; nunca aceita perfil enviado pelo navegador.
    const updates = {};
    if (req.user.email && profile.email !== req.user.email) updates.email = req.user.email;
    if (req.body.nome && String(req.body.nome).trim() && profile.nome !== String(req.body.nome).trim()) {
      updates.nome = String(req.body.nome).trim();
    }
    if (Object.keys(updates).length) await ref.update(updates);
    res.json({ usuario: { ...profile, ...updates }, criado: false });
  } catch (error) {
    next(error);
  }
}

async function me(req, res, next) {
  try {
    const snap = await db().collection('usuarios').doc(req.user.uid).get();
    if (!snap.exists) throw httpError(403, 'Perfil não inicializado. Saia e entre novamente.');
    res.json({ usuario: snap.data() });
  } catch (error) { next(error); }
}

module.exports = { bootstrap, me };
