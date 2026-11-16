// node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseISO, prepare, lookup } from '../public/lookup.js';
import { cleanTitle, hasMarkup } from '../scripts/clean-title.mjs';

const data = JSON.parse(await readFile(new URL('../public/chapters.json', import.meta.url), 'utf8'));
const list = prepare(data.chapters);
const TODAY = parseISO('2026-11-16');
const at = s => lookup(list, parseISO(s), TODAY);

test('27/01/1997: nessun capitolo, mancano 173 giorni', () => {
  const r = at('1997-01-27');
  assert.equal(r.kind, 'before');
  assert.equal(r.daysToFirst, 173);
  assert.equal(r.romanceDawn, true);
});

test('prima di Romance Dawn non c\'è la nota sul one-shot', () => {
  assert.equal(at('1996-08-03').romanceDawn, false);
  assert.equal(at('1996-08-04').romanceDawn, true);
});

test('19/07/1997: capitolo 1 uscito quel giorno', () => {
  const r = at('1997-07-19');
  assert.equal(r.kind, 'release');
  assert.equal(r.chapter.chapter, 1);
  assert.equal(r.prev, null);
});

test('25/07/1997: capitolo 1, uscito quella settimana', () => {
  const r = at('1997-07-25');
  assert.equal(r.kind, 'week');
  assert.equal(r.chapter.chapter, 1);
});

test('04/07/2022: capitolo 1053, pausa; il 1054 esce il 25/07/2022', () => {
  const r = at('2022-07-04');
  assert.equal(r.chapter.chapter, 1053);
  assert.equal(r.kind, 'break');
  assert.equal(r.next.chapter, 1054);
  assert.equal(r.next.releaseDate, '2022-07-25');
});

test('06/01/2021: capitolo 1000', () => {
  assert.equal(at('2021-01-06').chapter.chapter, 1000);
});

test('16/11/2026: capitolo 1198, pausa; il 1199 è previsto per il 23/11/2026', () => {
  const r = at('2026-11-16');
  assert.equal(r.chapter.chapter, 1198);
  assert.equal(r.kind, 'break');
  assert.equal(r.next.chapter, 1199);
  assert.equal(r.nextIsFuture, true);
  assert.equal(r.beyondArchive, false);
});

test('25/11/2026: capitolo 1199 previsto, non ancora oltre l\'archivio', () => {
  const r = at('2026-11-25');
  assert.equal(r.chapter.chapter, 1199);
  assert.equal(r.chapterIsFuture, true);
  assert.equal(r.beyondArchive, false);
});

test('15/12/2026: oltre l\'ultimo capitolo in archivio', () => {
  const r = at('2026-12-15');
  assert.equal(r.chapter.chapter, 1199);
  assert.equal(r.beyondArchive, true);
});

test('parseISO rifiuta date inesistenti', () => {
  assert.equal(parseISO('2023-02-29'), null);
  assert.equal(parseISO('ciao'), null);
  assert.notEqual(parseISO('2024-02-29'), null);
});

test('nessun titolo contiene markup wiki o HTML', () => {
  const bad = list.filter(c => hasMarkup(c.titleEn) || hasMarkup(c.titleJa) || hasMarkup(c.titleIt)).map(c => c.chapter);
  assert.deepEqual(bad, []);
});

test('ogni capitolo già uscito ha il titolo inglese e quello italiano', () => {
  const missing = list.filter(c => c.ms <= TODAY && (!c.titleEn || !c.titleIt)).map(c => c.chapter);
  assert.deepEqual(missing, []);
  assert.equal(list.find(c => c.chapter === 1053).titleIt, 'I nuovi imperatori');
});

test('cleanTitle ripulisce i casi visti sulla wiki', () => {
  assert.equal(cleanTitle('{{ruby|仕事|ビジネス}}'), '仕事');
  assert.equal(cleanTitle('{{Ruby|行進曲|マーチ}}'), '行進曲');
  assert.equal(cleanTitle("'''0'''"), '0');
  assert.equal(cleanTitle('Donut Race<nowiki>!!</nowiki>'), 'Donut Race!!');
  assert.equal(cleanTitle('<s>3D</s>2Y'), '3D2Y');
  assert.equal(cleanTitle('The Mermaid Princess<br/>in Hard-Shell Tower'), 'The Mermaid Princess in Hard-Shell Tower');
  assert.equal(cleanTitle('兄弟盃 (volume)<br/>兄弟杯 (magazine)'), '兄弟盃');
  assert.equal(cleanTitle('怒り|'), '怒り');
  assert.equal(cleanTitle('TBA'), null);
  assert.equal(cleanTitle(''), null);
});

test('il dataset è ordinato, senza buchi e con numeri crescenti', () => {
  for (let i = 1; i < list.length; i++) {
    assert.ok(list[i].ms > list[i - 1].ms, `data non crescente al capitolo ${list[i].chapter}`);
    assert.equal(list[i].chapter, list[i - 1].chapter + 1);
  }
});
