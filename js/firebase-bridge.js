// Canonical production URL: Vercel is the single public application origin.
if (window.location.hostname.endsWith('.github.io')) {
  const githubPrefix = '/to-nghe-taxi-vietnam';
  const remainingPath = window.location.pathname.startsWith(githubPrefix)
    ? window.location.pathname.slice(githubPrefix.length)
    : '';
  window.location.replace(
    `https://to-nghe-taxi.vercel.app${remainingPath}${window.location.search}${window.location.hash}`
  );
}

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signInAnonymously,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import firebaseConfig from './firebase-config.js';

function statePayload(state) {
  return {
    incenseCount: Number(state.incenseCount || 0),
    lastIncense: String(state.lastIncense || 'Chưa có').slice(0, 80),
    prayers: Array.isArray(state.prayers) ? state.prayers.slice(0, 10).map((prayer) => ({
      date: String(prayer.date || '').slice(0, 60),
      text: String(prayer.text || '').slice(0, 160)
    })) : [],
    meritPoints: Number(state.meritPoints || 0),
    userName: String(state.userName || 'Tài Xế Anonymous').slice(0, 80),
    joinDate: String(state.joinDate || '').slice(0, 20),
    queDrawnDate: String(state.queDrawnDate || '').slice(0, 40),
    likedPosts: Array.isArray(state.likedPosts) ? state.likedPosts.slice(0, 100) : []
  };
}

function waitForInitialAuthState(auth) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (settled) return;
      settled = true;
      unsubscribe();
      resolve(user || null);
    }, (error) => {
      if (settled) return;
      settled = true;
      unsubscribe();
      reject(error);
    });
  });
}

function mountCommunityHomeLogin() {
  const heading = document.querySelector('#page-community .glass-card h3');
  if (!heading || heading.querySelector('.community-home-login')) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'community-home-login';
  button.textContent = 'Đăng nhập Google';
  button.setAttribute('aria-label', 'Đăng nhập Google để đăng bài và thả tim');
  Object.assign(button.style, {
    flex: '0 0 auto', border: '1px solid #c9a45a', borderRadius: '10px',
    background: 'linear-gradient(145deg,#a67c1a 0%,#d4af37 50%,#e8c56a 100%)',
    color: '#170c02', fontFamily: "'Be Vietnam Pro', sans-serif",
    fontSize: 'clamp(10px, 2.4vw, 13px)', fontWeight: '800',
    padding: '9px 12px', whiteSpace: 'nowrap', cursor: 'pointer',
    boxShadow: '0 3px 14px rgba(212,175,55,.28)', textShadow: 'none'
  });
  button.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    window.driverCommunity?.login?.();
  });
  heading.style.display = 'flex';
  heading.style.alignItems = 'center';
  heading.style.justifyContent = 'space-between';
  heading.style.gap = '10px';
  heading.appendChild(button);
}

function scheduleCommunityHomeLogin() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountCommunityHomeLogin, { once: true });
  } else {
    mountCommunityHomeLogin();
  }
}

