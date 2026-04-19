// ============================================================
// FIREBASE INITIALIZATION
// ============================================================

// Importar Firebase SDK
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import { getFirestore, collection, doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

// Configuración Firebase — Nutergia Seguro
const firebaseConfig = {
  apiKey: "AIzaSyCLmL_3hy-Vnveon4zLSXsMnVqSwxAxubw",
  authDomain: "nutergiaseguro.firebaseapp.com",
  projectId: "nutergiaseguro",
  storageBucket: "nutergiaseguro.firebasestorage.app",
  messagingSenderId: "67467161742",
  appId: "1:67467161742:web:8925a95ddf578bacf619df"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Exponer globalmente para que sync.js pueda acceder
window.firebaseApp = app;
window.firebaseDb = db;
window.firebaseReady = true;

console.log('✓ Firebase inicializado correctamente');

// Disparar evento para que sync.js sepa que Firebase está listo
window.dispatchEvent(new CustomEvent('firebaseReady'));
