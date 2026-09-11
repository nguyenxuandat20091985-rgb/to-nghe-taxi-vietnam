// Auth UI + first-login onboarding for Google accounts
const DRIVER_COMPANIES = [
  'Mai Linh', 'Vinasun', 'Xanh SM', 'Grab', 'Taxi Group', 'Lái xe công nghệ', 'Khác',
];

function injectAuthStyles() {
  if (document.getElementById('tn-auth-styles')) return;
  const style = document.createElement('style');
  style.id = 'tn-auth-styles';
  style.textContent = `
    #google-auth-status{position:fixed;top:10px;right:10px;z-index:220;display:flex;align-items:center;gap:8px;max-width:calc(100vw - 20px)}
    .tn-auth-btn{display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(212,175,55,.55);border-radius:999px;background:rgba(15,8,2,.92);color:#f0e0a0;padding:6px 12px 6px 6px;font-size:12px;font-weight:700;cursor:pointer;backdrop-filter:blur(10px);box-shadow:0 6px 18px rgba(0,0,0,.35)}
    .tn-auth-btn:hover{border-color:#e8c56a}
    .tn-auth-avatar{width:28px;height:28px;border-radius:50%;border:1.5px solid #d4af37;background:linear-gradient(135deg,#a67c1a,#d4af37);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;overflow:hidden}
    .tn-auth-avatar img{width:100%;height:100%;border-radius:50%;object-fit:cover}
    .tn-auth-login{background:linear-gradient(145deg,#a67c1a,#d4af37,#e8c56a);color:#170c02;border-color:#c9a45a;padding:8px 14px;font-weight:800}
    .tn-auth-login .g-icon{width:18px;height:18px;border-radius:4px;background:#fff;color:#4285F4;display:inline-flex;align-items:center;justify-content:center;font-weight:900;font-size:13px;font-family:Arial,sans-serif}
    .tn-auth-logout{border:1px solid rgba(212,175,55,.35);border-radius:999px;background:rgba(40,20,8,.85);color:#e8d48b;padding:6px 10px;font-size:11px;font-weight:700;cursor:pointer}
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
  `;
  document.head.appendChild(style);
}

function escapeHtml(str = '') {
  return String(str)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

export function mountAuthStatus(user) {
  injectAuthStyles();
  let el = document.querySelector('#google-auth-status');
  if (!el) {
    el = document.createElement('div');
    el.id = 'google-auth-status';
    document.body.appendChild(el);
  }
  el.replaceChildren();

  if (user && !user.isAnonymous) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;align-items:center;gap:6px';

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
      avatar.textContent = '🚕';
    }
    const name = document.createElement('span');
    name.textContent = String(user.displayName || user.email || 'Google').slice(0, 18);
    btn.appendChild(avatar);
    btn.appendChild(name);
    btn.onclick = () => { if (typeof window.showPage === 'function') window.showPage('profile'); };

    const logoutBtn = document.createElement('button');
    logoutBtn.type = 'button';
    logoutBtn.className = 'tn-auth-logout';
    logoutBtn.textContent = 'Đăng xuất';
    logoutBtn.onclick = () => window.firebaseBridge?.logout?.().catch(console.error);

    wrap.appendChild(btn);
    wrap.appendChild(logoutBtn);
    el.appendChild(wrap);
  } else {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tn-auth-btn tn-auth-login';
    btn.innerHTML = '<span class="g-icon">G</span><span>Đăng nhập Google</span>';
    btn.onclick = () =>
      window.firebaseBridge?.googleLogin?.().catch((err) => {
        console.error('[Google Auth]', err);
        alert('Đăng nhập Google chưa thành công. Vui lòng thử lại.');
      });
    el.appendChild(btn);
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
    if (photoURL) {
      avatarEl.innerHTML = '';
      const img = document.createElement('img');
      img.src = photoURL;
      img.alt = displayName;
      img.referrerPolicy = 'no-referrer';
      Object.assign(img.style, { width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' });
      avatarEl.appendChild(img);
    } else if (!avatarEl.querySelector('img')) {
      avatarEl.textContent = '🚖';
    }
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
