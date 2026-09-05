// Driver Community module for Tổ Nghề Taxi Việt Nam.
// Google Auth + Firestore realtime community.

import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const COMPANIES = ['Mai Linh', 'Vinasun', 'Xanh SM', 'Grab', 'Taxi Group', 'Khác'];
const services = window.firebaseServices;
if (!services) throw new Error('[Community] Firebase services unavailable');
const { auth, db } = services;

let panel = null;
let unsubscribePosts = null;
let unsubscribeComments = null;
let currentPosts = [];
let activeCommentPostId = null;

const esc = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const fmtDate = (timestamp) => {
  if (!timestamp?.toDate) return 'Vừa đăng';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(timestamp.toDate());
};

function user() {
  return auth.currentUser && !auth.currentUser.isAnonymous ? auth.currentUser : null;
}

function notify(message, type = 'info') {
  const el = document.createElement('div');
  el.className = `community-toast ${type}`;
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

function closeLoginModal() {
  document.querySelector('#community-login-modal')?.remove();
}

function loginModal(action = 'tương tác với cộng đồng') {
  closeLoginModal();
  const modal = document.createElement('div');
  modal.id = 'community-login-modal';
  modal.className = 'community-modal-backdrop';
  modal.innerHTML = `
    <div class="community-modal" role="dialog" aria-modal="true" aria-label="Đăng nhập tài xế">
      <button class="community-modal-close" aria-label="Đóng">×</button>
      <div class="community-seal">🚕</div>
      <h3>Đăng nhập tài xế</h3>
      <p>Vui lòng đăng nhập Google để ${esc(action)}.</p>
      <button class="community-google" id="community-google-login">G&nbsp;&nbsp; Đăng nhập bằng Google</button>
    </div>`;
  document.body.appendChild(modal);

  modal.querySelector('.community-modal-close').onclick = closeLoginModal;
  modal.addEventListener('click', (e) => { if (e.target === modal) closeLoginModal(); });

  const googleBtn = modal.querySelector('#community-google-login');
  googleBtn.onclick = async () => {
    googleBtn.disabled = true;
    googleBtn.textContent = 'Đang đăng nhập Google…';
    try {
      const result = await googleLogin();
      if (result?.user) {
        await ensureUserProfile(result.user);
        closeLoginModal();
        renderCommunityUser();
        renderPosts();
        notify('Đăng nhập Google thành công.', 'success');
      }
    } catch (error) {
      console.error('[Community] Google sign-in failed:', error);
      googleBtn.disabled = false;
      googleBtn.textContent = 'G  Đăng nhập bằng Google';
      let errorMsg = 'Đăng nhập thất bại. Vui lòng thử lại.';
      if (error.code === 'auth/unauthorized-domain') {
        errorMsg = 'Tên miền chưa được thêm vào Authorized domains của Firebase.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMsg = 'Trình duyệt đã chặn cửa sổ Google. Hãy cho phép popup rồi thử lại.';
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMsg = 'Cửa sổ đăng nhập Google đã bị đóng.';
      } else if (error.message) {
        errorMsg = `Lỗi: ${error.message}`;
      }
      notify(errorMsg, 'error');
    }
  };
}

async function ensureUserProfile(profile = {}) {
  const u = profile?.uid ? profile : user();
  if (!u || u.isAnonymous) return null;
  const ref = doc(db, 'users', u.uid);
  const snap = await getDoc(ref);
  const data = {
    displayName: profile.displayName ?? u.displayName ?? 'Tài xế',
    photoURL: profile.photoURL ?? u.photoURL ?? '',
    company: profile.company ?? (snap.exists() ? snap.data().company || 'Khác' : 'Khác'),
  };
  if (!snap.exists()) data.createdAt = serverTimestamp();
  await setDoc(ref, data, { merge: true });
  return data;
}

async function googleLogin() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    return await signInWithPopup(auth, provider);
  } catch (error) {
    const fallbackCodes = new Set([
      'auth/popup-blocked',
      'auth/popup-closed-by-user',
      'auth/cancelled-popup-request',
      'auth/operation-not-supported-in-this-environment',
    ]);
    if (!fallbackCodes.has(error.code)) throw error;
    await signInWithRedirect(auth, provider);
    return null;
  }
}

