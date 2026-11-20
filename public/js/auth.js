import {
  auth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  googleProvider, signInWithPopup, onAuthStateChanged, api, updateProfile
} from './firebase.js';

const form = document.querySelector('#login-form');
const message = document.querySelector('#auth-message');
const registerLink = document.querySelector('#show-register');
let registering = false;
let submittingAuth = false;

function showMessage(text, isError = true) {
  message.textContent = text;
  message.className = isError ? 'notice error' : 'notice success';
}

registerLink.addEventListener('click', (event) => {
  event.preventDefault();
  registering = !registering;
  form.querySelector('button[type="submit"]').textContent = registering ? 'Criar conta' : 'Entrar';
  registerLink.textContent = registering ? 'Já tenho conta' : 'Criar conta';
  document.querySelector('#name-field').hidden = !registering;
  document.querySelector('#display-name').required = registering;
  document.querySelector('#password').autocomplete = registering ? 'new-password' : 'current-password';
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  submittingAuth = true;
  const email = document.querySelector('#email').value.trim();
  const displayName = document.querySelector('#display-name').value.trim();
  const password = document.querySelector('#password').value;
  try {
    if (registering) {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, { displayName });
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }
    await api('/api/auth/bootstrap', { method: 'POST', body: JSON.stringify({ nome: registering ? displayName : '' }) });
    location.href = '/';
  } catch (error) {
    showMessage(error.message || 'Falha ao autenticar.');
  }
});

document.querySelector('#google-login').addEventListener('click', async () => {
  submittingAuth = true;
  try {
    await signInWithPopup(auth, googleProvider);
    await api('/api/auth/bootstrap', { method: 'POST', body: JSON.stringify({}) });
    location.href = '/';
  } catch (error) { showMessage(error.message || 'Falha no login Google.'); }
});

onAuthStateChanged(auth, async (user) => {
  if (!user || submittingAuth) return;
  try {
    await api('/api/auth/bootstrap', { method: 'POST', body: JSON.stringify({}) });
    location.href = '/';
  } catch (error) { showMessage(error.message); }
});
