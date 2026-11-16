// Coerenza delle lingue: chi aggiunge una lingua scopre qui cosa manca.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { STRINGS, LANGS, DEFAULT_LANG } from '../public/i18n.js';

const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
const data = JSON.parse(await readFile(new URL('../public/chapters.json', import.meta.url), 'utf8'));

// Forma di un valore: tipo, e per gli oggetti le chiavi annidate.
const shape = v => typeof v === 'object' && v !== null
  ? Object.fromEntries(Object.keys(v).sort().map(k => [k, shape(v[k])]))
  : typeof v;

test('LANGS e STRINGS elencano le stesse lingue, e c\'è la lingua predefinita', () => {
  assert.deepEqual([...LANGS].sort(), Object.keys(STRINGS).sort());
  assert.ok(LANGS.includes(DEFAULT_LANG));
});

for (const lang of LANGS) {
  test(`${lang}: stesse chiavi e stessi tipi della lingua predefinita`, () => {
    assert.deepEqual(shape(STRINGS[lang]), shape(STRINGS[DEFAULT_LANG]));
  });

  test(`${lang}: c'è il pulsante nello switch di lingua`, () => {
    assert.match(html, new RegExp(`<button[^>]*data-lang="${lang}"`));
  });

  test(`${lang}: locale valido, campo del titolo nei dati, link alla wiki`, () => {
    const T = STRINGS[lang];
    assert.doesNotThrow(() => new Intl.DateTimeFormat(T.locale));
    assert.ok(data.chapters.some(c => c[T.titleField]), `nessun capitolo ha il campo ${T.titleField}`);
    assert.match(T.wikiUrl(1), /^https:\/\/.+1$/);
  });
}