async function toggleLike(postId) {
  const u = user();
  if (!u) { loginModal('thả tim bài viết'); return; }
  const ref = doc(db, 'posts', postId);
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) throw new Error('Bài viết không còn tồn tại');
      const data = snap.data();
      const likedBy = Array.isArray(data.likedBy) ? [...data.likedBy] : [];
      const index = likedBy.indexOf(u.uid);
      if (index >= 0) likedBy.splice(index, 1);
      else likedBy.push(u.uid);
      tx.update(ref, { likedBy, likesCount: likedBy.length });
    });
  } catch (error) {
    console.error('[Community] like failed', error);
    notify('Không thể cập nhật lượt thích. Vui lòng thử lại.', 'error');
  }
}

async function submitPost(event) {
  event.preventDefault();
  const u = user();
  if (!u) { loginModal('đăng bài'); return; }
  const form = event.currentTarget;
  const company = form.company.value;
  const content = form.content.value.trim();
  if (!content) return notify('Anh/chị hãy nhập nội dung bài viết.', 'error');
  if (content.length > 2000) return notify('Nội dung tối đa 2.000 ký tự.', 'error');
  const submit = form.querySelector('button[type="submit"]');
  submit.disabled = true;
  try {
    const profile = await ensureUserProfile({ company });
    await setDoc(doc(collection(db, 'posts')), {
      authorId: u.uid,
      authorName: profile?.displayName || u.displayName || 'Tài xế',
      authorPhoto: profile?.photoURL || u.photoURL || '',
      company,
      content,
      createdAt: serverTimestamp(),
      likesCount: 0,
      likedBy: [],
      commentsCount: 0,
    });
    form.reset();
    form.company.value = company;
    notify('Đã đăng bài lên Cộng Đồng Tài Xế.', 'success');
  } catch (error) {
    console.error('[Community] post failed', error);
    notify('Đăng bài thất bại. Hãy kiểm tra Firestore Rules và kết nối Firebase.', 'error');
  } finally {
    submit.disabled = false;
  }
}

function openComments(postId) {
  activeCommentPostId = postId;
  document.querySelector('#community-comments-modal')?.remove();
  const modal = document.createElement('div');
  modal.id = 'community-comments-modal';
  modal.className = 'community-modal-backdrop comments-backdrop';
  modal.innerHTML = `
    <div class="community-sheet">
      <div class="community-sheet-header"><span>💬 Bình luận tài xế</span><button class="community-sheet-close">×</button></div>
      <div class="community-sheet-body" id="comments-list-container"><div class="community-empty">Đang tải bình luận...</div></div>
      <form class="community-sheet-form" id="comment-submit-form">
        <input type="text" name="commentText" placeholder="Viết bình luận..." maxlength="500" required autocomplete="off">
        <button type="submit">Gửi</button>
      </form>
    </div>`;
  document.body.appendChild(modal);
  modal.querySelector('.community-sheet-close').onclick = closeComments;
  modal.addEventListener('click', (e) => { if (e.target === modal) closeComments(); });
  modal.querySelector('#comment-submit-form').onsubmit = handleAddComment;

  const qComments = query(collection(db, 'posts', postId, 'comments'), orderBy('createdAt', 'asc'));
  unsubscribeComments = onSnapshot(qComments, (snapshot) => {
    const container = document.getElementById('comments-list-container');
    if (!container) return;
    if (snapshot.empty) {
      container.innerHTML = '<div class="community-empty">Chưa có bình luận nào. Hãy là người đầu tiên để lại ý kiến!</div>';
      return;
    }
    container.innerHTML = snapshot.docs.map((docSnap) => {
      const c = docSnap.data();
      const avatar = c.authorPhoto ? `<img src="${esc(c.authorPhoto)}" alt="">` : '<span>🚕</span>';
      return `<div class="community-comment-item"><div class="community-avatar mini">${avatar}</div><div class="community-comment-content"><div class="community-comment-author"><strong>${esc(c.authorName || 'Tài xế')}</strong><small>${fmtDate(c.createdAt)}</small></div><p>${esc(c.content || '')}</p></div></div>`;
    }).join('');
    container.scrollTop = container.scrollHeight;
  }, (err) => {
    console.error('[Community] Load comments error', err);
    const container = document.getElementById('comments-list-container');
    if (container) container.innerHTML = '<div class="community-empty error">Không thể tải bình luận. Vui lòng thử lại.</div>';
  });
}

