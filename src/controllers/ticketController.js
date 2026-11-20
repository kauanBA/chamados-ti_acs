const { db } = require('../config/firebase');
const { httpError } = require('../utils/httpError');

const tickets = () => db().collection('chamados');
const comments = () => db().collection('comentarios');
const allowedStatuses = ['Aberto', 'Em andamento', 'Aguardando', 'Resolvido', 'Fechado'];
const allowedPriorities = ['Baixa', 'Média', 'Alta', 'Crítica'];

function clean(value, max = 3000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

async function list(req, res, next) {
  try {
    let query = tickets();
    if (req.profile.perfil === 'user') query = query.where('autorUid', '==', req.user.uid);
    const snap = await query.get();
    const chamados = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    chamados.sort((a, b) => String(b.criadoEm || '').localeCompare(String(a.criadoEm || '')));
    res.json({ chamados });
  } catch (error) { next(error); }
}

async function create(req, res, next) {
  try {
    const titulo = clean(req.body.titulo, 150);
    const descricao = clean(req.body.descricao, 5000);
    if (!titulo || !descricao) throw httpError(400, 'Título e descrição são obrigatórios.');

    const ref = tickets().doc();
    const now = new Date().toISOString();
    const data = {
      titulo, descricao,
      autorUid: req.user.uid,
      autorNome: req.profile.nome,
      autorEmail: req.profile.email,
      status: 'Aberto',
      tecnicoResponsavel: null,
      prioridade: allowedPriorities.includes(req.body.prioridade) ? req.body.prioridade : 'Média',
      categoria: clean(req.body.categoria, 80),
      setor: clean(req.body.setor, 80),
      criadoEm: now,
      atualizadoEm: now
    };
    await ref.set(data);
    res.status(201).json({ chamado: { id: ref.id, ...data } });
  } catch (error) { next(error); }
}

async function getOne(req, res, next) {
  try {
    const snap = await tickets().doc(req.params.id).get();
    if (!snap.exists) throw httpError(404, 'Chamado não encontrado.');
    const ticket = { id: snap.id, ...snap.data() };
    if (req.profile.perfil === 'user' && ticket.autorUid !== req.user.uid) {
      throw httpError(403, 'Você só pode visualizar seus próprios chamados.');
    }
    const commentsSnap = await comments().where('chamadoId', '==', snap.id).get();
    const pareceres = commentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    pareceres.sort((a, b) => String(a.criadoEm || '').localeCompare(String(b.criadoEm || '')));
    res.json({ chamado: ticket, comentarios: pareceres });
  } catch (error) { next(error); }
}

async function update(req, res, next) {
  try {
    const ref = tickets().doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) throw httpError(404, 'Chamado não encontrado.');
    const ticket = snap.data();
    const isStaff = ['tecnico', 'admin'].includes(req.profile.perfil);
    if (!isStaff && ticket.autorUid !== req.user.uid) throw httpError(403, 'Acesso negado.');
    if (!isStaff) throw httpError(403, 'Usuários comuns não podem alterar dados técnicos do chamado.');

    const patch = { atualizadoEm: new Date().toISOString() };
    if (req.body.status !== undefined) {
      if (!allowedStatuses.includes(req.body.status)) throw httpError(400, 'Status inválido.');
      patch.status = req.body.status;
    }
    if (req.body.prioridade !== undefined) {
      if (!allowedPriorities.includes(req.body.prioridade)) throw httpError(400, 'Prioridade inválida.');
      patch.prioridade = req.body.prioridade;
    }
    if (req.body.assumir === true || req.body.assumir === 'true') {
      if (req.profile.perfil !== 'tecnico' && req.profile.perfil !== 'admin') throw httpError(403, 'Apenas técnicos podem assumir chamados.');
      patch.tecnicoResponsavel = { uid: req.user.uid, nome: req.profile.nome, email: req.profile.email };
    } else if (req.profile.perfil === 'admin' && req.body.tecnicoResponsavel !== undefined) {
      patch.tecnicoResponsavel = req.body.tecnicoResponsavel || null;
    }
    await ref.update(patch);
    res.json({ sucesso: true });
  } catch (error) { next(error); }
}

async function addComment(req, res, next) {
  try {
    const ref = tickets().doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) throw httpError(404, 'Chamado não encontrado.');
    const ticket = snap.data();
    if (req.profile.perfil === 'user' && ticket.autorUid !== req.user.uid) throw httpError(403, 'Acesso negado.');
    const texto = clean(req.body.texto, 3000);
    if (!texto) throw httpError(400, 'O parecer não pode ficar vazio.');
    const data = {
      chamadoId: ref.id,
      autorUid: req.user.uid,
      autorNome: req.profile.nome,
      texto,
      criadoEm: new Date().toISOString()
    };
    const commentRef = await comments().add(data);
    await ref.update({ atualizadoEm: data.criadoEm });
    res.status(201).json({ comentario: { id: commentRef.id, ...data } });
  } catch (error) { next(error); }
}

async function remove(req, res, next) {
  try {
    if (req.profile.perfil !== 'admin') throw httpError(403, 'Somente administradores podem excluir chamados.');
    const ref = tickets().doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) throw httpError(404, 'Chamado não encontrado.');
    const commentsSnap = await comments().where('chamadoId', '==', ref.id).get();
    const batch = db().batch();
    commentsSnap.docs.forEach(doc => batch.delete(doc.ref));
    batch.delete(ref);
    await batch.commit();
    res.json({ sucesso: true });
  } catch (error) { next(error); }
}

module.exports = { list, create, getOne, update, addComment, remove };
