// Tổ Nghề Taxi Việt Nam — Messenger Inbox v3
// Zalo-inspired information architecture (not a copy): inbox -> private 1-1 / group chat.
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const GROUP_ID = 'tai_xe_viet_nam';
const GROUP = { id: GROUP_ID, name: 'Tổ Nghề Taxi Việt Nam', subtitle: 'Nhóm chung · anh em tài xế' };
let mounted = false;
let listUnsub = null;
let activeUnsub = null;
let active = null;
let rows = [];
let filter = 'all';
let search = '';

const esc = (v = '') => String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const services = () => window.firebaseServices || {};
const auth = () => services().auth;
const db = () => services().db;
const me = () => { const u = auth()?.currentUser; return u && !u.isAnonymous ? u : null; };
const chatId = (a,b) => [a,b].sort().join('__');
const fmt = ts => ts?.toDate ? new Intl.DateTimeFormat('vi-VN',{dateStyle:'short',timeStyle:'short'}).format(ts.toDate()) : '';
const avatar = (photo,name,group=false) => group
  ? '<div class="m3-avatar m3-group-avatar">👥</div>'
  : `<div class="m3-avatar">${photo ? `<img src="${esc(photo)}" alt="">` : `<span>${esc((name||'T').trim().charAt(0).toUpperCase())}</span>`}</div>`;
function toast(text,type='info'){ const e=document.createElement('div'); e.className=`tc-toast ${type}`; e.textContent=text; document.body.appendChild(e); setTimeout(()=>e.remove(),3000); }

