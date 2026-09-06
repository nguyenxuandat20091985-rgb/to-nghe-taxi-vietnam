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

// IMPORTANT: community.js must be loaded only after Firebase services exist.
// The previous build only linked firebase-bridge.js from index.html, so the
// Community module was never mounted and the screen stayed on "Đang tải...".
import('./community.js').catch((error) => {
  console.error('[Firebase] Community module failed to load:', error);
});

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

// The main page historically routes "community" to a static placeholder.
// The real Facebook/Zalo-style community is a separate overlay exposed by
// community.js as window.driverCommunity. Intercept only that route and leave
// every other page exactly as it was.
function installCommunityRoute() {
  if (typeof window.showPage !== 'function') return false;
  if (window.showPage.__communityRoutePatched) return true;

  const originalShowPage = window.showPage;
  const pageMap = ['home','incense','prayer','que','calendar','news','community','merit','profile','exorcism','ai'];

  window.showPage = function patchedShowPage(pageId) {
    if (pageId === 'community') {
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active', 'page-zoom'));
      document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
      const items = document.querySelectorAll('.menu-item');
      const idx = pageMap.indexOf('community');
      if (idx >= 0 && items[idx]) items[idx].classList.add('active');

      const open = () => {
        if (window.driverCommunity?.open) {
          window.driverCommunity.open();
          return true;
        }
        return false;
      };

      if (!open()) {
        let tries = 0;
        const timer = setInterval(() => {
          tries += 1;
          if (open() || tries >= 50) clearInterval(timer);
        }, 100);
      }
      return;
    }
    return originalShowPage(pageId);
  };

  window.showPage.__communityRoutePatched = true;
  return true;
}

// showPage is declared by the legacy inline page script near the end of index.html.
// Wait until the DOM is ready, then patch it; also keep a short retry window for slow devices.
if (!installCommunityRoute()) {
  window.addEventListener('DOMContentLoaded', () => {
    if (installCommunityRoute()) return;
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (installCommunityRoute() || tries >= 50) clearInterval(timer);
    }, 100);
  }, { once: true });
}
