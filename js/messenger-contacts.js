// Tổ Nghề Taxi Việt Nam — Danh bạ Messenger
// Danh bạ tài xế dùng một collection công khai có chủ đích: driver_directory.
// Chỉ lưu thông tin hiển thị cần thiết (tên, ảnh, hãng xe, trạng thái); không đọc appState riêng tư.
import { collection, doc, getDoc, limit, onSnapshot, query, setDoc, serverTimestamp, where } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const auth = () => window.firebaseServices?.auth;
const db = () => window.firebaseServices?.db;
const me = () => { const u = auth()?.currentUser; return u && !u.isAnonymous ? u : null; };
const esc = (v='') => String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
let drivers = [], unsubscribe = null, contactMode = false, search = '';

function styles(){
  if(document.querySelector('#m4-contacts-styles')) return;
  const s=document.createElement('style'); s.id='m4-contacts-styles'; s.textContent=`
  .m4-contacts-toolbar{padding:10px 12px 4px;display:flex;align-items:center;justify-content:space-between;gap:8px;color:#a99b7e;font-size:12px}
  .m4-contacts-count{color:#79d49b;white-space:nowrap}
  .m4-contact-row{width:100%;display:flex;align-items:center;gap:11px;border:0;border-bottom:1px solid rgba(218,177,61,.1);background:transparent;color:inherit;text-align:left;padding:11px 9px;cursor:pointer;border-radius:13px}
  .m4-contact-row:hover,.m4-contact-row:active{background:rgba(218,177,61,.08)}
  .m4-contact-avatar{width:50px;height:50px;flex:0 0 50px;border-radius:50%;overflow:hidden;border:1px solid rgba(218,177,61,.42);display:flex;align-items:center;justify-content:center;background:#21150e;color:#d9bd76;font-weight:800;font-size:19px;position:relative}
  .m4-contact-avatar img{width:100%;height:100%;object-fit:cover}
  .m4-contact-online{position:absolute;right:1px;bottom:1px;width:10px;height:10px;border-radius:50%;background:#68d391;border:2px solid #100905}
  .m4-contact-main{min-width:0;flex:1}
  .m4-contact-name{display:flex;align-items:center;gap:6px;color:#f1dfb2;font-weight:800;font-size:15px}
  .m4-contact-company{margin-top:4px;color:#a99b7e;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .m4-contact-action{border:1px solid rgba(218,177,61,.28);background:transparent;color:#d8ad36;border-radius:999px;padding:6px 9px;font-weight:800;font-size:11px}
  `; document.head.appendChild(s);
}

function avatar(d){
  const name=d.displayName||'Tài xế';
  return `<div class="m4-contact-avatar">${d.photoURL?`<img src="${esc(d.photoURL)}" alt="">`:`<span>${esc(name.trim().charAt(0).toUpperCase())}</span>`}<i class="m4-contact-online"></i></div>`;
}

async function syncMyDirectory(){
  const u=me(); if(!u||!db()) return;
  try{
    const snap=await getDoc(doc(db(),'users',u.uid));
    const old=snap.exists()?snap.data():{};
    await setDoc(doc(db(),'driver_directory',u.uid),{
      displayName:u.displayName||old.displayName||'Tài xế',
      photoURL:u.photoURL||old.photoURL||'',
      company:old.company||'Khác',
      uid:u.uid,
      online:true,
      updatedAt:serverTimestamp()
    },{merge:true});
  }catch(e){ console.warn('[Messenger contacts] sync failed',e); }
}

function startDirectory(){
  unsubscribe?.(); unsubscribe=null;
  const u=me(); if(!u||!db()) return;
  syncMyDirectory();
  const q=query(collection(db(),'driver_directory'),limit(200));
  unsubscribe=onSnapshot(q,snap=>{
    drivers=snap.docs.map(d=>({id:d.id,...d.data()})).filter(d=>d.uid!==u.uid);
    drivers.sort((a,b)=>(a.displayName||'').localeCompare(b.displayName||'','vi'));
    if(contactMode) renderContacts();
  },err=>{
    console.error('[Messenger contacts] directory',err);
    if(contactMode){ const box=document.querySelector('#m4-list'); if(box) box.innerHTML='<div class="m4-empty"><div class="ico">⚠️</div><strong>Không tải được danh bạ</strong><p>Kiểm tra kết nối Firebase và quyền danh bạ.</p></div>'; }
  });
}

