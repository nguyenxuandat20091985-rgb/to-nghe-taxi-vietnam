// Tổ Nghề Taxi Việt Nam — dedicated chat-tab layout.
// Presentation/lifecycle only. Messenger v4 owns chat interactions.
// No MutationObserver: community chat is a highly interactive DOM. Observing
// mutations here can cause render feedback loops and freeze mobile browsers.
(function () {
  const STYLE_ID = 'tc-chat-only-layout-v6';
  let booted = false;
  let scheduled = false;

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

  function applyLayout() {
    const root = document.querySelector('#tc-community .tc-app');
    const view = document.querySelector('#tc-community .tc-chat-view');
    if (!root || !view) return;
    const active = !view.classList.contains('hidden');
    root.classList.toggle('tc-chat-only', active);
    if (active) window.driverMessengerV3?.mount?.();
  }

  function scheduleApply() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      applyLayout();
    });
  }

  function interceptPostMessage(e) {
    const btn = e.target.closest?.('#tc-community [data-message-user]');
    if (!btn || !window.driverMessengerV3?.openPrivate) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    window.driverMessengerV3.activateChatTab?.();
    window.driverMessengerV3.openPrivate({
      uid: btn.dataset.messageUser,
      name: btn.dataset.messageName,
      photo: btn.dataset.messagePhoto
    });
  }

  function handleCommunityTabClick(e) {
    const target = e.target.closest?.('#tc-community button');
    if (!target) return;
    const text = (target.textContent || '').trim().toLowerCase();
    if (text.includes('trò chuyện')) scheduleApply();
  }

  function onCommunityChatActivated() {
    scheduleApply();
  }

  function boot() {
    if (booted) return;
    booted = true;
    installStyles();
    document.addEventListener('click', interceptPostMessage, true);
    document.addEventListener('click', handleCommunityTabClick, false);
    window.addEventListener('community-chat-activated', onCommunityChatActivated);
    applyLayout();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
