import { readFile, readdir, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import { validateContent, sectionsFor } from './editorial.mjs';
const root = fileURLToPath(new URL('../',import.meta.url));
const files = ['index.html','archive.html',...(await readdir(path.join(root,'editions'))).filter(f=>f.endsWith('.html')).map(f=>'editions/'+f)];
const html = new Map(await Promise.all(files.map(async f=>[f,await readFile(path.join(root,f),'utf8')])));
let links=0;
for (const [file,body] of html) {
  assert.match(body,/<html lang="es">/);
  assert.equal([...body.matchAll(/<h1[ >]/g)].length,1,`${file}: un H1`);
  const ids=[...body.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(ids.length,new Set(ids).size,`${file}: IDs duplicados`);
  for (const [,raw] of body.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (/^(https?:|data:|mailto:)/.test(raw)) continue;
    assert(!raw.startsWith('/'),`${file}: ruta absoluta ${raw}`);
    const [relative,fragment] = raw.split('#');
    const target = relative ? path.posix.normalize(path.posix.join(path.posix.dirname(file),relative)) : file;
    await access(path.join(root,target));
    if (fragment) assert(html.get(target)?.includes(`id="${fragment}"`),`${file}: fragmento inexistente ${raw}`);
    links++;
  }
}
const index = JSON.parse(await readFile(path.join(root,'data/editions.json'),'utf8'));
assert.equal(new Set(index.editions.map(e=>e.slug)).size,index.editions.length,'Slugs duplicados');
assert.equal(new Set(index.editions.map(e=>e.number)).size,index.editions.length,'Números duplicados');
for (const edition of index.editions) {
  assert(html.has(edition.url));
  assert(html.get('archive.html').includes(edition.url));
  const data = JSON.parse(await readFile(path.join(root,edition.content),'utf8'));
  validateContent(edition,data);
  assert.equal(new Set(data.articles.map(a=>a.id)).size,data.articles.length);
  for (const a of data.articles) {
    assert(html.get(edition.url).includes(`id="${a.id}"`));
    assert(new URL(a.url).protocol==='https:');
    for (const extra of a.additionalSources || []) assert.equal(new URL(extra.url).protocol,'https:');
  }
  if (data.schemaVersion === 2) {
    const page = html.get(edition.url);
    for (const [section] of sectionsFor(data)) assert(page.includes(`id="${section}"`));
    assert.equal([...page.matchAll(/data-searchable/g)].length,data.articles.length);
    for (const a of data.articles) for (const field of ['eventDate','sourceDate']) assert(page.includes(`datetime="${a[field]}"`));
    assert(page.includes('Lo más importante de la semana'));
    assert(page.includes('Qué vigilar la próxima semana'));
  }
}
// Follow CSS imports and url() references, which are not HTML resources.
const checkedCSS = new Set();
async function checkCSS(file) {
  if (checkedCSS.has(file)) return;
  checkedCSS.add(file);
  const css = await readFile(path.join(root,file),'utf8');
  for (const match of css.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
    if (/^(https?:|data:|#)/.test(match[1])) continue;
    const target = path.posix.normalize(path.posix.join(path.posix.dirname(file),match[1]));
    await access(path.join(root,target));
    if (target.endsWith('.css')) await checkCSS(target);
  }
}
await checkCSS('assets/styles.css');
console.log(`OK: ${files.length} páginas, ${links} enlaces/recursos locales y sus fragmentos, índice y artículos.`);
