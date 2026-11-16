// Aggiorna chapters.json dalla One Piece Wiki (Fandom, MediaWiki API).
// Uso: node scripts/update-chapters.mjs [output.json] [--all-titles]
//      (Node 18+, fetch nativo; default: public/chapters.json)
//
// Fonti:
//  - Date: Template:WhichMangaDate, uno #switch con righe "|Chapter N=MM/DD/YYYY". Vengono sempre riprese tutte.
//  - Titoli: sezione 0 di ogni pagina "Chapter_N", template {{Chapter Box}} con i campi "title" e "jname".
//    I titoli già presenti nel file vengono mantenuti (quelli di 1–1145 vengono da una traduzione curata):
//    dalla wiki si scaricano solo quelli mancanti. Con --all-titles si riscaricano tutti.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { cleanTitle, hasMarkup } from './clean-title.mjs';

const args = process.argv.slice(2);
const ALL_TITLES = args.includes('--all-titles');
const OUT = args.find(a => !a.startsWith('--')) ?? fileURLToPath(new URL('../public/chapters.json', import.meta.url));
const API = 'https://onepiece.fandom.com/api.php';
const UA = { 'User-Agent': 'onepiece-birthday-chapter/1.0 (personal project)' };

async function api(params) {
  const url = API + '?' + new URLSearchParams({ format: 'json', formatversion: '2', ...params });
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

// 0) Dati esistenti
let existing = new Map();
try {
  const old = JSON.parse(await readFile(OUT, 'utf8'));
  existing = new Map(old.chapters.map(c => [c.chapter, c]));
} catch (e) {
  if (e.code !== 'ENOENT') throw e;
}

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
if (existing.size && max < Math.max(...existing.keys())) {
  throw new Error(`La wiki elenca meno capitoli (${max}) di quelli in archivio: interrompo per non perdere dati.`);
}

// 2) Titoli mancanti, 50 pagine per richiesta (limite API)
const keep = n => !ALL_TITLES && existing.get(n)?.titleEn && existing.get(n)?.titleJa;
const todo = [...dates.keys()].filter(n => !keep(n)).sort((a, b) => a - b);
const titles = new Map();
for (let s = 0; s < todo.length; s += 50) {
  const names = todo.slice(s, s + 50).map(n => 'Chapter_' + n);
  const r = await api({ action: 'query', prop: 'revisions', rvprop: 'content', rvslots: 'main', rvsection: '0', titles: names.join('|') });
  for (const p of r.query.pages) {
    if (!p.revisions) continue;
    const c = p.revisions[0].slots.main.content;
    const field = k => { const m = c.match(new RegExp('^\\|[ \\t]*' + k + '[ \\t]*=[ \\t]*(.*)$', 'm')); return m ? cleanTitle(m[1]) : null; };
    const n = Number(p.title.split(' ')[1]);
    const t = { en: field('title'), ja: field('jname') };
    for (const [k, v] of Object.entries(t)) if (hasMarkup(v)) { console.warn(`Markup non gestito nel capitolo ${n} (${k}):`, v); t[k] = null; }
    titles.set(n, t);
  }
  if (s + 50 < todo.length) await new Promise(r => setTimeout(r, 300)); // gentile con il server
}

const chapters = [];
for (let n = 1; n <= max; n++) {
  if (!dates.has(n)) continue;
  const old = existing.get(n), t = titles.get(n);
  chapters.push({
    chapter: n,
    releaseDate: dates.get(n),
    titleEn: (keep(n) ? old.titleEn : t?.en ?? (ALL_TITLES ? null : old?.titleEn)) ?? null,
    titleJa: (keep(n) ? old.titleJa : t?.ja ?? (ALL_TITLES ? null : old?.titleJa)) ?? null,
  });
}

await writeFile(OUT, JSON.stringify({
  source: 'One Piece Wiki (onepiece.fandom.com) - Template:WhichMangaDate + Template:Chapter Box',
  generatedAt: new Date().toISOString().slice(0, 10),
  dateMeaning: 'Data di uscita giapponese (Weekly Shonen Jump)',
  chapters,
}, null, 1));
console.log(`Scritti ${chapters.length} capitoli in ${OUT} (ultimo: ${max}, ${dates.get(max)}); titoli scaricati: ${todo.length}`);
