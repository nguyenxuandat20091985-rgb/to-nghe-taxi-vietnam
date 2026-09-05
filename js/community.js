// js/community.js - Phiên bản tối ưu đầy đủ tính năng đăng nhập và giao diện Cộng Đồng

import { auth, db } from './firebase-init.js';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  linkWithPopup, 
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Hàm hiển thị thông báo toast
function notify(message, type = 'success') {
  const existingToast = document.querySelector('.community-toast');
  if (existingToast) existingToast.remove();

  const toast = document.createElement('div');
  toast.className = `community-toast community-toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Hàm chống lỗi HTML Injection
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Kiểm tra user hiện tại
function user() {
  return auth.currentUser;
}

// Đảm bảo khởi tạo profile user trong Firestore
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

// Hàm xử lý đăng nhập Google (Hỗ trợ Popup + Redirect dự phòng)
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
      console.warn('[Community] linkWithPopup error:', error);
      if (error.code !== 'auth/credential-already-in-use') throw error;
    }
  }

  try {
    console.log('[Community] Đang gọi signInWithPopup...');
    const result = await signInWithPopup(auth, provider);
    await ensureUserProfile(result.user);
    notify('Đăng nhập Google thành công.', 'success');
    document.querySelector('#community-login-modal')?.remove();
    return result.user;
  } catch (error) {
    console.error('[Community] signInWithPopup error:', error);
    try {
      console.log('[Community] Chuyển sang signInWithRedirect dự phòng...');
      await signInWithRedirect(auth, provider);
    } catch (redirectError) {
      console.error('[Community] redirect error:', redirectError);
      notify(`Lỗi đăng nhập: ${redirectError.message || redirectError.code}`, 'error');
      throw redirectError;
    }
  }
}

// Modal đăng nhập
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
    googleBtn.textContent = 'Đang xử lý đăng nhập...';
    try {
      await googleLogin();
    } catch (error) {
      googleBtn.disabled = false;
      googleBtn.textContent = 'G  Đăng nhập bằng Google';
    }
  };
}

// Xây dựng giao diện bảng cộng đồng
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
          <textarea class="community-text" placeholder="Chia sẻ kinh nghiệm, thông tin đường phố, câu chuyện nghề..."></textarea>
          <button class="community-submit-btn">Đăng bài</button>
        </div>
      </div>
      <div class="community-feed-section">
        <div class="community-feed-header">
          <h3>Bài viết mới nhất</h3>
          <button class="community-refresh-btn">Realtime</button>
        </div>
        <div class="community-feed-list">
          <p class="community-empty">Chưa có bài viết. Hãy là người đầu tiên chia sẻ cùng anh em tài xế.</p>
        </div>
      </div>
    </div>
  `;

  // Gắn sự kiện cho nút đăng nhập ở góc trên/khu vực đăng bài
  const loginBtn = panel.querySelector('.community-login-btn');
  loginBtn.onclick = async () => {
    if (user()) {
      notify('Anh/chị đã đăng nhập.', 'success');
      return;
    }
    loginBtn.disabled = true;
    loginBtn.textContent = 'Đang chuyển hướng...';
    try {
      await googleLogin();
    } catch (error) {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Đăng nhập Google';
    }
  };

  // Theo dõi trạng thái đăng nhập để cập nhật giao diện nút
  onAuthStateChanged(auth, (currentUser) => {
    const userInfo = panel.querySelector('.community-user-info');
    const formBox = panel.querySelector('.community-form');
    if (currentUser && !currentUser.isAnonymous) {
      userInfo.innerHTML = `<span class="community-username">${esc(currentUser.displayName || 'Tài xế')}</span>`;
      loginBtn.style.display = 'none';
      formBox.style.display = 'block';
    } else {
      userInfo.innerHTML = `<span class="community-username">Khách</span><small>Đăng nhập để đăng bài & thả tim</small>`;
      loginBtn.style.display = 'block';
      loginBtn.disabled = false;
      loginBtn.textContent = 'Đăng nhập Google';
      formBox.style.display = 'none';
    }
  });

  return panel;
}
