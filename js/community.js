// Cộng Đồng Tài Xế - Facebook/Zalo style community for Tổ Nghề Taxi Việt Nam.
// Vanilla JS + Firebase Auth + Firestore realtime. No browser prompt().
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const { auth, db } = window.firebaseServices || {};
if (!auth || !db) throw new Error('[Community] Firebase services unavailable');

const COMPANIES = ['Tất cả', 'Mai Linh', 'Vinasun', 'Xanh SM', 'Grab', 'Taxi Group', 'Lái xe công nghệ', 'Khác'];
const POST_TYPES = ['Bản tin', 'Cảnh báo đường phố', 'Tuyển dụng', 'Kinh nghiệm nghề', 'Khác'];
const CHAT_ROOM = 'drivers';

let panel = null;
let unsubscribePosts = null;
let unsubscribeComments = null;
let unsubscribeMessages = null;
let currentPosts = [];
let activeCommentPostId = null;
let activeFeedFilter = 'Tất cả';
let activeTab = 'feed';
let loginBusy = false;

const esc = (value = '') => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

function currentUser() {
  const u = auth.currentUser;
  return u && !u.isAnonymous ? u : null;
}

function fmtDate(timestamp) {
  if (!timestamp?.toDate) return 'Vừa đăng';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(timestamp.toDate());
}