function closeComments() {
  unsubscribeComments?.();
  unsubscribeComments = null;
  activeCommentPostId = null;
  document.querySelector('#community-comments-modal')?.remove();
}

async function handleAddComment(e) {
  e.preventDefault();
  const u = user();
  if (!u) { loginModal('bình luận bài viết'); return; }
  const form = e.currentTarget;
  const text = form.commentText.value.trim();
  if (!text || !activeCommentPostId) return;
  const btn = form.querySelector('button');
  btn.disabled = true;
  try {
    const profile = await ensureUserProfile();
    await addDoc(collection(db, 'posts', activeCommentPostId, 'comments'), {
      authorId: u.uid,
      authorName: profile?.displayName || u.displayName || 'Tài xế',
      authorPhoto: profile?.photoURL || u.photoURL || '',
      content: text,
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, 'posts', activeCommentPostId), { commentsCount: increment(1) });
    form.reset();
  } catch (err) {
    console.error('[Community] Add comment error', err);
    notify('Không thể gửi bình luận. Vui lòng thử lại.', 'error');
  } finally {
    btn.disabled = false;
  }
}

function renderCommunityUser() {
  if (!panel) return;
  const u = user();
  const name = u?.displayName || 'Khách';
  const avatar = u?.photoURL ? `<img src="${esc(u.photoURL)}" alt="">` : '<span>👤</span>';
  const profile = panel.querySelector('.community-user');
  if (profile) {
    profile.innerHTML = u
      ? `${avatar}<div><strong>${esc(name)}</strong><small>Đã đăng nhập</small></div>`
      : `<span>👤</span><div><strong>Khách</strong><small>Chạm để đăng nhập Google</small></div>`;
    profile.setAttribute('aria-label', u ? 'Tài khoản tài xế đã đăng nhập' : 'Đăng nhập Google');
    profile.classList.toggle('is-guest', !u);
  }
}

function renderPosts() {
  if (!panel) return;
  const list = panel.querySelector('.community-posts');
  if (!list) return;
  if (!currentPosts.length) {
    list.innerHTML = '<div class="community-empty">Chưa có bài viết. Hãy là người đầu tiên chia sẻ cùng anh em tài xế.</div>';
    return;
  }
  const uid = user()?.uid;
  list.innerHTML = currentPosts.map(({ id, data }) => {
    const liked = uid && Array.isArray(data.likedBy) && data.likedBy.includes(uid);
    const avatar = data.authorPhoto ? `<img src="${esc(data.authorPhoto)}" alt="">` : '<span>🚕</span>';
    return `<article class="community-post" data-post-id="${esc(id)}">
      <header><div class="community-avatar">${avatar}</div><div class="community-author"><strong>${esc(data.authorName || 'Tài xế')}</strong><span>${esc(data.company || 'Khác')} · ${fmtDate(data.createdAt)}</span></div></header>
      <p>${esc(data.content || '').replaceAll('\n', '<br>')}</p>
      <div class="community-post-footer"><button class="community-like ${liked ? 'liked' : ''}" data-like="${esc(id)}" aria-label="${liked ? 'Bỏ thích' : 'Thả tim'}">${liked ? '♥' : '♡'} <span>${Number(data.likesCount || 0)}</span></button><button class="community-comment-btn" data-comment="${esc(id)}">💬 <span>${Number(data.commentsCount || 0)}</span> Bình luận</button></div>
    </article>`;
  }).join('');
  list.querySelectorAll('[data-like]').forEach((btn) => btn.addEventListener('click', () => toggleLike(btn.dataset.like)));
  list.querySelectorAll('[data-comment]').forEach((btn) => btn.addEventListener('click', () => openComments(btn.dataset.comment)));
}

