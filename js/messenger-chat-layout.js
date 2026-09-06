// Tổ Nghề Taxi Việt Nam — chat tab layout
// Keeps Bản tin + Hãng xe unchanged. In chat mode, removes the community hero/post composer
// and leaves a dedicated Zalo-inspired inbox supplied by messenger-inbox-v3.js.
(function () {
  const STYLE_ID = 'tc-chat-only-layout';

  function installStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #tc-community .tc-app.tc-chat-only .tc-welcome,
      #tc-community .tc-app.tc-chat-only .tc-composer { display:none !important; }
      #tc-community .tc-app.tc-chat-only .tc-content { padding-top: 10px; }
      #tc-community .tc-app.tc-chat-only .tc-chat-view {
        height: calc(100vh - 120px);
        min-height: 0;
        margin-top: 2px;
        border-radius: 16px;
      }
      #tc-community .tc-app.tc-chat-only .tc-chat-header { display:none !important; }
      #tc-community .tc-app.tc-chat-only .tc-chat-body { min-height:0; }
      @media (max-width:520px) {
        #tc-community .tc-app.tc-chat-only .tc-content { padding: 8px 8px 24px; }
        #tc-community .tc-app.tc-chat-only .tc-chat-view { height: calc(100vh - 112px); }
      }
    `;
    document.head.appendChild(style);
  }

  function isChatActive(view) {
    return !!view && !view.classList.contains('hidden');
  }

  function apply() {
    const root = document.querySelector('#tc-community .tc-app');
    const view = document.querySelector('#tc-community .tc-chat-view');
    if (!root || !view) return;
    installStyles();
    const active = isChatActive(view);
    root.classList.toggle('tc-chat-only', active);

    // If an older messenger renderer has repopulated the body, release v3's
    // mount guard so its inbox renderer can take ownership again.
    if (active) {
      const body = view.querySelector('.tc-chat-body');
      if (body && /Trò chuyện riêng|Tin nhắn riêng tư|Chưa có cuộc trò chuyện/.test(body.textContent || '')) {
        if (body.dataset.m3Mounted === '1') delete body.dataset.m3Mounted;
        body.appendChild(document.createComment('messenger-v3-repatch'));
      }
    }
  }

  function boot() {
    installStyles();
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    [100, 300, 700, 1200, 2000].forEach(ms => setTimeout(apply, ms));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();
