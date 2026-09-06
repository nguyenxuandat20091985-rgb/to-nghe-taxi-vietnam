// Tổ Nghề Taxi Việt Nam — dedicated chat-tab layout.
// Presentation/lifecycle only. Messenger v4 owns chat interactions.
// IMPORTANT: do not observe class attributes here. The community tab itself
// toggles `hidden` / `tc-chat-only`; watching those attributes and then
// changing them again can create a hot MutationObserver loop on mobile.
(function () {
  const STYLE_ID = 'tc-chat-only-layout-v5';
  let booted = false;

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
    installStyles();
    const root = document.querySelector('#tc-community .tc-app');
    const view = document.querySelector('#tc-community .tc-chat-view');
    if (!root || !view) return;
    const active = !view.classList.contains('hidden');
    // classList.toggle with a stable boolean is safe; unlike the old
    // class-attribute MutationObserver, this function is never recursively
    // triggered by its own mutation.
    root.classList.toggle('tc-chat-only', active);
    if (active) window.driverMessengerV3?.mount?.();
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

  function onCommunityChatActivated() {
    // Defer one frame so the community renderer has finished toggling the chat
    // view before Messenger mounts. This avoids competing DOM writes.
    requestAnimationFrame(applyLayout);
  }

  function boot() {
    if (booted) return;
    booted = true;
    installStyles();
    document.addEventListener('click', interceptPostMessage, true);
    window.addEventListener('community-chat-activated', onCommunityChatActivated);

    // Only observe DOM insertion/removal, never class/attribute changes.
    // This lets us detect the Community panel being created without a loop.
    const observer = new MutationObserver(() => applyLayout());
    observer.observe(document.body, { childList: true, subtree: true });
    applyLayout();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
