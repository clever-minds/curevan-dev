// Scans src/ for '/dashboard/...' strings and reports any without a matching page.tsx.
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const SRC = 'src';
const APP = join(SRC, 'app');

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}

// every page route as segments; [param] / [...rest] match anything
const norm = (f) => f.split(String.fromCharCode(92)).join('/');
const pages = walk(APP).map(norm).filter((f) => f.endsWith('/page.tsx'))
  .map((f) => f.slice(norm(APP).length + 1, -'/page.tsx'.length).split('/').filter((s) => s && !(s.startsWith('(') && s.endsWith(')'))));

const matches = (segs) => pages.some((p) =>
  (p.length === segs.length || (p.length && /^\[\.\.\./.test(p[p.length - 1]) && segs.length >= p.length)) &&
  p.every((s, i) => /^\[/.test(s) || s === segs[i]));

const re = /['"`](\/dashboard(?:\/[A-Za-z0-9_\-\[\]${}.]*)*)/g;
const missing = new Map();
for (const f of walk(SRC).filter((f) => /\.(tsx?|jsx?)$/.test(f))) {
  const text = readFileSync(f, 'utf8');
  for (const m of text.matchAll(re)) {
    const path = m[1].split('?')[0].replace(/\/$/, '');
    // anything with a template part counts as a dynamic segment
    const segs = path.split('/').filter(Boolean).map((s) => (s.includes('${') ? '[x]' : s));
    if (!matches(segs)) { (missing.get(path) ?? missing.set(path, new Set()).get(path)).add(norm(f)); }
  }
}
for (const [p, files] of missing) console.log(`MISSING ${p}  <- ${[...files].slice(0, 3).join(', ')}`);
console.log(`${pages.length} pages, ${missing.size} missing link targets`);
process.exit(missing.size ? 1 : 0);
