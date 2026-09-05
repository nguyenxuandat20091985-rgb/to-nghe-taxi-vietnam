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

// Wait for Firebase Auth to restore its persisted session before creating an
// anonymous user. This is critical after Google signInWithRedirect on mobile:
// creating an anonymous user too early can hide the restored Google session.
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

async function initializeFirebaseBridge() {
  try {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    // IMPORTANT: wait for persisted Google credentials first. Only visitors
    // with no restored session receive an anonymous session.
    let user = await waitForInitialAuthState(auth);
    if (!user) {
      user = await signInAnonymously(auth);
      user = user.user;
    }

    const stateRef = doc(db, 'users', user.uid);

    window.firebaseServices = { app, auth, db };
    window.firebaseBridge = {
      uid: user.uid,
      async loadUserState() {
        const snapshot = await getDoc(stateRef);
        return snapshot.exists() ? snapshot.data().appState || null : null;
      },
      async saveUserState(state) {
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

    window.dispatchEvent(new CustomEvent('firebase-ready'));
  } catch (error) {
    console.warn('[Firebase] Initialization unavailable; using local state.', error);
  }
}

initializeFirebaseBridge();
