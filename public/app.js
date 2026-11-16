import { ROMANCE_DAWN, parseISO, toISO, todayUTC, prepare, lookup } from './lookup.js';
import { STRINGS, LANGS, loadLang, saveLang } from './i18n.js';

const $ = id => document.getElementById(id);
const form = $('f'), input = $('d'), card = $('card'), err = $('err'), stats = $('stats');

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let lang = loadLang();
let T = STRINGS[lang];
let list = [];
let dataset = null;
let today = todayUTC();
let current = null; // data mostrata (ms), per ridisegnare la scheda quando cambia lingua
let errKey = null;  // errore mostrato, per tradurlo quando cambia lingua

const fmt = ms => new Date(ms).toLocaleDateString(T.locale, { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const fmtShort = ms => new Date(ms).toLocaleDateString(T.locale, { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' });
const num = n => n.toLocaleString(T.locale);
const days = n => T.days(n, num(n));

function showError(key) {
  errKey = key;
  err.textContent = key ? T[key] : '';
}

// Titolo nella lingua scelta; se manca, quello inglese (con il suo attributo lang).
function localTitle(c) {
  if (c[T.titleField]) return { text: c[T.titleField], lang };
  if (c.titleEn) return { text: c.titleEn, lang: 'en' };
  return null;
}

// Scheda sulla wiki della lingua scelta; se lì il capitolo non c'è ancora (nessun titolo), quella inglese.
const wikiHref = c => (c[T.titleField] ? T : STRINGS.en).wikiUrl(c.chapter);

// Copertina dalla CDN della wiki, ridimensionata dal server di Fandom (scale-to-width-down).
const coverUrl = (src, w) => src.replace('/revision/latest', `/revision/latest/scale-to-width-down/${w}`);

function coverBlock(c) {
  if (!c.cover) return '';
  const { src, width, height } = c.cover;
  const sizes = [320, 480, 640, 960].filter(w => w < width);
  const srcset = sizes.map(w => `${coverUrl(src, w)} ${w}w`).concat(`${src} ${width}w`).join(', ');
  return `<figure class="cover">
      <a href="${wikiHref(c)}" target="_blank" rel="noopener">
        <img src="${coverUrl(src, Math.min(640, width))}" srcset="${srcset}" sizes="${width >= height ? '(max-width: 600px) 90vw, 512px' : '320px'}"
          width="${width}" height="${height}" style="--ar: ${(width / height).toFixed(4)}" alt="${esc(T.coverAlt(c.chapter))}" decoding="async"
          onerror="this.closest('figure').remove()">
      </a>
      <figcaption>${T.coverCredit}</figcaption>
    </figure>`;
}

function chapterBlock(c, label, future) {
  const t = localTitle(c);
  const title = t
    ? `<div class="en"${t.lang !== lang ? ` lang="${t.lang}"` : ''}>${esc(t.text)}</div>`
    : `<div class="en">${future ? T.titleTba : '—'}</div>`;
  return `
    <div class="label">${label}</div>
    <div class="num"><small>${T.chapterShort}</small>${c.chapter}</div>
    ${title}
    <p class="ja" lang="ja">${c.titleJa ? esc(c.titleJa) : ''}</p>`;
}

function renderBefore(r) {
  return `<div class="stamp">${T.stampBefore}</div>
    <div class="label">${esc(fmt(r.date))}</div>
    <div class="num num--text">${T.notYet}</div>
    <p class="en">${T.notStarted}</p>
    <div class="meta">${T.beforeMeta(days(r.daysToFirst), r.first.chapter, esc(localTitle(r.first)?.text ?? ''), esc(fmtShort(r.first.ms)))}</div>
    ${r.romanceDawn ? `<div class="note">${T.romanceDawn(esc(fmtShort(ROMANCE_DAWN)))}</div>` : ''}
    <div class="nav">
      <span></span>
      <a class="wiki" href="${wikiHref(r.first)}" target="_blank" rel="noopener">${T.wikiChapter(r.first.chapter)}</a>
      <a href="#${toISO(r.first.ms)}">${T.chapterShort} ${r.first.chapter} →</a>
    </div>`;
}

function renderChapter(r) {
  const c = r.chapter;
  const k = r.beyondArchive ? 'beyond' : r.kind;

  const meta = T.released(r.chapterIsFuture, esc(fmt(c.ms))) + (r.since > 0 ? T.sinceBefore(days(r.since)) : '') + '.';

  let note = '';
  if (r.beyondArchive) note = r.date > today ? T.beyondFuture : T.beyondStale;
  else if (r.chapterIsFuture) note = T.chapterFuture(esc(fmtShort(c.ms)));
  else if (r.kind === 'break' && r.next) note = T.breakNote(r.next.chapter, r.nextIsFuture, esc(fmtShort(r.next.ms)));

  return `<div class="stamp${k === 'break' || k === 'beyond' ? ' stamp--muted' : ''}">${T.stamp[k]}</div>
    ${chapterBlock(c, esc(T.label[k]) + ' · ' + esc(fmtShort(r.date)), r.chapterIsFuture)}
    ${coverBlock(c)}
    <div class="meta">${meta}</div>
    ${note ? `<div class="note">${note}</div>` : ''}
    <div class="nav">
      ${r.prev ? `<a href="#${toISO(r.prev.ms)}">← ${T.chapterShort} ${r.prev.chapter}</a>` : '<span></span>'}
      <a class="wiki" href="${wikiHref(c)}" target="_blank" rel="noopener">${T.wikiRead}</a>
      ${r.next ? `<a href="#${toISO(r.next.ms)}">${T.chapterShort} ${r.next.chapter} →</a>` : '<span></span>'}
    </div>`;
}

function render(ms, animate = true) {
  showError(null);
  current = ms;
  today = todayUTC();
  const r = lookup(list, ms, today);
  card.innerHTML = r.kind === 'before' ? renderBefore(r) : renderChapter(r);
  if (animate) { card.classList.remove('show'); void card.offsetWidth; }
  card.classList.add('show');
  document.title = r.kind === 'before' ? T.pageTitle : T.chapterTitle(r.chapter.chapter);
}

function renderStats() {
  if (!list.length) { stats.textContent = T.loading; return; }
  const first = list[0], last = list[list.length - 1];
  const gen = parseISO(dataset?.generatedAt);
  stats.innerHTML = T.stats(num(list.length), first.chapter, esc(fmtShort(first.ms)), last.chapter, last.ms > today, esc(fmtShort(last.ms)))
    + (gen !== null ? '<br>' + T.updated(esc(fmtShort(gen))) : '');
}

// Testi statici della pagina (data-i18n = testo, data-i18n-html = HTML fidato dal dizionario).
function applyLang(next) {
  lang = next;
  T = STRINGS[lang];
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = T[el.dataset.i18n]; });
  document.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = T[el.dataset.i18nHtml]; });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', T[el.dataset.i18nAria]); });
  document.querySelector('meta[name=description]').content = T.description;
  document.querySelectorAll('.lang button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  if (errKey) err.textContent = T[errKey];
  renderStats();
  if (current !== null) render(current, false);
  else document.title = T.pageTitle;
}

document.querySelector('.lang').addEventListener('click', e => {
  const b = e.target.closest('button[data-lang]');
  if (!b || b.dataset.lang === lang || !LANGS.includes(b.dataset.lang)) return;
  saveLang(b.dataset.lang);
  applyLang(b.dataset.lang);
});

// La data scelta vive nell'hash (#AAAA-MM-GG): il link si può condividere e funziona su qualunque hosting statico.
function fromHash() {
  const ms = parseISO(decodeURIComponent(location.hash.slice(1)));
  if (ms === null) return false;
  input.value = toISO(ms);
  render(ms);
  return true;
}

form.addEventListener('submit', e => {
  e.preventDefault();
  const ms = parseISO(input.value);
  if (ms === null) {
    showError('invalidDate');
    card.classList.remove('show');
    current = null;
    return;
  }
  const hash = '#' + toISO(ms);
  if (location.hash === hash) render(ms); else location.hash = hash; // hashchange → render
});

window.addEventListener('hashchange', fromHash);

async function init() {
  applyLang(lang);
  try {
    const res = await fetch('chapters.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    dataset = await res.json();
    list = prepare(dataset.chapters);
    if (!list.length) throw new Error('empty dataset');
    renderStats();
    form.querySelector('button').disabled = false;
    fromHash();
  } catch (e) {
    showError('loadError');
    console.error(e);
  }
}

init();
