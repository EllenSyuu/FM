/*
 * Installable app (PWA): registers the service worker for offline use and handles the
 * browser's install prompt where one exists (Android Chrome, desktop Chrome / Edge).
 * iOS has no prompt; the settings page explains "Add to Home Screen" instead.
 */
let deferred = null;
let onChange = () => {};

export const installState = () => ({
  standalone:
    window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true,
  canPrompt: !!deferred,
});

export async function promptInstall() {
  if (!deferred) return false;
  deferred.prompt();
  const choice = await deferred.userChoice.catch(() => null);
  deferred = null;
  return !!choice && choice.outcome === 'accepted';
}

export function initPwa(opts = {}) {
  onChange = opts.onChange || onChange;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferred = e;
    onChange();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    onChange();
  });
  const secure = location.protocol === 'https:' || location.hostname === 'localhost';
  if ('serviceWorker' in navigator && secure) navigator.serviceWorker.register('sw.js').catch(() => {});
  document.documentElement.classList.toggle('standalone', installState().standalone);
}
