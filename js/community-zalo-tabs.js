// Community UI cleanup: compact header, logo mark, hide bulky composer, Zalo tabs
const LOGO_MARK = '<span class="tc-logo-mark">🚕</span>';

function injectStyles() {
  if (document.getElementById('tc-zalo-patch-styles')) return;
  const s = document.createElement('style');
  s.id = 'tc-zalo-patch-styles';
  s.textContent = `
#tc-community .tc-topbar{height:56px!important;grid-template-columns:40px 1fr auto!important;gap:8px!important;padding:6px 10px!important;align-items:center!important}
#tc-community .tc-back{width:36px!important;height:36px!important;font-size:20px!important;border-radius:11px!important}
#tc-community .tc-brand{min-width:0;overflow:hidden}
#tc-community .tc-brand small{font-size:8px!important;letter-spacing:1px!important;display:block;opacity:.75}
#tc-community .tc-brand h1{font-size:14px!important;line-height:1.2!important;margin:2px 0 0!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#tc-community .tc-account{min-height:0!important;height:36px!important;max-width:120px!important;padding:3px 6px 3px 3px!important;gap:5px!important;border-radius:999px!important}
#tc-community .tc-account strong{font-size:10px!important;max-width:72px;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#tc-community .tc-account small{font-size:8px!important;display:block;opacity:.75}
#tc-community .tc-account-dot{display:none!important}
#tc-community .tc-brand-row{display:flex;align-items:center;gap:8px;min-width:0}
#tc-community .tc-logo-mark{display:inline-flex;align-items:center;justify-content:center;border-radius:50%;background:radial-gradient(circle at 35% 30%,#2a1808,#0a1f12 70%);border:1.5px solid #d4af37;color:#f0d78c;font-weight:800;line-height:1;box-shadow:0 0 10px rgba(212,175,55,.25);width:32px;height:32px;font-size:14px;flex:0 0 32px}
#tc-community .tc-account .tc-logo-mark,#tc-community .tc-account img{width:28px!important;height:28px!important;border-radius:50%;object-fit:cover;flex:0 0 28px}
#tc-community .tc-main-tabs{display:flex;gap:6px;margin:0 0 10px;position:sticky;top:0;z-index:6;background:rgba(10,6,3,.94);padding:6px 0 8px;backdrop-filter:blur(8px)}
#tc-community .tc-main-tab{flex:1;border:1px solid rgba(212,175,55,.28);background:#140a04;color:#cbb888;border-radius:999px;padding:9px 6px;font-weight:800;font-size:12px;cursor:pointer}
#tc-community .tc-main-tab.active{background:linear-gradient(145deg,#a67c1a,#d4af37);color:#170c02;border-color:#c9a45a}
#tc-community .tc-composer,#tc-community .tc-welcome{display:none!important}
#tc-community .tc-companies-view{display:none!important}
#tc-community .tc-compose-mini{display:none;align-items:center;gap:10px;width:100%;margin:0 0 12px;border:1px solid rgba(212,175,55,.22);background:#140a04;border-radius:14px;padding:10px 12px;color:#cbb888;font-size:13px;cursor:pointer;text-align:left}
#tc-community .tc-compose-mini.show{display:flex}
#tc-community .tc-compose-mini .tc-logo-mark,#tc-community .tc-compose-mini img{width:34px;height:34px;border-radius:50%;flex:0 0 34px;object-fit:cover}
#tc-community .tc-compose-mini span{flex:1;opacity:.85}
#tc-community .tc-compose-mini b{flex:0 0 auto;background:linear-gradient(145deg,#a67c1a,#d4af37);color:#170c02;border-radius:999px;padding:7px 12px;font-size:11px;font-weight:800}
#tc-compose-sheet{position:fixed;inset:0;z-index:100080;background:rgba(0,0,0,.72);display:flex;align-items:flex-end;justify-content:center;padding:12px;backdrop-filter:blur(4px)}
#tc-compose-sheet .sheet{width:min(480px,100%);background:linear-gradient(180deg,#1a0e05,#0c0703);border:1px solid #c9a45a;border-radius:18px 18px 14px 14px;padding:16px;color:#f0e0a0}
#tc-compose-sheet h3{margin:0 0 12px;font-size:16px;color:#e8c56a;text-align:center}
#tc-compose-sheet textarea{width:100%;box-sizing:border-box;min-height:110px;border:1px solid #584216;border-radius:12px;background:#140a04;color:#fff;padding:12px;font-size:14px;resize:vertical}
#tc-compose-sheet .row{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
#tc-compose-sheet select{border:1px solid #584216;border-radius:11px;background:#140a04;color:#fff;padding:10px;font-size:13px}
#tc-compose-sheet .actions{display:grid;grid-template-columns:1fr 1.4fr;gap:8px;margin-top:12px}
#tc-compose-sheet button{border-radius:12px;padding:12px;font-weight:800;font-size:13px;cursor:pointer;border:1px solid #765b1b}
#tc-compose-sheet .cancel{background:#170b03;color:#d5c087}
#tc-compose-sheet .save{background:linear-gradient(145deg,#a67c1a,#d4af37);color:#170c02;border-color:#c9a45a}
#tc-community .tc-contacts-view{display:none}
#tc-community .tc-contacts-view.show{display:block}
#tc-community .tc-contacts-search{position:relative;margin:0 0 10px}
#tc-community .tc-contacts-search span{position:absolute;left:12px;top:50%;transform:translateY(-50%);opacity:.7}
#tc-community .tc-contacts-search input{width:100%;box-sizing:border-box;border:1px solid rgba(212,175,55,.28);background:#140a04;color:#f3e7c7;border-radius:14px;padding:11px 12px 11px 36px;font-size:13px;outline:none}
#tc-community .tc-contact-row{display:flex;align-items:center;gap:10px;width:100%;border:1px solid rgba(212,175,55,.12);background:#140a04;border-radius:14px;padding:10px;color:#f0e0a0;text-align:left;cursor:pointer;margin-bottom:6px}
#tc-community .tc-contact-av{width:44px;height:44px;flex:0 0 44px;border-radius:50%;overflow:hidden;border:1px solid rgba(212,175,55,.35);display:flex;align-items:center;justify-content:center;background:#21150e}
#tc-community .tc-contact-av img,#tc-community .tc-contact-av .tc-logo-mark{width:100%;height:100%;object-fit:cover;border:0;border-radius:50%}
#tc-community .tc-contact-main{min-width:0;flex:1}
#tc-community .tc-contact-main strong{display:block;font-size:13px}
#tc-community .tc-contact-main small{display:block;font-size:11px;color:#a8925c;margin-top:2px}
#tc-community .tc-contact-msg{font-size:11px;font-weight:700;color:#170c02;background:linear-gradient(145deg,#a67c1a,#d4af37);border-radius:999px;padding:6px 10px}
`;
  document.head.appendChild(s);
}

