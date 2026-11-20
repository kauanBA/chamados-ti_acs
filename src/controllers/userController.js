const { db, auth } = require('../config/firebase');
const { httpError } = require('../utils/httpError');

async function list(req, res, next) {
  try {
    const snap = await db().collection('usuarios').orderBy('nome').get();
    res.json({ usuarios: snap.docs.map(d => d.data()) });
  } catch (error) { next(error); }
}

async function changeRole(req, res, next) {
  try {
    const role = req.body.perfil;
    if (!['user', 'tecnico', 'admin'].includes(role)) throw httpError(400, 'Perfil inválido.');
    if (req.params.uid === req.user.uid && role !== 'admin') {
      throw httpError(400, 'Não é permitido remover o próprio perfil de administrador.');
    }
    const ref = db().collection('usuarios').doc(req.params.uid);
    const snap = await ref.get();
    if (!snap.exists) throw httpError(404, 'Usuário não encontrado.');
    await ref.update({ perfil: role, atualizadoEm: new Date().toISOString() });
    res.json({ sucesso: true });
  } catch (error) { next(error); }
}

module.exports = { list, changeRole };
