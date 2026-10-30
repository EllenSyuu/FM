// The offline shell must list every module the page loads, and nothing that does not exist.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const sw = readFileSync(new URL('sw.js', root), 'utf8');
const shell = [...sw.matchAll(/^\s+'([^']+)',$/gm)].map(m => m[1]);

test('every shell file exists', () => {
  for (const f of shell) if (f !== './') assert.ok(existsSync(new URL(f, root)), `missing ${f}`);
});

test('every script and lesson file is cached for offline use', () => {
  for (const dir of ['js', 'data']) for (const f of readdirSync(new URL(`${dir}/`, root))) if (f.endsWith('.js')) assert.ok(shell.includes(`${dir}/${f}`), `${dir}/${f} not in sw.js`);
});

test('manifest icons exist', () => {
  const m = JSON.parse(readFileSync(new URL('manifest.webmanifest', root), 'utf8'));
  for (const i of m.icons) assert.ok(existsSync(new URL(i.src, root)), i.src);
});
