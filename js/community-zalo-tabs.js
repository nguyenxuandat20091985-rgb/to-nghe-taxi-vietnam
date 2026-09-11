// Zalo-style community tabs + logo + simplified feed
import {
  collection,
  limit,
  onSnapshot,
  query,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { LOGO_URL } from './logo-data.js';

function esc(v = '') {
  return String(v)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

let contactsCache = [];
let unsubContacts = null;
let contactsSearch = '';

function injectStyles() {
  if (document.getElementById('tc-zalo-patch-styles')) return;
  const s = document.createElement('style');
  s.id = 'tc-zalo-patch-styles';
  s.textContent = `
    #tc-community .tc-brand-logo{
      width:36px;height:36px;border-radius:50%;object-fit:cover;
      border:1.5px solid rgba(212,175,55,.55);flex:0 0 36px;
      box-shadow:0 0 12px rgba(212,175,55,.25);background:#0a0603;
    }
    #tc-community .tc-brand{display:flex;align-items:center;gap:8px;min-width:0}
    #tc-community .tc-brand .tc-brand-text{min-width:0}
    #tc-community .tc-main-tabs{display:flex;gap:8px;margin:0 0 12px;position:sticky;top:0;z-index:6;background:rgba(10,6,3,.94);padding:8px 0;backdrop-filter:blur(8px)}
    #tc-community .tc-main-tab{flex:1;border:1px solid rgba(212,175,55,.28);background:#140a04;color:#cbb888;border-radius:999px;padding:10px 8px;font-weight:800;font-size:12px;cursor:pointer}
    #tc-community .tc-main-tab.active{background:linear-gradient(145deg,#a67c1a,#d4af37);color:#170c02;border-color:#c9a45a}
    #tc-community .tc-contacts-view{display:none}
    #tc-community .tc-contacts-view.show{display:block}
    #tc-community .tc-companies-view{display:none!important}
    #tc-community .tc-welcome{display:none!important}
    #tc-community .tc-contacts-search{position:relative;margin:0 0 10px}
    #tc-community .tc-contacts-search span{position:absolute;left:12px;top:50%;transform:translateY(-50%);opacity:.7}
    #tc-community .tc-contacts-search input{width:100%;box-sizing:border-box;border:1px solid rgba(212,175,55,.28);background:#140a04;color:#f3e7c7;border-radius:14px;padding:11px 12px 11px 36px;font-size:13px;outline:none}
    #tc-community .tc-contact-row{display:flex;align-items:center;gap:10px;width:100%;border:1px solid rgba(212,175,55,.12);background:#140a04;border-radius:14px;padding:10px;color:#f0e0a0;text-align:left;cursor:pointer;margin-bottom:6px}
    #tc-community .tc-contact-row:active{background:rgba(212,175,55,.08)}
    #tc-community .tc-contact-av{width:44px;height:44px;flex:0 0 44px;border-radius:50%;overflow:hidden;border:1px solid rgba(212,175,55,.35);display:flex;align-items:center;justify-content:center;background:#21150e}
    #tc-community .tc-contact-av img{width:100%;height:100%;object-fit:cover}
    #tc-community .tc-contact-main{min-width:0;flex:1}
    #tc-community .tc-contact-main strong{display:block;font-size:13px}
    #tc-community .tc-contact-main small{display:block;font-size:11px;color:#a8925c;margin-top:2px}
    #tc-community .tc-contact-msg{font-size:11px;font-weight:700;color:#170c02;background:linear-gradient(145deg,#a67c1a,#d4af37);border-radius:999px;padding:6px 10px}
    #tc-community .tc-composer.hidden{display:none!important}
    #tc-community .tc-feed-view .tc-section-title{display:flex;align-items:center;justify-content:space-between;margin:4px 0 8px;padding:0}
    #tc-community .tc-feed-view .tc-section-title h3{font-size:15px;margin:0;color:#efd990}
    #tc-community .tc-feed-view .tc-feed-count{font-size:11px;color:#9a8558;font-weight:600}
    #tc-community .tc-feed-view .tc-realtime{display:none!important}
    #tc-community .tc-composer{border:1px solid rgba(212,175,55,.22);border-radius:16px;background:rgba(20,10,4,.9);padding:12px;margin-bottom:12px}
    #tc-community .tc-composer-head{display:flex;align-items:center;gap:8px;margin-bottom:8px}
    #tc-community .tc-composer textarea{width:100%;min-height:72px;max-height:140px;resize:vertical;box-sizing:border-box;border:1px solid rgba(212,175,55,.2);border-radius:12px;background:#0f0804;color:#f3e7c7;padding:10px 12px;font-size:13px;line-height:1.45;outline:none}
    #tc-community .tc-composer-options{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;align-items:center}
    #tc-community .tc-composer-options select{flex:1;min-width:110px;border:1px solid rgba(212,175,55,.25);border-radius:10px;background:#140a04;color:#e8d48b;padding:8px 10px;font-size:12px}
    #tc-community .tc-post-btn{flex:1 1 100%;border:0;border-radius:12px;padding:12px;background:linear-gradient(145deg,#a67c1a,#d4af37);color:#170c02;font-weight:800;font-size:13px;cursor:pointer}
    #tc-community .tc-filter-row{display:flex;gap:6px;overflow-x:auto;padding:2px 0 10px;scrollbar-width:none}
    #tc-community .tc-filter-row::-webkit-scrollbar{display:none}
    #tc-community .tc-chip{flex:0 0 auto;border:1px solid rgba(212,175,55,.25);background:transparent;color:#bba980;border-radius:999px;padding:6px 12px;font-size:11px;font-weight:700;cursor:pointer}
    #tc-community .tc-chip.active{background:#d4af37;border-color:#d4af37;color:#1a0e05}
    #tc-community .tc-post{border:1px solid rgba(212,175,55,.14);border-radius:14px;background:rgba(16,9,4,.92);padding:12px;margin-bottom:10px}
    #tc-community .tc-post-head{display:flex;gap:10px;align-items:flex-start;margin-bottom:8px}
    #tc-community .tc-post-author strong{font-size:13px;color:#f0e0a0}
    #tc-community .tc-post-author div{font-size:11px;color:#9a8558;margin-top:2px}
    #tc-community .tc-post p, #tc-community .tc-post .tc-post-body{font-size:13px;line-height:1.5;color:#e9dfc8;margin:0 0 10px}
    #tc-community .tc-post-actions{display:flex;gap:8px;flex-wrap:wrap}
    #tc-community .tc-post-actions button{border:1px solid rgba(212,175,55,.2);background:transparent;color:#cbb888;border-radius:999px;padding:6px 10px;font-size:11px;font-weight:700;cursor:pointer}
  `;
  document.head.appendChild(s);
}

function panel() {
  return document.querySelector('#tc-community');
}

function applyLogo() {
  const p = panel();
  if (!p) return;
  const brand = p.querySelector('.tc-brand');
  if (!brand || brand.querySelector('.tc-brand-logo')) return;
  const img = document.createElement('img');
  img.className = 'tc-brand-logo';
  img.src = LOGO_URL;
  img.alt = 'Tổ Nghề Taxi';
  const textWrap = document.createElement('div');
  textWrap.className = 'tc-brand-text';
  while (brand.firstChild) textWrap.appendChild(brand.firstChild);
  brand.appendChild(img);
  brand.appendChild(textWrap);
}

function simplifyFeedChrome() {
  const p = panel();
  if (!p) return;
  p.querySelectorAll('.tc-feed-view .tc-realtime').forEach((el) => el.remove());
  const title = p.querySelector('.tc-feed-view .tc-section-title h3');
  if (title && title.textContent.includes('Bảng tin')) title.textContent = 'Bảng tin';
  p.querySelector('.tc-companies-view')?.classList.add('hidden');
}

function renderContacts() {
  const p = panel();
  if (!p) return;
  const list = p.querySelector('#tc-zalo-contacts-list');
  const countEl = p.querySelector('#tc-zalo-contacts-count');
  if (!list) return;
  const q = contactsSearch.trim().toLowerCase();
  const uid = window.firebaseServices?.auth?.currentUser?.uid;
  const rows = contactsCache.filter((d) => {
    if (!q) return true;
    return (
      String(d.displayName || '').toLowerCase().includes(q) ||
      String(d.company || '').toLowerCase().includes(q) ||
      String(d.plate || '').toLowerCase().includes(q)
    );
  });
  if (countEl) countEl.textContent = `${rows.length} tài xế`;
  if (!rows.length) {
    list.innerHTML = `<div class="tc-empty"><div>📒</div><strong>${q ? 'Không tìm thấy' : 'Chưa có ai trong danh bạ'}</strong><p>${q ? 'Thử từ khóa khác.' : 'Tài xế đăng nhập và lưu hồ sơ sẽ hiện tại đây.'}</p></div>`;
    return;
  }
  list.innerHTML = rows
    .map((d) => {
      const isMe = uid && d.uid === uid;
      const avatar = d.photoURL
        ? `<img src="${esc(d.photoURL)}" alt="">`
        : `<img src="${LOGO_URL}" alt="">`;
      const meta = [d.company || 'Khác', d.plate || ''].filter(Boolean).join(' · ');
      return `<button type="button" class="tc-contact-row" data-uid="${esc(d.uid)}" data-name="${esc(d.displayName || 'Tài xế')}" data-photo="${esc(d.photoURL || '')}" ${isMe ? 'disabled' : ''}>
      <div class="tc-contact-av">${avatar}</div>
      <div class="tc-contact-main"><strong>${esc(d.displayName || 'Tài xế')}${isMe ? ' (Bạn)' : ''}</strong><small>${esc(meta)}</small></div>
      ${isMe ? '' : '<span class="tc-contact-msg">Nhắn tin</span>'}
    </button>`;
    })
    .join('');
  list.querySelectorAll('.tc-contact-row[data-uid]:not([disabled])').forEach((b) => {
    b.onclick = () => {
      const chatTab = p.querySelector('.tc-main-tab[data-tab="chat"]');
      chatTab?.click();
      setTimeout(() => {
        const btn = document.createElement('button');
        btn.setAttribute('data-message-user', b.dataset.uid);
        btn.setAttribute('data-message-name', b.dataset.name);
        btn.setAttribute('data-message-photo', b.dataset.photo || '');
        btn.style.display = 'none';
        p.appendChild(btn);
        btn.click();
        btn.remove();
      }, 150);
    };
  });
}

function subscribeContacts() {
  const db = window.firebaseServices?.db;
  if (!db || unsubContacts) return;
  try {
    unsubContacts = onSnapshot(query(collection(db, 'driver_directory'), limit(200)), (snap) => {
      contactsCache = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
      contactsCache.sort((a, b) =>
        String(a.displayName || '').localeCompare(String(b.displayName || ''), 'vi')
      );
      renderContacts();
    });
  } catch (e) {
    console.error('[Community Zalo] contacts', e);
  }
}

function setZaloTab(tab) {
  const p = panel();
  if (!p) return;
  p.querySelectorAll('.tc-main-tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
  p.querySelector('.tc-feed-view')?.classList.toggle('hidden', tab !== 'feed');
  p.querySelector('.tc-chat-view')?.classList.toggle('hidden', tab !== 'chat');
  p.querySelector('.tc-companies-view')?.classList.add('hidden');
  const contacts = p.querySelector('.tc-contacts-view');
  if (contacts) contacts.classList.toggle('show', tab === 'contacts');
  p.querySelector('.tc-composer')?.classList.toggle('hidden', tab !== 'feed');
  p.querySelector('.tc-welcome')?.classList.add('hidden');
  p.querySelector('.tc-app')?.classList.toggle('tc-chat-only', tab === 'chat');
  if (tab === 'contacts') {
    subscribeContacts();
    renderContacts();
  }
  if (tab === 'feed') simplifyFeedChrome();
  if (tab === 'chat') {
    try {
      window.dispatchEvent(new CustomEvent('tc-open-chat-tab'));
    } catch (_) {}
  }
}

function rebuildTabs() {
  const p = panel();
  if (!p) return false;
  injectStyles();
  applyLogo();
  simplifyFeedChrome();

  const nav = p.querySelector('.tc-main-tabs');
  if (!nav) return false;

  nav.innerHTML = `
    <button class="tc-main-tab active" data-tab="chat" type="button">💬 Tin nhắn</button>
    <button class="tc-main-tab" data-tab="feed" type="button">📰 Bảng tin</button>
    <button class="tc-main-tab" data-tab="contacts" type="button">📒 Danh bạ</button>
  `;
  nav.querySelectorAll('.tc-main-tab').forEach((b) => {
    b.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setZaloTab(b.dataset.tab);
    };
  });

  let contacts = p.querySelector('.tc-contacts-view');
  if (!contacts) {
    contacts = document.createElement('section');
    contacts.className = 'tc-contacts-view';
    contacts.innerHTML = `
      <div class="tc-section-title"><div><h3>📒 Danh bạ tài xế</h3><span id="tc-zalo-contacts-count">0 tài xế</span></div></div>
      <div class="tc-contacts-search"><span>🔍</span><input type="search" id="tc-zalo-contacts-q" placeholder="Tìm tên hoặc hãng xe…" autocomplete="off"></div>
      <div id="tc-zalo-contacts-list" class="tc-contacts-list"><div class="tc-empty"><div>📒</div><strong>Đang tải danh bạ…</strong></div></div>
    `;
    p.querySelector('.tc-content')?.appendChild(contacts);
    contacts.querySelector('#tc-zalo-contacts-q')?.addEventListener('input', (e) => {
      contactsSearch = e.target.value || '';
      renderContacts();
    });
  }

  p.querySelector('.tc-companies-view')?.classList.add('hidden');
  p.querySelector('.tc-welcome')?.classList.add('hidden');
  setZaloTab('chat');
  return true;
}

function tryPatch() {
  return rebuildTabs();
}

const _open = () => {
  let n = 0;
  const t = setInterval(() => {
    if (tryPatch() || ++n > 40) clearInterval(t);
  }, 100);
};

function hookOpen() {
  const dc = window.driverCommunity;
  if (!dc || dc.__zaloPatched) return !!dc;
  const orig = dc.open?.bind(dc);
  if (typeof orig === 'function') {
    dc.open = function () {
      const r = orig();
      _open();
      return r;
    };
    dc.__zaloPatched = true;
    return true;
  }
  return false;
}

function boot() {
  injectStyles();
  if (!hookOpen()) {
    let n = 0;
    const t = setInterval(() => {
      if (hookOpen() || ++n > 50) clearInterval(t);
    }, 100);
  }
  if (panel()) tryPatch();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
window.addEventListener('firebase-ready', boot);
