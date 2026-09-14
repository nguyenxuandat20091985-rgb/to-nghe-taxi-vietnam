import { LOGO_URL } from './logo-data.js';
// Auth UI + first-login onboarding for Google accounts
const DRIVER_COMPANIES = [
  'Mai Linh', 'Vinasun', 'Xanh SM', 'Grab', 'Taxi Group', 'Lái xe công nghệ', 'Khác',
];

function injectAuthStyles() {
  if (document.getElementById('tn-auth-styles')) return;
  const style = document.createElement('style');
  style.id = 'tn-auth-styles';
  style.textContent = `
    .header.tn-header-auth{
      display:grid!important;
      grid-template-columns:minmax(64px,auto) 1fr minmax(64px,auto);
      align-items:center;
      gap:6px;
      text-align:center;
      padding:8px 8px 6px!important;
    }
    .header.tn-header-auth .tn-header-center{min-width:0;text-align:center}
    .header.tn-header-auth .tn-header-center h1{
      font-size:clamp(13px,3.6vw,20px)!important;
      letter-spacing:clamp(1px,0.3vw,2px)!important;
      white-space:nowrap;
      overflow:hidden;
      text-overflow:ellipsis;
    }
    .header.tn-header-auth .tn-header-center p{
      font-size:clamp(8px,1.9vw,11px)!important;
      margin-top:2px!important;
      white-space:normal;
      overflow:visible;
      text-overflow:unset;
      line-height:1.25;
      letter-spacing:0.5px!important;
    }
    #google-auth-status-left,#google-auth-status-right{
      position:static!important;
      display:flex;
      align-items:center;
      max-width:none;
    }
    #google-auth-status-left{justify-content:flex-start}
    #google-auth-status-right{justify-content:flex-end}
    #google-auth-status{display:none!important}
    .tn-auth-btn{display:inline-flex;align-items:center;gap:6px;border:1px solid rgba(212,175,55,.55);border-radius:999px;background:rgba(15,8,2,.92);color:#f0e0a0;padding:4px 10px 4px 4px;font-size:11px;font-weight:700;cursor:pointer;backdrop-filter:blur(10px);box-shadow:0 4px 12px rgba(0,0,0,.3);max-width:140px}
    .tn-auth-btn:hover{border-color:#e8c56a}
    .tn-auth-btn span:last-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .tn-auth-avatar{width:26px;height:26px;border-radius:50%;border:1.5px solid #d4af37;background:linear-gradient(135deg,#a67c1a,#d4af37);display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;overflow:hidden}
    .tn-auth-avatar img{width:100%;height:100%;border-radius:50%;object-fit:cover}
    .tn-auth-login{background:linear-gradient(145deg,#a67c1a,#d4af37,#e8c56a);color:#170c02;border-color:#c9a45a;padding:6px 10px;font-weight:800;font-size:11px}
    .tn-auth-login .g-icon{width:16px;height:16px;border-radius:4px;background:#fff;color:#4285F4;display:inline-flex;align-items:center;justify-content:center;font-weight:900;font-size:12px;font-family:Arial,sans-serif}
    .tn-auth-logout{border:1px solid rgba(212,175,55,.35);border-radius:999px;background:rgba(40,20,8,.85);color:#e8d48b;padding:6px 10px;font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap}
    #tn-onboarding-modal{position:fixed;inset:0;z-index:100050;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(4px)}
    .tn-onboard-card{width:min(420px,100%);background:linear-gradient(180deg,#1a0e05 0%,#0c0703 100%);border:1px solid #c9a45a;border-radius:18px;padding:22px 18px 18px;box-shadow:0 20px 50px rgba(0,0,0,.55);color:#f0e0a0}
    .tn-onboard-card h3{margin:0 0 6px;font-size:18px;color:#e8c56a;text-align:center}
    .tn-onboard-card p{margin:0 0 16px;font-size:13px;color:rgba(240,224,160,.75);text-align:center;line-height:1.45}
    .tn-onboard-card label{display:block;font-size:12px;color:rgba(232,212,139,.85);margin:12px 0 6px}
    .tn-onboard-card select,.tn-onboard-card input{width:100%;box-sizing:border-box;border:1px solid #584216;border-radius:11px;background:#140a04;color:#fff;padding:11px 12px;font-size:14px;outline:none}
    .tn-onboard-actions{display:grid;grid-template-columns:1fr 1.4fr;gap:10px;margin-top:18px}
    .tn-onboard-actions button{border-radius:12px;padding:12px;font-weight:800;font-size:13px;cursor:pointer;border:1px solid #765b1b}
    .tn-onboard-skip{background:#170b03;color:#d5c087}
    .tn-onboard-save{background:linear-gradient(145deg,#a67c1a,#d4af37);color:#170c02;border-color:#c9a45a}
    .tn-onboard-avatar{width:64px;height:64px;border-radius:50%;margin:0 auto 12px;border:2px solid #d4af37;overflow:hidden;background:#2a1808;display:flex;align-items:center;justify-content:center;font-size:28px}
    .tn-onboard-avatar img{width:100%;height:100%;object-fit:cover}

    /* ===== LOGIN GATE (bắt buộc đăng nhập Google) ===== */
    #tn-login-gate{
      position:fixed;inset:0;z-index:100100;
      background:linear-gradient(180deg,#0c0703 0%,#1a0e05 40%,#0a0502 100%);
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      padding:24px 20px;text-align:center;
      overflow:auto;
    }
    #tn-login-gate.tn-gate-hidden{display:none!important}
    .tn-gate-logo{
      width:96px;height:96px;border-radius:50%;border:3px solid #d4af37;
      overflow:hidden;margin:0 auto 20px;background:#2a1808;
      box-shadow:0 0 32px rgba(212,175,55,.45);
    }
    .tn-gate-logo img{width:100%;height:100%;object-fit:cover}
    .tn-gate-title{
      font-family:'Playfair Display','Cormorant Garamond',serif;
      font-size:clamp(22px,5.5vw,32px);color:#e8c56a;margin:0 0 8px;
      text-shadow:0 0 24px rgba(212,175,55,.6);
      letter-spacing:1px;
    }
    .tn-gate-sub{
      font-size:clamp(13px,3vw,15px);color:rgba(240,224,160,.8);
      margin:0 0 28px;line-height:1.5;max-width:340px;
    }
    .tn-gate-login-btn{
      display:inline-flex;align-items:center;gap:12px;
      background:linear-gradient(145deg,#a67c1a,#d4af37,#e8c56a);
      color:#170c02;border:2px solid #c9a45a;border-radius:999px;
      padding:14px 28px;font-size:16px;font-weight:800;cursor:pointer;
      box-shadow:0 6px 24px rgba(212,175,55,.4);
      transition:transform .2s,box-shadow .2s;
    }
    .tn-gate-login-btn:hover{transform:scale(1.03);box-shadow:0 8px 32px rgba(212,175,55,.55)}
    .tn-gate-login-btn:active{transform:scale(.97)}
    .tn-gate-login-btn .g-icon{
      width:28px;height:28px;border-radius:6px;background:#fff;color:#4285F4;
      display:inline-flex;align-items:center;justify-content:center;
      font-weight:900;font-size:18px;font-family:Arial,sans-serif;
    }
    .tn-gate-hint{
      margin-top:20px;font-size:12px;color:rgba(232,212,139,.55);max-width:300px;line-height:1.4;
    }
    .tn-gate-error{
      margin-top:16px;padding:10px 14px;border-radius:10px;
      background:rgba(139,26,26,.35);border:1px solid rgba(192,57,43,.5);
      color:#f5c6c6;font-size:13px;max-width:320px;display:none;
    }
    .tn-gate-error.show{display:block}
    body.tn-gate-active #app,
    body.tn-gate-active .bottom-menu,
    body.tn-gate-active .header,
    body.tn-gate-active .main-content{
      visibility:hidden!important;pointer-events:none!important;
    }
  `;
  document.head.appendChild(style);
}

