// guestbook.js - the comment section's gentle ancestor (docs/05). Renders a
// list of entries and wires the sign form. Three ways to get entries: an
// endpoint (src), an inline <script type="application/json">, or nothing but a
// mailto fallback (a zero-backend guestbook, which was real and honorable). It
// renders every entry as text nodes only, an injected <script> in a message
// shows up as literal text, never runs.
import { selfRegister, safeUrl } from './_overlay.js';

function factory(el, options, ctx) {
  let destroyed = false; // a late fetch must not render into a torn-down book (cf. webring)
  const list = document.createElement('div');
  list.className = 'rs-guestbook__entries';
  el.appendChild(list);

  function card(entry) {
    const art = document.createElement('article');
    art.className = 'rs-panel';
    const head = document.createElement('h3');
    head.className = 'rs-panel__title';
    const when = entry.date ? ` ~ ${entry.date}` : '';
    const from = entry.from ? ` ~ ${entry.from}` : '';
    head.textContent = `${entry.name || 'Guest'}${from}${when}`; // text only
    const body = document.createElement('p');
    body.textContent = entry.message || ''; // text only, no HTML from data
    art.append(head, body);
    if (entry.homepage) {
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.href = safeUrl(entry.homepage); a.rel = 'nofollow ugc'; a.textContent = 'homepage';
      p.appendChild(a); art.appendChild(p);
    }
    return art;
  }

  function render(entries) {
    list.textContent = '';
    if (!entries || !entries.length) { // a working-but-empty book invites, it doesn't look broken
      const empty = document.createElement('p');
      empty.className = 'rs-guestbook__empty';
      empty.textContent = 'No signatures yet. The pen is warm and the pressure is off.';
      list.appendChild(empty);
      return;
    }
    for (const e of entries) list.appendChild(card(e));
    // rs:content handshake (docs/05): the entries can arrive after the page's
    // first paint, so text-decorating widgets (smilies) get a pass over them too
    ctx.emit('content');
  }

  // source the entries
  const inline = el.querySelector('script[type="application/json"]');
  if (inline) {
    try { const p = JSON.parse(inline.textContent); render(Array.isArray(p) ? p : p.entries); } catch { ctx.log('guestbook: bad inline JSON'); }
  } else if (typeof options.src === 'string') {
    fetch(options.src).then((r) => r.json())
      .then((d) => { if (!destroyed) render(Array.isArray(d) ? d : d.entries); })
      .catch(() => {
        if (destroyed) return;
        const a = document.createElement('div');
        a.className = 'rs-alert rs-alert--info';
        a.textContent = 'The guestbook is taking a nap. Try again later!';
        list.appendChild(a);
      });
  }

  // wire an existing form's honeypot + minimum-time trap, if present
  const form = el.querySelector('form');
  let cleanup = () => {};
  if (form) {
    const started = Date.now();
    const onSubmit = (e) => {
      const hp = form.querySelector('[name="website"]'); // honeypot
      if ((hp && hp.value) || Date.now() - started < 3000) {
        e.preventDefault();
        ctx.log('guestbook: submission looked automated');
      }
    };
    form.addEventListener('submit', onSubmit);
    cleanup = () => form.removeEventListener('submit', onSubmit);
  }

  return { destroy() { destroyed = true; cleanup(); list.remove(); } };
}

export default selfRegister({ id: 'guestbook', motion: 'informative', pointer: 'any', factory });
