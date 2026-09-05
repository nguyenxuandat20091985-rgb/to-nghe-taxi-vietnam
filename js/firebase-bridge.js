// Firebase bootstrap for Tổ Nghề Taxi Việt Nam.
// Keep Google OAuth independent from the Anonymous app-state session.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
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

async function googleLogin() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  // Do not link Google to the anonymous state account here. A fresh Google
  // sign-in is reliable on the public Vercel/GitHub Pages origins and avoids
  // the anonymous-link race that previously made the button appear inert.
  try {
    const credential = await signInWithPopup(auth, provider);
    return credential.user;
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
    const { signInAnonymously } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
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

// Resolve an OAuth redirect as soon as the Firebase module loads. This is
// required after signInWithRedirect() returns to the app.
getRedirectResult(auth).then((result) => {
  if (result?.user) window.dispatchEvent(new CustomEvent('google-auth-complete', { detail: result.user }));
}).catch((error) => {
  console.error('[Firebase] Google redirect failed:', error);
  window.dispatchEvent(new CustomEvent('google-auth-error', { detail: error }));
});

onAuthStateChanged(auth, (user) => {
  window.dispatchEvent(new CustomEvent('firebase-auth-changed', { detail: user || null }));
});

// The outer Community login control is intentionally independent from the
// Community tab's internal composer. It survives navigation and is always a
// real button receiving touch/click events.
function mountOuterLogin() {
  const host = document.querySelector('#page-community');
  if (!host || document.querySelector('#community-outer-google-login')) return;

  const button = document.createElement('button');
  button.id = 'community-outer-google-login';
  button.type = 'button';
  button.textContent = 'Đăng nhập Google';
  button.setAttribute('aria-label', 'Đăng nhập Google');
  button.style.cssText = [
    'position:relative', 'z-index:2147483647', 'pointer-events:auto',
    'touch-action:manipulation', 'display:inline-flex', 'align-items:center',
    'justify-content:center', 'min-height:42px', 'padding:10px 16px',
    'margin:10px 0', 'border:1px solid #d4af37', 'border-radius:12px',
    'background:#d4af37', 'color:#17100a', 'font-weight:800',
    'cursor:pointer', 'user-select:none'
  ].join(';');

  const activate = (event) => {
    event.preventDefault();
    event.stopPropagation();
    googleLogin().catch(error => {
      console.error('[Firebase] Google login:', error);
      alert('Không thể mở Google. Vui lòng kiểm tra quyền đăng nhập Google trong Firebase.');
    });
  };
  button.addEventListener('pointerup', activate, { passive: false });
  button.addEventListener('click', activate, { passive: false });
  host.insertBefore(button, host.firstChild);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountOuterLogin, { once: true });
else mountOuterLogin();
window.addEventListener('firebase-auth-changed', mountOuterLogin);
