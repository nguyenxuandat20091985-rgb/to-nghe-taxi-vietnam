// Canonical production URL: GitHub Pages is a compatibility alias;
// Vercel short domain is the single public application origin.
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
import { getAuth, onAuthStateChanged, signInAnonymously } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
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

  heading.classList.add('community-home-heading');
  heading.style.display = 'flex';
  heading.style.alignItems = 'center';
  heading.style.justifyContent = 'space-between';
  heading.style.gap = '10px';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'community-home-login';
  button.textContent = 'Đăng nhập Google';
  button.setAttribute('aria-label', 'Đăng nhập Google để đăng bài và thả tim');
  Object.assign(button.style, {
    flex: '0 0 auto',
    border: '1px solid #c9a45a',
    borderRadius: '10px',
    background: 'linear-gradient(145deg,#a67c1a 0%,#d4af37 50%,#e8c56a 100%)',
    color: '#170c02',
    fontFamily: "'Be Vietnam Pro', sans-serif",
    fontSize: 'clamp(10px, 2.4vw, 13px)',
    fontWeight: '800',
    padding: '9px 12px',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    boxShadow: '0 3px 14px rgba(212,175,55,.28)',
    textShadow: 'none'
  });
  button.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (window.driverCommunity?.login) {
      window.driverCommunity.login();
    }
  });
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

    // IMPORTANT: expose Firebase services and load the Community module BEFORE
    // creating an anonymous session. Otherwise Community's Google button sees
    // an anonymous currentUser and can get stuck in the wrong OAuth flow.
    // Visitors who use the rest of the app still receive an anonymous account
    // lazily, only when cloud app-state persistence is actually requested.
    const initialUser = await waitForInitialAuthState(auth);

    window.firebaseServices = { app, auth, db };
    window.firebaseBridge = {
      get uid() {
        return auth.currentUser?.uid || null;
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
        await setDoc(stateRef, {
          appState: statePayload(state),
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
    };

    try {
      await import('./community.js');
    } catch (communityError) {
      console.error('[Community] Module unavailable; core app remains usable.', communityError);
    }

    scheduleCommunityHomeLogin();
    window.dispatchEvent(new CustomEvent('firebase-ready'));

    // Keep the restored user observable for diagnostics without forcing a new
    // anonymous account. A Google login can therefore start from a clean null
    // auth state on a new visitor.
    if (initialUser) {
      console.info('[Firebase] Restored auth session:', initialUser.isAnonymous ? 'anonymous' : 'google/account');
    }
  } catch (error) {
    console.warn('[Firebase] Initialization unavailable; using local state.', error);
    scheduleCommunityHomeLogin();
  }
}

initializeFirebaseBridge();
