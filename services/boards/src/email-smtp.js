// email-smtp.js, the only network-touching email file: Fastmail SMTP submission over
// implicit TLS (port 465). Swap this transport for an SES one later without touching email.js
// or any caller. Config from env: SMTP_HOST, SMTP_PORT, SMTP_USER (a Fastmail address),
// SMTP_PASS (a Fastmail *app password*, never the account password), and the From header.
// Because the domain's DKIM/SPF live at Fastmail, mail relayed here authenticates on arrival.
import tls from 'node:tls';
import { randomUUID } from 'node:crypto';
import { buildMime, extractAddr, messageIdDomain } from './email.js';

const CRLF = '\r\n';
const b64 = (s) => Buffer.from(String(s), 'utf8').toString('base64');

/** Build a transport bound to one SMTP account. `from` is the default From header. */
export function smtpTransport({ host = 'smtp.fastmail.com', port = 465, user, pass, from } = {}) {
  return {
    async send({ to, subject, text, from: msgFrom }) {
      const fromHeader = msgFrom || from;
      const sender = extractAddr(fromHeader);
      const data = buildMime({
        from: fromHeader, to, subject, text,
        // the Message-ID wears our own domain, not the relay's
        messageId: `${randomUUID()}@${messageIdDomain(fromHeader, host)}`,
        date: new Date().toUTCString(),
      });
      await deliver({ host, port, user, pass, sender, rcpt: extractAddr(to), data });
      return { to: extractAddr(to), subject };
    },
  };
}

// One message, one connection: greet, EHLO, AUTH LOGIN, envelope, DATA, QUIT.
function deliver({ host, port, user, pass, sender, rcpt, data }) {
  return new Promise((resolve, reject) => {
    const socket = tls.connect({ host, port, servername: host });
    socket.setEncoding('utf8');
    socket.setTimeout(20000, () => socket.destroy(new Error('SMTP timed out')));
    const io = reader(socket, reject);
    (async () => {
      try {
        await io.expect(220);
        io.write(`EHLO ${host}${CRLF}`); await io.expect(250);
        io.write(`AUTH LOGIN${CRLF}`); await io.expect(334);
        io.write(b64(user) + CRLF); await io.expect(334);
        io.write(b64(pass) + CRLF); await io.expect(235);
        io.write(`MAIL FROM:<${sender}>${CRLF}`); await io.expect(250);
        io.write(`RCPT TO:<${rcpt}>${CRLF}`); await io.expect(250);
        io.write(`DATA${CRLF}`); await io.expect(354);
        io.write(data + CRLF); await io.expect(250);
        io.write(`QUIT${CRLF}`);
        socket.end();
        resolve({ ok: true, to: rcpt });
      } catch (e) {
        socket.destroy();
        reject(e);
      }
    })();
  });
}

// Reads one SMTP reply at a time. A reply's final line is `NNN ` (space), continuations `NNN-`.
// The flow awaits each expect() in turn, so a single pending waiter is enough.
function reader(socket, onError) {
  let buffer = '';
  let waiting = null;
  const flush = () => {
    if (!waiting) return;
    const m = buffer.match(/^(?:\d{3}-[^\r\n]*\r\n)*(\d{3}) [^\r\n]*\r\n/);
    if (!m) return;
    buffer = buffer.slice(m[0].length);
    const w = waiting; waiting = null;
    w.settle(Number(m[1]), m[0]);
  };
  socket.on('data', (chunk) => { buffer += chunk; flush(); });
  socket.on('error', (e) => { const w = waiting; waiting = null; (w ? w.reject : onError)(e); });
  return {
    write: (s) => socket.write(s),
    expect: (code) => new Promise((resolve, reject) => {
      waiting = { settle: (got, text) => (got === code ? resolve() : reject(new Error(`SMTP: expected ${code}, got ${text.trim()}`))), reject };
      flush();
    }),
  };
}
