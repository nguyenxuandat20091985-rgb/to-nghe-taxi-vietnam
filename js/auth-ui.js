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
  `;
  // NOTE: truncated intentionally for test
};
