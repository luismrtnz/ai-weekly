import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { sectionsFor, validateContent } from './editorial.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = async file => JSON.parse(await readFile(path.join(root, file), 'utf8'));
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const index = await read('data/editions.json');
const editions = [...index.editions].sort((a,b) => b.startDate.localeCompare(a.startDate));
if (!editions.length) throw new Error('El índice necesita al menos una edición.');
if (new Set(editions.map(e => e.slug)).size !== editions.length) throw new Error('Hay ediciones duplicadas.');
const latest = editions[0];
const date = value => new Intl.DateTimeFormat('es-ES',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(value+'T12:00:00Z'));
const period = e => `${date(e.startDate)} — ${date(e.endDate)}`;
const number = e => String(e.number).padStart(2,'0');
const shortPeriod = e => `${new Intl.DateTimeFormat('es-ES',{day:'numeric',month:'short',timeZone:'UTC'}).format(new Date(e.startDate+'T12:00:00Z'))} — ${new Intl.DateTimeFormat('es-ES',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(e.endDate+'T12:00:00Z'))}`;
const contents = new Map();
for (const e of editions) {
  const c = await read(e.content);
  validateContent(e, c);
  contents.set(e.slug, c);
}
function shell(page, title, description, body, edition = latest) {
  const prefix = page === 'edition' ? '../' : '';
  const editionLink = page === 'edition' ? '' : edition.url;
  const sectionNav = sectionsFor(contents.get(edition.slug)).filter(([id]) => ['developer','mercados','negocio','politica'].includes(id)).map(([id,name]) => `<a href="${editionLink}#${id}">${esc(name)}</a>`).join('');
  const nav = (href,label,current) => `<a href="${href}"${current ? ' aria-current="page"' : ''}>${label}</a>`;
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light dark"><title>${esc(title)} — AI Weekly</title><meta name="description" content="${esc(description)}"><meta name="author" content="Luis Martínez Plano"><link rel="icon" href="${prefix}assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="${prefix}assets/styles.css"><script src="${prefix}assets/app.js" defer></script></head>
<body data-page="${page}"><a class="skip" href="#main">Saltar al contenido</a><div class="wrap"><header><div class="topline"><span><span class="edition-dot">●</span> Edición #${number(edition)} · ${esc(shortPeriod(edition))}</span><span class="top-caption">Una semana. Todas las perspectivas.</span><button type="button" class="theme js-only" data-theme-toggle>◐ Modo oscuro</button></div><div class="masthead"><div><a href="${prefix}index.html" class="brand" aria-label="AI Weekly, portada">AI WEEKLY</a><p class="byline">by Luis Martínez Plano</p></div><p class="mast-note">Una mirada semanal a la inteligencia artificial que cambia el mundo.</p></div><nav class="nav" aria-label="Navegación principal">${nav(prefix+'index.html','Portada',page==='home')}${nav(prefix+latest.url,'Última edición',page==='edition' && edition.slug===latest.slug)}${sectionNav}<a class="archive-link" href="${prefix}archive.html"${page==='archive'?' aria-current="page"':''}>Archivo ↗</a></nav><div class="scope">MODELOS Y NUEVAS VERSIONES · AGENTES · HERRAMIENTAS Y FRAMEWORKS · APIs, SDKs Y LIBRERÍAS · OPEN SOURCE · INVESTIGACIÓN · IA Y BOLSA · STARTUPS E INVERSIÓN · CHIPS E INFRAESTRUCTURA · POLÍTICA · REGULACIÓN · GEOPOLÍTICA · SEGURIDAD</div></header>
<main id="main">${body}</main><section class="author" aria-labelledby="author-title"><div class="monogram" aria-hidden="true">LM</div><div><span class="eyebrow">Detrás de esta edición</span><h2 id="author-title">Luis Martínez Plano</h2><p>AI Weekly conecta las novedades técnicas con sus consecuencias en la empresa, los mercados y la sociedad. Una selección semanal con fuentes y contexto.</p></div></section><footer><span>© 2026 AI Weekly · by Luis Martínez Plano</span><a href="${prefix}archive.html">Explorar el archivo →</a><a href="#main">Volver arriba ↑</a></footer></div></body></html>\n`;
}
function toolbar(categories, archive = false) {
  return `<div class="toolbar js-only"><div class="search-row"><label class="search-label" for="search">${archive?'Buscar ediciones':'Buscar en la edición'}</label><input id="search" class="search" type="search" placeholder="${archive?'Tema, fecha o edición…':'Modelos, empresas, herramientas…'}" data-search autocomplete="off" aria-controls="results"></div><div class="filters" role="group" aria-label="Filtrar por categoría">${['Todas',...categories].map((c,i)=>`<button class="filter" type="button" data-filter="${esc(c)}" aria-pressed="${i===0}">${esc(c)}</button>`).join('')}</div><p class="results-count" data-results role="status" aria-live="polite"></p></div>`;
}
const empty = '<div class="empty" data-empty hidden><h2>No encontramos coincidencias</h2><p>Prueba otro término o amplía la categoría.</p><button class="filter" type="button" data-reset>Limpiar búsqueda y filtros</button></div>';
function card(a, home, e) {
  return `<article class="news-card" id="${esc(a.id)}" data-searchable data-categories="${esc(a.categories.join('|'))}"><span class="eyebrow">${esc(a.label)}</span>${a.eventDate ? `<p class="source">${esc(a.categories.join(" / "))} · <strong>${esc(a.status)}</strong><br>Fecha: <time datetime="${a.eventDate}">${date(a.eventDate)}</time> · Fuente: <time datetime="${a.sourceDate}">${date(a.sourceDate)}</time><br>${esc(a.dateContext)}</p>` : ""}<h3>${home?`<a href="${e.url}#${esc(a.id)}">${esc(a.title)}</a>`:esc(a.title)}</h3><p>${esc(a.summary)}</p><div class="importance"><strong>Por qué importa${a.eventDate ? " · Análisis" : ""}</strong><p>${esc(a.why)}</p></div><a class="source" href="${esc(a.url)}" target="_blank" rel="noopener noreferrer">Fuente: ${esc(a.source)} ↗<span class="sr-only"> (nueva pestaña)</span></a>${(a.additionalSources || []).map(x => `<br><a class="source" href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${esc(x.source)} ↗<span class="sr-only"> (nueva pestaña)</span></a>`).join('')}</article>`;
}
function news(content, home, e) {
  return `<div class="section-heading"><h2>${home?'El pulso de la semana':'Todas las claves'}</h2><small>${content.articles.length} noticias · Edición #${number(e)}</small></div>${toolbar(e.categories)}<div id="results">${sectionsFor(content).map(([id,name])=>`<section class="section-group" id="${id}" data-group aria-labelledby="heading-${id}"><h2 class="group-title" id="heading-${id}">${esc(name)}</h2><div class="news-grid">${content.articles.filter(a=>a.section===id).map(a=>card(a,home,e)).join('')}</div></section>`).join('')}</div>${empty}`;
}
function watch(content) {return `<aside class="watch" id="vigilar"><div><span class="eyebrow">La agenda abierta</span><h2>Qué vigilar la próxima semana</h2></div><ol>${content.watch.map(x=>`<li>${esc(x)}</li>`).join('')}</ol></aside>`;}
const content = contents.get(latest.slug);
function briefing(c) {
  return c.briefing?.length ? `<aside class="briefing" aria-label="En un minuto"><div class="eyebrow">En un minuto</div>${c.briefing.map(x=>`<p><span>${esc(x.label)}</span>${esc(x.text)}</p>`).join('')}</aside>` : '';
}
function highlights(c, home, e) {
  return c.highlights?.length ? `<section class="section-group" id="importante"><h2 class="group-title">Lo más importante de la semana</h2><div class="news-grid">${c.highlights.map(x=>`<article class="news-card"><span class="eyebrow">Análisis editorial</span><h3>${esc(x.label)}</h3><p>${esc(x.text)}</p><a class="source" href="${home?e.url:''}#${esc(x.articleId)}">Ver noticia →</a></article>`).join('')}</div></section>` : '';
}
const art = `<div class="hero-art" aria-hidden="true"><span class="art-label">Inteligencia en movimiento</span><div class="orbit"><div class="core"></div></div><div class="art-bottom"><strong>${number(latest)}</strong><span>${esc(content.artLabel || "Una semana de IA")} ↗</span></div></div>`;
const home = `<section class="hero"><div><span class="eyebrow">Edición #${number(latest)} · ${esc(shortPeriod(latest))}</span><h1>${esc(latest.title).replace(/ actuar$/, ' <em>actuar.</em>')}</h1><p class="lead">${esc(latest.summary)} Las claves de la semana, con contexto para entender lo que viene.</p><a class="button" href="${latest.url}">Leer la edición #${number(latest)} <span aria-hidden="true">↗</span></a></div>${art}</section>${briefing(content)}${news(content,true,latest)}${highlights(content,true,latest)}${watch(content)}`;
await writeFile(path.join(root,'index.html'),shell('home','La semana en inteligencia artificial',latest.summary,home));
const archive = `<section class="archive-hero"><span class="eyebrow">La hemeroteca</span><h1>El futuro también<br>tiene <em>archivo.</em></h1><p class="lead">Cada semana, una nueva perspectiva. Todas las ediciones de AI Weekly, en un mismo lugar.</p></section>${toolbar([...new Set(editions.flatMap(e=>e.categories))],true)}<div id="results">${editions.map(e=>`<article class="archive-card" data-searchable data-categories="${esc(e.categories.join('|'))}"><div class="archive-number">${number(e)}</div><div><span class="eyebrow">Edición #${number(e)} · <time datetime="${e.startDate}">${esc(period(e))}</time></span><h2><a href="${e.url}">${esc(e.title)}</a></h2><p>${esc(e.summary)}</p><span class="source">${esc(e.startDate)} · ${esc(e.categories.join(' / '))}</span></div><a class="button" href="${e.url}">Leer edición ↗</a></article>`).join('')}</div>${empty}<p class="note">Una hemeroteca en construcción, edición a edición. Las publicaciones anteriores conservan su enlace permanente.</p>`;
await writeFile(path.join(root,'archive.html'),shell('archive','Archivo de ediciones','El histórico de AI Weekly. Todas las ediciones de Luis Martínez Plano.',archive));
await mkdir(path.join(root,'editions'),{recursive:true});
for (const e of editions) {
  const destination = path.join(root,e.url);
  let exists = false; try { await access(destination); exists = true; } catch {}
  // Preserve published editions. Corrections are explicit, never a side effect of publishing.
  if (exists && !process.argv.includes(`--update=${e.slug}`)) continue;
  const c = contents.get(e.slug);
  const body = `<section class="archive-hero edition-intro"><a class="back" href="../archive.html">← Todas las ediciones</a><p class="eyebrow" style="margin-top:26px">Edición #${number(e)} · ${esc(period(e))}</p><h1>${esc(e.title)}</h1><p class="lead">${esc(e.summary)}</p><p class="source">Por Luis Martínez Plano · Publicado el <time datetime="${e.publishedAt}">${date(e.publishedAt)}</time></p></section><nav class="contents" aria-label="Contenido de la edición">${sectionsFor(c).map(([id,name])=>`<a href="#${id}">${esc(name)}</a>`).join('')}${c.highlights?.length?'<a href="#importante">Lo más importante</a>':''}<a href="#vigilar">Qué vigilar</a></nav>${briefing(c)}${news(c,false,e)}${highlights(c,false,e)}${watch(c)}<p class="note">Cierre editorial: ${date(e.endDate)}. Las fuentes se consultaron el ${date(e.publishedAt)}. «Por qué importa» recoge interpretación editorial. Cada pieza distingue la fecha de la novedad de la fecha de su fuente. «Información de terceros» identifica reportes atribuidos con sus límites de confirmación. «Qué vigilar» recoge expectativas y seguimiento, no hechos futuros confirmados. Las cifras financieras son información periodística, no recomendaciones de inversión.</p><a class="button" href="../archive.html">Volver al archivo →</a>`;
  await writeFile(destination,shell('edition',`Edición #${number(e)} · ${e.title}`,e.summary,body,e));
}
console.log(`Generadas portada y archivo; ${editions.length} edición(es) indexada(s). Histórico conservado.`);
