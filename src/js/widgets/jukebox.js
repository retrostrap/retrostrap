// jukebox.js - a playlist player in window chrome (docs/05). It NEVER autoplays
//, there is no autoplay option, and that is the one piece of the era we refuse
// to revive (Decency Law). Full keyboard operation; a fake EQ dances while a
// track plays and holds still under reduced motion.
import { selfRegister } from './_overlay.js';

function factory(el, options, ctx) {
  const tracks = Array.isArray(options.tracks) ? options.tracks
    : (() => { const s = el.querySelector('script[type="application/json"]'); try { return s ? (JSON.parse(s.textContent).tracks || JSON.parse(s.textContent)) : []; } catch { return []; } })();
  if (!tracks.length && typeof options.src !== 'string') { ctx.log('jukebox: no tracks'); return {}; }

  el.classList.add('rs-jukebox', 'rs-window');
  el.setAttribute('role', 'region');
  el.setAttribute('aria-label', 'Jukebox');

  const audio = new Audio();
  audio.preload = 'none'; // and no autoplay, ever
  let idx = 0;

  el.innerHTML = '';
  const bar = document.createElement('div');
  bar.className = 'rs-window__titlebar';
  const lcd = document.createElement('span');
  lcd.className = 'rs-window__title';
  bar.appendChild(lcd);
  // a play() that can't start (no src, undecodable, autoplay policy) must never
  // escape as an unhandled rejection; the error listener below does the talking
  const tryPlay = () => { const p = audio.play(); if (p && p.catch) p.catch(() => {}); };
  // a track that 404s or won't decode should say so, not look armed-but-dead
  // only a track that declared a real src can be "scratched", src-less display
  // mode (band's silent jukebox) sets an empty src, which must not read as an error
  audio.addEventListener('error', () => { if (audio.getAttribute('src')) lcd.textContent = "that one's scratched, try another"; });
  const body = document.createElement('div');
  body.className = 'rs-window__body';

  // transport
  const controls = document.createElement('div');
  controls.className = 'rs-toolbar';
  const mkBtn = (label, aria) => { const b = document.createElement('button'); b.className = 'rs-btn rs-btn--small'; b.textContent = label; b.setAttribute('aria-label', aria); return b; };
  const prev = mkBtn('|◀', 'Previous track');
  const play = mkBtn('▶', 'Play');
  const stop = mkBtn('■', 'Stop');
  const next = mkBtn('▶|', 'Next track');
  const vol = document.createElement('input');
  vol.type = 'range'; vol.min = '0'; vol.max = '100'; vol.value = '80';
  vol.setAttribute('aria-label', 'Volume'); vol.className = 'rs-jukebox__vol';
  controls.append(prev, play, stop, next, vol);

  // a seek bar: scrub the current track; a native range is keyboard-operable for free
  const seek = document.createElement('input');
  seek.type = 'range'; seek.min = '0'; seek.max = '100'; seek.value = '0';
  seek.setAttribute('aria-label', 'Seek'); seek.className = 'rs-jukebox__seek';
  seek.style.cssText = 'inline-size:100%;margin:4px 0';
  const fmtTime = (t) => { t = Math.max(0, Math.floor(t || 0)); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };
  const seekLabel = () => seek.setAttribute('aria-valuetext', `${fmtTime(audio.currentTime)} of ${fmtTime(audio.duration)}`);
  let seeking = false;
  audio.addEventListener('loadedmetadata', () => { seek.max = String(Math.max(1, Math.floor(audio.duration || 0))); seekLabel(); });
  audio.addEventListener('timeupdate', () => { if (!seeking) { seek.value = String(Math.floor(audio.currentTime)); seekLabel(); } });
  seek.addEventListener('input', () => { seeking = true; if (audio.duration) audio.currentTime = Number(seek.value); seekLabel(); });
  seek.addEventListener('change', () => { seeking = false; });

  // fake EQ, eight bars in a sunken well, self-styled so the widget needs no
  // extra stylesheet
  const eq = document.createElement('div');
  eq.className = 'rs-jukebox__eq';
  eq.setAttribute('aria-hidden', 'true');
  eq.style.cssText = 'display:flex;align-items:flex-end;gap:2px;height:24px;padding:2px;margin:4px 0;' +
    'background:#000000;border:2px solid;border-color:#808080 #FFFFFF #FFFFFF #808080';
  for (let i = 0; i < 8; i++) {
    const s = document.createElement('span');
    s.style.cssText = 'flex:1;block-size:20%;background:#00FF00;align-self:flex-end';
    eq.appendChild(s);
  }

  // tracklist
  const ol = document.createElement('ol');
  ol.className = 'rs-jukebox__list';
  tracks.forEach((t, i) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.className = 'rs-btn rs-btn--link';
    b.textContent = t.title || `Track ${i + 1}`;
    b.addEventListener('click', () => { idx = i; load(); tryPlay(); });
    li.appendChild(b);
    ol.appendChild(li);
  });

  body.append(controls, seek, eq, ol);
  el.append(bar, body);

  let stopEqTick = () => {}; // lives up here: load() runs once before the EQ block below

  function load() {
    stopEq(); // swapping src pauses silently (no 'pause' event), so park the bars here
    const t = tracks[idx] || {};
    audio.src = t.src || options.src || '';
    lcd.textContent = t.title || 'Jukebox';
    ctx.emit('jukebox:track', { index: idx, title: t.title });
    [...ol.children].forEach((li, i) => li.firstChild.setAttribute('aria-current', i === idx ? 'true' : 'false'));
  }
  load();
  vol.addEventListener('input', () => { audio.volume = Number(vol.value) / 100; });
  audio.volume = 0.8;

  play.addEventListener('click', () => { audio.paused ? tryPlay() : audio.pause(); });
  stop.addEventListener('click', () => { stopEq(); audio.pause(); audio.currentTime = 0; }); // pause() on an already-paused element fires nothing
  prev.addEventListener('click', () => { if (!tracks.length) return; idx = (idx - 1 + tracks.length) % tracks.length; load(); tryPlay(); });
  next.addEventListener('click', () => { if (!tracks.length) return; idx = (idx + 1) % tracks.length; load(); tryPlay(); });
  audio.addEventListener('play', () => {
    play.textContent = '⏸'; play.setAttribute('aria-label', 'Pause'); startEq();
    const t = tracks[idx] || {};
    ctx.announce(`Now playing: ${t.title || `Track ${idx + 1}`}`); // spoken on any start, auto-advance included
  });
  audio.addEventListener('pause', () => { play.textContent = '▶'; play.setAttribute('aria-label', 'Play'); stopEq(); });
  audio.addEventListener('ended', () => {
    stopEq(); // 'ended' fires no 'pause', so stop the bars here or they dance on past the last track
    // guard only the index math against a 0-track (src-only) player, not the replay: a lone src + loop still loops
    if (options.loop || idx < tracks.length - 1) { idx = tracks.length ? (idx + 1) % tracks.length : 0; load(); tryPlay(); }
  });
  // a mid-track decode failure never fires 'pause'; put the transport back
  audio.addEventListener('error', () => { play.textContent = '▶'; play.setAttribute('aria-label', 'Play'); stopEq(); });

  // the EQ dances only while playing, and only if motion is welcome. Jukebox is
  // informative, so the engine won't re-init it when the preference flips; read
  // it live at play time (the public reading, docs/08) instead of the snapshot.
  function startEq() {
    stopEqTick(); stopEqTick = () => {}; // idempotent: never stack a second ticker on top of a live one
    const rs = typeof window !== 'undefined' && (window.Retrostrap || window.RS);
    if (rs?.motion?.reduced ? rs.motion.reduced() : ctx.reducedMotion) return;
    let seed = 7;
    stopEqTick = ctx.ticker.add(() => {
      for (const s of eq.children) {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        s.style.blockSize = `${20 + (seed % 80)}%`;
      }
    });
  }
  function stopEq() { stopEqTick(); stopEqTick = () => {}; for (const s of eq.children) s.style.blockSize = '20%'; }

  return {
    destroy() { stopEq(); audio.pause(); audio.src = ''; el.classList.remove('rs-jukebox', 'rs-window'); el.innerHTML = ''; },
  };
}

export default selfRegister({ id: 'jukebox', motion: 'informative', pointer: 'any', factory });
