// Tổ Nghề Taxi Việt Nam — Danh bạ tài xế (event-driven, không MutationObserver)
// Danh bạ chỉ dùng dữ liệu hiển thị tối thiểu từ driver_directory.
import { collection, doc, getDoc, limit, onSnapshot, query, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const auth = () => window.firebaseServices?.auth;
const db = () => window.firebaseServices?.db;
const me = () => { const u = auth()?.currentUser; return u && !u.isAnonymous ? u : null; };
const esc = (v='') => String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');

let drivers = [];
let unsubscribe = null;
let search = '';
let installed = false;
let contactsOpen = false;

function styles(){
  if(document.querySelector('#m4-contacts-v7-styles')) return;
  const s=document.createElement('style');
  s.id='m4-contacts-v7-styles';
  s.textContent=`
    .m4-contact-tab{position:relative}
    .m4-contact-tab .m4-contact-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:#79d49b;margin-left:5px;vertical-align:middle;box-shadow:0 0 7px rgba(121,212,155,.65)}
    .m4-contacts-screen{height:100%;min-height:0;display:flex;flex-direction:column;background:#100905;color:#ead9b3}
    .m4-contacts-head{display:flex;align-items:center;gap:10px;padding:11px 12px;border-bottom:1px solid rgba(218,177,61,.18);background:linear-gradient(180deg,rgba(44,25,11,.96),rgba(18,10,6,.98))}
    .m4-contacts-back{width:40px;height:40px;border-radius:12px;border:1px solid rgba(218,177,61,.3);background:transparent;color:#f0d99f;font-size:24px;cursor:pointer;flex:0 0 40px}
    .m4-contacts-head-main{min-width:0;flex:1}.m4-contacts-head-main strong{display:block;color:#f1dca6;font-size:19px}.m4-contacts-head-main small{display:block;color:#7ed39d;margin-top:2px;font-size:11px}
    .m4-contacts-search{padding:10px 12px 4px;position:relative}.m4-contacts-search span{position:absolute;left:25px;top:19px;opacity:.7}.m4-contacts-search input{width:100%;box-sizing:border-box;border:1px solid rgba(218,177,61,.28);background:#190d08;color:#f3e7c7;border-radius:18px;padding:10px 13px 10px 38px;outline:none;font-size:14px}
    .m4-contacts-meta{padding:8px 14px;color:#9f9278;font-size:12px;display:flex;justify-content:space-between}.m4-contacts-meta b{color:#79d49b}
    .m4-contacts-list{flex:1;min-height:0;overflow:auto;padding:2px 8px 18px}
    .m4-contact-row{width:100%;display:flex;align-items:center;gap:11px;border:0;border-bottom:1px solid rgba(218,177,61,.1);background:transparent;color:inherit;text-align:left;padding:11px 8px;cursor:pointer;border-radius:13px}.m4-contact-row:hover,.m4-contact-row:active{background:rgba(218,177,61,.08)}
    .m4-contact-avatar{width:50px;height:50px;flex:0 0 50px;border-radius:50%;overflow:hidden;border:1px solid rgba(218,177,61,.42);display:flex;align-items:center;justify-content:center;background:#21150e;color:#d9bd76;font-weight:800;font-size:19px;position:relative}.m4-contact-avatar img{width:100%;height:100%;object-fit:cover}.m4-contact-online{position:absolute;right:1px;bottom:1px;width:10px;height:10px;border-radius:50%;background:#68d391;border:2px solid #100905}.m4-contact-offline{background:#786d5b}
    .m4-contact-main{min-width:0;flex:1}.m4-contact-name{display:flex;align-items:center;gap:6px;color:#f1dfb2;font-weight:800;font-size:15px}.m4-contact-company{margin-top:4px;color:#a99b7e;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.m4-contact-status{font-size:11px;color:#79d49b}.m4-contact-status.offline{color:#8f846f}.m4-contact-action{border:1px solid rgba(218,177,61,.28);background:transparent;color:#d8ad36;border-radius:999px;padding:6px 9px;font-weight:800;font-size:11px;flex:0 0 auto}
    .m4-contacts-empty{text-align:center;padding:52px 22px;color:#9f9278}.m4-contacts-empty .ico{font-size:40px;margin-bottom:10px}.m4-contacts-empty strong{display:block;color:#e7d29c;font-size:18px;margin-bottom:6px}.m4-contacts-empty p{margin:0;line-height:1.5}
  `;
  document.head.appendChild(s);
}

function avatar(d){
  const name=d.displayName||'Tài xế';
  const online=d.online!==false;
  return `<div class="m4-contact-avatar">${d.photoURL?`<img src="${esc(d.photoURL)}" alt="">`:`<span>${esc(name.trim().charAt(0).toUpperCase())}</span>`}<i class="m4-contact-online ${online?'':'m4-contact-offline'}"></i></div>`;
}

async function syncMyDirectory(){
  const u=me(); const firestore=db();
  if(!u||!firestore) return;
  try{
    const snap=await getDoc(doc(firestore,'users',u.uid));
    const old=snap.exists()?snap.data():{};
    await setDoc(doc(firestore,'driver_directory',u.uid),{
      uid:u.uid,
      displayName:u.displayName||old.displayName||'Tài xế',
      photoURL:u.photoURL||old.photoURL||'',
      company:old.company||'Khác',
      online:true,
      updatedAt:serverTimestamp()
    },{merge:true});
  }catch(e){ console.warn('[Messenger contacts] sync failed',e); }
}

function startDirectory(){
  unsubscribe?.(); unsubscribe=null;
  const u=me(); const firestore=db();
  if(!u||!firestore) return;
  syncMyDirectory();
  const q=query(collection(firestore,'driver_directory'),limit(200));
  unsubscribe=onSnapshot(q,snap=>{
    drivers=snap.docs.map(d=>({id:d.id,...d.data()})).filter(d=>d.uid!==u.uid);
    drivers.sort((a,b)=>(a.displayName||'').localeCompare(b.displayName||'','vi'));
    if(contactsOpen) renderScreen();
  },err=>{
    console.error('[Messenger contacts] directory',err);
    if(contactsOpen) renderError();
  });
}

function getChatBody(){ return document.querySelector('#tc-community .tc-chat-body'); }

function restoreInbox(){
  contactsOpen=false;
  const b=getChatBody();
  if(b) b.dataset.m4Contacts='0';
  window.driverMessengerV3?.mount?.();
  window.setTimeout(installTab,0);
  window.setTimeout(installTab,120);
}

function installTab(){
  const tabs=document.querySelector('#tc-community .m4-tabs');
  if(!tabs) return false;
  let btn=document.querySelector('#m4-contacts-tab');
  if(!btn){
    btn=document.createElement('button');
    btn.type='button';
    btn.id='m4-contacts-tab';
    btn.className='m4-tab m4-contact-tab';
    btn.dataset.m4ContactsTab='1';
    btn.innerHTML='👥 Danh bạ<span class="m4-contact-dot"></span>';
    btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();showContacts();});
    tabs.appendChild(btn);
  }
  return true;
}