function styles(){
  if(document.querySelector('#m3-styles')) return;
  const s=document.createElement('style'); s.id='m3-styles'; s.textContent=`
  #tc-community .tc-chat-body{padding:0!important;overflow:hidden!important}
  .m3{height:100%;min-height:600px;display:flex;flex-direction:column;background:#100905;color:#ead9b3}
  .m3-head{padding:18px 16px 10px;border-bottom:1px solid rgba(218,177,61,.18);background:linear-gradient(180deg,rgba(44,25,11,.92),rgba(18,10,6,.95))}
  .m3-title{display:flex;align-items:center;justify-content:space-between;gap:12px}.m3-title h3{margin:0;font-size:22px;color:#f1dca6}.m3-title small{color:#79d49b;white-space:nowrap}
  .m3-search{position:relative;margin-top:13px}.m3-search span{position:absolute;left:14px;top:10px;opacity:.7}.m3-search input{width:100%;box-sizing:border-box;border:1px solid rgba(218,177,61,.28);background:#190d08;color:#f3e7c7;border-radius:18px;padding:11px 14px 11px 40px;outline:none;font-size:14px}
  .m3-tabs{display:flex;gap:8px;overflow:auto;padding:12px 0 2px;scrollbar-width:none}.m3-tabs::-webkit-scrollbar{display:none}.m3-tab{flex:0 0 auto;border:1px solid rgba(218,177,61,.25);background:transparent;color:#bba980;border-radius:999px;padding:8px 14px;font-weight:700}.m3-tab.active{background:#d8ad36;border-color:#d8ad36;color:#201408}
  .m3-list{flex:1;overflow:auto;padding:4px 8px 18px}.m3-row{width:100%;display:flex;align-items:center;gap:12px;border:0;border-bottom:1px solid rgba(218,177,61,.10);background:transparent;color:inherit;text-align:left;padding:13px 10px;cursor:pointer;border-radius:14px}.m3-row:hover{background:rgba(218,177,61,.07)}.m3-avatar{width:52px;height:52px;flex:0 0 52px;border-radius:50%;overflow:hidden;border:1px solid rgba(218,177,61,.42);display:flex;align-items:center;justify-content:center;background:#21150e;color:#d9bd76;font-weight:800;font-size:20px}.m3-avatar img{width:100%;height:100%;object-fit:cover}.m3-group-avatar{background:linear-gradient(135deg,#d9ae39,#725016);color:#201307}.m3-main{min-width:0;flex:1}.m3-line{display:flex;align-items:center;gap:8px}.m3-line strong{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#f1dfb2;font-size:15px}.m3-line time{font-size:11px;color:#958565;white-space:nowrap}.m3-preview{display:block;margin-top:5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#a99b7e;font-size:13px}.m3-badge{min-width:20px;height:20px;border-radius:10px;background:#d8ad36;color:#211407;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;padding:0 6px}.m3-empty{text-align:center;padding:62px 24px;color:#9f9278}.m3-empty .ico{font-size:42px;margin-bottom:12px}.m3-empty strong{display:block;color:#e7d29c;font-size:18px;margin-bottom:6px}.m3-empty p{margin:0;line-height:1.5}
  .m3-chat{height:100%;min-height:600px;display:flex;flex-direction:column}.m3-chat-head{display:flex;align-items:center;gap:9px;padding:10px 11px;border-bottom:1px solid rgba(218,177,61,.18);background:rgba(37,20,9,.95)}.m3-back{width:40px;height:40px;border-radius:12px;border:1px solid rgba(218,177,61,.3);background:transparent;color:#f0d99f;font-size:21px}.m3-chat-head .m3-avatar{width:42px;height:42px;flex-basis:42px;font-size:16px}.m3-head-main{min-width:0;flex:1}.m3-head-main strong{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#f1dfb2}.m3-head-main small{display:block;color:#7ed39d;margin-top:2px}.m3-head-more{border:0;background:transparent;color:#c9b77e;font-size:22px}
  .m3-notice{margin:9px 12px 0;padding:8px 10px;border-radius:11px;border:1px solid rgba(113,171,101,.23);background:rgba(65,88,48,.12);color:#a5b692;font-size:11px}.m3-messages{flex:1;overflow:auto;padding:10px 12px 12px}.m3-msg{display:flex;gap:7px;align-items:flex-end;margin:8px 0}.m3-msg.mine{justify-content:flex-end}.m3-msg .m3-avatar{width:30px;height:30px;flex-basis:30px;font-size:11px}.m3-msg-body{max-width:78%}.m3-author{font-size:11px;color:#a89a7c;margin:0 0 3px 4px}.m3-bubble{display:inline-block;padding:9px 12px;border-radius:16px 16px 16px 4px;background:#21130c;border:1px solid rgba(218,177,61,.14);color:#eadcbd;line-height:1.43;word-break:break-word}.m3-msg.mine .m3-bubble{background:#d8ad36;color:#211408;border-color:#d8ad36;border-radius:16px 16px 4px 16px}.m3-meta{font-size:10px;color:#85785f;margin-top:3px}.m3-msg.mine .m3-meta{text-align:right}.m3-compose{display:flex;gap:8px;padding:9px;border-top:1px solid rgba(218,177,61,.18);background:rgba(29,15,8,.97)}.m3-compose input{flex:1;min-width:0;border:1px solid rgba(218,177,61,.28);background:#170c08;color:#f2e6c5;border-radius:20px;padding:11px 14px;outline:none}.m3-compose button{width:44px;height:44px;border:0;border-radius:50%;background:#d8ad36;color:#211408;font-size:18px;font-weight:900}.m3-compose button:disabled{opacity:.45}.m3-login{margin:auto 22px;text-align:center}.m3-login button{border:0;background:#d8ad36;color:#211408;font-weight:900;border-radius:13px;padding:12px 20px}
  `; document.head.appendChild(s);
}

