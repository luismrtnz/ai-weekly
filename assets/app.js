(() => {
  'use strict';
  // Resolve against this shared asset, including on GitHub Pages project sites.
  const siteRoot = new URL('../', document.currentScript.src);
  document.documentElement.classList.add('js');
  const themeButton = document.querySelector('[data-theme-toggle]');
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  let preference;
  try { preference = localStorage.getItem('ai-weekly-theme'); } catch (_) { /* Storage is optional. */ }
  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    if (themeButton) {
      themeButton.textContent = theme === 'dark' ? '☀ Modo claro' : '◐ Modo oscuro';
      themeButton.setAttribute('aria-label', `Activar modo ${theme === 'dark' ? 'claro' : 'oscuro'}`);
    }
  }
  setTheme(preference === 'dark' || preference === 'light' ? preference : system.matches ? 'dark' : 'light');
  themeButton?.addEventListener('click', () => {
    preference = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    setTheme(preference);
    try { localStorage.setItem('ai-weekly-theme', preference); } catch (_) { /* Keep in-memory preference. */ }
  });
  system.addEventListener('change', e => { if (!preference) setTheme(e.matches ? 'dark' : 'light'); });
  const search = document.querySelector('[data-search]');
  const cards = [...document.querySelectorAll('[data-searchable]')];
  const filters = [...document.querySelectorAll('[data-filter]')];
  let category = 'Todas';
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  function filter() {
    const words = normalize(search?.value.trim() || '').split(/\s+/).filter(Boolean);
    let count = 0;
    cards.forEach(card => {
      const content = normalize(card.textContent + ' ' + card.dataset.categories);
      const matches = words.every(word => content.includes(word)) && (category === 'Todas' || card.dataset.categories.split('|').includes(category));
      card.hidden = !matches;
      if (matches) count++;
    });
    document.querySelectorAll('[data-group]').forEach(group => { group.hidden = ![...group.querySelectorAll('[data-searchable]')].some(card => !card.hidden); });
    const status = document.querySelector('[data-results]');
    if (status) status.textContent = `${count} ${document.body.dataset.page === 'archive' ? (count === 1 ? 'edición' : 'ediciones') : (count === 1 ? 'noticia' : 'noticias')}`;
    const empty = document.querySelector('[data-empty]');
    if (empty) empty.hidden = count > 0;
  }
  search?.addEventListener('input', filter);
  filters.forEach(button => button.addEventListener('click', () => {
    category = button.dataset.filter;
    filters.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    filter();
  }));
  document.querySelector('[data-reset]')?.addEventListener('click', () => {
    if (search) search.value = '';
    category = 'Todas';
    filters.forEach(item => item.setAttribute('aria-pressed', String(item.dataset.filter === 'Todas')));
    filter(); search?.focus();
  });
  if (search) filter();

  const primaryNav = document.querySelector('.nav');
  if (!primaryNav) return;
  const archiveURL = new URL('archive.html', siteRoot);
  const link = (text, url) => {
    const element = document.createElement('a');
    element.textContent = text;
    element.href = url;
    return element;
  };
  const selector = document.createElement('div');
  selector.className = 'edition-selector';
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'edition-toggle';
  toggle.textContent = 'Ediciones ▾';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', 'edition-dropdown');
  const dropdown = document.createElement('div');
  dropdown.id = 'edition-dropdown';
  dropdown.className = 'edition-dropdown';
  dropdown.hidden = true;
  const status = document.createElement('p');
  status.className = 'edition-status';
  status.setAttribute('role', 'status');
  status.textContent = 'Cargando ediciones…';
  const list = document.createElement('ul');
  list.setAttribute('aria-label', 'Ediciones disponibles');
  const archiveLink = link('Ver todo el archivo →', archiveURL);
  archiveLink.className = 'edition-archive';
  dropdown.append(status, list, archiveLink);
  selector.append(toggle, dropdown);
  primaryNav.insertBefore(selector, primaryNav.querySelector('.archive-link'));
  const close = () => {
    dropdown.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
  };
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    dropdown.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
  });
  selector.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !dropdown.hidden) {
      event.preventDefault(); close(); toggle.focus();
    }
    if (event.target === toggle && event.key === 'ArrowDown') {
      event.preventDefault(); dropdown.hidden = false;
      toggle.setAttribute('aria-expanded', 'true');
      dropdown.querySelector('a')?.focus();
    }
  });
  document.addEventListener('click', event => { if (!selector.contains(event.target)) close(); });
  selector.addEventListener('focusout', event => { if (!selector.contains(event.relatedTarget)) close(); });
  const isEdition = document.body.dataset.page === 'edition';
  const weeklyNav = document.createElement('nav');
  weeklyNav.className = 'weekly-navigation';
  weeklyNav.setAttribute('aria-label', 'Navegación entre ediciones');
  const allEditions = link('Todas las ediciones', archiveURL);
  if (isEdition) {
    weeklyNav.append(allEditions);
    document.querySelector('main')?.append(weeklyNav);
  }
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const parseDate = value => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Fecha inválida');
    const date = new Date(`${value}T12:00:00Z`);
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0,10) !== value) throw new Error('Fecha inválida');
    return date;
  };
  const range = edition => {
    const start = parseDate(edition.startDate), end = parseDate(edition.endDate);
    const sameYear = start.getUTCFullYear() === end.getUTCFullYear();
    const sameMonth = sameYear && start.getUTCMonth() === end.getUTCMonth();
    const first = `${start.getUTCDate()}${sameMonth ? '' : ` ${months[start.getUTCMonth()]}`}${sameYear ? '' : ` ${start.getUTCFullYear()}`}`;
    return `${first}${sameMonth ? '–' : ' – '}${end.getUTCDate()} ${months[end.getUTCMonth()]} ${end.getUTCFullYear()}`;
  };
  async function loadEditions() {
    try {
      const response = await fetch(new URL('data/editions.json', siteRoot), {cache: 'no-cache'});
      if (!response.ok) throw new Error('No se pudo cargar el índice');
      const data = await response.json();
      if (!Array.isArray(data.editions)) throw new Error('Índice inválido');
      const editions = data.editions.map(edition => {
        const url = new URL(edition.url, siteRoot);
        if (typeof edition.url !== 'string' || !/^editions\/[\w-]+\.html$/.test(edition.url) || url.origin !== siteRoot.origin || !Number.isInteger(edition.number)) throw new Error('Edición inválida');
        const label = `#${String(edition.number).padStart(2,'0')} · ${range(edition)}`;
        if (edition.endDate < edition.startDate) throw new Error('Intervalo inválido');
        return {...edition, url, label};
      }).sort((a,b) => b.startDate.localeCompare(a.startDate));
      if (new Set(editions.map(e => e.url.href)).size !== editions.length) throw new Error('Ediciones duplicadas');
      // The home page may still feature an older issue while the JSON is updated.
      const displayedURL = document.body.dataset.page === 'home'
        ? document.querySelector('.hero a.button')?.href : isEdition ? location.href : null;
      const displayedPath = displayedURL ? new URL(displayedURL).pathname : null;
      const current = editions.findIndex(edition => edition.url.pathname === displayedPath);
      const items = editions.map((edition, index) => {
        const item = document.createElement('li');
        const anchor = link(edition.label, edition.url);
        if (index === current) {
          anchor.setAttribute('aria-current', 'page');
          const active = document.createElement('span');
          active.className = 'edition-active';
          active.textContent = 'Activa';
          anchor.append(active);
        }
        item.append(anchor); return item;
      });
      list.replaceChildren(...items);
      status.hidden = editions.length > 0;
      status.textContent = 'Todavía no hay ediciones disponibles.';
      if (isEdition && current >= 0) {
        const neighbor = (edition, text, relation) => {
          if (!edition) {
            const unavailable = document.createElement('span');
            unavailable.className = 'edition-unavailable';
            unavailable.textContent = text;
            unavailable.setAttribute('aria-disabled', 'true');
            return unavailable;
          }
          const anchor = link(text, edition.url);
          anchor.rel = relation;
          anchor.setAttribute('aria-label', `${text}: ${edition.label}`);
          return anchor;
        };
        weeklyNav.replaceChildren(
          neighbor(editions[current + 1], '← Edición anterior', 'prev'),
          allEditions,
          neighbor(editions[current - 1], 'Edición siguiente →', 'next')
        );
      }
    } catch (_) {
      status.hidden = false;
      status.textContent = 'No se pudieron cargar las ediciones. Puedes consultar el archivo.';
    }
  }
  loadEditions();
})();