function showContacts(){
  const u=me();
  if(!u){ window.driverCommunity?.login?.(); return; }
  const b=getChatBody();
  if(!b) return;
  contactsOpen=true;
  b.dataset.m4Contacts='1';
  renderScreen();
}

function renderError(){
  const b=getChatBody(); if(!b) return;
  b.innerHTML=`<div class="m4-contacts-screen"><div class="m4-contacts-head"><button type="button" class="m4-contacts-back" data-m4-contacts-back>‹</button><div class="m4-contacts-head-main"><strong>👥 Danh bạ</strong><small>Không thể tải danh sách tài xế</small></div></div><div class="m4-contacts-empty"><div class="ico">⚠️</div><strong>Danh bạ chưa kết nối</strong><p>Kiểm tra kết nối Firebase rồi thử lại.</p></div></div>`;
  b.querySelector('[data-m4-contacts-back]')?.addEventListener('click',restoreInbox);
}

function renderScreen(){
  const b=getChatBody(); const u=me();
  if(!b||!u) return;
  const q=search.trim().toLowerCase();
  const list=q?drivers.filter(d=>`${d.displayName||''} ${d.company||''}`.toLowerCase().includes(q)):drivers.slice();
  b.innerHTML=`<div class="m4-contacts-screen"><div class="m4-contacts-head"><button type="button" class="m4-contacts-back" data-m4-contacts-back aria-label="Quay lại tin nhắn">‹</button><div class="m4-contacts-head-main"><strong>👥 Danh bạ tài xế</strong><small>Tài xế đã đăng nhập · nhắn tin 1–1</small></div></div><div class="m4-contacts-search"><span>🔍</span><input id="m4-contacts-search" value="${esc(search)}" placeholder="Tìm tên hoặc hãng xe…" autocomplete="off"></div><div class="m4-contacts-meta"><span>${q?'Kết quả tìm kiếm':'Tất cả tài xế'}</span><b>● ${list.length}</b></div><div class="m4-contacts-list" id="m4-contacts-list">${list.length?list.map(d=>`<button type="button" class="m4-contact-row" data-contact-uid="${esc(d.uid)}" data-contact-name="${esc(d.displayName||'Tài xế')}" data-contact-photo="${esc(d.photoURL||'')}">${avatar(d)}<div class="m4-contact-main"><div class="m4-contact-name">${esc(d.displayName||'Tài xế')}</div><div class="m4-contact-company">🚕 ${esc(d.company||'Khác')}</div><div class="m4-contact-status ${d.online===false?'offline':''}">${d.online===false?'○ Ngoại tuyến':'● Đang hoạt động'}</div></div><span class="m4-contact-action">Nhắn tin</span></button>`).join(''):`<div class="m4-contacts-empty"><div class="ico">👥</div><strong>${q?'Không tìm thấy tài xế':'Chưa có tài xế khác trong danh bạ'}</strong><p>${q?'Thử tên khác hoặc tên hãng xe.':'Khi tài xế khác đăng nhập, họ sẽ tự xuất hiện tại đây.'}</p></div>`}</div></div>`;
  b.querySelector('[data-m4-contacts-back]')?.addEventListener('click',restoreInbox);
  b.querySelector('#m4-contacts-search')?.addEventListener('input',e=>{search=e.target.value;renderScreen();const input=document.querySelector('#m4-contacts-search');input?.focus();input?.setSelectionRange(search.length,search.length);});
  b.querySelectorAll('[data-contact-uid]').forEach(btn=>btn.addEventListener('click',()=>{
    const other={uid:btn.dataset.contactUid,name:btn.dataset.contactName,photo:btn.dataset.contactPhoto};
    contactsOpen=false;
    window.driverMessengerV3?.openPrivate?.(other);
  }));
}

function boot(){
  if(installed) return;
  installed=true;
  styles();
  startDirectory();

  // Chỉ chạy khi người dùng mở tab Trò chuyện; không quan sát toàn bộ DOM.
  document.addEventListener('click',e=>{
    const mainTab=e.target.closest?.('#tc-community .tc-main-tab[data-tab="chat"]');
    const filterTab=e.target.closest?.('#tc-community .m4-tab[data-m4-filter]');
    if(mainTab || filterTab) window.setTimeout(installTab,0);
  },true);

  window.addEventListener('community-chat-request',()=>{window.setTimeout(installTab,0);window.setTimeout(installTab,120);});
  window.addEventListener('firebase-auth-changed',()=>{contactsOpen=false;drivers=[];startDirectory();window.setTimeout(installTab,80);});
  window.setTimeout(installTab,0);
  window.setTimeout(installTab,250);
}

boot();
