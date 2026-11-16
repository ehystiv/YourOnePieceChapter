// Riduce il valore wikitext di un campo di {{Chapter Box}} a testo semplice.
export function cleanTitle(raw) {
  let s = String(raw ?? '');
  // Varianti "X (Volume)<br/>Y (Magazine)": si tiene quella del volume.
  const parts = s.split(/<br\s*\/?>/i);
  const vol = parts.find(p => /\((volume|tankobon)\)/i.test(p));
  if (vol && parts.some(p => /\(magazine\)/i.test(p))) s = vol;
  s = s
    .replace(/\{\{\s*ruby\s*\|([^|}]*)\|[^}]*\}\}/gi, '$1') // {{Ruby|kanji|lettura}} → kanji
    .replace(/\((volume|magazine|tankobon)\)/gi, '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/?[a-z][^>]*>/gi, '')                       // <nowiki>, <s>, <span …>
    .replace(/'{2,}/g, '')                                  // ''corsivo'' e '''grassetto'''
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1')       // [[link|testo]] → testo
    .replace(/[|\s]+$/, '')                                  // "|" finali
    .replace(/\s+/g, ' ')
    .trim();
  return s && s !== 'TBA' ? s : null;
}

/** true se nel titolo è rimasto del markup wiki o HTML. */
export const hasMarkup = s => typeof s === 'string' && /\{\{|\}\}|\[\[|\]\]|<\/?[a-z][^>]*>|''|\|/i.test(s);
