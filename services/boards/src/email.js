// email.js, the Boards' transactional mail: pure message-building over an injected transport,
// so the copy and the MIME safety test at the repo root with no network. email-smtp.js binds
// Fastmail SMTP submission (the only socket-touching file); mem-email.js captures sends for
// tests. Plain-text UTF-8 only, which is period-right, deliverable, and dodges HTML-mail bloat.
// The transport supplies From/Date/Message-ID; the builders only know the recipient and the link.

const CRLF = '\r\n';

/** Fold a header value onto one line, the header-injection guard (no CR/LF smuggling). */
export const stripHeader = (v) => String(v ?? '').replace(/[\r\n]+/g, ' ').trim();
/** Pull the bare address out of a `Name <addr>` header (for the SMTP envelope). CR/LF are
    stripped so a crafted address can't smuggle a second MAIL FROM/RCPT TO command on the wire. */
export const extractAddr = (s) => { const m = String(s ?? '').match(/<([^>]+)>/); return (m ? m[1] : String(s ?? '')).replace(/[\r\n]/g, '').trim(); };
/** The domain a Message-ID should wear: the From address's own, else the fallback.
    lastIndexOf, because a quoted local part may legally carry an @ of its own. */
export const messageIdDomain = (fromHeader, fallback) => {
  const addr = extractAddr(fromHeader);
  const at = addr.lastIndexOf('@');
  const domain = at > -1 ? addr.slice(at + 1).trim() : '';
  return domain || fallback;
};
/** RFC 2047 encoded-word so a non-ASCII subject (German, say) survives the wire. */
export const encodeWord = (v) => (/^[\x20-\x7E]*$/.test(v) ? v : `=?UTF-8?B?${Buffer.from(String(v), 'utf8').toString('base64')}?=`);
/** CRLF line endings + RFC 5321 dot-stuffing, so a line starting with '.' can't end DATA early. */
export const dotStuff = (body) => String(body).replace(/\r?\n/g, CRLF).replace(/^\./gm, '..');

/** Assemble the full RFC 822 message. Header values are stripped; the body is dot-stuffed. */
export function buildMime({ from, to, subject, text, messageId, date }) {
  const headers = [
    `From: ${stripHeader(from)}`,
    `To: ${stripHeader(to)}`,
    `Subject: ${encodeWord(stripHeader(subject))}`,
    `Date: ${stripHeader(date)}`,
    `Message-ID: <${stripHeader(messageId)}>`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: 8bit',
    'Auto-Submitted: auto-generated', // RFC 3834: don't auto-reply to us
  ].join(CRLF);
  return `${headers}${CRLF}${CRLF}${dotStuff(text)}${CRLF}.`;
}

/** The two launch-critical letters. `transport.send({to, subject, text})` does the delivery. */
export function emailer(transport, { appName = 'Retrostrap Boards' } = {}) {
  return {
    sendVerification: ({ to, displayName, verifyUrl }) => transport.send({
      to,
      subject: `Confirm your ${appName} account`,
      text: `Hi ${displayName || 'there'},

Welcome aboard. Confirm your account by opening this link:

${verifyUrl}

It works once and expires in a day. Didn't sign up? Ignore this note and nothing happens.

See you on the boards,
The maintainers`,
    }),
    sendPasswordReset: ({ to, displayName, resetUrl }) => transport.send({
      to,
      subject: `Reset your ${appName} password`,
      text: `Hi ${displayName || 'there'},

Someone asked to reset your password. Open this link to set a new one:

${resetUrl}

It works once and expires in an hour. Didn't ask? Ignore this note; your password stays as it is.

The maintainers`,
    }),
    // Sent when someone tries to register an address that already has an account, so the
    // sign-up response can be identical for new and existing emails (no account enumeration).
    sendAccountExists: ({ to, displayName, loginUrl }) => transport.send({
      to,
      subject: `You already have a ${appName} account`,
      text: `Hi ${displayName || 'there'},

Someone (maybe you) just tried to sign up with this email, but you already have an account here. No new account was made. Log in, or reset your password, at:

${loginUrl}

If this wasn't you, you can ignore this note.

The maintainers`,
    }),
  };
}