function login(){ window.driverCommunity?.login?.(); }
function patch(){
  const body=document.querySelector('#tc-community .tc-chat-body');
  if(!body) return false;
  styles();
  if(body.dataset.m3Mounted==='1') return true;
  body.dataset.m3Mounted='1'; mounted=true;
  render();
  bindInboxEvents();
  subscribeList();
  return true;
}
function render(){
  const u=me();
  if(!u){ document.querySelector('#tc-community .tc-chat-body').innerHTML=`<div class="m3"><div class="m3-head"><div class="m3-title"><h3>💬 Tin nhắn</h3><small>● Realtime</small></div></div><div class="m3-empty m3-login"><div class="ico">🔐</div><strong>Đăng nhập để nhắn tin</strong><p>Tin nhắn cá nhân và nhóm chỉ dành cho tài xế đã xác thực.</p><button data-m3-login>Đăng nhập Google</button></div></div>`; return; }
  document.querySelector('#tc-community .tc-chat-body').innerHTML=`<div class="m3"><div class="m3-head"><div class="m3-title"><h3>💬 Tin nhắn</h3><small>● Realtime</small></div></div><div class="m3-search"><span>🔍</span><input id="m3-search" placeholder="Tìm người hoặc cuộc trò chuyện…" value="${esc(search)}"></div><div class="m3-tabs"><button class="m3-tab ${filter==='all'?'active':''}" data-m3-filter="all">Tất cả</button><button class="m3-tab ${filter==='private'?'active':''}" data-m3-filter="private">👤 Cá nhân</button><button class="m3-tab ${filter==='group'?'active':''}" data-m3-filter="group">👥 Nhóm</button></div><div class="m3-list" id="m3-list"></div></div>`;
  bindInboxEvents(); renderList();
}
function bindInboxEvents(){
  const root=document.querySelector('#tc-community .tc-chat-body'); if(!root) return;
  root.querySelector('[data-m3-login]')?.addEventListener('click',login);
  root.querySelectorAll('[data-m3-filter]').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.m3Filter;render();}));
  root.querySelector('#m3-search')?.addEventListener('input',e=>{search=e.target.value;renderList();});
}
function subscribeList(){
  listUnsub?.(); const u=me(); if(!u) return;
  listUnsub=onSnapshot(query(collection(db(),'direct_chats'),where('participantIds','array-contains',u.uid),limit(100)),snap=>{
    rows=snap.docs.map(d=>({id:d.id,kind:'private',data:d.data()}));
    rows.push({id:`group:${GROUP_ID}`,kind:'group',data:{name:GROUP.name,lastMessage:'Phòng chung · nhắn tin với anh em tài xế',lastMessageAt:null}});
    rows.sort((a,b)=>(b.data.lastMessageAt?.toMillis?.()||0)-(a.data.lastMessageAt?.toMillis?.()||0));
    renderList();
  },err=>{console.error('[Messenger v3]',err); const box=document.querySelector('#m3-list'); if(box)box.innerHTML='<div class="m3-empty"><div class="ico">⚠️</div><strong>Không tải được tin nhắn</strong><p>Kiểm tra kết nối Firebase và đăng nhập lại.</p></div>';});
}
function renderList(){
  const box=document.querySelector('#m3-list'),u=me(); if(!box||!u)return;
  let list=rows.filter(r=>filter==='all'||r.kind===filter);
  if(search.trim()){const q=search.trim().toLowerCase();list=list.filter(r=>{const x=privateInfo(r,u.uid);return `${x.name} ${r.data.lastMessage||''}`.toLowerCase().includes(q);});}
  if(!list.length){box.innerHTML='<div class="m3-empty"><div class="ico">💬</div><strong>Chưa có cuộc trò chuyện</strong><p>Mở bài viết của một tài xế và chọn “Nhắn tin” để bắt đầu.</p></div>';return;}
  box.innerHTML=list.map(r=>{const x=privateInfo(r,u.uid); const group=r.kind==='group'; const time=fmt(r.data.lastMessageAt); const unread=0; return `<button class="m3-row" data-m3-open="${esc(r.id)}" data-m3-kind="${r.kind}" data-m3-other="${esc(x.other||'')}" data-m3-name="${esc(x.name)}" data-m3-photo="${esc(x.photo)}">${avatar(x.photo,x.name,group)}<div class="m3-main"><div class="m3-line"><strong>${esc(x.name)}</strong>${time?`<time>${esc(time)}</time>`:''}</div><span class="m3-preview">${esc(r.data.lastMessage || (group?'Phòng chung · tất cả tài xế':'Chưa có tin nhắn'))}</span></div>${unread?`<span class="m3-badge">${unread}</span>`:''}</button>`;}).join('');
  box.querySelectorAll('[data-m3-open]').forEach(b=>b.addEventListener('click',()=>b.dataset.m3Kind==='group'?openGroup():openPrivate({uid:b.dataset.m3Other,name:b.dataset.m3Name,photo:b.dataset.m3Photo},b.dataset.m3Open)));
}
function privateInfo(row,uid){ if(row.kind==='group') return {name:GROUP.name,photo:'',other:null}; const other=(row.data.participantIds||[]).find(x=>x!==uid); const p=row.data.participantProfiles?.[other]||{}; return {name:p.name||'Tài xế',photo:p.photo||'',other}; }
async function ensureChat(other){
  const u=me(); if(!u||!other?.uid||u.uid===other.uid)return null;
  const id=chatId(u.uid,other.uid),ref=doc(db(),'direct_chats',id),snap=await getDoc(ref);
  const mine={name:u.displayName||'Tài xế',photo:u.photoURL||''};
  const data={participantIds:[u.uid,other.uid].sort(),participantProfiles:{[u.uid]:mine,[other.uid]:{name:other.name||'Tài xế',photo:other.photo||''}}};
  if(!snap.exists())data.createdAt=serverTimestamp(); await setDoc(ref,data,{merge:true}); return id;
}
function openPrivate(other,id){const u=me();if(!u)return login();if(!other?.uid||other.uid===u.uid)return;active={type:'private',id:id||chatId(u.uid,other.uid),other};renderChat();ensureChat(other).then(()=>subscribeMessages()).catch(e=>{console.error(e);toast('Không thể mở tin nhắn riêng.','error');});}
function openGroup(){if(!me())return login();active={type:'group',id:GROUP_ID,other:null};renderChat();subscribeMessages();}
function renderChat(){
  const body=document.querySelector('#tc-community .tc-chat-body'); if(!body||!active)return; const group=active.type==='group'; const other=active.other; body.innerHTML=`<div class="m3-chat"><div class="m3-chat-head"><button class="m3-back" data-m3-back>‹</button>${avatar(group?'':other?.photo,group?GROUP.name:other?.name,group)}<div class="m3-head-main"><strong>${esc(group?GROUP.name:(other?.name||'Tài xế'))}</strong><small>● ${group?'Nhóm chung · mọi tài xế':'Trực tuyến · tin nhắn riêng tư'}</small></div><button class="m3-head-more" aria-label="Tùy chọn">•••</button></div><div class="m3-notice">🔒 ${group?'Tin nhắn trong nhóm chỉ dành cho thành viên đã đăng nhập.':'Cuộc trò chuyện này chỉ hiển thị với hai tài xế.'}</div><div class="m3-messages" id="m3-messages"><div class="m3-empty"><div class="ico">⏳</div><strong>Đang tải tin nhắn…</strong></div></div><form class="m3-compose" id="m3-compose"><input name="message" maxlength="1000" placeholder="Nhập tin nhắn…" autocomplete="off"><button type="submit">➤</button></form></div>`;
  body.querySelector('[data-m3-back]').onclick=()=>{active=null;activeUnsub?.();activeUnsub=null;render();bindInboxEvents();subscribeList();};
  body.querySelector('#m3-compose').onsubmit=sendMessage;
}
function subscribeMessages(){
  activeUnsub?.(); const u=me(); if(!u||!active)return; const c=active.type==='group'?collection(db(),'community_rooms',GROUP_ID,'messages'):collection(db(),'direct_chats',active.id,'messages');
  activeUnsub=onSnapshot(query(c,orderBy('createdAt','asc'),limit(200)),snap=>{renderMessages(snap.docs.map(d=>({id:d.id,data:d.data()}))); markRead(snap.docs);},err=>{console.error('[Messenger v3 messages]',err);const box=document.querySelector('#m3-messages');if(box)box.innerHTML='<div class="m3-empty"><div class="ico">⚠️</div><strong>Không thể tải cuộc trò chuyện</strong><p>Kiểm tra Firestore Rules và kết nối mạng.</p></div>';});
}
function renderMessages(items){
  const box=document.querySelector('#m3-messages'),u=me();if(!box||!u)return;if(!items.length){box.innerHTML='<div class="m3-empty"><div class="ico">💬</div><strong>Chưa có tin nhắn</strong><p>Hãy gửi lời chào đầu tiên.</p></div>';return;}
  box.innerHTML=items.map(({id,data})=>{const mine=data.senderId===u.uid;const author=data.senderName||'Tài xế';return `<div class="m3-msg ${mine?'mine':''}">${mine?'':avatar(data.senderPhoto||'',author)}<div class="m3-msg-body">${active.type==='group'&&!mine?`<div class="m3-author">${esc(author)}</div>`:''}<div class="m3-bubble">${esc(data.content||'').replaceAll('\n','<br>')}</div><div class="m3-meta">${esc(fmt(data.createdAt))}${mine?(Array.isArray(data.readBy)&&data.readBy.length>1?' · Đã xem':' · Đã gửi'):''}</div></div></div>`;}).join(''); box.scrollTop=box.scrollHeight;}
