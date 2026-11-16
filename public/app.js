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

// La "foto" del manifesto: la copertina, oppure un riquadro vuoto con "?".
// `extra`: elementi sovrapposti alla foto (timbro, ドン!).
function coverBlock(c, extra = '') {
  if (!c.cover) {
    return `<figure class="cover cover--empty"><div class="photo"><div class="blank" aria-hidden="true">?</div>${extra}</div><figcaption>${T.noCover}</figcaption></figure>`;
  }
  const { src, width, height } = c.cover;
  const sizes = [320, 480, 640, 960].filter(w => w < width);
  const srcset = sizes.map(w => `${coverUrl(src, w)} ${w}w`).concat(`${src} ${width}w`).join(', ');
  return `<figure class="cover">
      <div class="photo" style="--ar: ${(width / height).toFixed(4)}"><a href="${wikiHref(c)}" target="_blank" rel="noopener">
        <img src="${coverUrl(src, Math.min(640, width))}" srcset="${srcset}" sizes="${width >= height ? '(max-width: 600px) 90vw, 512px' : '300px'}"
          width="${width}" height="${height}" style="--ar: ${(width / height).toFixed(4)}" alt="${esc(T.coverAlt(c.chapter))}" decoding="async"
          onerror="this.closest('figure').remove()">
      </a>${extra}</div>
      <figcaption>${T.coverCredit}</figcaption>
    </figure>`;
}

const ICONS = {
  // Bottiglia con messaggio arrotolato
  bottle: `<svg viewBox="0 0 34 54" aria-hidden="true"><rect x="12" y="1" width="10" height="7" rx="2" fill="#a0703c" stroke="#1f2a3a" stroke-width="1.5"/><path d="M13 8h8v7c0 2 7 5 7 12v20a6 6 0 0 1-6 6H12a6 6 0 0 1-6-6V27c0-7 7-10 7-12z" fill="#cfe3e8" fill-opacity=".7" stroke="#1f2a3a" stroke-width="1.5"/><rect x="11" y="26" width="12" height="18" rx="2" fill="#f8ecd0" stroke="#6b6250" stroke-width="1"/><path d="M13 31h8M13 35h8M13 39h5" stroke="#6b6250" stroke-width="1"/></svg>`,
  // Isola nella nebbia, rotta tratteggiata e X
  island: `<svg class="island" viewBox="0 34 340 106" aria-hidden="true">
    <g fill="none" stroke="#1d3557" stroke-opacity=".35" stroke-width="1.5"><path d="M10 120q12-8 24 0t24 0t24 0"/><path d="M250 132q12-8 24 0t24 0t24 0"/><path d="M40 40q12-8 24 0t24 0"/></g>
    <path d="M20 128C70 128 90 70 150 88" fill="none" stroke="#b3261e" stroke-width="2.5" stroke-dasharray="7 7"/>
    <path d="M150 104c-8-26 20-44 52-46 30-2 66 6 74 26 8 22-18 36-56 38-38 2-64-2-70-18z" fill="#e8b84a" fill-opacity=".55" stroke="#1f2a3a" stroke-width="2.5"/>
    <path d="M196 70c10-14 28-14 36 0" fill="none" stroke="#1f2a3a" stroke-width="2"/>
    <g fill="#f8ecd0" fill-opacity=".85"><ellipse cx="170" cy="72" rx="46" ry="12"/><ellipse cx="248" cy="94" rx="52" ry="11"/><ellipse cx="210" cy="112" rx="60" ry="10"/></g>
    <text x="214" y="98" text-anchor="middle" font-family="Fraunces, serif" font-weight="800" font-size="48" fill="#b3261e">?</text>
  </svg>`,
};

function titleBlock(c, future) {
  const t = localTitle(c);
  return t
    ? `<h2 class="title"${t.lang !== lang ? ` lang="${t.lang}"` : ''}>${esc(t.text)}</h2>`
    : `<h2 class="title">${future ? T.titleTba : '—'}</h2>`;
}

