/*
 * Sync between devices through a private (secret) GitHub Gist in your own account.
 *
 * No server of ours is involved: the browser talks to api.github.com directly with a
 * fine-grained personal access token that can only read and write Gists. The token and the
 * gist id are kept in this browser only (they are not part of the synced progress).
 *
 * When: on start, when the app comes back to the foreground, a few seconds after any
 * change, when the network comes back, every few minutes while open, and when the app goes
 * to the background. Every sync is pull → merge → push, so the order in which devices
 * study and sync does not matter (see merge.js).
 */
import { mergeState, syncable, fingerprint } from './merge.js';

const API = 'https://api.github.com';
const CONF = 'fm-notebook:sync';
const FILE = 'fm-notebook-progress.json';
const DESC = 'FM Notebook — progress sync (private)';

let ctx = null; // { state: () => S, apply(merged), onStatus(status) }
let timer = 0;
let running = null;
let again = false;
let status = { state: 'off', at: null, error: '' };

export const config = () => {
  try {
    return JSON.parse(localStorage.getItem(CONF) || 'null');
  } catch (e) {
    return null;
  }
};
const saveConfig = c => {
  try {
    if (c) localStorage.setItem(CONF, JSON.stringify(c));
    else localStorage.removeItem(CONF);
  } catch (e) {
    /* ignore */
  }
};

export const getStatus = () => status;
function setStatus(state, extra = {}) {
  status = { ...status, state, ...extra };
  if (ctx && ctx.onStatus) ctx.onStatus(status);
}

async function gh(path, token, { method = 'GET', body, keepalive = false } = {}) {
  const r = await fetch(`${API}${path}`, {
    method,
    keepalive,
    cache: 'no-store',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (r.status === 401 || r.status === 403) {
    const e = new Error(r.status === 401 ? '令牌无效或已过期' : '令牌没有 Gists 读写权限');
    e.auth = true;
    throw e;
  }
  if (!r.ok) throw new Error(`GitHub ${r.status}`);
  return r.status === 204 ? null : r.json();
}

/* Find this app's gist in the account, or create it. Same token on every device → same gist. */
export async function connect(token) {
  token = token.trim();
  setStatus('syncing');
  try {
    let gist = null;
    for (let page = 1; page <= 5 && !gist; page++) {
      const list = await gh(`/gists?per_page=100&page=${page}`, token);
      gist = list.find(g => g.files && g.files[FILE]);
      if (list.length < 100) break;
    }
    if (!gist) {
      gist = await gh('/gists', token, {
        method: 'POST',
        body: { description: DESC, public: false, files: { [FILE]: { content: JSON.stringify(syncable(ctx.state())) } } },
      });
    }
    saveConfig({ token, gistId: gist.id });
    await syncNow();
    return true;
  } catch (e) {
    setStatus('error', { error: e.message });
    throw e;
  }
}

export function disconnect() {
  saveConfig(null);
  clearTimeout(timer);
  setStatus('off', { at: null, error: '' });
}

async function pull(c) {
  const g = await gh(`/gists/${c.gistId}`, c.token);
  const f = g.files && g.files[FILE];
  if (!f) return null;
  let text = f.content;
  if (f.truncated && f.raw_url) text = await (await fetch(f.raw_url, { cache: 'no-store' })).text();
  try {
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
}

export async function syncNow({ keepalive = false } = {}) {
  const c = config();
  if (!c || !ctx) return;
  if (running) {
    again = true;
    return running;
  }
  running = (async () => {
    setStatus('syncing');
    try {
      const remote = await pull(c);
      const local = ctx.state();
      const merged = remote ? mergeState(local, remote) : local;
      if (fingerprint(merged) !== fingerprint(local)) ctx.apply(merged);
      if (!remote || fingerprint(merged) !== fingerprint(remote)) {
        await gh(`/gists/${c.gistId}`, c.token, {
          method: 'PATCH',
          keepalive,
          body: { files: { [FILE]: { content: JSON.stringify(syncable(merged)) } } },
        });
      }
      setStatus('ok', { at: Date.now(), error: '' });
    } catch (e) {
      setStatus(e.auth ? 'auth' : navigator.onLine === false ? 'offline' : 'error', { error: e.message });
    } finally {
      running = null;
      if (again) {
        again = false;
        schedule(1500);
      }
    }
  })();
  return running;
}

/* Called after every local change. */
export function schedule(ms = 5000) {
  if (!config()) return;
  clearTimeout(timer);
  timer = setTimeout(() => syncNow(), ms);
}

export function initSync(c) {
  ctx = c;
  if (config()) syncNow();
  else setStatus('off');
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') syncNow({ keepalive: true });
    else syncNow();
  });
  window.addEventListener('online', () => syncNow());
  window.addEventListener('pageshow', e => e.persisted && syncNow());
  setInterval(() => document.visibilityState === 'visible' && syncNow(), 4 * 60 * 1000);
}