function notify(message, type = 'info') {
  const el = document.createElement('div');
  el.className = `tc-toast ${type}`;
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

async function ensureUserProfile(company) {
  const u = currentUser();
  if (!u) return null;
  const ref = doc(db, 'users', u.uid);
  const snap = await getDoc(ref);
  const existing = snap.exists() ? snap.data() : {};
  const profile = {
    displayName: u.displayName || existing.displayName || 'Tài xế',
    photoURL: u.photoURL || existing.photoURL || '',
    company: company || existing.company || 'Khác',
  };
  if (!snap.exists()) profile.createdAt = serverTimestamp();
  await setDoc(ref, profile, { merge: true });
  return profile;
}

function closeLogin() {
  document.querySelector('#tc-login-modal')?.remove();
}

function openLogin(reason = 'tham gia Cộng Đồng') {
  if (currentUser() || loginBusy) return;
  closeLogin();
  const modal = document.createElement('div');
  modal.id = 'tc-login-modal';
  modal.className = 'tc-modal-backdrop';
  modal.innerHTML = `
    <div class="tc-login-card" role="dialog" aria-modal="true" aria-label="Đăng nhập tài xế">
      <button class="tc-x" aria-label="Đóng">×</button>
      <div class="tc-login-icon">🚕</div>
      <div class="tc-eyebrow">TỔ NGHỀ TAXI VIỆT NAM</div>
      <h3>Đăng nhập tài xế</h3>
      <p>Đăng nhập Google để ${esc(reason)}.</p>
      <button id="tc-google-login" class="tc-google-btn" type="button"><span class="google-g">G</span><span>Đăng nhập bằng Google</span></button>
      <small class="tc-login-note">Tài khoản chỉ dùng để xác nhận người đăng bài và nhắn tin.</small>
    </div>`;
  document.body.appendChild(modal);
  modal.querySelector('.tc-x').onclick = closeLogin;
  modal.addEventListener('click', e => { if (e.target === modal) closeLogin(); });
  modal.querySelector('#tc-google-login').onclick = async () => {
    if (loginBusy) return;
    loginBusy = true;
    const button = modal.querySelector('#tc-google-login');
    button.disabled = true;
    button.innerHTML = '<span class="tc-spinner"></span><span>Đang mở Google…</span>';
    try {
      const result = await window.firebaseBridge.googleLogin();
      if (result?.user) {
        await ensureUserProfile();
        closeLogin();
        notify('Đăng nhập Google thành công.', 'success');
      }
      // On mobile googleLogin() redirects the page. The success state is handled after return.
    } catch (error) {
      console.error('[Community] Google login failed:', error);
      button.disabled = false;
      button.innerHTML = '<span class="google-g">G</span><span>Đăng nhập bằng Google</span>';
      const code = error?.code || '';
      let msg = 'Không thể đăng nhập Google. Vui lòng thử lại.';
      if (code === 'auth/unauthorized-domain') msg = 'Tên miền chưa được thêm vào Firebase → Authentication → Authorized domains.';
      else if (code === 'auth/account-exists-with-different-credential') msg = 'Email này đã tồn tại với phương thức đăng nhập khác.';
      else if (error?.message) msg = `Google báo lỗi: ${error.message}`;
      notify(msg, 'error');
    } finally {
      loginBusy = false;
    }
  };
}

function renderAccount() {
  if (!panel) return;
  const u = currentUser();
  const box = panel.querySelector('.tc-account');
  const composerLogin = panel.querySelector('.tc-composer-login');
  if (box) {
    box.innerHTML = u
      ? `<div class="tc-avatar">${u.photoURL ? `<img src="${esc(u.photoURL)}" alt="">` : '👤'}</div><div><strong>${esc(u.displayName || 'Tài xế')}</strong><small>Đã đăng nhập · Tài xế</small></div><span class="tc-account-dot">●</span>`
      : `<div class="tc-avatar">👤</div><div><strong>Khách</strong><small>Chạm để đăng nhập Google</small></div><span class="tc-account-arrow">›</span>`;
    box.classList.toggle('guest', !u);
  }
  if (composerLogin) {
    composerLogin.textContent = u ? `Đang đăng bài với ${u.displayName || 'Tài xế'}` : 'Đăng nhập Google để đăng bài';
  }
}

function renderPosts() {
  if (!panel) return;
  const list = panel.querySelector('.tc-feed-list');
  const count = panel.querySelector('.tc-feed-count');
  if (!list) return;
  const filtered = activeFeedFilter === 'Tất cả'
    ? currentPosts
    : currentPosts.filter(p => (p.data.company || 'Khác') === activeFeedFilter);
  if (count) count.textContent = `${filtered.length} bài`;
  if (!filtered.length) {
    list.innerHTML = `<div class="tc-empty"><div>📰</div><strong>Chưa có bài viết</strong><p>Hãy là người đầu tiên chia sẻ cùng anh em tài xế.</p><button class="tc-empty-btn" type="button">✍️ Đăng bài đầu tiên</button></div>`;
    list.querySelector('.tc-empty-btn')?.addEventListener('click', () => panel.querySelector('.tc-content')?.scrollTo({ top: 0, behavior: 'smooth' }));
    return;
  }
  const uid = currentUser()?.uid;
  list.innerHTML = filtered.map(({ id, data }) => {
    const liked = Boolean(uid && Array.isArray(data.likedBy) && data.likedBy.includes(uid));
    const avatar = data.authorPhoto ? `<img src="${esc(data.authorPhoto)}" alt="">` : '🚕';
    const type = data.postType || 'Bản tin';
    return `<article class="tc-post" data-post="${esc(id)}">
      <div class="tc-post-head">
        <div class="tc-avatar tc-avatar-post">${avatar}</div>
        <div class="tc-post-author"><strong>${esc(data.authorName || 'Tài xế')}</strong><div><span class="tc-company">${esc(data.company || 'Khác')}</span><span> · ${esc(type)} · ${fmtDate(data.createdAt)}</span></div></div>
        ${uid === data.authorId ? `<button class="tc-post-more" data-delete="${esc(id)}" aria-label="Xóa bài">•••</button>` : ''}
      </div>
      <p class="tc-post-text">${esc(data.content || '').replaceAll('\n', '<br>')}</p>
      <div class="tc-post-stats"><span>♥ ${Number(data.likesCount || 0)} lượt thích</span><span>${Number(data.commentsCount || 0)} bình luận</span></div>
      <div class="tc-post-actions">
        <button class="tc-action ${liked ? 'active' : ''}" data-like="${esc(id)}">${liked ? '♥' : '♡'} <span>Thích</span></button>
        <button class="tc-action" data-comment="${esc(id)}">💬 <span>Bình luận</span></button>
        <button class="tc-action" data-share="${esc(id)}">↗ <span>Chia sẻ</span></button>
      </div>
    </article>`;
  }).join('');
  list.querySelectorAll('[data-like]').forEach(b => b.onclick = () => toggleLike(b.dataset.like));
  list.querySelectorAll('[data-comment]').forEach(b => b.onclick = () => openComments(b.dataset.comment));
  list.querySelectorAll('[data-share]').forEach(b => b.onclick = () => sharePost(b.dataset.share));
  list.querySelectorAll('[data-delete]').forEach(b => b.onclick = () => deletePost(b.dataset.delete));
}

async function toggleLike(postId) {
  const u = currentUser();
  if (!u) return openLogin('thả tim và tương tác với bài viết');
  try {
    await runTransaction(db, async tx => {
      const ref = doc(db, 'posts', postId);
      const snap = await tx.get(ref);
      if (!snap.exists()) throw new Error('Bài viết không tồn tại');
      const data = snap.data();
      const likedBy = Array.isArray(data.likedBy) ? [...data.likedBy] : [];
      const i = likedBy.indexOf(u.uid);
      if (i >= 0) likedBy.splice(i, 1); else likedBy.push(u.uid);
      tx.update(ref, { likedBy, likesCount: likedBy.length });
    });
  } catch (e) {
    console.error(e);
    notify('Không thể cập nhật lượt thích.', 'error');
  }
}

async function submitPost(e) {
  e.preventDefault();
  const u = currentUser();
  if (!u) return openLogin('đăng bài viết');
  const form = e.currentTarget;
  const content = form.content.value.trim();
  const company = form.company.value;
  const postType = form.postType.value;
  if (!content) return notify('Anh/chị hãy nhập nội dung bài viết.', 'error');
  if (content.length > 2000) return notify('Nội dung tối đa 2.000 ký tự.', 'error');
  const button = form.querySelector('[type="submit"]');
  button.disabled = true;
  try {
    const profile = await ensureUserProfile(company);
    await addDoc(collection(db, 'posts'), {
      authorId: u.uid,
      authorName: profile?.displayName || u.displayName || 'Tài xế',
      authorPhoto: profile?.photoURL || u.photoURL || '',
      company,
      postType,
      content,
      createdAt: serverTimestamp(),
      likesCount: 0,
      likedBy: [],
      commentsCount: 0,
    });
    form.reset();
    form.company.value = company;
    form.postType.value = postType;
    notify('Đã đăng bài. Anh em sẽ thấy ngay trong Realtime.', 'success');
    setTab('feed');
  } catch (e) {
    console.error('[Community] post', e);
    notify('Đăng bài thất bại. Hãy kiểm tra Firestore Rules.', 'error');
  } finally {
    button.disabled = false;
  }
}

function openComments(postId) {
  activeCommentPostId = postId;
  unsubscribeComments?.();
  document.querySelector('#tc-comments')?.remove();
  const modal = document.createElement('div');
  modal.id = 'tc-comments';
  modal.className = 'tc-modal-backdrop tc-sheet-backdrop';
  modal.innerHTML = `<div class="tc-sheet"><div class="tc-sheet-bar"><span>💬 Bình luận</span><button class="tc-x">×</button></div><div id="tc-comment-list" class="tc-comment-list"><div class="tc-empty small">Đang tải bình luận…</div></div><form id="tc-comment-form" class="tc-comment-form"><input name="text" maxlength="500" placeholder="Viết bình luận…" autocomplete="off" required><button>Gửi</button></form></div>`;
  document.body.appendChild(modal);
  modal.querySelector('.tc-x').onclick = closeComments;
  modal.onclick = e => { if (e.target === modal) closeComments(); };
  modal.querySelector('#tc-comment-form').onsubmit = addComment;
  const q = query(collection(db, 'posts', postId, 'comments'), orderBy('createdAt', 'asc'), limit(100));
  unsubscribeComments = onSnapshot(q, snap => {
    const box = document.querySelector('#tc-comment-list');
    if (!box) return;
    if (snap.empty) { box.innerHTML = '<div class="tc-empty small"><div>💬</div><strong>Chưa có bình luận</strong><p>Hãy mở đầu cuộc trò chuyện.</p></div>'; return; }
    box.innerHTML = snap.docs.map(d => {
      const c = d.data();
      return `<div class="tc-comment"><div class="tc-avatar mini">${c.authorPhoto ? `<img src="${esc(c.authorPhoto)}" alt="">` : '👤'}</div><div class="tc-comment-bubble"><strong>${esc(c.authorName || 'Tài xế')}</strong><small>${fmtDate(c.createdAt)}</small><p>${esc(c.content || '')}</p></div></div>`;
    }).join('');
    box.scrollTop = box.scrollHeight;
  }, err => { console.error(err); const box = document.querySelector('#tc-comment-list'); if (box) box.innerHTML = '<div class="tc-empty small">Không tải được bình luận.</div>'; });
}

function closeComments() {
  unsubscribeComments?.();
  unsubscribeComments = null;
  activeCommentPostId = null;
  document.querySelector('#tc-comments')?.remove();
}

async function addComment(e) {
  e.preventDefault();
  const u = currentUser();
  if (!u) return openLogin('bình luận bài viết');
  const form = e.currentTarget;
  const text = form.text.value.trim();
  if (!text || !activeCommentPostId) return;
  const btn = form.querySelector('button');
  btn.disabled = true;
  try {
    const profile = await ensureUserProfile();
    await runTransaction(db, async tx => {
      const postRef = doc(db, 'posts', activeCommentPostId);
      const postSnap = await tx.get(postRef);
      if (!postSnap.exists()) throw new Error('Bài viết không tồn tại');
      const commentRef = doc(collection(db, 'posts', activeCommentPostId, 'comments'));
      tx.set(commentRef, {
        authorId: u.uid,
        authorName: profile?.displayName || u.displayName || 'Tài xế',
        authorPhoto: profile?.photoURL || u.photoURL || '',
        content: text,
        createdAt: serverTimestamp(),
      });
      tx.update(postRef, { commentsCount: Number(postSnap.data().commentsCount || 0) + 1 });
    });
    form.reset();
  } catch (e) {
    console.error(e);
    notify('Không thể gửi bình luận.', 'error');
  } finally { btn.disabled = false; }
}

async function deletePost(postId) {
  const u = currentUser();
  if (!u) return;
  const item = currentPosts.find(p => p.id === postId);
  if (!item || item.data.authorId !== u.uid) return;
  // Custom confirmation replaces browser prompt/alert style interactions.
  const ok = await confirmAction('Xóa bài viết?', 'Bài viết sẽ được xóa khỏi bảng tin.');
  if (!ok) return;
  try { await deleteDoc(doc(db, 'posts', postId)); notify('Đã xóa bài viết.', 'success'); }
  catch (e) { console.error(e); notify('Không thể xóa bài viết.', 'error'); }
}

function confirmAction(title, text) {
  return new Promise(resolve => {
    const modal = document.createElement('div');
    modal.className = 'tc-modal-backdrop';
    modal.innerHTML = `<div class="tc-confirm"><div class="tc-login-icon">⚠️</div><h3>${esc(title)}</h3><p>${esc(text)}</p><div class="tc-confirm-actions"><button class="cancel">Hủy</button><button class="danger">Xóa</button></div></div>`;
    document.body.appendChild(modal);
    const finish = value => { modal.remove(); resolve(value); };
    modal.querySelector('.cancel').onclick = () => finish(false);
    modal.querySelector('.danger').onclick = () => finish(true);
  });
}

async function sharePost(postId) {
  const item = currentPosts.find(p => p.id === postId);
  if (!item) return;
  const text = `${item.data.authorName || 'Tài xế'}: ${item.data.content || ''}`;
  try {
    if (navigator.share) await navigator.share({ title: 'Cộng Đồng Tài Xế', text, url: location.href });
    else { await navigator.clipboard.writeText(`${text}\n${location.href}`); notify('Đã sao chép nội dung chia sẻ.', 'success'); }
  } catch (_) {}
}

function renderFeedFilters() {
  const box = panel?.querySelector('.tc-filter-row');
  if (!box) return;
  box.innerHTML = COMPANIES.map(c => `<button class="tc-chip ${activeFeedFilter === c ? 'active' : ''}" data-filter="${esc(c)}">${esc(c)}</button>`).join('');
  box.querySelectorAll('[data-filter]').forEach(b => b.onclick = () => { activeFeedFilter = b.dataset.filter; renderFeedFilters(); renderPosts(); });
}

function renderChat() {
  const body = panel?.querySelector('.tc-chat-body');
  if (!body) return;
  const q = query(collection(db, 'community_rooms', CHAT_ROOM, 'messages'), orderBy('createdAt', 'asc'), limit(150));
  unsubscribeMessages?.();
  unsubscribeMessages = onSnapshot(q, snap => {
    body.innerHTML = snap.empty ? '<div class="tc-empty small"><div>💬</div><strong>Phòng chat đang chờ anh em</strong><p>Hãy gửi lời chào đầu tiên.</p></div>' : snap.docs.map(d => {
      const m = d.data();
      const mine = currentUser()?.uid === m.authorId;
      return `<div class="tc-chat-msg ${mine ? 'mine' : ''}"><div class="tc-avatar mini">${m.authorPhoto ? `<img src="${esc(m.authorPhoto)}" alt="">` : '👤'}</div><div><strong>${esc(m.authorName || 'Tài xế')}</strong><div class="tc-chat-bubble">${esc(m.content || '')}</div><small>${fmtDate(m.createdAt)}</small></div></div>`;
    }).join('');
    body.scrollTop = body.scrollHeight;
  }, err => { console.error(err); body.innerHTML = '<div class="tc-empty small">Không thể kết nối phòng chat.</div>'; });
}

async function sendChat(e) {
  e.preventDefault();
  const u = currentUser();
  if (!u) return openLogin('nhắn tin cùng anh em tài xế');
  const form = e.currentTarget;
  const content = form.text.value.trim();
  if (!content) return;
  const btn = form.querySelector('button'); btn.disabled = true;
  try {
    const profile = await ensureUserProfile();
    await addDoc(collection(db, 'community_rooms', CHAT_ROOM, 'messages'), {
      authorId: u.uid,
      authorName: profile?.displayName || u.displayName || 'Tài xế',
      authorPhoto: profile?.photoURL || u.photoURL || '',
      content: content.slice(0, 500),
      createdAt: serverTimestamp(),
    });
    form.reset();
  } catch (e) { console.error(e); notify('Không thể gửi tin nhắn.', 'error'); }
  finally { btn.disabled = false; }
}

function setTab(tab) {
  activeTab = tab;
  if (!panel) return;
  panel.querySelectorAll('.tc-main-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  panel.querySelector('.tc-feed-view')?.classList.toggle('hidden', tab !== 'feed');
  panel.querySelector('.tc-chat-view')?.classList.toggle('hidden', tab !== 'chat');
  panel.querySelector('.tc-companies-view')?.classList.toggle('hidden', tab !== 'companies');
  if (tab === 'chat') renderChat(); else { unsubscribeMessages?.(); unsubscribeMessages = null; }
  if (tab === 'companies') renderCompanyDirectory();
}

function renderCompanyDirectory() {
  const box = panel?.querySelector('.tc-company-grid');
  if (!box) return;
  const icons = { 'Mai Linh': '🟢', Vinasun: '🔴', 'Xanh SM': '🔵', Grab: '🟢', 'Taxi Group': '🚕', 'Lái xe công nghệ': '📱', 'Khác': '⭐' };
  box.innerHTML = COMPANIES.filter(c => c !== 'Tất cả').map(c => {
    const count = currentPosts.filter(p => (p.data.company || 'Khác') === c).length;
    return `<button class="tc-company-card" data-company="${esc(c)}"><span>${icons[c] || '🚕'}</span><div><strong>${esc(c)}</strong><small>${count} bài viết</small></div><b>›</b></button>`;
  }).join('');
  box.querySelectorAll('[data-company]').forEach(b => b.onclick = () => { activeFeedFilter = b.dataset.company; renderFeedFilters(); setTab('feed'); });
}

function buildPanel() {
  panel = document.createElement('section');
  panel.id = 'tc-community';
  panel.innerHTML = `
    <div class="tc-app">
      <header class="tc-topbar">
        <button class="tc-back" type="button" aria-label="Quay lại">←</button>
        <div class="tc-brand"><small>TỔ NGHỀ TAXI VIỆT NAM</small><h1>🚕 Cộng Đồng Tài Xế</h1></div>
        <button class="tc-account guest" type="button" aria-label="Đăng nhập"></button>
      </header>
      <main class="tc-content">
        <section class="tc-welcome"><div><span class="tc-live">● LIVE REALTIME</span><h2>Cùng nhau chia sẻ<br><em>chuyện nghề tài xế</em></h2><p>Bản tin · Kinh nghiệm · Cảnh báo · Nhắn tin</p></div><div class="tc-welcome-icon">🤝</div></section>
        <nav class="tc-main-tabs" aria-label="Cộng đồng"><button class="tc-main-tab active" data-tab="feed">📰 Bản tin</button><button class="tc-main-tab" data-tab="chat">💬 Trò chuyện</button><button class="tc-main-tab" data-tab="companies">🚕 Hãng xe</button></nav>
        <section class="tc-composer">
          <div class="tc-composer-head"><div class="tc-avatar">👤</div><button class="tc-composer-login" type="button">Đăng nhập Google để đăng bài</button></div>
          <form id="tc-post-form">
            <textarea name="content" maxlength="2000" rows="4" placeholder="Anh em đang có chuyện gì muốn chia sẻ?" required></textarea>
            <div class="tc-composer-options"><select name="company">${COMPANIES.filter(c => c !== 'Tất cả').map(c => `<option>${esc(c)}</option>`).join('')}</select><select name="postType">${POST_TYPES.map(c => `<option>${esc(c)}</option>`).join('')}</select><button type="submit" class="tc-post-btn">Đăng bài</button></div>
          </form>
        </section>
        <section class="tc-feed-view">
          <div class="tc-section-title"><div><h3>Bảng tin mới nhất</h3><span class="tc-feed-count">0 bài</span></div><span class="tc-realtime">● Realtime</span></div>
          <div class="tc-filter-row"></div>
          <div class="tc-feed-list"><div class="tc-empty"><div>⏳</div><strong>Đang kết nối cộng đồng…</strong><p>Đang tải dữ liệu realtime.</p></div></div>
        </section>
        <section class="tc-chat-view hidden"><div class="tc-chat-header"><div><h3>💬 Phòng trò chuyện tài xế</h3><small>Phòng chung · Tin nhắn realtime</small></div><span class="tc-online">● Đang mở</span></div><div class="tc-chat-body"></div><form class="tc-chat-form"><input name="text" maxlength="500" placeholder="Viết tin nhắn cho anh em…" autocomplete="off" required><button type="submit">➤</button></form></section>
        <section class="tc-companies-view hidden"><div class="tc-section-title"><div><h3>🚕 Cộng đồng theo hãng xe</h3><span>Chọn hãng để xem bài viết</span></div></div><div class="tc-company-grid"></div></section>
      </main>
    </div>`;
  document.body.appendChild(panel);
  panel.querySelector('.tc-back').onclick = () => {
  closeCommunity();
  try {
    if (typeof window.showPage === 'function') window.showPage('home');
    else window.location.assign(window.location.origin + window.location.pathname);
  } catch (error) {
    console.warn('[Community] Could not return to home:', error);
    window.location.assign(window.location.origin + window.location.pathname);
  }
};
  panel.querySelector('.tc-account').onclick = () => currentUser() ? notify('Anh/chị đã đăng nhập Google.', 'success') : openLogin('tham gia Cộng Đồng');
  panel.querySelector('.tc-composer-login').onclick = () => currentUser() ? panel.querySelector('textarea')?.focus() : openLogin('đăng bài viết');
  panel.querySelector('#tc-post-form').onsubmit = submitPost;
  panel.querySelector('.tc-chat-form').onsubmit = sendChat;
  panel.querySelectorAll('.tc-main-tab').forEach(b => b.onclick = () => setTab(b.dataset.tab));
  renderFeedFilters();
  renderAccount();
}

function openCommunity() {
  if (!panel) buildPanel();
  panel.querySelector('.tc-content').scrollTop = 0;
  renderAccount(); renderFeedFilters(); renderPosts(); setTab(activeTab);
  if (!unsubscribePosts) {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(80));
    unsubscribePosts = onSnapshot(q, snap => {
      currentPosts = snap.docs.map(d => ({ id: d.id, data: d.data() }));
      renderPosts(); renderCompanyDirectory();
    }, err => {
      console.error('[Community] posts', err);
      const list = panel?.querySelector('.tc-feed-list');
      if (list) list.innerHTML = '<div class="tc-empty"><div>⚠️</div><strong>Không kết nối được bảng tin</strong><p>Kiểm tra Firestore Rules và kết nối mạng.</p></div>';
    });
  }
}

function closeCommunity() {
  closeComments();
  unsubscribePosts?.(); unsubscribePosts = null;
  unsubscribeMessages?.(); unsubscribeMessages = null;
  panel?.remove(); panel = null; currentPosts = [];
}

const styles = `
#tc-community{position:fixed;inset:0;z-index:99999;background:#050301;color:#f2df9f;font-family:'Be Vietnam Pro',Arial,sans-serif}
#tc-community *{box-sizing:border-box}.tc-app{height:100%;display:flex;flex-direction:column;background:radial-gradient(circle at 50% -10%,#3a210b 0,#100903 42%,#050301 100%)}
.tc-topbar{height:70px;flex:none;display:grid;grid-template-columns:44px 1fr minmax(150px,220px);align-items:center;gap:10px;padding:8px 12px;border-bottom:1px solid rgba(212,175,55,.25);background:rgba(14,7,2,.96);backdrop-filter:blur(14px)}
.tc-back{width:42px;height:42px;border-radius:13px;border:1px solid #846316;background:#170b03;color:#f2df9f;font-size:25px}.tc-brand{min-width:0}.tc-brand small{font-size:9px;letter-spacing:1.5px;color:#aa8a48}.tc-brand h1{font-size:18px;line-height:1.2;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.tc-account{width:100%;min-height:48px;display:flex;align-items:center;gap:8px;padding:5px 8px;border:1px solid rgba(212,175,55,.2);border-radius:14px;background:#170b03;color:#f2df9f;text-align:left}.tc-account.guest{border-color:#c19b32;cursor:pointer}.tc-account strong,.tc-account small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.tc-account strong{font-size:12px}.tc-account small{font-size:9px;color:#b19a6b}.tc-account-dot{color:#65bd75;margin-left:auto}.tc-account-arrow{font-size:24px;margin-left:auto;color:#c9a95b}.tc-avatar{width:40px;height:40px;flex:none;display:grid;place-items:center;border:1px solid #876719;border-radius:50%;background:#221106;font-size:19px;overflow:hidden}.tc-avatar img{width:100%;height:100%;object-fit:cover}.tc-avatar-post{width:42px;height:42px}
.tc-content{flex:1;overflow:auto;padding:12px max(12px,calc((100vw - 700px)/2)) 50px;scroll-behavior:smooth}.tc-welcome{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:18px;border:1px solid rgba(212,175,55,.28);border-radius:18px;background:linear-gradient(135deg,rgba(55,29,8,.88),rgba(20,10,3,.9));box-shadow:0 10px 30px rgba(0,0,0,.22)}.tc-live{display:inline-block;font-size:9px;color:#79d58a;border:1px solid #376743;border-radius:20px;padding:4px 8px;letter-spacing:.5px}.tc-welcome h2{font-size:22px;line-height:1.25;margin:9px 0 5px}.tc-welcome h2 em{font-style:normal;color:#e7c95e}.tc-welcome p{font-size:11px;color:#a99870}.tc-welcome-icon{font-size:48px;filter:drop-shadow(0 0 10px rgba(212,175,55,.25))}.tc-main-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:12px 0}.tc-main-tab{border:1px solid rgba(212,175,55,.18);border-radius:12px;background:#120904;color:#a99568;padding:10px 5px;font-weight:700;font-size:12px}.tc-main-tab.active{background:#c9a338;color:#150a02;border-color:#e2c45a;box-shadow:0 4px 14px rgba(212,175,55,.18)}
.tc-composer{padding:14px;border:1px solid rgba(212,175,55,.3);border-radius:18px;background:rgba(39,20,7,.82);margin-bottom:16px}.tc-composer-head{display:flex;align-items:center;gap:9px;margin-bottom:10px}.tc-composer-login{flex:1;text-align:left;border:0;border-radius:11px;padding:11px 12px;background:#120904;color:#b9a477;font-size:12px}.tc-composer-head+.tc-post-form{}.tc-composer textarea{width:100%;border:1px solid #654d18;border-radius:12px;background:#0d0703;color:#f6e8bf;padding:12px;resize:vertical;min-height:90px;outline:none;font:inherit;font-size:13px}.tc-composer textarea:focus{border-color:#c7a33d}.tc-composer-options{display:grid;grid-template-columns:1fr 1fr auto;gap:7px;margin-top:9px}.tc-composer select{min-width:0;border:1px solid #5c4517;border-radius:10px;background:#120904;color:#d7c28c;padding:10px 8px;font-size:11px}.tc-post-btn{border:1px solid #e0bf52;border-radius:10px;background:#d4af37;color:#170c02;font-weight:800;padding:10px 14px;white-space:nowrap}.tc-post-btn:disabled{opacity:.5}
.tc-section-title{display:flex;justify-content:space-between;align-items:center;gap:10px;margin:14px 2px 9px}.tc-section-title h3{font-size:17px;color:#f0dc98}.tc-section-title span{font-size:10px;color:#9c8b66}.tc-realtime{border:1px solid #376743!important;color:#7bd68b!important;padding:5px 8px;border-radius:20px}.tc-filter-row{display:flex;gap:6px;overflow:auto;padding:2px 1px 8px}.tc-chip{flex:none;border:1px solid #5b4517;border-radius:20px;background:#100803;color:#ad9867;padding:7px 10px;font-size:10px}.tc-chip.active{background:#b99227;color:#160b02;border-color:#e1c052;font-weight:800}.tc-feed-list{display:flex;flex-direction:column;gap:10px}.tc-post{border:1px solid rgba(212,175,55,.22);border-radius:16px;background:rgba(24,12,4,.88);padding:13px}.tc-post-head{display:flex;align-items:center;gap:9px}.tc-post-author{min-width:0;flex:1}.tc-post-author strong{display:block;color:#f0dda0;font-size:13px}.tc-post-author div{font-size:9px;color:#8f7d56;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.tc-company{color:#c7a84e}.tc-post-more{border:0;background:transparent;color:#8c7b54;font-weight:900;letter-spacing:2px}.tc-post-text{font-size:13px;line-height:1.55;color:#eee2c5;margin:12px 0}.tc-post-stats{display:flex;justify-content:space-between;font-size:9px;color:#88764e;border-top:1px solid rgba(212,175,55,.1);padding-top:8px}.tc-post-actions{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;border-top:1px solid rgba(212,175,55,.12);margin-top:8px;padding-top:6px}.tc-action{border:0;background:transparent;color:#a9976c;padding:7px 4px;font-size:11px;border-radius:8px}.tc-action.active{color:#f0c936;background:rgba(212,175,55,.08)}.tc-action:active{transform:scale(.97)}
.tc-empty{border:1px dashed #594417;border-radius:16px;padding:34px 15px;text-align:center;color:#9d8a5d}.tc-empty>div{font-size:28px;margin-bottom:7px}.tc-empty strong{display:block;color:#c9b47b;font-size:14px}.tc-empty p{font-size:11px;margin-top:5px}.tc-empty.small{border:0;padding:25px}.tc-empty-btn{margin-top:12px;border:1px solid #c19a30;border-radius:10px;background:#b88f22;color:#130a02;font-weight:800;padding:9px 13px}.hidden{display:none!important}
.tc-chat-view{height:calc(100vh - 190px);min-height:390px;border:1px solid rgba(212,175,55,.24);border-radius:16px;background:#0b0603;display:flex;flex-direction:column;overflow:hidden}.tc-chat-header{display:flex;justify-content:space-between;align-items:center;padding:13px;border-bottom:1px solid rgba(212,175,55,.15)}.tc-chat-header h3{font-size:15px}.tc-chat-header small{font-size:9px;color:#88764f}.tc-online{font-size:9px;color:#7ed48b;border:1px solid #386548;padding:5px 7px;border-radius:20px}.tc-chat-body{flex:1;overflow:auto;padding:12px;display:flex;flex-direction:column;gap:10px}.tc-chat-msg{display:flex;gap:7px;max-width:88%}.tc-chat-msg.mine{align-self:flex-end;flex-direction:row-reverse}.tc-chat-msg strong{font-size:10px;color:#cdb66f}.tc-chat-msg small{display:block;color:#665632;font-size:8px;margin-top:3px}.tc-chat-bubble{margin-top:3px;padding:8px 10px;border-radius:12px 12px 12px 3px;background:#241205;color:#e8ddc4;font-size:12px;line-height:1.4}.tc-chat-msg.mine .tc-chat-bubble{background:#8f6e19;color:#fff2c3;border-radius:12px 12px 3px 12px}.tc-avatar.mini{width:30px;height:30px;font-size:13px}.tc-chat-form{display:flex;gap:7px;padding:9px;border-top:1px solid rgba(212,175,55,.15)}.tc-chat-form input{flex:1;min-width:0;border:1px solid #594317;border-radius:12px;background:#120904;color:#fff;padding:10px;font-size:12px;outline:none}.tc-chat-form button{width:42px;border:0;border-radius:12px;background:#d4af37;color:#140a02;font-weight:900}
.tc-company-grid{display:flex;flex-direction:column;gap:8px}.tc-company-card{display:flex;align-items:center;gap:10px;text-align:left;padding:13px;border:1px solid rgba(212,175,55,.2);border-radius:14px;background:#140a04;color:#e8d59a}.tc-company-card>span{font-size:25px}.tc-company-card div{flex:1}.tc-company-card strong,.tc-company-card small{display:block}.tc-company-card strong{font-size:13px}.tc-company-card small{font-size:9px;color:#8f7d55;margin-top:3px}.tc-company-card b{font-size:22px;color:#9e854c}
.tc-modal-backdrop{position:fixed;inset:0;z-index:100001;background:rgba(0,0,0,.78);display:grid;place-items:center;padding:18px}.tc-login-card,.tc-confirm{position:relative;width:min(410px,100%);border:1px solid #a47c1f;border-radius:20px;background:linear-gradient(150deg,#321a07,#0d0703);padding:25px 20px;text-align:center;box-shadow:0 20px 70px #000}.tc-login-icon{font-size:38px}.tc-eyebrow{font-size:8px;letter-spacing:1.5px;color:#9c7e43;margin-top:7px}.tc-login-card h3,.tc-confirm h3{font-size:23px;color:#f1d98f;margin:7px 0}.tc-login-card p,.tc-confirm p{color:#c4b487;font-size:12px;line-height:1.5}.tc-x{position:absolute;right:11px;top:8px;border:0;background:transparent;color:#d8c184;font-size:28px}.tc-google-btn{width:100%;margin-top:15px;display:flex;align-items:center;justify-content:center;gap:10px;border:1px solid #aaa;border-radius:12px;background:#fff;color:#222;padding:12px;font-weight:800;font-size:14px;min-height:48px}.tc-google-btn:disabled{opacity:.65}.google-g{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;font-weight:900;color:#4285f4;background:#f4f4f4}.tc-login-note{display:block;margin-top:12px;color:#806e48;font-size:9px}.tc-spinner{width:18px;height:18px;border:2px solid #aaa;border-top-color:#222;border-radius:50%;animation:tcspin .8s linear infinite}@keyframes tcspin{to{transform:rotate(360deg)}}
.tc-sheet-backdrop{display:flex;align-items:flex-end;justify-content:center;padding:0}.tc-sheet{width:min(650px,100%);height:min(78vh,700px);background:#0c0703;border-top:1px solid #a17c20;border-radius:20px 20px 0 0;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 -20px 60px #000}.tc-sheet-bar{display:flex;justify-content:space-between;align-items:center;padding:14px 16px;border-bottom:1px solid rgba(212,175,55,.15);font-weight:800;color:#efd990}.tc-comment-list{flex:1;overflow:auto;padding:12px;display:flex;flex-direction:column;gap:9px}.tc-comment{display:flex;gap:8px}.tc-comment-bubble{flex:1;background:#1c0e05;border:1px solid rgba(212,175,55,.1);border-radius:4px 13px 13px 13px;padding:8px 10px}.tc-comment-bubble strong{font-size:11px;color:#d6bd72}.tc-comment-bubble small{float:right;font-size:8px;color:#675736}.tc-comment-bubble p{clear:both;margin-top:4px;color:#e9dfc8;font-size:11px;line-height:1.45}.tc-comment-form{display:flex;gap:7px;padding:10px;border-top:1px solid rgba(212,175,55,.15)}.tc-comment-form input{flex:1;min-width:0;border:1px solid #584216;border-radius:11px;background:#140a04;color:#fff;padding:11px;font-size:12px}.tc-comment-form button{border:0;border-radius:11px;background:#d4af37;color:#140a02;font-weight:800;padding:0 16px}.tc-confirm-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:16px}.tc-confirm-actions button{padding:11px;border-radius:11px;font-weight:800;border:1px solid #765b1b}.tc-confirm-actions .cancel{background:#170b03;color:#d5c087}.tc-confirm-actions .danger{background:#9e2b23;color:#fff}.tc-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:100010;max-width:90%;padding:11px 15px;border:1px solid #806119;border-radius:12px;background:#1d0e05;color:#f4e5b7;box-shadow:0 10px 30px #000;font-size:12px;text-align:center}.tc-toast.success{border-color:#4b8056}.tc-toast.error{border-color:#a4514b}
@media(max-width:520px){.tc-topbar{grid-template-columns:42px 1fr 150px;padding:7px}.tc-brand h1{font-size:16px}.tc-content{padding:10px 10px 40px}.tc-welcome h2{font-size:19px}.tc-welcome-icon{font-size:38px}.tc-composer-options{grid-template-columns:1fr 1fr}.tc-post-btn{grid-column:1/-1}.tc-account{min-width:0}.tc-account strong{font-size:11px}.tc-account small{font-size:8px}}
`;
const style = document.createElement('style'); style.id = 'tc-community-styles'; style.textContent = styles; document.head.appendChild(style);

window.addEventListener('firebase-auth-changed', async e => {
  if (e.detail && !e.detail.isAnonymous) {
    try { await ensureUserProfile(); } catch (err) { console.error(err); }
    closeLogin(); notify('Đăng nhập Google thành công.', 'success');
  }
  renderAccount(); renderPosts();
});
window.addEventListener('google-auth-complete', async e => {
  if (!e.detail) return;
  try { await ensureUserProfile(); } catch (err) { console.error(err); }
  closeLogin(); renderAccount(); renderPosts(); notify('Đăng nhập Google thành công.', 'success');
});
window.addEventListener('google-auth-error', e => {
  const err = e.detail;
  if (err?.code && err.code !== 'auth/no-auth-event') notify(`Đăng nhập Google thất bại: ${err.message || err.code}`, 'error');
});

window.driverCommunity = { open: openCommunity, close: closeCommunity, login: () => openLogin('tham gia Cộng Đồng') };
