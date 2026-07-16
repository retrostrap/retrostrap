// mem-email.js, the email transport for tests: it captures instead of sending. Mirrors
// mem-ops.js. `sent` is the outbox to assert against.
export function memEmail() {
  const sent = [];
  return {
    sent,
    send(msg) { sent.push(msg); return Promise.resolve({ to: msg.to, subject: msg.subject, accepted: true }); },
  };
}
