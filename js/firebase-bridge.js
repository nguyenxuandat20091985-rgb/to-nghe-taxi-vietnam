// Firebase bootstrap for Tổ Nghề Taxi Việt Nam.
// Community Google login is handled here once, so the UI never has competing auth listeners.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signInAnonymously,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import firebaseConfig from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
window.firebaseServices = { app, auth, db };

function statePayload(state) {
  return {
    incenseCount: Number(state.incenseCount || 0),
    lastIncense: String(state.lastIncense || 'Chưa có').slice(0, 80),
    prayers: Array.isArray(state.prayers) ? state.prayers.slice(0, 10).map(p => ({ date: String(p.date || '').slice(0, 60), text: String(p.text || '').slice(0, 160) })) : [],
    meritPoints: Number(state.meritPoints || 0),
    userName: String(state.userName || 'Tài Xế Anonymous').slice(0, 80),
    joinDate: String(state.joinDate || '').slice(0, 20),
    queDrawnDate: String(state.queDrawnDate || '').slice(0, 40),
    likedPosts: Array.isArray(state.likedPosts) ? state.likedPosts.slice(0, 100) : []
  };
}

function isMobileBrowser() {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.matchMedia?.('(pointer: coarse)').matches;
}

async function googleLogin() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  // Mobile Chrome is much more reliable with a full-page OAuth redirect than a popup.
  if (isMobileBrowser()) {
    await signInWithRedirect(auth, provider);
    return null;
  }

  try {
    return (await signInWithPopup(auth, provider)).user;
  } catch (error) {
    const fallback = new Set([
      'auth/popup-blocked',
      'auth/popup-closed-by-user',
      'auth/cancelled-popup-request',
      'auth/operation-not-supported-in-this-environment',
      'auth/internal-error'
    ]);
    if (!fallback.has(error.code)) throw error;
    await signInWithRedirect(auth, provider);
    return null;
  }
}

window.firebaseBridge = {
  get uid() { return auth.currentUser?.uid || null; },
  get currentUser() { return auth.currentUser || null; },
  googleLogin,
  async ensureUser() {
    if (auth.currentUser) return auth.currentUser;
    return (await signInAnonymously(auth)).user;
  },
  async loadUserState() {
    const user = await this.ensureUser();
    const snap = await getDoc(doc(db, 'users', user.uid));
    return snap.exists() ? snap.data().appState || null : null;
  },
  async saveUserState(state) {
    const user = await this.ensureUser();
    await setDoc(doc(db, 'users', user.uid), { appState: statePayload(state), updatedAt: serverTimestamp() }, { merge: true });
  }
};

// Consume the OAuth redirect exactly once and notify the Community module.
getRedirectResult(auth).then((result) => {
  if (result?.user) window.dispatchEvent(new CustomEvent('google-auth-complete', { detail: result.user }));
}).catch((error) => {
  console.error('[Firebase] Google redirect failed:', error);
  window.dispatchEvent(new CustomEvent('google-auth-error', { detail: error }));
});

onAuthStateChanged(auth, (user) => {
  window.dispatchEvent(new CustomEvent('firebase-auth-changed', { detail: user || null }));
});