function renderBefore(r) {
  return `<div class="poster poster--chart">
    <div class="stamp stamp--muted">${T.stampBefore}</div>
    <div class="chart-title">${T.uncharted}</div>
    ${ICONS.island}
    <div class="label">${esc(fmt(r.date))}</div>
    <div class="bounty bounty--text"><span class="num">${T.notYet}</span></div>
    <h2 class="title">${T.notStarted}</h2>
    <div class="waves" aria-hidden="true"></div>
    <div class="meta">${T.beforeMeta(days(r.daysToFirst), r.first.chapter, esc(localTitle(r.first)?.text ?? ''), esc(fmtShort(r.first.ms)))}</div>
    ${r.romanceDawn ? `<div class="note">${T.romanceDawn(esc(fmtShort(ROMANCE_DAWN)))}</div>` : ''}
    <div class="nav">
      <span></span>
      <a class="wiki" href="${wikiHref(r.first)}" target="_blank" rel="noopener">${T.wikiChapter(r.first.chapter)}</a>
      <a href="#${toISO(r.first.ms)}">${T.chapterShort} ${r.first.chapter} →</a>
    </div>
  </div>`;
}

function renderChapter(r) {
  const c = r.chapter;
  const k = r.beyondArchive ? 'beyond' : r.kind;
  const meta = T.released(r.chapterIsFuture, esc(fmt(c.ms))) + (r.since > 0 ? T.sinceBefore(days(r.since)) : '') + '.';

  // La nota cambia forma con lo stato: bottiglia (futuro), giornale (pausa).
  let note = '';
  if (r.beyondArchive || r.chapterIsFuture) {
    const text = r.beyondArchive ? (r.date > today ? T.beyondFuture : T.beyondStale) : T.chapterFuture(esc(fmtShort(c.ms)));
    note = `<div class="bottle">${ICONS.bottle}<span>${text}</span></div>`;
  } else if (r.kind === 'break' && r.next) {
    note = `<div class="news">
        <div class="news-mast"><span>${T.newsMast}</span><span>${esc(fmtShort(r.date))}</span></div>
        <div class="news-head">${T.newsHead}</div>
        <p>${T.breakNote(r.next.chapter, r.nextIsFuture, esc(fmtShort(r.next.ms)))}</p>
      </div>`;
  }
  const don = r.kind === 'release' && !r.chapterIsFuture ? `<span class="don" lang="ja" aria-hidden="true">ドン!</span>` : '';

  const stamp = `<div class="stamp${k === 'break' || k === 'beyond' ? ' stamp--muted' : ''}">${T.stamp[k]}</div>`;

  return `<div class="poster">
    <div class="wanted" aria-hidden="true">WANTED</div>
    ${coverBlock(c, stamp + don)}
    <div class="label">${esc(T.label[k])} · ${esc(fmtShort(r.date))}</div>
    ${titleBlock(c, r.chapterIsFuture)}
    <p class="ja" lang="ja">${c.titleJa ? esc(c.titleJa) : ''}</p>
    <div class="bounty"><small>${T.chapterShort}</small><span class="num">${c.chapter}</span><span class="dash" aria-hidden="true">—</span></div>
    <div class="waves" aria-hidden="true"></div>
    <div class="meta">${meta}</div>
    ${note}
    <div class="nav">
      ${r.prev ? `<a href="#${toISO(r.prev.ms)}">← ${T.chapterShort} ${r.prev.chapter}</a>` : '<span></span>'}
      <a class="wiki" href="${wikiHref(c)}" target="_blank" rel="noopener">${T.wikiRead}</a>
      ${r.next ? `<a href="#${toISO(r.next.ms)}">${T.chapterShort} ${r.next.chapter} →</a>` : '<span></span>'}
    </div>
  </div>`;
}

function render(ms, animate = true) {
  showError(null);
  current = ms;
  today = todayUTC();
  const r = lookup(list, ms, today);
  card.innerHTML = '<span class="pin" aria-hidden="true"></span>' + (r.kind === 'before' ? renderBefore(r) : renderChapter(r));
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
