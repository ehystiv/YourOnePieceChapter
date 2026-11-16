// Testi dell'interfaccia. Inglese di default, italiano con lo switch.
// Le funzioni ricevono valori già formattati ed escapati dove serve.

export const LANGS = ['en', 'it'];
export const DEFAULT_LANG = 'en';

export const STRINGS = {
  en: {
    locale: 'en-US',
    titleField: 'titleEn',
    wikiUrl: n => `https://onepiece.fandom.com/wiki/Chapter_${n}`,
    coverAlt: n => `Cover page of chapter ${n}`,
    coverCredit: 'Cover page © Eiichiro Oda / Shueisha · image via One Piece Wiki',
    pageTitle: 'Your One Piece Chapter',
    chapterTitle: n => `Chapter ${n} · Your One Piece Chapter`,
    description: 'Enter a date and find out which One Piece chapter was on newsstands in Japan that week.',
    kicker: 'Weekly Shōnen Jump · since 1997',
    h1: 'Your <span class="hl">One Piece</span><br>chapter',
    sub: 'Enter a date (your birthday, for example) and find out which chapter was on newsstands in Japan that week.',
    dateLabel: 'Date',
    search: 'Set sail!',
    langSwitch: 'Language',
    invalidDate: 'Please enter a valid date.',
    loadError: 'Could not load the chapter list. Please try again later.',
    loading: 'Loading chapters…',
    noscript: 'This page needs JavaScript.',
    days: (n, s) => n === 1 ? '1 day' : `${s} days`,
    chapterShort: 'Ch.',
    // Prima del capitolo 1
    stampBefore: 'Before it all',
    notYet: 'Not yet',
    notStarted: 'One Piece had not started yet',
    beforeMeta: (days, n, title, date) => `It was <b>${days}</b> before <b>Chapter ${n}</b>${title ? `, “${title}”` : ''}, released on ${date}.`,
    romanceDawn: date => `But <b>Romance Dawn</b>, the one-shot that One Piece grew out of, had already come out on ${date}: in a way, Luffy already existed.`,
    wikiChapter: n => `Chapter ${n} on the wiki`,
    // Capitolo trovato
    stamp: { release: 'Out that day', week: 'Out that week', break: 'Break week', beyond: 'Not announced yet' },
    label: { release: 'Released on that very day', week: 'Released that week', break: 'On newsstands that week', beyond: 'Latest chapter on record' },
    titleTba: 'Title not announced yet',
    noCover: 'No cover page yet',
    uncharted: 'Uncharted waters',
    newsMast: 'World News · Special edition',
    newsHead: 'One Piece takes a break this week',
    released: (future, date) => `${future ? 'Scheduled for' : 'Released'} <b>${date}</b>`,
    sinceBefore: days => ` · ${days} before the chosen date`,
    beyondFuture: 'This date is past the latest chapter on record: that week’s chapter has not been announced yet.',
    beyondStale: 'This date is past the latest chapter on record: the data may be out of date.',
    chapterFuture: date => `This chapter is not out yet: it is scheduled for ${date}.`,
    breakNote: (n, future, date) => `One Piece was on break that week. This was the latest chapter out; the next one, <b>${n}</b>, ${future ? 'is scheduled for' : 'came out on'} ${date}.`,
    wikiRead: 'Read the wiki page',
    share: 'Share',
    shareCopied: 'Copied!',
    shareFailed: 'Could not copy',
    shareChapter: (date, n, title, future) => `${future ? 'The week of' : 'On'} ${date}, ${future ? 'Japan gets' : 'Japan was reading'} One Piece chapter ${n}${title ? ` "${title}"` : ''}. What's yours?`,
    shareBefore: date => `On ${date}, One Piece hadn't started yet. What's your chapter?`,
    // Footer
    stats: (count, first, firstDate, last, lastFuture, lastDate) =>
      `${count} chapters, from no. ${first} (${firstDate}) to no. ${last} (${lastFuture ? 'scheduled for ' : ''}${lastDate}).`,
    updated: date => `Data updated on ${date}.`,
    source: 'Japanese release dates and titles from the <a href="https://onepiece.fandom.com/wiki/Chapters_and_Volumes" target="_blank" rel="noopener">One Piece Wiki</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noopener">CC BY-SA</a> license).',
    fanMade: 'Unofficial fan-made page.',
    code: 'Source code on <a href="https://github.com/ehystiv/YourOnePieceChapter" target="_blank" rel="noopener">GitHub</a>.',
  },
  it: {
    locale: 'it-IT',
    titleField: 'titleIt',
    wikiUrl: n => `https://onepiece.fandom.com/it/wiki/Capitolo_${n}`,
    coverAlt: n => `Copertina del capitolo ${n}`,
    coverCredit: 'Copertina © Eiichiro Oda / Shueisha · immagine dalla One Piece Wiki',
    pageTitle: 'Il tuo capitolo di One Piece',
    chapterTitle: n => `Capitolo ${n} · Il tuo capitolo di One Piece`,
    description: 'Inserisci una data e scopri quale capitolo di One Piece era in edicola in Giappone quella settimana.',
    kicker: 'Weekly Shōnen Jump · dal 1997',
    h1: 'Il tuo capitolo<br>di <span class="hl">One Piece</span>',
    sub: 'Inserisci una data (per esempio il tuo compleanno) e scopri quale capitolo era in edicola in Giappone quella settimana.',
    dateLabel: 'Data',
    search: 'Salpa!',
    langSwitch: 'Lingua',
    invalidDate: 'Inserisci una data valida.',
    loadError: 'Impossibile caricare l\'elenco dei capitoli. Riprova più tardi.',
    loading: 'Caricamento dei capitoli…',
    noscript: 'Per usare la pagina serve JavaScript.',
    days: (n, s) => n === 1 ? '1 giorno' : `${s} giorni`,
    chapterShort: 'Cap.',
    stampBefore: 'Prima di tutto',
    notYet: 'Non ancora',
    notStarted: 'One Piece non era ancora iniziato',
    beforeMeta: (days, n, title, date) => `Mancavano <b>${days}</b> al <b>Capitolo ${n}</b>${title ? `, «${title}»` : ''}, uscito il ${date}.`,
    romanceDawn: date => `Però era già uscito <b>Romance Dawn</b>, il one-shot da cui è nato One Piece, pubblicato il ${date}: in un certo senso Rufy esisteva già.`,
    wikiChapter: n => `Capitolo ${n} sulla wiki`,
    stamp: { release: 'Uscito quel giorno', week: 'Uscito quella settimana', break: 'Settimana di pausa', beyond: 'Non ancora annunciato' },
    label: { release: 'Uscito proprio quel giorno', week: 'Uscito quella settimana', break: 'In edicola quella settimana', beyond: 'Ultimo capitolo in archivio' },
    titleTba: 'Titolo non ancora annunciato',
    noCover: 'Copertina non ancora disponibile',
    uncharted: 'Mare inesplorato',
    newsMast: 'Notizie dal mondo · Edizione speciale',
    newsHead: 'One Piece in pausa questa settimana',
    released: (future, date) => `Uscito ${future ? '(previsto) ' : ''}<b>${date}</b>`,
    sinceBefore: days => ` · ${days} prima della data scelta`,
    beyondFuture: 'Questa data è oltre l\'ultimo capitolo in archivio: il capitolo di quella settimana non è ancora stato annunciato.',
    beyondStale: 'Questa data è oltre l\'ultimo capitolo in archivio: i dati potrebbero non essere aggiornati.',
    chapterFuture: date => `Questo capitolo non è ancora uscito: è previsto per il ${date}.`,
    breakNote: (n, future, date) => `Quella settimana One Piece era in pausa. L'ultimo capitolo uscito era questo; il successivo, il <b>${n}</b>, ${future ? 'è previsto per' : 'è arrivato'} il ${date}.`,
    wikiRead: 'Leggi la scheda sulla wiki',
    share: 'Condividi',
    shareCopied: 'Copiato!',
    shareFailed: 'Copia non riuscita',
    shareChapter: (date, n, title, future) => `Il ${date} in Giappone ${future ? 'esce' : 'era in edicola'} il capitolo ${n} di One Piece${title ? `, «${title}»` : ''}. E il tuo?`,
    shareBefore: date => `Il ${date} One Piece non era ancora iniziato. Qual è il tuo capitolo?`,
    stats: (count, first, firstDate, last, lastFuture, lastDate) =>
      `${count} capitoli, dal n. ${first} (${firstDate}) al n. ${last} (${lastFuture ? 'previsto il ' : ''}${lastDate}).`,
    updated: date => `Dati aggiornati al ${date}.`,
    source: 'Date di uscita giapponesi tratte dalla <a href="https://onepiece.fandom.com/wiki/Chapters_and_Volumes" target="_blank" rel="noopener">One Piece Wiki</a>, titoli italiani dalla <a href="https://onepiece.fandom.com/it/wiki/One_Piece_Wiki_Italia" target="_blank" rel="noopener">One Piece Wiki Italia</a> (licenza <a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noopener">CC BY-SA</a>).',
    fanMade: 'Pagina non ufficiale, realizzata da un fan.',
    code: 'Codice sorgente su <a href="https://github.com/ehystiv/YourOnePieceChapter" target="_blank" rel="noopener">GitHub</a>.',
  },
};

const KEY = 'lang';

/** Lingua salvata (se valida), altrimenti l'inglese. */
export function loadLang() {
  try {
    const v = localStorage.getItem(KEY);
    if (LANGS.includes(v)) return v;
  } catch { /* storage non disponibile */ }
  return DEFAULT_LANG;
}

export function saveLang(lang) {
  try { localStorage.setItem(KEY, lang); } catch { /* storage non disponibile */ }
}
