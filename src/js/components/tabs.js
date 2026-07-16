// tabs.js - upgrades the no-JS anchor-and-sections fallback into real tabs
// with roving tabindex and automatic activation (docs/08). Markup shape:
// .rs-tabs holds .rs-tabs__tab controls; .rs-tabs__panel sections follow.
import { emit } from '../core/events.js';

let seq = 0;

function enhance(el, options) {
  const ac = new AbortController();
  const { signal } = ac;
  const tabs = [...el.querySelectorAll('.rs-tabs__tab')];
  // panels are the tab targets: prefer href="#id", else sibling panels in order
  const panels = tabs.map((tab, i) => {
    const href = tab.getAttribute('href');
    if (href && href.startsWith('#')) return document.getElementById(href.slice(1));
    return el.parentElement?.querySelectorAll('.rs-tabs__panel')[i] || null;
  });
  if (!tabs.length || panels.some((p) => !p)) return {}; // markup we don't recognize; leave the fallback

  const group = `rs-tabs-${++seq}`;
  // role=tablist goes on a wrapper around just the tab controls, so the panels
  // that follow inside .rs-tabs are never owned by the tablist (valid ARIA)
  const list = document.createElement('div');
  list.className = 'rs-tabs__list';
  list.setAttribute('role', 'tablist');
  tabs[0].before(list);
  tabs.forEach((t) => list.appendChild(t));

  const minted = []; // per tab: which attributes WE added, so destroy hands the DOM back pristine
  tabs.forEach((tab, i) => {
    const tabId = !tab.id;
    if (tabId) tab.id = `${group}-tab-${i}`;
    tab.setAttribute('role', 'tab');
    const panelId = !panels[i].id;
    if (panelId) panels[i].id = `${group}-panel-${i}`;
    tab.setAttribute('aria-controls', panels[i].id);
    panels[i].setAttribute('role', 'tabpanel');
    panels[i].setAttribute('aria-labelledby', tab.id);
    const panelTab = !panels[i].hasAttribute('tabindex');
    if (panelTab) panels[i].tabIndex = 0;
    minted.push({ tabId, panelId, panelTab });

    tab.addEventListener('click', (e) => { e.preventDefault(); select(i, true); }, { signal });
    tab.addEventListener('keydown', onKey, { signal });
  });

  function onKey(e) {
    const i = tabs.indexOf(e.currentTarget);
    let next = i;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % tabs.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    else return;
    e.preventDefault();
    select(next, true); // automatic activation
  }

  function select(i, focus) {
    const previous = tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true');
    tabs.forEach((tab, j) => {
      const on = j === i;
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
      tab.tabIndex = on ? 0 : -1;
      tab.classList.toggle('rs-tabs__tab--active', on);
      panels[j].hidden = !on;
    });
    if (focus) tabs[i].focus();
    if (previous !== -1 && i !== previous) emit(el, 'tabs:change', { selected: i, previous }); // silent on the initial paint
  }

  // honor a pre-marked active tab, else the first
  const start = Math.max(0, tabs.findIndex((t) => t.classList.contains('rs-tabs__tab--active')));
  select(start, false);

  return {
    select: (idOrId) => {
      const i = typeof idOrId === 'number' ? idOrId : tabs.findIndex((t) => t.id === idOrId);
      if (i >= 0) select(i, false);
    },
    destroy() {
      ac.abort();
      tabs.forEach((tab, i) => {
        list.before(tab);
        tab.removeAttribute('role');
        tab.removeAttribute('aria-selected');
        tab.removeAttribute('aria-controls');
        tab.removeAttribute('tabindex');
        tab.classList.remove('rs-tabs__tab--active');
        if (minted[i].tabId) tab.removeAttribute('id'); // only the ids/tabindex we minted, never the author's
      });
      list.remove();
      panels.forEach((p, i) => {
        p.hidden = false;
        p.removeAttribute('role');
        p.removeAttribute('aria-labelledby');
        if (minted[i].panelId) p.removeAttribute('id');
        if (minted[i].panelTab) p.removeAttribute('tabindex');
      });
    },
  };
}

export default { name: 'tabs', selector: '.rs-tabs', enhance };
