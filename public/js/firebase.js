import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js';
import {
  getAuth, onAuthStateChanged, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut,
  updateProfile
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js';

const config = window.__FIREBASE_CONFIG__ || {};
if (!config.apiKey || !config.projectId || !config.appId) {
  throw new Error('Configuração web do Firebase incompleta. Verifique as variáveis FIREBASE_* no ambiente.');
}
const app = initializeApp(config);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

async function api(url, options = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error('Sua sessão terminou. Entre novamente.');
  const token = await user.getIdToken();
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`
    }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Não foi possível concluir a operação.');
  return payload;
}

export {
  auth, api, onAuthStateChanged, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, googleProvider, signInWithPopup, signOut,
  updateProfile
};
