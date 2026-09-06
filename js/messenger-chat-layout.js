// Tổ Nghề Taxi Việt Nam — dedicated chat-tab layout.
// Presentation/lifecycle only. Messenger v4 owns all chat interactions.
(function () {
  const STYLE_ID = 'tc-chat-only-layout-v4';
  function installStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #tc-community .tc-app.tc-chat-only .tc-welcome,
      #tc-community .tc-app.tc-chat-only .tc-composer { display:none !important; }
      #tc-community .tc-app.tc-chat-only .tc-content { padding-top:8px; }
      #tc-community .tc-app.tc-chat-only .tc-chat-view { height:calc(100vh - 112px); min-height:0; margin-top:0; border-radius:16px; }
      #tc-community .tc-app.tc-chat-only .tc-chat-header { display:none !important; }
      #tc-community .tc-app.tc-chat-only .tc-chat-body { min-height:0; height:100%; }
      @media (max-width:520px) {
        #tc-community .tc-app.tc-chat-only .tc-content { padding:6px 8px 20px; }
        #tc-community .tc-app.tc-chat-only .tc-chat-view { height:calc(100vh - 106px); }
      }
    `;
    document.head.appendChild(style);
  }
  function apply() {
    installStyles();
    const root = document.querySelector('#tc-community .tc-app');
    const view = document.querySelector('#tc-community .tc-chat-view');
    if (!root || !view) return;
    const active = !view.classList.contains('hidden');
    root.classList.toggle('tc-chat-only', active);
    if (active) window.driverMessengerV3?.mount?.();
  }
  function boot() {
    installStyles();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:['class'] });
    apply();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();
