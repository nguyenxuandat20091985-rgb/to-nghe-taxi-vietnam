// Canonical production URL: Vercel is the single public application origin.
if (window.location.hostname.endsWith('.github.io')) {
  const githubPrefix = '/to-nghe-taxi-vietnam';
  const remainingPath = window.location.pathname.startsWith(githubPrefix) ? window.location.pathname.slice(githubPrefix.length) : '';
  window.location.replace(`https://to-nghe-taxi.vercel.app${remainingPath}${window.location.search}${window.location.hash}`);
}

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, onAuthStateChanged, setPersistence, browserLocalPersistence, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
// === App Check Import ===
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-check.js';

import firebaseConfig from './firebase-config.js';
import {
  mountAuthStatus as mountAuthStatusUI,
  applyGoogleProfileToUI,
  closeOnboarding,
  maybeShowOnboarding,
  showLoginGate,
  hideLoginGate,
} from './auth-ui.js';

function statePayload(state) { return { incenseCount:Number(state.incenseCount||0), lastIncense:String(state.lastIncense||'Chưa có').slice(0,80), prayers:Array.isArray(state.prayers)?state.prayers.slice(0,10):[], meritPoints:Number(state.meritPoints||0), userName:String(state.userName||'').slice(0,80), joinDate:String(state.joinDate||'').slice(0,20), queDrawnDate:String(state.queDrawnDate||'').slice(0,40), likedPosts:Array.isArray(state.likedPosts)?state.likedPosts.slice(0,100):[] }; }
function waitForAuth(auth) { return new Promise((resolve,reject)=>{ let done=false; const off=onAuthStateChanged(auth,u=>{if(done)return;done=true;off();resolve(u||null)},e=>{if(done)return;done=true;off();reject(e)}); }); }
function mountLoginButton() {
  const heading=document.querySelector('#page-community .glass-card h3');
  if(!heading||heading.querySelector('.community-home-login'))return;
  const b=document.createElement('button');
  b.type='button'; b.className='community-home-login'; b.textContent='Đăng nhập Google'; b.setAttribute('aria-label','Đăng nhập Google');
  Object.assign(b.style,{flex:'0 0 auto',border:'1px solid #c9a45a',borderRadius:'10px',background:'linear-gradient(145deg,#a67c1a,#d4af37,#e8c56a)',color:'#170c02',fontWeight:'800',padding:'9px 12px',whiteSpace:'nowrap',cursor:'pointer'});
  b.onclick=e=>{e.preventDefault();e.stopPropagation();window.firebaseBridge?.googleLogin?.().catch(err=>{console.error('[Google Auth]',err);alert('Đăng nhập Google chưa thành công. Vui lòng thử lại.');});};
  heading.style.display='flex'; heading.style.alignItems='center'; heading.style.justifyContent='space-between'; heading.style.gap='10px'; heading.appendChild(b);
}
function scheduleLogin(){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountLoginButton,{once:true});else mountLoginButton();}
function mountAuthStatus(user) {
  mountAuthStatusUI(user);
}
async function init(){
  try{
    const app=initializeApp(firebaseConfig);
    
    // === App Check Initialization ===
    // Local development only: Firebase App Check debug mode.
    // This is intentionally enabled ONLY on localhost/127.0.0.1.
    // Production domains always use reCAPTCHA Enterprise attestation.
    const isLocalAppCheckDebug = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    if (isLocalAppCheckDebug) {
      // Firebase SDK prints the generated debug token to the console. On mobile
      // browsers DevTools may be unavailable, so temporarily mirror that UUID
      // into a native prompt. This hook exists ONLY on localhost and restores
      // the original console methods after the token is captured.
      self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;

      const debugTokenPattern = /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;
      const consoleMethods = ['log', 'info', 'warn', 'error'];
      const originalConsoleMethods = {};
      let debugTokenCaptured = false;

      const restoreDebugConsoleHooks = () => {
        consoleMethods.forEach((method) => {
          if (originalConsoleMethods[method]) console[method] = originalConsoleMethods[method];
        });
      };

      consoleMethods.forEach((method) => {
        originalConsoleMethods[method] = console[method].bind(console);
        console[method] = (...args) => {
          originalConsoleMethods[method](...args);
          if (debugTokenCaptured) return;

          const message = args.map((value) => {
            try { return typeof value === 'string' ? value : JSON.stringify(value); }
            catch (_) { return String(value); }
          }).join(' ');

          const match = message.match(debugTokenPattern);
          if (match) {
            debugTokenCaptured = true;
            restoreDebugConsoleHooks();
            setTimeout(() => {
              const token = match[0];
              window.prompt(
                'App Check Debug Token\\n\\nHãy COPY mã này rồi dán vào Firebase Console → Manage debug tokens:',
                token
              );
            }, 0);
          }
        };
      });

      console.info('[App Check] Local debug mode enabled. Firebase will show the generated debug token here and in a mobile copy prompt.');
    }

    const appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider('6Lchn7wtAAAAAAmVllVXpXOAWdUvT5ewTTAeBRMG'),
      isTokenAutoRefreshEnabled: true
    });

    const auth=getAuth(app),db=getFirestore(app);
    await setPersistence(auth,browserLocalPersistence);
    window.firebaseServices={app,auth,db};
    window.firebaseBridge={
      get uid(){return auth.currentUser?.uid||null},
      get currentUser(){return auth.currentUser||null},
      async googleLogin(){
        const provider=new GoogleAuthProvider(); provider.setCustomParameters({prompt:'select_account'});
        try{const r=await signInWithPopup(auth,provider);return r.user}catch(e){
          if(['auth/popup-blocked','auth/operation-not-supported-in-this-environment','auth/internal-error'].includes(e?.code)){await signInWithRedirect(auth,provider);return null}
          throw e;
        }
      },
      async logout(){closeOnboarding();return signOut(auth)},
      async ensureUser(){const u=auth.currentUser;if(!u||u.isAnonymous)throw new Error('GOOGLE_LOGIN_REQUIRED');return u},
      async loadUserState(){const u=await this.ensureUser(),s=await getDoc(doc(db,'users',u.uid));return s.exists()?s.data().appState||null:null},
      async saveUserState(state){const u=await this.ensureUser();await setDoc(doc(db,'users',u.uid),{displayName:u.displayName||'',photoURL:u.photoURL||'',email:u.email||'',appState:statePayload(state),updatedAt:serverTimestamp()},{merge:true})},
      async saveDriverProfile({ company, plate } = {}) {
        const u = await this.ensureUser();
        const payload = {
          displayName: u.displayName || '',
          photoURL: u.photoURL || '',
          email: u.email || '',
          company: String(company || 'Khác').slice(0, 80),
          plate: String(plate || '').slice(0, 20),
          updatedAt: serverTimestamp(),
        };
        await setDoc(doc(db, 'users', u.uid), payload, { merge: true });
        try {
          await setDoc(doc(db, 'driver_directory', u.uid), {
            uid: u.uid,
            displayName: payload.displayName || 'Tài xế',
            photoURL: payload.photoURL || '',
            company: payload.company,
            plate: payload.plate,
            updatedAt: serverTimestamp(),
          }, { merge: true });
        } catch (e) { console.warn('[Auth] driver_directory', e); }
        return payload;
      },
      closeOnboarding,
    };
    await import('./community.js');
    await import('./community-zalo-tabs.js');
    await import('./messenger-inbox-v3.js');
    await import('./messenger-chat-layout.js');
    await import('./messenger-contacts.js');
    scheduleLogin();
    const rr=await getRedirectResult(auth).catch(e=>{console.error('[Firebase] redirect',e);return null});
    if(rr?.user)window.dispatchEvent(new CustomEvent('google-auth-complete',{detail:rr.user}));
    onAuthStateChanged(auth,async u=>{
      mountAuthStatus(u||null);
      // Bắt buộc đăng nhập Google mới được vào app
      if (u && !u.isAnonymous) {
        hideLoginGate();
        try{await setDoc(doc(db,'users',u.uid),{displayName:u.displayName||'',photoURL:u.photoURL||'',email:u.email||'',updatedAt:serverTimestamp()},{merge:true});}catch(e){console.error('[Firebase] user profile sync',e);}
        await maybeShowOnboarding(db, u, getDoc, doc);
      } else {
        showLoginGate();
        const meta = document.getElementById('profileDriverMeta');
        if (meta) meta.style.display = 'none';
        const avatarEl = document.querySelector('#page-profile .profile-avatar');
        if (avatarEl && avatarEl.querySelector('img')) avatarEl.innerHTML = '🚖';
      }
      window.dispatchEvent(new CustomEvent('firebase-auth-changed',{detail:u||null}));
    });
    window.dispatchEvent(new CustomEvent('firebase-ready'));
    // Hiện gate ngay nếu chưa login (tránh nháy app)
    if (!auth.currentUser || auth.currentUser.isAnonymous) {
      showLoginGate();
    } else {
      hideLoginGate();
    }
    mountAuthStatus(auth.currentUser||null);
  }catch(e){console.error('[Firebase] initialization failed',e);scheduleLogin();mountAuthStatus(null);showLoginGate();window.dispatchEvent(new CustomEvent('firebase-error',{detail:e}));}
}
init();
const NEWS_AI_URL='https://nguyenxuandat20091985-rgb.github.io/my-ai-bot/';
function installCommunityRoute(){if(typeof window.showPage!=='function')return false;if(window.showPage.__communityRoutePatched)return true;const original=window.showPage,pageMap=['home','incense','prayer','que','calendar','news','community','merit','profile','exorcism','ai'];window.showPage=function(pageId){if(pageId==='news'){window.location.assign(NEWS_AI_URL);return}if(pageId==='community'){document.querySelectorAll('.page').forEach(p=>p.classList.remove('active','page-zoom'));document.querySelectorAll('.menu-item').forEach(m=>m.classList.remove('active'));const items=document.querySelectorAll('.menu-item'),i=pageMap.indexOf('community');if(i>=0&&items[i])items[i].classList.add('active');const open=()=>window.driverCommunity?.open?.();if(!open()){let n=0;const t=setInterval(()=>{if(open()||++n>=50)clearInterval(t)},100)}return}return original(pageId)};window.showPage.__communityRoutePatched=true;return true}
if(!installCommunityRoute())document.addEventListener('DOMContentLoaded',()=>{let n=0;const t=setInterval(()=>{if(installCommunityRoute()||++n>=50)clearInterval(t)},100)},{once:true});
