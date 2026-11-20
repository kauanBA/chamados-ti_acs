const express = require('express');
const { authenticate } = require('../middlewares/authenticate');
const { loadProfile, allowRoles } = require('../middlewares/authorize');
const authController = require('../controllers/authController');
const ticketController = require('../controllers/ticketController');
const userController = require('../controllers/userController');

const router = express.Router();
router.use(authenticate);
router.post('/auth/bootstrap', authController.bootstrap);
router.get('/auth/me', loadProfile, authController.me);

router.use(loadProfile);
router.get('/chamados', ticketController.list);
router.post('/chamados', ticketController.create);
router.get('/chamados/:id', ticketController.getOne);
router.patch('/chamados/:id', ticketController.update);
router.post('/chamados/:id/pareceres', ticketController.addComment);
router.delete('/chamados/:id', allowRoles('admin'), ticketController.remove);

router.get('/usuarios', allowRoles('admin'), userController.list);
router.patch('/usuarios/:uid/perfil', allowRoles('admin'), userController.changeRole);

module.exports = router;