async function initializeFirebaseBridge() {
  try {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    await setPersistence(auth, browserLocalPersistence);
    const initialUser = await waitForInitialAuthState(auth);

    window.firebaseServices = { app, auth, db };
    window.firebaseBridge = {
      get uid() { return auth.currentUser?.uid || null; },
      get currentUser() { return auth.currentUser || null; },
      authPersistenceReady: Promise.resolve(),
      async googleLogin() {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        try {
          const result = await signInWithPopup(auth, provider);
          await waitForInitialAuthState(auth);
          return result.user;
        } catch (error) {
          const fallbackCodes = new Set([
            'auth/popup-blocked', 'auth/popup-closed-by-user',
            'auth/cancelled-popup-request', 'auth/operation-not-supported-in-this-environment',
            'auth/internal-error'
          ]);
          if (!fallbackCodes.has(error?.code)) throw error;
          await signInWithRedirect(auth, provider);
          return null;
        }
      },
      async ensureUser() {
        if (auth.currentUser) return auth.currentUser;
        const anonymousResult = await signInAnonymously(auth);
        return anonymousResult.user;
      },
      async loadUserState() {
        const user = await this.ensureUser();
        const stateRef = doc(db, 'users', user.uid);
        const snapshot = await getDoc(stateRef);
        return snapshot.exists() ? snapshot.data().appState || null : null;
      },
      async saveUserState(state) {
        const user = await this.ensureUser();
        const stateRef = doc(db, 'users', user.uid);
        await setDoc(stateRef, { appState: statePayload(state), updatedAt: serverTimestamp() }, { merge: true });
      }
    };

    await import('./community.js');
    // v2 was superseded by messenger-inbox-v3; loading both caused the old
    // composer/chat renderer to overwrite the new inbox.
    await import('./messenger-inbox-v3.js');
    await import('./messenger-chat-layout.js');
    await import('./messenger-contacts.js');
    scheduleCommunityHomeLogin();
    window.dispatchEvent(new CustomEvent('firebase-ready'));

    try {
      const redirectResult = await getRedirectResult(auth);
      if (redirectResult?.user) window.dispatchEvent(new CustomEvent('google-auth-complete', { detail: redirectResult.user }));
    } catch (error) {
      console.error('[Firebase] Google redirect failed:', error);
      window.dispatchEvent(new CustomEvent('google-auth-error', { detail: error }));
    }
    if (initialUser) console.info('[Firebase] Restored auth session:', initialUser.isAnonymous ? 'anonymous' : 'google/account');
    onAuthStateChanged(auth, (user) => window.dispatchEvent(new CustomEvent('firebase-auth-changed', { detail: user || null })));
  } catch (error) {
    console.warn('[Firebase] Initialization unavailable; using local state.', error);
    scheduleCommunityHomeLogin();
  }
}

initializeFirebaseBridge();

const NEWS_AI_URL = 'https://nguyenxuandat20091985-rgb.github.io/my-ai-bot/';

function installCommunityRoute() {
  if (typeof window.showPage !== 'function') return false;
  if (window.showPage.__communityRoutePatched) return true;
  const originalShowPage = window.showPage;
  const pageMap = ['home','incense','prayer','que','calendar','news','community','merit','profile','exorcism','ai'];
  const returnHome = () => { try { originalShowPage('home'); } catch (error) { console.warn('[Community] Could not restore home page:', error); } };

  window.showPage = function patchedShowPage(pageId) {
    if (pageId === 'news') { window.location.assign(NEWS_AI_URL); return; }
    if (pageId === 'community') {
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active', 'page-zoom'));
      document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
      const items = document.querySelectorAll('.menu-item'); const idx = pageMap.indexOf('community');
      if (idx >= 0 && items[idx]) items[idx].classList.add('active');
      const open = () => {
        if (window.driverCommunity?.open) {
          if (!window.driverCommunity.__homeReturnPatched) {
            const originalClose = window.driverCommunity.close;
            window.driverCommunity.close = () => { try { originalClose?.(); } finally { returnHome(); } };
            window.driverCommunity.__homeReturnPatched = true;
          }
          window.driverCommunity.open(); return true;
        }
        return false;
      };
      if (!open()) { let tries = 0; const timer = setInterval(() => { tries += 1; if (open() || tries >= 50) clearInterval(timer); }, 100); }
      return;
    }
    return originalShowPage(pageId);
  };
  window.showPage.__communityRoutePatched = true;
  return true;
}

if (!installCommunityRoute()) {
  window.addEventListener('DOMContentLoaded', () => {
    if (installCommunityRoute()) return;
    let tries = 0;
    const timer = setInterval(() => { tries += 1; if (installCommunityRoute() || tries >= 50) clearInterval(timer); }, 100);
  }, { once: true });
}
