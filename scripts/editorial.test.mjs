import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateContent } from './editorial.mjs';

const read = name => JSON.parse(readFileSync(new URL('../data/'+name, import.meta.url)));
const edition = read('editions.json').editions.find(e => e.slug === '2026-09-28');
const content = read('2026-09-28.json');

test('publication on Monday or later preserves the same closed editorial week', () => {
  for (const date of ['2026-10-05', '2026-10-09']) {
    validateContent({...edition, publishedAt: date}, {...content, researchedAt: date});
  }
});

test('publication before the week closes is rejected', () => {
  assert.throws(() => validateContent({...edition, publishedAt: edition.endDate}, content));
});

test('research after publication is rejected', () => {
  assert.throws(() => validateContent(edition, {...content, researchedAt: '2026-10-10'}));
});

test('nonexistent publication and research dates are rejected', () => {
  assert.throws(() => validateContent({...edition, publishedAt: '2026-09-31'}, content));
  assert.throws(() => validateContent(edition, {...content, researchedAt: '2026-09-31'}));
});

test('late publication does not admit events after the Sunday cutoff', () => {
  const changed = structuredClone(content);
  changed.articles[0].eventDate = '2026-10-05';
  assert.throws(() => validateContent(edition, changed));
});
