(() => {
  'use strict';
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
})();