function setTabs(active){
  document.querySelectorAll('#tc-community [data-m4-filter]').forEach(x=>x.classList.toggle('active',x.dataset.m4Filter===active));
  const c=document.querySelector('#m4-contacts-tab'); if(c) c.classList.toggle('active',active==='contacts');
}

function renderContacts(){
  const box=document.querySelector('#m4-list'),u=me(); if(!box||!u) return;
  let list=drivers.slice();
  const q=search.trim().toLowerCase();
  if(q) list=list.filter(d=>`${d.displayName||''} ${d.company||''}`.toLowerCase().includes(q));
  if(!list.length){
    box.innerHTML='<div class="m4-empty"><div class="ico">👥</div><strong>Chưa có tài xế phù hợp</strong><p>Tìm theo tên hoặc hãng xe. Tài xế đã đăng nhập sẽ xuất hiện trong danh bạ.</p></div>';
    return;
  }
  box.innerHTML=`<div class="m4-contacts-toolbar"><span>Danh bạ tài xế</span><span class="m4-contacts-count">● ${list.length} người</span></div>`+list.map(d=>`<button type="button" class="m4-contact-row" data-contact-uid="${esc(d.uid)}" data-contact-name="${esc(d.displayName||'Tài xế')}" data-contact-photo="${esc(d.photoURL||'')}">${avatar(d)}<div class="m4-contact-main"><div class="m4-contact-name">${esc(d.displayName||'Tài xế')}</div><div class="m4-contact-company">🚕 ${esc(d.company||'Khác')}</div></div><span class="m4-contact-action">Nhắn tin</span></button>`).join('');
  box.querySelectorAll('[data-contact-uid]').forEach(btn=>btn.addEventListener('click',()=>{
    contactMode=false;
    const open=window.driverMessengerV3?.openPrivate;
    if(open) open({uid:btn.dataset.contactUid,name:btn.dataset.contactName,photo:btn.dataset.contactPhoto});
    else window.driverMessengerV3?.activateChatTab?.();
  }));
}

function showContacts(){
  const b=document.querySelector('#tc-community .tc-chat-body'); if(!b||!me()) return;
  contactMode=true; setTabs('contacts');
  const searchBox=b.querySelector('#m4-search');
  if(searchBox){ searchBox.value=search; searchBox.placeholder='Tìm trong danh bạ…'; }
  renderContacts();
}

function patch(){
  styles();
  const tabs=document.querySelector('#tc-community .m4-tabs');
  if(!tabs) return;
  let btn=document.querySelector('#m4-contacts-tab');
  if(!btn){
    btn=document.createElement('button'); btn.type='button'; btn.id='m4-contacts-tab'; btn.className='m4-tab'; btn.dataset.m4Filter='contacts'; btn.textContent='👥 Danh bạ';
    tabs.appendChild(btn);
    btn.addEventListener('click',showContacts);
  }
  if(!btn.dataset.bound){
    btn.dataset.bound='1'; btn.addEventListener('click',showContacts);
  }
  const input=document.querySelector('#m4-search');
  if(input && input.dataset.contactsBound!=='1'){
    input.dataset.contactsBound='1';
    input.addEventListener('input',e=>{search=e.target.value; if(contactMode) renderContacts();});
  }
}

function boot(){
  if(!document.querySelector('#tc-community')) return;
  styles();
  const observer=new MutationObserver(()=>{ if(document.querySelector('#tc-community .m4-tabs')) patch(); });
  observer.observe(document.body,{subtree:true,childList:true});
  patch();
  startDirectory();
  window.addEventListener('firebase-auth-changed',()=>{contactMode=false;drivers=[];startDirectory();});
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
