/* To-Do List 98, a tiny shareware task manager.
   Plain JavaScript, no modules, no build. Saves to localStorage on this computer.
   (c) 1998 Grebe Software. Evaluation copy. */
(function () {
  'use strict';

  var KEY = 'rs-demo-todo';
  var RS = window.Retrostrap || window.RS;
  var SEED = [
    { text: 'Return the VHS tapes (late fees!!)', done: true },
    { text: 'Burn a mix CD for the road trip', done: false },
    { text: 'Defrag the C: drive', done: false }
  ];

  var tasks = [];
  var sel = -1;
  var idSeq = Date.now();

  // Elements
  var addForm, input, menuEl, tbody, table, emptyState, prog, progBar, progPct, statusCell;

  function nextId() { return ++idSeq; }

  function load() {
    var raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) {}
    if (raw === null) {
      tasks = SEED.map(function (t) { return { id: nextId(), text: t.text, done: t.done }; });
      save();
    } else {
      try { tasks = JSON.parse(raw) || []; } catch (e) { tasks = []; }
      if (!Array.isArray(tasks)) tasks = [];
    }
    sel = tasks.length ? 0 : -1;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(tasks)); } catch (e) {}
  }

  // Dialog helpers (fall back to the browser's own if the framework is missing)
  function confirmDialog(msg, title) {
    if (RS && RS.dialog && RS.dialog.confirm) return RS.dialog.confirm(msg, { title: title, variant: 'warn' });
    return Promise.resolve(window.confirm(msg));
  }
  function alertDialog(msg, title) {
    if (RS && RS.dialog && RS.dialog.alert) return RS.dialog.alert(msg, { title: title, variant: 'info' });
    window.alert(msg); return Promise.resolve();
  }

  function render() {
    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
    if (sel >= tasks.length) sel = tasks.length - 1;
    if (!tasks.length) {
      table.style.display = 'none'; emptyState.style.display = '';
    } else {
      table.style.display = ''; emptyState.style.display = 'none';
      tasks.forEach(function (t, i) {
        var tr = document.createElement('tr');
        tr.className = 'task-row' + (t.done ? ' done' : '');
        tr.dataset.index = i;
        if (i === sel) tr.setAttribute('aria-selected', 'true');
        var td1 = document.createElement('td');
        var cb = document.createElement('input');
        cb.type = 'checkbox'; cb.className = 'rs-checkbox'; cb.id = 'cb-' + t.id;
        cb.checked = !!t.done;
        td1.appendChild(cb);
        var td2 = document.createElement('td');
        var lb = document.createElement('label');
        lb.className = 'task-text'; lb.htmlFor = cb.id; lb.textContent = t.text;
        td2.appendChild(lb);
        tr.appendChild(td1); tr.appendChild(td2);
        tbody.appendChild(tr);
      });
    }
    updateMeters();
  }

  function updateMeters() {
    var total = tasks.length;
    var done = tasks.filter(function (t) { return t.done; }).length;
    var pct = total ? Math.round(done / total * 100) : 0;
    progBar.style.width = pct + '%';
    prog.setAttribute('aria-valuenow', String(pct));
    progPct.textContent = pct + '%';
    statusCell.textContent = total + ' ' + (total === 1 ? 'task' : 'tasks') + ', ' + done + ' done, ' + pct + '%';
  }

  function setSel(i) {
    var rows = tbody.children;
    if (sel >= 0 && rows[sel]) rows[sel].removeAttribute('aria-selected');
    sel = i;
    if (rows[sel]) {
      rows[sel].setAttribute('aria-selected', 'true');
      if (rows[sel].scrollIntoView) rows[sel].scrollIntoView({ block: 'nearest' });
    }
  }

  // Actions
  function addTask(text) {
    text = (text || '').trim();
    if (!text) return;
    tasks.push({ id: nextId(), text: text, done: false });
    sel = tasks.length - 1;
    save(); render();
    input.value = ''; input.focus();
  }

  function markSel() {
    if (sel < 0 || !tasks[sel]) return;
    tasks[sel].done = !tasks[sel].done;
    save(); render();
  }

  function deleteSel() {
    if (sel < 0 || !tasks[sel]) return;
    confirmDialog('Delete this task? There is no recycle bin. There was never a recycle bin.', 'Confirm delete')
      .then(function (ok) {
        if (!ok) return;
        tasks.splice(sel, 1);
        if (sel >= tasks.length) sel = tasks.length - 1;
        save(); render();
      });
  }

  function clearCompleted() {
    var n = tasks.filter(function (t) { return t.done; }).length;
    if (!n) { alertDialog('Nothing to clear, no task is marked done yet. Ambitious.', 'Clear completed'); return; }
    confirmDialog('Remove ' + n + ' completed task' + (n > 1 ? 's' : '') + ' for good?', 'Clear completed')
      .then(function (ok) {
        if (!ok) return;
        tasks = tasks.filter(function (t) { return !t.done; });
        if (sel >= tasks.length) sel = tasks.length - 1;
        save(); render();
      });
  }

  function about() {
    alertDialog('To-Do List 98, version 1.0. © 1998 Grebe Software. This product is shareware: evaluate it free for 30 days, then register for $12 and receive the registered edition on a 3.5-inch floppy by post. Registered users also receive: our gratitude.', 'About To-Do List 98');
  }
  function exitProgram() {
    alertDialog('There is no exit, only more tasks. This evaluation copy also cannot save to floppy; register for the edition that can.', 'Exit');
  }

  function doAction(a) {
    if (a === 'new') input.focus();
    else if (a === 'delete') deleteSel();
    else if (a === 'mark') markSel();
    else if (a === 'clear') clearCompleted();
    else if (a === 'about') about();
    else if (a === 'exit') exitProgram();
  }

  function closeMenus() {
    var open = menuEl.querySelectorAll('[aria-expanded="true"]');
    for (var i = 0; i < open.length; i++) open[i].setAttribute('aria-expanded', 'false');
    if (document.activeElement && menuEl.contains(document.activeElement)) document.activeElement.blur();
  }

  function start() {
    addForm = document.getElementById('add-form');
    input = document.getElementById('new-task');
    menuEl = document.querySelector('.rs-menu');
    tbody = document.getElementById('task-body');
    table = document.getElementById('task-table');
    emptyState = document.getElementById('empty-state');
    prog = document.getElementById('prog');
    progBar = document.getElementById('prog-bar');
    progPct = document.getElementById('prog-pct');
    statusCell = document.getElementById('status-cell');

    load();
    render();

    addForm.addEventListener('submit', function (e) { e.preventDefault(); addTask(input.value); });

    tbody.addEventListener('change', function (e) {
      var cb = e.target;
      if (!cb.classList || !cb.classList.contains('rs-checkbox')) return;
      var tr = cb.closest('tr'); var i = +tr.dataset.index;
      tasks[i].done = cb.checked;
      tr.classList.toggle('done', cb.checked);
      save(); updateMeters();
    });

    tbody.addEventListener('click', function (e) {
      var tr = e.target.closest('tr');
      if (!tr || tr.dataset.index == null) return;
      setSel(+tr.dataset.index);
    });

    // Menu + toolbar actions share one handler via data-action
    document.addEventListener('click', function (e) {
      var el = e.target.closest('[data-action]');
      if (!el) return;
      doAction(el.dataset.action);
      closeMenus();
    });

    // Keyboard: shortcuts fire when focus is not inside a control
    document.addEventListener('keydown', function (e) {
      var tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || tag === 'button' || tag === 'a') return;
      if (!tasks.length) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); setSel(Math.min((sel < 0 ? -1 : sel) + 1, tasks.length - 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setSel(Math.max((sel < 0 ? 0 : sel) - 1, 0)); }
      else if (e.key === ' ') { e.preventDefault(); markSel(); }
      else if (e.key === 'Delete') { e.preventDefault(); deleteSel(); }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