async function markRead(docs){const u=me();if(!u)return;for(const d of docs){const data=d.data();if(!(Array.isArray(data.readBy)&&data.readBy.includes(u.uid))){try{await updateDoc(d.ref,{readBy:arrayUnion(u.uid)});}catch(e){console.warn('[Messenger v3] read receipt',e);}}}}
async function sendMessage(e){e.preventDefault();const u=me();if(!u||!active)return;const form=e.currentTarget;const input=form.message;const content=input.value.trim();if(!content)return;const button=form.querySelector('button');button.disabled=true;
  try{const profile={name:u.displayName||'Tài xế',photo:u.photoURL||''};let parentRef;
    if(active.type==='group'){parentRef=doc(db(),'community_rooms',GROUP_ID);await setDoc(parentRef,{name:GROUP.name,updatedAt:serverTimestamp()},{merge:true});await addDoc(collection(parentRef,'messages'),{senderId:u.uid,senderName:profile.name,senderPhoto:profile.photo,content,createdAt:serverTimestamp(),readBy:[u.uid]});}
    else {await ensureChat(active.other);parentRef=doc(db(),'direct_chats',active.id);await addDoc(collection(parentRef,'messages'),{senderId:u.uid,senderName:profile.name,senderPhoto:profile.photo,content,createdAt:serverTimestamp(),readBy:[u.uid]});await updateDoc(parentRef,{lastMessage:content.slice(0,120),lastMessageAt:serverTimestamp(),lastSenderId:u.uid});}
    input.value='';
  }catch(err){console.error('[Messenger v3] send',err);toast('Gửi tin nhắn thất bại.','error');}finally{button.disabled=false;input.focus();}}

// Keep this as a resilient overlay because community.js creates its chat DOM after navigation.
function boot(){
  styles();
  const tryPatch=()=>patch();
  if(tryPatch()) return;
  const observer=new MutationObserver(()=>{if(patch()) { /* keep observing: community can rebuild the panel */ }});
  observer.observe(document.body,{childList:true,subtree:true});
  setInterval(()=>{if(!document.querySelector('#tc-community .tc-chat-body')) return; const body=document.querySelector('#tc-community .tc-chat-body'); if(body.dataset.m3Mounted!=='1') patch();},700);
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-message-user]'); if(!b)return;
    e.preventDefault(); e.stopImmediatePropagation();
    openPrivate({uid:b.dataset.messageUser,name:b.dataset.messageName,photo:b.dataset.messagePhoto});
  },true);
  window.addEventListener('firebase-auth-changed',()=>{ if(document.querySelector('#tc-community .tc-chat-body')){mounted=false;active=null;render();bindInboxEvents();subscribeList();}});
}
window.driverMessengerV3={openPrivate,openGroup};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
