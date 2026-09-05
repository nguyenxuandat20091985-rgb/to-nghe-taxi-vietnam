// js/community.js
import { auth, db } from './firebase-init.js';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  linkWithPopup, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

function notify(message, type = 'success') {
  const existing = document.querySelector('.community-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `community-toast community-toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function ensureUserProfile(currentUser) {
  if (!currentUser) return;
  const userRef = doc(db, 'users', currentUser.uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid: currentUser.uid,
      displayName: currentUser.displayName || 'Tài xế ẩn danh',
      email: currentUser.email || '',
      photoURL: currentUser.photoURL || '',
      createdAt: serverTimestamp()
    }, { merge: true });
  }
}

async function googleLogin() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  
  const anon = auth.currentUser?.isAnonymous ? auth.currentUser : null;
  if (anon) {
    try {
      const result = await linkWithPopup(anon, provider);
      await ensureUserProfile(result.user);
      return result.user;
    } catch (error) {
      if (error.code !== 'auth/credential-already-in-use') throw error;
    }
  }

  try {
    const result = await signInWithPopup(auth, provider);
    await ensureUserProfile(result.user);
    notify('Đăng nhập Google thành công.', 'success');
    document.querySelector('#community-login-modal')?.remove();
    return result.user;
  } catch (error) {
    try {
      await signInWithRedirect(auth, provider);
    } catch (redirectError) {
      notify(`Lỗi đăng nhập: ${redirectError.message || redirectError.code}`, 'error');
      throw redirectError;
    }
  }
}

function loginModal(action = 'tương tác với cộng đồng') {
  document.querySelector('#community-login-modal')?.remove();
  const modal = document.createElement('div');
  modal.id = 'community-login-modal';
  modal.className = 'community-modal-backdrop';
  modal.innerHTML = `
    <div class="community-modal" role="dialog" aria-modal="true" aria-label="Đăng nhập">
      <button class="community-modal-close" aria-label="Đóng">×</button>
      <div class="community-seal">🚕</div>
      <h3>Đăng nhập tài xế</h3>
      <p>Vui lòng đăng nhập Google để ${esc(action)}.</p>
      <button class="community-google" id="community-google-login">G&nbsp;&nbsp; Đăng nhập bằng Google</button>
    </div>`;
  document.body.appendChild(modal);
  
  modal.querySelector('.community-modal-close').onclick = () => modal.remove();
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  
  const googleBtn = modal.querySelector('#community-google-login');
  googleBtn.onclick = async () => {
    googleBtn.disabled = true;
    googleBtn.textContent = 'Đang xử lý...';
    try {
      await googleLogin();
    } catch (e) {
      googleBtn.disabled = false;
      googleBtn.textContent = 'G  Đăng nhập bằng Google';
    }
  };
}

export function buildPanel() {
  const panel = document.createElement('div');
  panel.className = 'community-panel';
  panel.innerHTML = `
    <div class="community-header">
      <button class="community-back-btn">←</button>
      <h2>🚕 Cộng Đồng Tài Xế</h2>
      <div class="community-user-info">
        <span class="community-username">Khách</span>
      </div>
    </div>
    <div class="community-content">
      <div class="community-post-box">
        <h3>Chia sẻ cùng anh em</h3>
        <button class="community-login-btn">Đăng nhập Google</button>
        <div class="community-form" style="display:none;">
          <label>Hãng xe</label>
          <select class="community-car-brand">
            <option value="Vinasun">Vinasun</option>
            <option value="Mai Linh">Mai Linh</option>
            <option value="Xanh SM">Xanh SM</option>
            <option value="Grab">Grab</option>
            <option value="Khác">Khác</option>
          </select>
          <label>Nội dung</label>
          <textarea class="community-text" placeholder="Chia sẻ kinh nghiệm, thông tin đường phố..."></textarea>
          <button class="community-submit-btn">Đăng bài</button>
        </div>
      </div>
      <div class="community-feed-section">
        <div class="community-feed-header">
          <h3>Bài viết mới nhất</h3>
          <button class="community-refresh-btn">Realtime</button>
        </div>
        <div class="community-feed-list">
          <p class="community-empty">Chưa có bài viết. Hãy là người đầu tiên chia sẻ.</p>
        </div>
      </div>
    </div>
  `;

  const loginBtn = panel.querySelector('.community-login-btn');
  loginBtn.onclick = async () => {
    if (auth.currentUser && !auth.currentUser.isAnonymous) {
      notify('Anh/chị đã đăng nhập.', 'success');
      return;
    }
    loginBtn.disabled = true;
    loginBtn.textContent = 'Đang chuyển hướng...';
    try {
      await googleLogin();
    } catch (e) {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Đăng nhập Google';
    }
  };

  onAuthStateChanged(auth, (currentUser) => {
    const userInfo = panel.querySelector('.community-user-info');
    const formBox = panel.querySelector('.community-form');
    if (currentUser && !currentUser.isAnonymous) {
      userInfo.innerHTML = `<span class="community-username">${esc(currentUser.displayName || 'Tài xế')}</span>`;
      loginBtn.style.display = 'none';
      formBox.style.display = 'block';
    } else {
      userInfo.innerHTML = `<span class="community-username">Khách</span><small>Đăng nhập để đăng bài</small>`;
      loginBtn.style.display = 'block';
      loginBtn.disabled = false;
      loginBtn.textContent = 'Đăng nhập Google';
      formBox.style.display = 'none';
    }
  });

  return panel;
}
