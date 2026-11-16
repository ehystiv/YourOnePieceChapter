// Rigenera chapters.json dalla One Piece Wiki (Fandom, MediaWiki API).
// Uso: node scripts/update-chapters.mjs [output.json]   (Node 18+, fetch nativo; default: public/chapters.json)
//
// Fonti:
//  - Date: Template:WhichMangaDate, uno #switch con righe "|Chapter N=MM/DD/YYYY".
//  - Titoli: sezione 0 di ogni pagina "Chapter_N", template {{Chapter Box}} con i campi "title" e "jname".
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const API = 'https://onepiece.fandom.com/api.php';
const OUT = process.argv[2] ?? fileURLToPath(new URL('../public/chapters.json', import.meta.url));
const UA = { 'User-Agent': 'onepiece-birthday-chapter/1.0 (personal project)' };

async function api(params) {
  const url = API + '?' + new URLSearchParams({ format: 'json', formatversion: '2', ...params });
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

const cleanRuby = s => (s ?? '').replace(/\{\{Ruby\|([^|}]*)\|[^}]*\}\}/g, '$1').trim();

// 1) Date
const tpl = await api({ action: 'query', prop: 'revisions', rvprop: 'content', rvslots: 'main', titles: 'Template:WhichMangaDate' });
const wikitext = tpl.query.pages[0].revisions[0].slots.main.content;
const dates = new Map();
for (const m of wikitext.matchAll(/\|\s*Chapter (\d+)\s*=\s*(\d\d)\/(\d\d)\/(\d{4})/g)) {
  const n = Number(m[1]);
  if (n >= 1 && !dates.has(n)) dates.set(n, `${m[4]}-${m[2]}-${m[3]}`);
}
const max = Math.max(...dates.keys());
for (let n = 1; n <= max; n++) if (!dates.has(n)) console.warn('Data mancante per il capitolo', n);

// 2) Titoli, 50 pagine per richiesta (limite API)
const titles = new Map();
for (let s = 1; s <= max; s += 50) {
  const names = [];
  for (let n = s; n < s + 50 && n <= max; n++) names.push('Chapter_' + n);
  const r = await api({ action: 'query', prop: 'revisions', rvprop: 'content', rvslots: 'main', rvsection: '0', titles: names.join('|') });
  for (const p of r.query.pages) {
    if (!p.revisions) continue;
    const c = p.revisions[0].slots.main.content;
    const field = k => { const m = c.match(new RegExp('^\\|\\s*' + k + '\\s*=\\s*(.*)$', 'm')); return m ? cleanRuby(m[1]) : ''; };
    const n = Number(p.title.split(' ')[1]);
    const en = field('title'), ja = field('jname');
    titles.set(n, { en: en && !en.startsWith('|') ? en : null, ja: ja && ja !== 'TBA' ? ja : null });
  }
  await new Promise(r => setTimeout(r, 300)); // gentile con il server
}

const chapters = [];
for (let n = 1; n <= max; n++) {
  if (!dates.has(n)) continue;
  chapters.push({ chapter: n, releaseDate: dates.get(n), titleEn: titles.get(n)?.en ?? null, titleJa: titles.get(n)?.ja ?? null });
}

await writeFile(OUT, JSON.stringify({
  source: 'One Piece Wiki (onepiece.fandom.com) - Template:WhichMangaDate + Template:Chapter Box',
  generatedAt: new Date().toISOString().slice(0, 10),
  dateMeaning: 'Data di uscita giapponese (Weekly Shonen Jump)',
  chapters,
}, null, 1));
console.log(`Scritti ${chapters.length} capitoli in ${OUT} (ultimo: ${max}, ${dates.get(max)})`);
