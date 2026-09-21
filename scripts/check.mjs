import { readFile, readdir, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
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
for (const edition of index.editions) {
  assert(html.has(edition.url));
  assert(html.get('archive.html').includes(edition.url));
  const data = JSON.parse(await readFile(path.join(root,edition.content),'utf8'));
  assert.equal(new Set(data.articles.map(a=>a.id)).size,data.articles.length);
  for (const a of data.articles) {
    assert(html.get(edition.url).includes(`id="${a.id}"`));
    assert(new URL(a.url).protocol==='https:');
  }
}
console.log(`OK: ${files.length} páginas, ${links} enlaces/recursos locales y sus fragmentos, índice y artículos.`);