function applyDefaultProfileLogo() {
  const el = document.querySelector('#page-profile .profile-avatar');
  if (!el) return;
  if (el.querySelector('img')) return;
  el.innerHTML = '';
  const img = document.createElement('img');
  img.src = LOGO_URL;
  img.alt = 'Tổ Nghề Taxi';
  Object.assign(img.style, { width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' });
  el.appendChild(img);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyDefaultProfileLogo);
else applyDefaultProfileLogo();

function escapeHtml(str = '') {
  return String(str)
    .replaceAll('&', '&').replaceAll('<', '<').replaceAll('>', '>')
    .replaceAll('"', '"').replaceAll("'", '&#039;');
}

export function mountAuthStatus(user) {
  injectAuthStyles();
  document.querySelector('#google-auth-status')?.remove();
  const header = document.querySelector('.header');
  if (header) {
    header.classList.add('tn-header-auth');
    let center = header.querySelector('.tn-header-center');
    if (!center) {
      center = document.createElement('div');
      center.className = 'tn-header-center';
      Array.from(header.querySelectorAll(':scope > h1, :scope > p')).forEach((el) => center.appendChild(el));
    }
    let left = header.querySelector('#google-auth-status-left');
    if (!left) { left = document.createElement('div'); left.id = 'google-auth-status-left'; }
    let right = header.querySelector('#google-auth-status-right');
    if (!right) { right = document.createElement('div'); right.id = 'google-auth-status-right'; }
    if (!header.contains(center)) {
      Array.from(header.querySelectorAll(':scope > h1, :scope > p')).forEach((el) => center.appendChild(el));
    }
    header.replaceChildren();
    header.appendChild(left);
    header.appendChild(center);
    header.appendChild(right);
  }
  let left = document.querySelector('#google-auth-status-left');
  let right = document.querySelector('#google-auth-status-right');
  if (!left) { left = document.createElement('div'); left.id = 'google-auth-status-left'; document.body.appendChild(left); }
  if (!right) { right = document.createElement('div'); right.id = 'google-auth-status-right'; document.body.appendChild(right); }
  left.replaceChildren();
  right.replaceChildren();
  if (user && !user.isAnonymous) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tn-auth-btn';
    btn.title = 'Đã đăng nhập Google — chạm để mở Hồ sơ';
    const avatar = document.createElement('span');
    avatar.className = 'tn-auth-avatar';
    if (user.photoURL) {
      const img = document.createElement('img');
      img.src = user.photoURL;
      img.alt = user.displayName || 'Avatar';
      img.referrerPolicy = 'no-referrer';
      avatar.appendChild(img);
    } else {
      const _img = document.createElement('img');
      _img.src = LOGO_URL;
      _img.alt = 'Tổ Nghề';
      Object.assign(_img.style, { width: '100%', height: '100%', objectFit: 'cover' });
      avatar.appendChild(_img);
    }
    const name = document.createElement('span');
    name.textContent = String(user.displayName || user.email || 'Google').slice(0, 14);
    btn.appendChild(avatar);
    btn.appendChild(name);
    btn.onclick = () => { if (typeof window.showPage === 'function') window.showPage('profile'); };
    left.appendChild(btn);
    const logoutBtn = document.createElement('button');
    logoutBtn.type = 'button';
    logoutBtn.className = 'tn-auth-logout';
    logoutBtn.textContent = 'Đăng xuất';
    logoutBtn.onclick = () => window.firebaseBridge?.logout?.().catch(console.error);
    right.appendChild(logoutBtn);
  } else {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tn-auth-btn tn-auth-login';
    btn.innerHTML = '<span class="g-icon">G</span><span>Đăng nhập</span>';
    btn.onclick = () =>
      window.firebaseBridge?.googleLogin?.().catch((err) => {
        console.error('[Google Auth]', err);
        alert('Đăng nhập Google chưa thành công. Vui lòng thử lại.');
      });
    right.appendChild(btn);
  }
}

export function applyGoogleProfileToUI(user, extra = {}) {
  if (!user || user.isAnonymous) return;
  const displayName = (extra.displayName || user.displayName || '').trim() || 'Tài xế';
  const photoURL = extra.photoURL || user.photoURL || '';
  const company = extra.company || '';
  const plate = extra.plate || '';
  const profileName = document.getElementById('profileName');
  if (profileName) profileName.textContent = displayName;
  const inputName = document.getElementById('inputName');
  if (inputName && (!inputName.value || inputName.value === 'Tài Xế Anonymous')) {
    inputName.value = displayName;
  }
  const avatarEl = document.querySelector('#page-profile .profile-avatar');
  if (avatarEl) {
    avatarEl.innerHTML = '';
    const img = document.createElement('img');
    img.src = photoURL || LOGO_URL;
    img.alt = displayName;
    img.referrerPolicy = 'no-referrer';
    Object.assign(img.style, { width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' });
    avatarEl.appendChild(img);
  }
  let meta = document.getElementById('profileDriverMeta');
  if (!meta && document.querySelector('#page-profile .profile-header')) {
    meta = document.createElement('p');
    meta.id = 'profileDriverMeta';
    meta.style.cssText = 'color:rgba(232,212,139,0.75);font-size:clamp(10px,2.2vw,12px);margin-top:4px;';
    const header = document.querySelector('#page-profile .profile-header');
    const badge = document.getElementById('profileBadge');
    if (badge) header.insertBefore(meta, badge);
    else header.appendChild(meta);
  }
  if (meta) {
    const parts = [];
    if (company) parts.push('🏢 ' + company);
    if (plate) parts.push('🔢 ' + plate);
    meta.textContent = parts.join(' · ') || '';
    meta.style.display = parts.length ? 'block' : 'none';
  }
  try {
    window.__driverProfile = { displayName, photoURL, company, plate, uid: user.uid };
    window.dispatchEvent(new CustomEvent('google-profile-ready', {
      detail: { displayName, photoURL, company, plate, uid: user.uid, email: user.email || '' },
    }));
  } catch (e) {
    console.warn('[Auth] apply profile UI', e);
  }
}

export function closeOnboarding() {
  document.getElementById('tn-onboarding-modal')?.remove();
}

/** Hiện màn hình bắt buộc đăng nhập Google – chặn toàn bộ app */
export function showLoginGate() {
  injectAuthStyles();
  document.body.classList.add('tn-gate-active');
  let gate = document.getElementById('tn-login-gate');
  if (gate) {
    gate.classList.remove('tn-gate-hidden');
    return;
  }
  gate = document.createElement('div');
  gate.id = 'tn-login-gate';
  gate.setAttribute('role', 'dialog');
  gate.setAttribute('aria-modal', 'true');
  gate.setAttribute('aria-label', 'Đăng nhập để vào Đền Tổ Nghề Taxi');
  gate.innerHTML = `
    <div class="tn-gate-logo" id="tn-gate-logo">
      <img src="${LOGO_URL}" alt="Tổ Nghề Taxi" referrerpolicy="no-referrer" />
    </div>
    <h1 class="tn-gate-title">Đền Tổ Nghề Taxi</h1>
    <p class="tn-gate-sub">Vui lòng đăng nhập bằng Google để vào ứng dụng.<br>Tài khoản dùng để lưu hồ sơ và kết nối cộng đồng tài xế.</p>
    <button type="button" class="tn-gate-login-btn" id="tn-gate-login-btn">
      <span class="g-icon">G</span>
      <span>Đăng nhập bằng Google</span>
    </button>
    <p class="tn-gate-hint">Chỉ dùng tài khoản Google. Không cần mật khẩu riêng.</p>
    <div class="tn-gate-error" id="tn-gate-error"></div>
  `;
  document.body.appendChild(gate);

  const btn = gate.querySelector('#tn-gate-login-btn');
  const errEl = gate.querySelector('#tn-gate-error');
  btn.onclick = async () => {
    errEl.classList.remove('show');
    errEl.textContent = '';
    btn.disabled = true;
    btn.style.opacity = '0.7';
    try {
      await window.firebaseBridge?.googleLogin?.();
      // onAuthStateChanged sẽ gọi hideLoginGate
    } catch (err) {
      console.error('[Google Auth Gate]', err);
      let msg = 'Đăng nhập Google chưa thành công. Vui lòng thử lại.';
      if (err?.code === 'auth/popup-blocked') msg = 'Popup bị chặn. Hãy cho phép popup hoặc thử lại.';
      else if (err?.code === 'auth/unauthorized-domain') msg = 'Domain chưa được phép. Liên hệ quản trị viên.';
      else if (err?.code === 'auth/network-request-failed') msg = 'Lỗi mạng. Kiểm tra kết nối rồi thử lại.';
      errEl.textContent = msg;
      errEl.classList.add('show');
    } finally {
      btn.disabled = false;
      btn.style.opacity = '1';
    }
  };
}

/** Ẩn màn hình đăng nhập, cho phép vào app */
export function hideLoginGate() {
  document.body.classList.remove('tn-gate-active');
  const gate = document.getElementById('tn-login-gate');
  if (gate) gate.classList.add('tn-gate-hidden');
}

export function openOnboarding(user, existing = {}) {
  if (!user || document.getElementById('tn-onboarding-modal')) return;
  injectAuthStyles();
  const modal = document.createElement('div');
  modal.id = 'tn-onboarding-modal';
  modal.innerHTML = `
    <div class="tn-onboard-card" role="dialog" aria-modal="true" aria-label="Hoàn thiện hồ sơ tài xế">
      <div class="tn-onboard-avatar" id="tn-onboard-avatar">🚕</div>
      <h3>Chào ${escapeHtml(user.displayName || 'tài xế')}!</h3>
      <p>Đăng nhập Google thành công. Anh/chị bổ sung thông tin tài xế để hiển thị trong Cộng đồng nhé.</p>
      <label for="tn-company">Công ty / Hãng</label>
      <select id="tn-company">
        ${DRIVER_COMPANIES.map((c) => `<option value="${escapeHtml(c)}" ${(existing.company || '') === c ? 'selected' : ''}>${escapeHtml(c)}</option>`).join('')}
      </select>
      <label for="tn-plate">Biển số xe (tuỳ chọn)</label>
      <input id="tn-plate" type="text" maxlength="15" placeholder="VD: 51A-123.45" value="${escapeHtml(existing.plate || '')}" />
      <div class="tn-onboard-actions">
        <button type="button" class="tn-onboard-skip" id="tn-skip">Để sau</button>
        <button type="button" class="tn-onboard-save" id="tn-save">Lưu hồ sơ</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  const avatarBox = modal.querySelector('#tn-onboard-avatar');
  if (user.photoURL) {
    avatarBox.innerHTML = '';
    const img = document.createElement('img');
    img.src = user.photoURL;
    img.alt = user.displayName || '';
    img.referrerPolicy = 'no-referrer';
    avatarBox.appendChild(img);
  } else if (LOGO_URL) {
    avatarBox.innerHTML = '';
    const img = document.createElement('img');
    img.src = LOGO_URL;
    img.alt = 'Tổ Nghề';
    avatarBox.appendChild(img);
  }
  modal.querySelector('#tn-skip').onclick = () => {
    closeOnboarding();
    try { localStorage.setItem('tn_onboard_skipped_' + user.uid, '1'); } catch (_) {}
  };
  modal.querySelector('#tn-save').onclick = async () => {
    const company = modal.querySelector('#tn-company').value || 'Khác';
    const plate = (modal.querySelector('#tn-plate').value || '').trim().toUpperCase();
    const saveBtn = modal.querySelector('#tn-save');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Đang lưu…';
    try {
      await window.firebaseBridge?.saveDriverProfile?.({ company, plate });
      applyGoogleProfileToUI(user, { displayName: user.displayName, photoURL: user.photoURL, company, plate });
      closeOnboarding();
      try { localStorage.removeItem('tn_onboard_skipped_' + user.uid); } catch (_) {}
      const t = document.createElement('div');
      t.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:100060;padding:11px 15px;border:1px solid #4b8056;border-radius:12px;background:#1d0e05;color:#f4e5b7;font-size:12px';
      t.textContent = 'Đã lưu hồ sơ tài xế.';
      document.body.appendChild(t);
      setTimeout(() => t.remove(), 2800);
    } catch (e) {
      console.error('[Onboarding]', e);
      saveBtn.disabled = false;
      saveBtn.textContent = 'Lưu hồ sơ';
      alert('Không lưu được hồ sơ. Vui lòng thử lại.');
    }
  };
}

export async function maybeShowOnboarding(db, user, getDoc, doc) {
  if (!user || user.isAnonymous) return;
  try {
    const snap = await getDoc(doc(db, 'users', user.uid));
    const data = snap.exists() ? snap.data() : {};
    const hasCompany = !!(data.company && String(data.company).trim());
    let skipped = false;
    try { skipped = localStorage.getItem('tn_onboard_skipped_' + user.uid) === '1'; } catch (_) {}
    applyGoogleProfileToUI(user, {
      displayName: data.displayName || user.displayName,
      photoURL: data.photoURL || user.photoURL,
      company: data.company || '',
      plate: data.plate || '',
    });
    if (!hasCompany && !skipped) {
      openOnboarding(user, { company: data.company || 'Khác', plate: data.plate || '' });
    }
  } catch (e) {
    console.error('[Onboarding check]', e);
    applyGoogleProfileToUI(user);
  }
}
