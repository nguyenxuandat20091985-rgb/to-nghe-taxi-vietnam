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
    .tn-auth-switch{border:1px solid rgba(212,175,55,.45);border-radius:999px;background:rgba(30,18,6,.9);color:#f0e0a0;padding:6px 9px;font-size:10px;font-weight:700;cursor:pointer;white-space:nowrap}
    .tn-auth-right-wrap{display:flex;flex-direction:column;align-items:flex-end;gap:4px}
    .tn-switch-profile-btn{display:block;width:100%;margin-top:10px;border:1px solid rgba(212,175,55,.5);border-radius:12px;background:linear-gradient(145deg,#2a1808,#1a0e05);color:#f0e0a0;padding:11px 14px;font-size:13px;font-weight:700;cursor:pointer;text-align:center}
    .tn-switch-profile-btn:active{opacity:.85}
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
    #tn-login-gate{position:fixed;inset:0;z-index:100040;background:radial-gradient(ellipse at center,#1a0e05 0%,#050301 70%);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;text-align:center}
    #tn-login-gate.tn-gate-hidden{display:none!important}
    .tn-gate-logo{width:120px;height:120px;border-radius:50%;margin-bottom:18px;overflow:hidden;border:3px solid #d4af37;box-shadow:0 0 40px rgba(212,175,55,.4)}
    .tn-gate-logo img{width:100%;height:100%;object-fit:cover}
    .tn-gate-title{font-size:1.5rem;color:#d4af37;margin:0 0 10px;font-weight:700}
    .tn-gate-sub{font-size:.95rem;color:rgba(240,224,160,.8);line-height:1.5;margin:0 0 22px;max-width:320px}
    .tn-gate-login-btn{display:inline-flex;align-items:center;gap:10px;border:none;border-radius:999px;background:linear-gradient(145deg,#a67c1a,#d4af37,#e8c56a);color:#170c02;padding:14px 28px;font-size:15px;font-weight:800;cursor:pointer;box-shadow:0 6px 20px rgba(212,175,55,.35)}
    .tn-gate-login-btn .g-icon{width:22px;height:22px;border-radius:4px;background:#fff;color:#4285F4;display:inline-flex;align-items:center;justify-content:center;font-weight:900;font-size:14px;font-family:Arial,sans-serif}
    body.tn-gate-active .header,
    body.tn-gate-active .menu,
    body.tn-gate-active .page{visibility:hidden!important;pointer-events:none!important}
  `;
  document.head.appendChild(style);
}

export function closeOnboarding() {
  document.getElementById('tn-onboarding-modal')?.remove();
}

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
    <p style="margin-top:16px;font-size:12px;color:rgba(240,224,160,.55)">Chỉ dùng tài khoản Google. Không cần mật khẩu riêng.</p>
  `;
  document.body.appendChild(gate);
  document.getElementById('tn-gate-login-btn')?.addEventListener('click', async () => {
    try {
      await window.firebaseBridge?.googleLogin?.();
    } catch (err) {
      console.error('[Google Auth Gate]', err);
      let msg = 'Đăng nhập Google chưa thành công. Vui lòng thử lại.';
      if (err?.code === 'auth/popup-blocked') msg = 'Popup bị chặn. Hãy cho phép popup hoặc thử lại.';
      else if (err?.code === 'auth/unauthorized-domain') msg = 'Domain chưa được phép. Liên hệ quản trị viên.';
      else if (err?.code === 'auth/network-request-failed') msg = 'Lỗi mạng. Kiểm tra kết nối rồi thử lại.';
      alert(msg);
    }
  });
}

export function hideLoginGate() {
  document.body.classList.remove('tn-gate-active');
  const gate = document.getElementById('tn-login-gate');
  if (gate) gate.classList.add('tn-gate-hidden');
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
    const wrap = document.createElement('div');
    wrap.className = 'tn-auth-right-wrap';
    const switchBtn = document.createElement('button');
    switchBtn.type = 'button';
    switchBtn.className = 'tn-auth-switch';
    switchBtn.textContent = 'Đổi TK';
    switchBtn.title = 'Đổi tài khoản Google';
    switchBtn.onclick = () => {
      if (!confirm('Anh muốn đăng nhập bằng tài khoản Google khác?')) return;
      window.firebaseBridge?.switchGoogleAccount?.().catch((err) => {
        console.error('[Switch Google]', err);
        alert('Đổi tài khoản chưa thành công. Vui lòng thử lại.');
      });
    };
    const logoutBtn = document.createElement('button');
    logoutBtn.type = 'button';
    logoutBtn.className = 'tn-auth-logout';
    logoutBtn.textContent = 'Đăng xuất';
    logoutBtn.onclick = () => window.firebaseBridge?.logout?.().catch(console.error);
    wrap.appendChild(switchBtn);
    wrap.appendChild(logoutBtn);
    right.appendChild(wrap);
    try {
      const profilePage = document.getElementById('page-profile');
      if (profilePage && !document.getElementById('tn-switch-account-btn')) {
        const host = profilePage.querySelector('.glass-card') || profilePage;
        const pbtn = document.createElement('button');
        pbtn.type = 'button';
        pbtn.id = 'tn-switch-account-btn';
        pbtn.className = 'tn-switch-profile-btn';
        pbtn.textContent = '🔄 Đổi tài khoản Google';
        pbtn.onclick = () => {
          if (!confirm('Anh muốn đăng nhập bằng tài khoản Google khác?')) return;
          window.firebaseBridge?.switchGoogleAccount?.().catch((err) => {
            console.error('[Switch Google]', err);
            alert('Đổi tài khoản chưa thành công. Vui lòng thử lại.');
          });
        };
        host.appendChild(pbtn);
      }
    } catch (e) { console.warn('[Auth] inject switch btn', e); }
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
  try {
    const displayName = extra.displayName || user?.displayName || user?.email || 'Tài xế';
    const photoURL = extra.photoURL || user?.photoURL || '';
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
      meta = document.createElement('div');
      meta.id = 'profileDriverMeta';
      meta.style.cssText = 'margin-top:8px;font-size:12px;color:rgba(240,224,160,.75);text-align:center';
      const header = document.querySelector('#page-profile .profile-header');
      const badge = document.getElementById('profileBadge');
      if (badge) header.insertBefore(meta, badge.nextSibling);
      else header.appendChild(meta);
    }
    if (meta) {
      meta.style.display = 'block';
      meta.innerHTML = [company && `🏢 ${company}`, plate && `🚗 ${plate}`].filter(Boolean).join(' · ') || '';
    }
    window.dispatchEvent(new CustomEvent('google-profile-ready', { detail: { displayName, photoURL, company, plate } }));
  } catch (e) {
    console.warn('[Auth] apply profile UI', e);
  }
}

function openOnboarding(user, defaults = {}) {
  closeOnboarding();
  injectAuthStyles();
  const modal = document.createElement('div');
  modal.id = 'tn-onboarding-modal';
  const companies = DRIVER_COMPANIES.map((c) => `<option value="${c}" ${c === (defaults.company || 'Khác') ? 'selected' : ''}>${c}</option>`).join('');
  modal.innerHTML = `
    <div class="tn-onboard-card">
      <div class="tn-onboard-avatar">${user.photoURL ? `<img src="${user.photoURL}" alt="" referrerpolicy="no-referrer" />` : '🚖'}</div>
      <h3>Chào mừng tài xế!</h3>
      <p>Điền thông tin để kết nối cộng đồng Tổ Nghề Taxi.</p>
      <label>Hãng / Nền tảng</label>
      <select id="tn-onboard-company">${companies}</select>
      <label>Biển số xe (tuỳ chọn)</label>
      <input id="tn-onboard-plate" type="text" maxlength="20" placeholder="VD: 51A-12345" value="${defaults.plate || ''}" />
      <div class="tn-onboard-actions">
        <button type="button" class="tn-onboard-skip" id="tn-onboard-skip">Bỏ qua</button>
        <button type="button" class="tn-onboard-save" id="tn-onboard-save">Lưu hồ sơ</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById('tn-onboard-skip')?.addEventListener('click', () => {
    try { localStorage.setItem('tn_onboard_skipped_' + user.uid, '1'); } catch (_) {}
    closeOnboarding();
  });
  document.getElementById('tn-onboard-save')?.addEventListener('click', async () => {
    const company = document.getElementById('tn-onboard-company')?.value || 'Khác';
    const plate = document.getElementById('tn-onboard-plate')?.value || '';
    try {
      await window.firebaseBridge?.saveDriverProfile?.({ company, plate });
      applyGoogleProfileToUI(user, { company, plate });
      closeOnboarding();
    } catch (e) {
      console.error('[Onboarding save]', e);
      alert('Lưu hồ sơ chưa thành công. Thử lại sau.');
    }
  });
}

export async function maybeShowOnboarding(db, user, getDoc, doc) {
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
