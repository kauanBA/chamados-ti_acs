require('dotenv').config();

const path = require('path');
const express = require('express');
const { initializeFirebase } = require('./src/config/firebase');
const pageRoutes = require('./src/routes/pages');
const apiRoutes = require('./src/routes/api');

initializeFirebase();

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/firebase-config.js', (req, res) => {
  res.type('application/javascript').set('Cache-Control', 'no-store');
  const config = {
    apiKey: process.env.FIREBASE_API_KEY || '',
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.FIREBASE_APP_ID || ''
  };
  res.send(`window.__FIREBASE_CONFIG__ = ${JSON.stringify(config)};`);
});

app.use('/', pageRoutes);
app.use('/api', apiRoutes);

app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Endpoint não encontrado.' });
  }
  res.status(404).render('error', { title: 'Página não encontrada', message: 'O endereço informado não existe.' });
});

app.use((err, req, res, next) => {
  console.error(err);
  if (req.path.startsWith('/api/')) {
    return res.status(err.status || 500).json({
      error: err.status && err.status < 500 ? err.message : 'Erro interno do servidor.'
    });
  }
  res.status(err.status || 500).render('error', {
    title: 'Erro',
    message: process.env.NODE_ENV === 'production' ? 'Ocorreu um erro inesperado.' : err.message
  });
});

app.listen(PORT, () => console.log(`HelpDesk TI disponível na porta ${PORT}`));
