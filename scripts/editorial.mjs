import assert from 'node:assert/strict';

export const sectionNames = {
  modelos: 'Modelos & Producto', agentes: 'Agentes', developer: 'Developer Corner',
  herramientas: 'Herramientas & Frameworks', opensource: 'Open Source', research: 'Research',
  mercados: 'Bolsa & Mercados', startups: 'Startups & Inversión', infraestructura: 'Chips & Infraestructura',
  politica: 'Política & Regulación', seguridad: 'Seguridad',
  actualidad: 'Modelos & Agentes', negocio: 'Bolsa & Negocio'
};
export const sectionsFor = content => Object.entries(sectionNames).filter(([id]) => content.articles.some(a => a.section === id));
export function validateContent(edition, content) {
  assert(Array.isArray(content.articles) && content.articles.length, 'Se necesitan noticias');
  const ids = new Set();
  for (const a of content.articles) {
    for (const field of ['id','section','title','summary','why','label','source','url']) assert(typeof a[field] === 'string' && a[field].trim(), `${a.id}: falta ${field}`);
    assert(/^[a-z][a-z0-9-]*$/.test(a.id) && !ids.has(a.id), `ID inválido o duplicado: ${a.id}`);
    assert(![...Object.keys(sectionNames), 'main', 'results', 'vigilar', 'importante'].includes(a.id), `ID reservado: ${a.id}`);
    ids.add(a.id);
    assert(sectionNames[a.section], `Sección desconocida: ${a.section}`);
    assert(Array.isArray(a.categories) && a.categories.length && a.categories.every(c => edition.categories.includes(c)), `${a.id}: categorías inválidas`);
    assert.equal(new URL(a.url).protocol, 'https:');
    if (content.schemaVersion === 2) {
      for (const key of ['eventDate','sourceDate']) assert(/^\d{4}-\d{2}-\d{2}$/.test(a[key]) && new Date(a[key]+'T12:00:00Z').toISOString().slice(0,10) === a[key], `${a.id}: ${key} inválida`);
      assert(a.eventDate >= edition.startDate && a.eventDate <= edition.endDate, `${a.id}: fuera del periodo`);
      assert(a.sourceDate <= edition.publishedAt, `${a.id}: fuente futura`);
      assert(['Confirmado','Información de terceros','Rumor'].includes(a.status), `${a.id}: estado inválido`);
      assert(a.dateContext && a.verification, `${a.id}: falta contexto o evidencia`);
    }
  }
  assert(Array.isArray(content.watch) && content.watch.length);
  if (content.schemaVersion === 2) {
    assert.equal(content.timezone, 'Europe/Madrid');
    assert.equal(content.period.startDate, edition.startDate);
    assert.equal(content.period.endDate, edition.endDate);
    assert.equal(new Date(edition.startDate+'T12:00:00Z').getUTCDay(), 1);
    assert.equal((Date.parse(edition.endDate)-Date.parse(edition.startDate))/86400000, 6);
    // A delayed run retains its closed editorial week and records the real publication date.
    for (const value of [edition.publishedAt, content.researchedAt]) {
      assert(/^\d{4}-\d{2}-\d{2}$/.test(value) && new Date(value+'T12:00:00Z').toISOString().slice(0,10) === value, 'Fecha de publicación/consulta inválida');
    }
    assert(Date.parse(edition.publishedAt) > Date.parse(edition.endDate), 'Publicación anterior al cierre');
    assert(content.researchedAt <= edition.publishedAt && content.researchedAt > edition.endDate, 'Consulta fuera del cierre/publicación');
    assert.equal(content.briefing.length, 3);
    for (const item of [...content.briefing, ...content.highlights]) assert(item.label && item.text && ids.has(item.articleId), 'Resumen sin noticia de respaldo');
    assert(content.highlights.length > 0);
  }
}