function esc(v=''){return String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');}
function panel(){return document.querySelector('#tc-community');}

function compactTopbar(){
  const p=panel(); if(!p) return;
  const brand=p.querySelector('.tc-brand');
  if(brand && !brand.querySelector('.tc-brand-row')){
    const h1=brand.querySelector('h1'); const small=brand.querySelector('small');
    const row=document.createElement('div'); row.className='tc-brand-row';
    row.innerHTML=LOGO_MARK;
    const text=document.createElement('div'); text.style.minWidth='0';
    if(small) text.appendChild(small);
    if(h1){ h1.textContent='Cộng Đồng Tài Xế'; text.appendChild(h1); }
    row.appendChild(text); brand.replaceChildren(row);
  }
  const acc=p.querySelector('.tc-account');
  if(acc){
    const u=window.firebaseServices?.auth?.currentUser;
    if(u && !u.isAnonymous){
      const name=String(u.displayName||'Tài xế').split(' ').slice(-2).join(' ').slice(0,12);
      const photo=u.photoURL
        ? `<img src="${esc(u.photoURL)}" alt="" referrerpolicy="no-referrer">`
        : LOGO_MARK;
      acc.innerHTML=`${photo}<div style="min-width:0"><strong>${esc(name)}</strong><small>Online</small></div>`;
      acc.classList.remove('guest');
    } else {
      acc.innerHTML=`${LOGO_MARK}<div style="min-width:0"><strong>Đăng nhập</strong></div>`;
      acc.classList.add('guest');
    }
  }
  p.querySelectorAll('.tc-avatar').forEach(av=>{
    const t=av.textContent.trim();
    if(!av.querySelector('img') && (t===''||t==='👤'||t.includes('👤'))) av.innerHTML=LOGO_MARK;
  });
}

function openComposeSheet(){
  if(document.getElementById('tc-compose-sheet')) return;
  const u=window.firebaseServices?.auth?.currentUser;
  if(!u||u.isAnonymous){ window.driverCommunity?.login?.(); return; }
  const companies=['Mai Linh','Vinasun','Xanh SM','Grab','Taxi Group','Lái xe công nghệ','Khác'];
  const types=['Bản tin','Cảnh báo đường phố','Tuyển dụng','Kinh nghiệm nghề','Khác'];
  const sheet=document.createElement('div'); sheet.id='tc-compose-sheet';
  sheet.innerHTML=`<div class="sheet" role="dialog"><h3>Đăng bài Cộng đồng</h3>
    <textarea id="tc-sheet-content" maxlength="2000" placeholder="Anh em đang có chuyện gì muốn chia sẻ?"></textarea>
    <div class="row"><select id="tc-sheet-company">${companies.map(c=>`<option>${esc(c)}</option>`).join('')}</select>
    <select id="tc-sheet-type">${types.map(c=>`<option>${esc(c)}</option>`).join('')}</select></div>
    <div class="actions"><button type="button" class="cancel" id="tc-sheet-cancel">Hủy</button>
    <button type="button" class="save" id="tc-sheet-save">Đăng bài</button></div></div>`;
  document.body.appendChild(sheet);
  sheet.querySelector('#tc-sheet-cancel').onclick=()=>sheet.remove();
  sheet.onclick=e=>{ if(e.target===sheet) sheet.remove(); };
  sheet.querySelector('#tc-sheet-save').onclick=()=>{
    const content=sheet.querySelector('#tc-sheet-content').value.trim(); if(!content) return;
    const form=panel()?.querySelector('#tc-post-form');
    if(form){ form.content.value=content; form.company.value=sheet.querySelector('#tc-sheet-company').value; form.postType.value=sheet.querySelector('#tc-sheet-type').value; form.requestSubmit?.()||form.dispatchEvent(new Event('submit',{cancelable:true,bubbles:true})); sheet.remove(); }
  };
}

function ensureComposeMini(){
  const p=panel(); if(!p) return;
  let mini=p.querySelector('.tc-compose-mini');
  if(!mini){
    mini=document.createElement('button'); mini.type='button'; mini.className='tc-compose-mini';
    const u=window.firebaseServices?.auth?.currentUser;
    const photo=u?.photoURL?`<img src="${esc(u.photoURL)}" alt="" referrerpolicy="no-referrer">`:LOGO_MARK;
    mini.innerHTML=`${photo}<span>Chia sẻ với anh em tài xế…</span><b>Đăng</b>`;
    mini.onclick=()=>openComposeSheet();
    const feed=p.querySelector('.tc-feed-view');
    const title=feed?.querySelector('.tc-section-title');
    if(title) title.insertAdjacentElement('beforebegin', mini); else feed?.prepend(mini);
  }
  const onFeed=!p.querySelector('.tc-feed-view')?.classList.contains('hidden');
  mini.classList.toggle('show', onFeed);
}

let contactsCache=[], unsubContacts=null, contactsSearch='';
function renderContacts(){
  const p=panel(); if(!p) return;
  const list=p.querySelector('#tc-zalo-contacts-list'); const countEl=p.querySelector('#tc-zalo-contacts-count');
  if(!list) return;
  const q=contactsSearch.trim().toLowerCase();
  const uid=window.firebaseServices?.auth?.currentUser?.uid;
  const rows=contactsCache.filter(d=>{
    if(!q) return true;
    return String(d.displayName||'').toLowerCase().includes(q)||String(d.company||'').toLowerCase().includes(q)||String(d.plate||'').toLowerCase().includes(q);
  });
  if(countEl) countEl.textContent=rows.length+' tài xế';
  if(!rows.length){ list.innerHTML=`<div class="tc-empty"><div>📒</div><strong>${q?'Không tìm thấy':'Chưa có ai trong danh bạ'}</strong></div>`; return; }
  list.innerHTML=rows.map(d=>{
    const isMe=uid&&d.uid===uid;
    const avatar=d.photoURL?`<img src="${esc(d.photoURL)}" alt="" referrerpolicy="no-referrer">`:LOGO_MARK;
    const meta=[d.company||'Khác',d.plate||''].filter(Boolean).join(' · ');
    return `<button type="button" class="tc-contact-row" data-uid="${esc(d.uid)}" data-name="${esc(d.displayName||'Tài xế')}" data-photo="${esc(d.photoURL||'')}" ${isMe?'disabled':''}>
      <div class="tc-contact-av">${avatar}</div><div class="tc-contact-main"><strong>${esc(d.displayName||'Tài xế')}${isMe?' (Bạn)':''}</strong><small>${esc(meta)}</small></div>
      ${isMe?'':'<span class="tc-contact-msg">Nhắn tin</span>'}</button>`;
  }).join('');
  list.querySelectorAll('.tc-contact-row[data-uid]:not([disabled])').forEach(b=>{
    b.onclick=()=>{ p.querySelector('.tc-main-tab[data-tab="chat"]')?.click(); };
  });
}
async function subscribeContacts(){
  if(unsubContacts) return;
  try{
    const mod=await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
    const db=window.firebaseServices?.db; if(!db) return;
    unsubContacts=mod.onSnapshot(mod.query(mod.collection(db,'driver_directory'), mod.limit(200)), snap=>{
      contactsCache=snap.docs.map(d=>({uid:d.id,...d.data()}));
      contactsCache.sort((a,b)=>String(a.displayName||'').localeCompare(String(b.displayName||''),'vi'));
      renderContacts();
    });
  }catch(e){ console.error('[Community]',e); }
}

function setZaloTab(tab){
  const p=panel(); if(!p) return;
  p.querySelectorAll('.tc-main-tab').forEach(b=>b.classList.toggle('active', b.dataset.tab===tab));
  p.querySelector('.tc-feed-view')?.classList.toggle('hidden', tab!=='feed');
  p.querySelector('.tc-chat-view')?.classList.toggle('hidden', tab!=='chat');
  p.querySelector('.tc-companies-view')?.classList.add('hidden');
  p.querySelector('.tc-contacts-view')?.classList.toggle('show', tab==='contacts');
  p.querySelector('.tc-app')?.classList.toggle('tc-chat-only', tab==='chat');
  ensureComposeMini(); compactTopbar();
  if(tab==='contacts'){ subscribeContacts(); renderContacts(); }
  if(tab==='chat'){ try{ window.dispatchEvent(new CustomEvent('tc-open-chat-tab')); }catch(_){} }
}

function rebuildTabs(){
  const p=panel(); if(!p) return false;
  injectStyles();
  const nav=p.querySelector('.tc-main-tabs'); if(!nav) return false;
  nav.innerHTML=`<button class="tc-main-tab" data-tab="chat" type="button">💬 Tin nhắn</button>
    <button class="tc-main-tab active" data-tab="feed" type="button">📰 Bảng tin</button>
    <button class="tc-main-tab" data-tab="contacts" type="button">📒 Danh bạ</button>`;
  nav.querySelectorAll('.tc-main-tab').forEach(b=>{ b.onclick=e=>{ e.preventDefault(); e.stopPropagation(); setZaloTab(b.dataset.tab); }; });
  if(!p.querySelector('.tc-contacts-view')){
    const contacts=document.createElement('section'); contacts.className='tc-contacts-view';
    contacts.innerHTML=`<div class="tc-section-title"><div><h3>📒 Danh bạ tài xế</h3><span id="tc-zalo-contacts-count">0 tài xế</span></div></div>
      <div class="tc-contacts-search"><span>🔍</span><input type="search" id="tc-zalo-contacts-q" placeholder="Tìm tên hoặc hãng xe…" autocomplete="off"></div>
      <div id="tc-zalo-contacts-list"></div>`;
    p.querySelector('.tc-content')?.appendChild(contacts);
    contacts.querySelector('#tc-zalo-contacts-q')?.addEventListener('input',e=>{ contactsSearch=e.target.value||''; renderContacts(); });
  }
  compactTopbar(); ensureComposeMini(); setZaloTab('feed');
  setTimeout(compactTopbar, 400); setTimeout(compactTopbar, 1200);
  return true;
}

function hookOpen(){
  const dc=window.driverCommunity; if(!dc||dc.__zaloPatched) return !!dc;
  const orig=dc.open?.bind(dc); if(typeof orig!=='function') return false;
  dc.open=function(){ const r=orig(); let n=0; const t=setInterval(()=>{ if(rebuildTabs()||++n>40) clearInterval(t); },100); return r; };
  dc.__zaloPatched=true; return true;
}
function boot(){
  injectStyles();
  if(!hookOpen()){ let n=0; const t=setInterval(()=>{ if(hookOpen()||++n>50) clearInterval(t); },100); }
  if(panel()) rebuildTabs();
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot); else boot();
window.addEventListener('firebase-ready', boot);
window.addEventListener('firebase-auth-changed', ()=>{ if(panel()){ compactTopbar(); ensureComposeMini(); } });
