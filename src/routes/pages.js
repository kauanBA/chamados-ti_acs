const express = require('express');
const router = express.Router();

router.get('/', (req, res) => res.render('app', { title: 'Painel de chamados', page: 'dashboard' }));
router.get('/login', (req, res) => res.render('login', { title: 'Entrar' }));
router.get('/chamados', (req, res) => res.render('app', { title: 'Chamados', page: 'tickets' }));
router.get('/chamados/novo', (req, res) => res.render('app', { title: 'Novo chamado', page: 'new-ticket' }));
router.get('/chamados/:id', (req, res) => res.render('app', { title: 'Detalhes do chamado', page: 'ticket-detail' }));
router.get('/usuarios', (req, res) => res.render('app', { title: 'Usuários', page: 'users' }));
router.get('/403', (req, res) => res.render('error', { title: 'Acesso negado', message: 'Você não tem permissão para acessar este recurso.' }));

module.exports = router;