function buildPanel() {
  const companies = COMPANIES.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
  panel = document.createElement('section');
  panel.id = 'community-panel';
  panel.innerHTML = `
    <div class="community-shell">
      <div class="community-topbar">
        <button class="community-back" aria-label="Đóng Cộng Đồng">←</button>
        <div class="community-heading"><small>TỔ NGHỀ TAXI VIỆT NAM</small><h2>🚕 Cộng Đồng Tài Xế</h2></div>
        <button type="button" class="community-user is-guest" aria-label="Đăng nhập Google"><span>👤</span><div><strong>Khách</strong><small>Chạm để đăng nhập Google</small></div></button>
      </div>
      <div class="community-scroll">
        <div class="community-composer">
          <div class="community-composer-title"><span>✍️ Chia sẻ cùng anh em</span><span class="community-status">Cộng đồng tài xế</span></div>
          <form class="community-form">
            <label>Hãng xe<select name="company" required>${companies}</select></label>
            <label>Nội dung<textarea name="content" maxlength="2000" rows="4" placeholder="Chia sẻ kinh nghiệm, thông tin đường phố, câu chuyện nghề…" required></textarea></label>
            <button type="submit" class="community-submit">Đăng bài</button>
          </form>
        </div>
        <div class="community-feed-title"><strong>Bài viết mới nhất</strong><span>Realtime</span></div>
        <div class="community-posts"><div class="community-empty">Đang tải cộng đồng…</div></div>
      </div>
    </div>`;
  document.body.appendChild(panel);
  panel.querySelector('.community-back').onclick = closeCommunity;
  panel.querySelector('.community-user').onclick = () => {
    if (!user()) loginModal('đăng bài và thả tim');
  };
  panel.querySelector('.community-form').addEventListener('submit', submitPost);
  renderCommunityUser();
}

function openCommunity() {
  if (panel) { renderCommunityUser(); renderPosts(); return; }
  buildPanel();
  const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(50));
  unsubscribePosts = onSnapshot(q, (snap) => {
    currentPosts = snap.docs.map((d) => ({ id: d.id, data: d.data() }));
    renderPosts();
  }, (error) => {
    console.error('[Community] realtime listener failed', error);
    const list = panel?.querySelector('.community-posts');
    if (list) list.innerHTML = '<div class="community-empty error">Không thể tải dữ liệu cộng đồng. Vui lòng kiểm tra Firestore Rules hoặc kết nối mạng.</div>';
  });
}

function closeCommunity() {
  closeComments();
  unsubscribePosts?.();
  unsubscribePosts = null;
  panel?.remove();
  panel = null;
  currentPosts = [];
}

