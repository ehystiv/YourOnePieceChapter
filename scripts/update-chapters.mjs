// Aggiorna chapters.json dalla One Piece Wiki (Fandom, MediaWiki API).
// Uso: node scripts/update-chapters.mjs [output.json] [--all-titles]
//      (Node 18+, fetch nativo; default: public/chapters.json)
//      --all-titles riscarica anche titoli e copertine già presenti.
//
// Fonti:
//  - Date: Template:WhichMangaDate della wiki inglese, uno #switch con righe "|Chapter N=MM/DD/YYYY".
//    Vengono sempre riprese tutte.
//  - Titoli inglese e giapponese: wiki inglese, pagine "Chapter_N", template {{Chapter Box}} (campi "title", "jname").
//  - Titolo italiano: One Piece Wiki Italia, pagine "Capitolo_N", template {{Profilo capitolo}} (campo "titolo").
//  I titoli già presenti nel file vengono mantenuti (quelli inglesi di 1–1145 vengono da una traduzione curata):
//  dalle wiki si scaricano solo quelli mancanti. Con --all-titles si riscaricano tutti.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { cleanTitle, hasMarkup } from './clean-title.mjs';

const args = process.argv.slice(2);
const ALL_TITLES = args.includes('--all-titles');
const OUT = args.find(a => !a.startsWith('--')) ?? fileURLToPath(new URL('../public/chapters.json', import.meta.url));
const UA = { 'User-Agent': 'onepiece-birthday-chapter/1.0 (personal project)' };

const WIKIS = {
  en: { api: 'https://onepiece.fandom.com/api.php', page: n => 'Chapter_' + n, fields: { titleEn: 'title', titleJa: 'jname' } },
  it: { api: 'https://onepiece.fandom.com/it/api.php', page: n => 'Capitolo_' + n, fields: { titleIt: 'titolo' } },
};
const TITLE_FIELDS = Object.values(WIKIS).flatMap(w => Object.keys(w.fields));

async function api(base, params) {
  const url = base + '?' + new URLSearchParams({ format: 'json', formatversion: '2', ...params });
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}
const pause = () => new Promise(r => setTimeout(r, 300)); // gentile con il server

// 0) Dati esistenti
let existing = new Map();
try {
  const old = JSON.parse(await readFile(OUT, 'utf8'));
  existing = new Map(old.chapters.map(c => [c.chapter, c]));
} catch (e) {
  if (e.code !== 'ENOENT') throw e;
}

// 1) Date
const tpl = await api(WIKIS.en.api, { action: 'query', prop: 'revisions', rvprop: 'content', rvslots: 'main', titles: 'Template:WhichMangaDate' });
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

// 2) Titoli mancanti, per ogni wiki, 50 pagine per richiesta (limite API)
const has = (n, f) => !ALL_TITLES && Boolean(existing.get(n)?.[f]);
const fetched = new Map(); // n → { titleEn, titleJa, titleIt }
const report = [];
for (const [lang, wiki] of Object.entries(WIKIS)) {
  const fields = Object.keys(wiki.fields);
  const todo = [...dates.keys()].filter(n => fields.some(f => !has(n, f))).sort((a, b) => a - b);
  for (let s = 0; s < todo.length; s += 50) {
    const names = todo.slice(s, s + 50).map(wiki.page);
    const r = await api(wiki.api, { action: 'query', prop: 'revisions', rvprop: 'content', rvslots: 'main', rvsection: '0', redirects: '1', titles: names.join('|') });
    for (const p of r.query.pages) {
      if (!p.revisions) continue;
      const c = p.revisions[0].slots.main.content;
      const n = Number(p.title.split(' ').pop());
      const t = fetched.get(n) ?? {};
      for (const [f, key] of Object.entries(wiki.fields)) {
        const m = c.match(new RegExp('^\\|[ \\t]*' + key + '[ \\t]*=[ \\t]*(.*)$', 'm'));
        const v = m ? cleanTitle(m[1]) : null;
        if (hasMarkup(v)) console.warn(`Markup non gestito nel capitolo ${n} (${f}):`, v);
        else t[f] = v;
      }
      fetched.set(n, t);
    }
    if (s + 50 < todo.length) await pause();
  }
  report.push(`${lang}: ${todo.length}`);
}

