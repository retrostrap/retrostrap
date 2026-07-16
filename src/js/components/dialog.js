// dialog.js - two jobs. It enhances author-written <dialog class="rs-dialog">
// so focus returns to whatever opened it, and it exports alert()/confirm()
// helpers that build a system-styled dialog on the fly. Native <dialog> gives
// us the focus trap, Escape, and the top layer for free (docs/08).
import { emit } from '../core/events.js';

function enhance(el) {
  let opener = null;

  // remember who opened us so we can hand focus back
  const showModal = el.showModal.bind(el);
  el.showModal = () => { opener = document.activeElement; showModal(); emit(el, 'dialog:open', {}); };
  const show = el.show.bind(el);
  el.show = () => { opener = document.activeElement; show(); emit(el, 'dialog:open', {}); };

  const onClose = () => {
    emit(el, 'dialog:close', { returnValue: el.returnValue });
    opener?.focus?.();
  };
  el.addEventListener('close', onClose);

  return {
    showModal: () => el.showModal(),
    close: (v) => el.close(v),
    destroy() {
      el.removeEventListener('close', onClose);
      delete el.showModal;
      delete el.show;
    },
  };
}

export default { name: 'dialog', selector: 'dialog.rs-dialog', enhance };

// ---- the programmatic helpers (Retrostrap.dialog.alert / .confirm) ----------

let dlgSeq = 0; // a counter, not Date.now(): two dialogs built in the same ms need distinct ids

function build(message, { title = '', variant = 'info', confirm = false } = {}) {
  const dlg = document.createElement('dialog');
  dlg.className = `rs-dialog rs-dialog--${variant}`;

  const bar = document.createElement('div');
  bar.className = 'rs-dialog__titlebar';
  bar.id = `rs-dlg-${++dlgSeq}`;
  bar.textContent = title || (confirm ? 'Confirm' : 'Message');
  dlg.setAttribute('aria-labelledby', bar.id);

  const body = document.createElement('div');
  body.className = 'rs-dialog__body';
  body.id = `rs-dlg-body-${dlgSeq}`;
  body.textContent = message; // text node only, no HTML from strings (docs/03)
  dlg.setAttribute('aria-describedby', body.id); // the titlebar names it; the body is the message an AT should read

  const buttons = document.createElement('form');
  buttons.method = 'dialog';
  buttons.className = 'rs-dialog__buttons';

  const ok = document.createElement('button');
  ok.className = 'rs-btn rs-btn--primary';
  ok.value = 'ok';
  ok.autofocus = true;
  ok.textContent = 'OK';
  buttons.appendChild(ok);

  if (confirm) {
    const cancel = document.createElement('button');
    cancel.className = 'rs-btn';
    cancel.value = 'cancel';
    cancel.textContent = 'Cancel';
    buttons.appendChild(cancel);
  }

  dlg.append(bar, body, buttons);
  return dlg;
}

function open(message, opts) {
  return new Promise((resolve) => {
    const opener = document.activeElement;
    const dlg = build(message, opts);
    document.body.appendChild(dlg);
    dlg.addEventListener('close', () => {
      dlg.remove();
      opener?.focus?.();
      resolve(dlg.returnValue === 'ok');
    });
    dlg.showModal();
  });
}

export function alert(message, opts = {}) {
  return open(message, { ...opts, confirm: false }).then(() => undefined);
}
export function confirm(message, opts = {}) {
  return open(message, { ...opts, confirm: true });
}