const communityStyles = `
#community-panel{position:fixed;inset:0;z-index:99999;background:#050301;color:#f0e0a0;font-family:Arial,sans-serif}
.community-shell{height:100%;display:flex;flex-direction:column;background:radial-gradient(circle at top,#2a1908 0,#090604 38%,#050301 100%)}
.community-topbar{display:grid;grid-template-columns:42px minmax(0,1fr) minmax(142px,auto);align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid rgba(212,175,55,.3);background:rgba(15,8,2,.96);backdrop-filter:blur(12px)}
.community-back{width:42px;height:42px;border:1px solid #8b6914;border-radius:12px;background:#1b0e03;color:#f0e0a0;font-size:24px}
.community-heading{min-width:0;overflow:hidden}.community-topbar h2{margin:2px 0;font-size:19px;line-height:1.15;white-space:nowrap}.community-topbar small{display:block;color:#c9a45a;font-size:10px}
.community-user{appearance:none;-webkit-appearance:none;width:100%;box-sizing:border-box;display:flex;align-items:center;gap:8px;min-width:142px;padding:6px 8px;border:1px solid transparent;border-radius:12px;background:transparent;color:inherit;text-align:left;cursor:pointer}
.community-user.is-guest{border-color:#8b6914;background:rgba(60,35,8,.28)}
.community-user:active{transform:scale(.98)}
.community-user img,.community-avatar img{width:36px;height:36px;border-radius:50%;object-fit:cover;border:1px solid #c9a45a}.community-user>span,.community-avatar>span{width:36px;height:36px;display:grid;place-items:center;border:1px solid #8b6914;border-radius:50%;background:#211006}.community-user strong,.community-user small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.community-user strong{font-size:12px}.community-user small{font-size:9px;color:#aa955e}
.community-scroll{flex:1;overflow:auto;padding:14px 12px 40px}.community-composer,.community-post{border:1px solid rgba(212,175,55,.28);border-radius:16px;background:rgba(38,20,7,.78);box-shadow:0 8px 30px rgba(0,0,0,.25)}.community-composer{padding:14px;margin-bottom:18px}.community-composer-title,.community-feed-title{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px;font-weight:700}.community-status{font-size:10px;color:#8fd3a0;border:1px solid #386548;padding:4px 7px;border-radius:20px;white-space:nowrap}.community-form label{display:block;font-size:11px;color:#d6bf82;margin-top:10px}.community-form select,.community-form textarea{width:100%;box-sizing:border-box;margin-top:6px;padding:11px;border:1px solid #70551a;border-radius:10px;background:#100903;color:#f4e5b3;font:inherit}.community-form textarea{resize:vertical;min-height:90px}.community-submit{width:100%;margin-top:10px;border:1px solid #c9a45a;border-radius:10px;background:#d4af37;color:#170c02;font-weight:800;padding:11px 12px}.community-feed-title{padding:0 2px;color:#e7d18d}.community-feed-title span{font-size:10px;color:#8fd3a0;border:1px solid #386548;padding:4px 7px;border-radius:20px}.community-post{padding:14px;margin-bottom:12px}.community-post header{display:flex;align-items:center;gap:9px}.community-author strong,.community-author span{display:block}.community-author strong{font-size:13px;color:#f3df9d}.community-author span{font-size:10px;color:#a99870;margin-top:2px}.community-post p{font-size:13px;line-height:1.55;color:#f5ecd2;white-space:normal;margin:12px 0}.community-post-footer{display:flex;align-items:center;gap:16px;border-top:1px solid rgba(212,175,55,.15);padding-top:10px;margin-top:10px}.community-like,.community-comment-btn{border:0;background:transparent;color:#bda86d;font-size:13px;cursor:pointer;display:flex;align-items:center;gap:5px;padding:4px 0}.community-like.liked{color:#ffcf4a}.community-empty{text-align:center;padding:32px 15px;border:1px dashed #5d4718;border-radius:14px;color:#9f8b5e}.community-empty.error{color:#e6a6a6}.community-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:100001;max-width:90%;padding:11px 15px;border:1px solid #8b6914;border-radius:12px;background:#211006;color:#f5e6b4;box-shadow:0 10px 30px #000}.community-toast.success{border-color:#5c9a6d}.community-toast.error{border-color:#a75b5b}.community-modal-backdrop{position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.76);display:grid;place-items:center;padding:20px}.community-modal{position:relative;width:min(390px,100%);box-sizing:border-box;padding:24px;border:1px solid #9c771e;border-radius:18px;background:linear-gradient(160deg,#2b1707,#0c0703);text-align:center;box-shadow:0 20px 60px #000}.community-modal h3{margin:8px 0;color:#f1db93}.community-modal p{color:#cbb98a;font-size:13px;line-height:1.5}.community-modal-close{position:absolute;right:10px;top:8px;border:0;background:none;color:#d6bf82;font-size:25px}.community-seal{font-size:34px}.community-google{width:100%;padding:12px;border-radius:11px;border:1px solid #aaa;background:#fff;color:#222;font-weight:700}.comments-backdrop{display:flex;align-items:flex-end;justify-content:center;padding:0!important;z-index:100002!important}.community-sheet{width:100%;max-width:600px;height:75vh;background:#0d0803;border-top:1px solid #8b6914;border-radius:20px 20px 0 0;display:flex;flex-direction:column;box-shadow:0 -10px 40px #000}.community-sheet-header{display:flex;justify-content:space-between;align-items:center;padding:14px 16px;border-bottom:1px solid rgba(212,175,55,.2);font-weight:700;color:#f1db93}.community-sheet-close{border:0;background:none;color:#d6bf82;font-size:24px;cursor:pointer}.community-sheet-body{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:12px}.community-comment-item{display:flex;gap:10px;background:rgba(33,16,6,.6);padding:10px;border-radius:12px;border:1px solid rgba(212,175,55,.1)}.community-avatar.mini img,.community-avatar.mini span{width:28px!important;height:28px!important;font-size:12px}.community-comment-content{flex:1;font-size:12px}.community-comment-author{display:flex;justify-content:space-between;gap:8px;color:#c9a45a;margin-bottom:3px}.community-comment-author small{color:#77643b;font-size:10px}.community-comment-content p{margin:0;color:#e8ddc5;line-height:1.4}.community-sheet-form{display:flex;gap:8px;padding:12px;border-top:1px solid rgba(212,175,55,.2);background:#070402}.community-sheet-form input{flex:1;padding:10px 12px;border:1px solid #5a4518;border-radius:10px;background:#150d05;color:#fff;font-size:13px;outline:none}.community-sheet-form button{padding:10px 16px;border:0;border-radius:10px;background:#d4af37;color:#000;font-weight:bold;cursor:pointer}
@media (max-width:520px){.community-topbar{grid-template-columns:42px minmax(0,1fr) minmax(132px,142px);gap:7px;padding:10px 10px}.community-topbar h2{font-size:17px}.community-topbar small{font-size:9px}.community-user{min-width:132px;padding:5px 6px}.community-user>span{width:34px;height:34px}.community-user strong{font-size:11px}.community-user small{font-size:8px}}
`;
const style = document.createElement('style');
style.textContent = communityStyles;
document.head.appendChild(style);

function interceptCommunityNavigation() {
  document.addEventListener('click', (event) => {
    const target = event.target.closest('button, a, div, li, span, [role="button"]');
    if (!target || target.closest('#community-panel')) return;
    const text = (target.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
    const isCommunity = text.includes('cộng đồng') || target.id?.toLowerCase().includes('community') || target.getAttribute('data-tab')?.toLowerCase().includes('community');
    if (isCommunity) {
      event.preventDefault();
      event.stopPropagation();
      openCommunity();
    }
  }, true);
}

onAuthStateChanged(auth, () => {
  renderCommunityUser();
  renderPosts();
});

getRedirectResult(auth).then(async (result) => {
  if (!result?.user) return;
  await ensureUserProfile(result.user);
  closeLoginModal();
  renderCommunityUser();
  renderPosts();
  notify('Đăng nhập Google thành công.', 'success');
}).catch((error) => {
  console.error('[Community] redirect result error:', error);
  if (error.code && error.code !== 'auth/no-auth-event') notify(`Đăng nhập thất bại: ${error.message}`, 'error');
});

interceptCommunityNavigation();
window.driverCommunity = { open: openCommunity, close: closeCommunity, login: () => loginModal('đăng bài và thả tim') };