// 3) Copertine: immagine principale della pagina "Chapter_N" sulla wiki inglese (file "Chapter_N.*").
//    Si salva solo l'URL sulla CDN di Fandom con le dimensioni, le immagini non vengono copiate.
const covers = new Map();
const coverTodo = [...dates.keys()].filter(n => !has(n, 'cover')).sort((a, b) => a - b);
for (let s = 0; s < coverTodo.length; s += 50) {
  const names = coverTodo.slice(s, s + 50).map(WIKIS.en.page);
  const r = await api(WIKIS.en.api, { action: 'query', prop: 'pageimages', piprop: 'original|name', pilimit: '50', redirects: '1', titles: names.join('|') });
  for (const p of r.query.pages) {
    const n = Number(p.title.split(' ').pop());
    // Il segnaposto (es. NoPicAvailable.png) non conta come copertina.
    if (p.original && new RegExp(`^Chapter_${n}\\.(png|jpe?g|webp|gif)$`, 'i').test(p.pageimage ?? '')) {
      covers.set(n, { src: p.original.source, width: p.original.width, height: p.original.height });
    }
  }
  if (s + 50 < coverTodo.length) await pause();
}
// Se l'immagine principale è un'altra (es. la tavola a colori), si cerca direttamente il file "Chapter_N.png".
const coverRetry = coverTodo.filter(n => !covers.has(n));
for (let s = 0; s < coverRetry.length; s += 50) {
  const files = coverRetry.slice(s, s + 50).map(n => `File:Chapter_${n}.png`);
  const r = await api(WIKIS.en.api, { action: 'query', prop: 'imageinfo', iiprop: 'url|size', titles: files.join('|') });
  for (const p of r.query.pages) {
    const ii = p.imageinfo?.[0];
    const m = /^File:Chapter (\d+)\.png$/.exec(p.title);
    if (ii && m) covers.set(Number(m[1]), { src: ii.url, width: ii.width, height: ii.height });
  }
  if (s + 50 < coverRetry.length) await pause();
}
report.push(`copertine: ${coverTodo.length}`);

const chapters = [];
for (let n = 1; n <= max; n++) {
  if (!dates.has(n)) continue;
  const old = existing.get(n) ?? {}, t = fetched.get(n) ?? {};
  const c = { chapter: n, releaseDate: dates.get(n) };
  for (const f of TITLE_FIELDS) c[f] = (has(n, f) ? old[f] : t[f] ?? (ALL_TITLES ? null : old[f])) ?? null;
  c.cover = (has(n, 'cover') ? old.cover : covers.get(n) ?? (ALL_TITLES ? null : old.cover)) ?? null;
  chapters.push(c);
}

await writeFile(OUT, JSON.stringify({
  source: 'One Piece Wiki (onepiece.fandom.com) - Template:WhichMangaDate + Template:Chapter Box; One Piece Wiki Italia (onepiece.fandom.com/it) - Template:Profilo capitolo',
  generatedAt: new Date().toISOString().slice(0, 10),
  dateMeaning: 'Data di uscita giapponese (Weekly Shonen Jump)',
  chapters,
}, null, 1).replace(/"cover": \{\n\s*("src": .*),\n\s*("width": \d+),\n\s*("height": \d+)\n\s*\}/g, '"cover": { $1, $2, $3 }')); // copertina su una riga
console.log(`Scritti ${chapters.length} capitoli in ${OUT} (ultimo: ${max}, ${dates.get(max)}); pagine scaricate per wiki: ${report.join(', ')}`);
