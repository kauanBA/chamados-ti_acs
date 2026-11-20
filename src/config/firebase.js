const admin = require('firebase-admin');

let initialized = false;

function initializeFirebase() {
  if (initialized || admin.apps.length) {
    initialized = true;
    return admin;
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON não foi configurada.');
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(raw);
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON precisa conter um JSON válido em uma única variável.');
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id
  });

  initialized = true;
  return admin;
}

function auth() {
  if (!initialized) initializeFirebase();
  return admin.auth();
}

function db() {
  if (!initialized) initializeFirebase();
  return admin.firestore();
}

module.exports = { admin, initializeFirebase, auth, db };
