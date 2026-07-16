/* Server Room Status, the live half of the PixelNet NOC board.
   Plain JavaScript, no modules, no build, no network. The CSS + inline markup
   render the whole board on their own; this file only steps the CPU numbers
   every five seconds, as discrete jumps (Motion Law: data isn't motion).

   ?rs-freeze=1 in the URL parks every timer so screenshots and tests stay still.
   The [freeze] button does the same on demand. */
(function () {
  'use strict';

  var POLL_MS = 5000;

  // Frozen if the URL says so. The board still renders; it just stops stepping.
  var params = new URLSearchParams(location.search);
  var frozen = params.get('rs-freeze') === '1';

  // Deterministic on demand: one seed, one sequence, same board every reload.
  // mulberry32, a tiny, well-behaved seeded PRNG.
  var seed = 0x19991231;
  function rand() {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Each tier keeps its CPU inside a band, so the status word never lies and
  // mimas stays pinned in the red where it belongs.
  var BANDS = { ok: [4, 70], warn: [55, 90], crit: [92, 99] };

  var pollTimer = null, tickTimer = null, nextIn = POLL_MS / 1000;
  var rows = [], lastPoll = '--:--:--';

  var freezeBtn, pollBtn, sbLast, sbNext, announce;

  function pad(n) { return String(n).padStart(2, '0'); }
  function nowClock() {
    var d = new Date();
    return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  }

  // Step one host's CPU by a non-zero amount, reflecting off its band edges so
  // the value always changes and always stays lawful for its status.
  function stepCpu(row) {
    var band = BANDS[row.tier] || BANDS.ok;
    var delta = (Math.floor(rand() * 5) + 1) * (rand() < 0.5 ? -1 : 1); // -5..-1, 1..5
    var next = row.cpu + delta;
    if (next < band[0] || next > band[1]) next = row.cpu - delta; // reflect
    if (next < band[0]) next = band[0];
    if (next > band[1]) next = band[1];
    if (next === row.cpu) next = row.cpu + (row.cpu < band[1] ? 1 : -1);
    row.cpu = next;
  }

  function paintRow(row) {
    row.valEl.textContent = String(row.cpu);
    row.bar.style.width = row.cpu + '%';
    row.prog.setAttribute('aria-valuenow', String(row.cpu));
  }

  function poll() {
    var crit = 0, warn = 0;
    for (var i = 0; i < rows.length; i++) {
      stepCpu(rows[i]);
      paintRow(rows[i]);
      if (rows[i].tier === 'crit') crit++;
      else if (rows[i].tier === 'warn') warn++;
    }
    lastPoll = nowClock();
    sbLast.textContent = 'last poll ' + lastPoll;
    nextIn = POLL_MS / 1000;
    // One polite line per poll, a summary, not a firehose of cells.
    announce.textContent = 'Poll ' + lastPoll + ': ' + rows.length + ' hosts, ' +
      warn + ' warning, ' + crit + ' critical.';
  }

  function tick() {
    nextIn -= 1;
    if (nextIn < 0) nextIn = 0;
    sbNext.textContent = 'next in ' + nextIn + 's';
  }

  function startTimers() {
    stopTimers();
    pollTimer = setInterval(poll, POLL_MS);
    tickTimer = setInterval(tick, 1000);
    sbNext.textContent = 'next in ' + nextIn + 's';
  }
  function stopTimers() {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    if (tickTimer) { clearInterval(tickTimer); tickTimer = null; }
  }

  function applyFrozen() {
    if (frozen) {
      stopTimers();
      sbNext.textContent = 'FROZEN, auto-refresh paused';
    } else {
      nextIn = POLL_MS / 1000;
      startTimers();
    }
    if (freezeBtn) {
      freezeBtn.setAttribute('aria-pressed', frozen ? 'true' : 'false');
      freezeBtn.textContent = frozen ? 'unfreeze' : 'freeze';
    }
  }

  function start() {
    freezeBtn = document.getElementById('freeze-btn');
    pollBtn = document.getElementById('poll-now');
    sbLast = document.getElementById('sb-lastpoll');
    sbNext = document.getElementById('sb-next');
    announce = document.getElementById('poll-status');

    // Read the inline fixture; fall back to the static rows if it is missing.
    var model = {};
    try {
      var raw = document.getElementById('fleet-data');
      if (raw) {
        var data = JSON.parse(raw.textContent);
        (data.hosts || []).forEach(function (h) { model[h.host] = h; });
      }
    } catch (e) { /* static HTML already shows the seeded board */ }

    // Bind each static row to its model tier + live elements.
    var trs = document.querySelectorAll('#fleet-body tr[data-host]');
    Array.prototype.forEach.call(trs, function (tr) {
      var host = tr.getAttribute('data-host');
      var valEl = tr.querySelector('.cpu-val');
      var prog = tr.querySelector('.cpu-bar');
      var bar = tr.querySelector('.rs-progress__bar');
      if (!valEl || !prog || !bar) return;
      rows.push({
        host: host,
        tier: tr.getAttribute('data-tier') || 'ok',
        cpu: parseInt(valEl.textContent, 10) || (model[host] ? model[host].cpu : 0),
        valEl: valEl, prog: prog, bar: bar
      });
    });

    if (pollBtn) pollBtn.addEventListener('click', function () {
      poll();                       // a manual poll always works, freeze or not
      if (!frozen) { nextIn = POLL_MS / 1000; startTimers(); }
    });
    if (freezeBtn) freezeBtn.addEventListener('click', function () {
      frozen = !frozen;
      applyFrozen();
    });

    sbLast.textContent = 'last poll ' + lastPoll;
    applyFrozen();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
