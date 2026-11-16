// Logica di ricerca, senza DOM: usata dal sito e dai test Node.
// Tutte le date sono date di calendario senza fuso orario, rappresentate come ms UTC a mezzanotte.

export const DAY = 864e5;
export const ROMANCE_DAWN = Date.UTC(1996, 7, 4); // one-shot "Romance Dawn", versione 1

/** "YYYY-MM-DD" → ms UTC, oppure null se la stringa non è una data valida. */
export function parseISO(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s ?? '').trim());
  if (!m) return null;
  const y = +m[1], mo = +m[2] - 1, d = +m[3];
  const ms = Date.UTC(y, mo, d);
  const back = new Date(ms);
  if (back.getUTCFullYear() !== y || back.getUTCMonth() !== mo || back.getUTCDate() !== d) return null;
  return ms;
}

export const toISO = ms => new Date(ms).toISOString().slice(0, 10);

/** Oggi (data locale del dispositivo) come ms UTC a mezzanotte. */
export function todayUTC(now = new Date()) {
  return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
}

/** Prepara i capitoli: aggiunge `ms` e ordina per data. */
export function prepare(chapters) {
  return chapters
    .map(c => ({ ...c, ms: parseISO(c.releaseDate) }))
    .filter(c => c.ms !== null)
    .sort((a, b) => a.ms - b.ms || a.chapter - b.chapter);
}

/** Indice dell'ultimo capitolo uscito il giorno `ms` o prima (-1 se nessuno). */
export function lastOnOrBefore(list, ms) {
  let lo = 0, hi = list.length - 1, ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (list[mid].ms <= ms) { ans = mid; lo = mid + 1; } else hi = mid - 1;
  }
  return ans;
}

/**
 * Risultato della ricerca per la data `ms`.
 * kind: 'before'  → prima del capitolo 1
 *       'release' → capitolo uscito proprio quel giorno (since === 0)
 *       'week'    → capitolo uscito quella settimana (since < 7)
 *       'break'   → settimana di pausa (since >= 7)
 */
export function lookup(list, ms, today = todayUTC()) {
  const i = lastOnOrBefore(list, ms);
  if (i < 0) {
    const first = list[0];
    return {
      kind: 'before',
      date: ms,
      first,
      daysToFirst: Math.round((first.ms - ms) / DAY),
      romanceDawn: ms >= ROMANCE_DAWN,
    };
  }
  const chapter = list[i];
  const since = Math.round((ms - chapter.ms) / DAY);
  const next = list[i + 1] ?? null;
  return {
    kind: since === 0 ? 'release' : since < 7 ? 'week' : 'break',
    date: ms,
    since,
    chapter,
    prev: list[i - 1] ?? null,
    next,
    chapterIsFuture: chapter.ms > today,
    nextIsFuture: next ? next.ms > today : false,
    // Data oltre l'ultimo capitolo in archivio, nel futuro: il capitolo di quella settimana non è ancora annunciato.
    // (Entro 7 giorni dall'ultimo capitolo vale ancora quel capitolo, eventualmente "previsto".)
    beyondArchive: !next && since >= 7,
  };
}
