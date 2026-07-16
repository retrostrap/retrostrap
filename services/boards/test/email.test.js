// The transactional letters (copy + the one-time link) and the MIME safety that keeps a
// crafted name or subject from injecting headers. Network transport isn't unit-tested.
import { describe, it, expect } from 'vitest';
import { emailer, buildMime, stripHeader, encodeWord, dotStuff, extractAddr } from '../src/email.js';
import { memEmail } from '../src/mem-email.js';

describe('transactional emails', () => {
  it('builds a verification email carrying the one-time link', async () => {
    const t = memEmail();
    await emailer(t).sendVerification({ to: 'new@x.example', displayName: 'Ada', verifyUrl: 'https://retrostrap.dev/verify?token=abc' });
    expect(t.sent).toHaveLength(1);
    expect(t.sent[0].to).toBe('new@x.example');
    expect(t.sent[0].subject).toBe('Confirm your Retrostrap Boards account');
    expect(t.sent[0].text).toContain('https://retrostrap.dev/verify?token=abc');
    expect(t.sent[0].text).toContain('Ada');
    expect(t.sent[0].text).not.toContain('—'); // house voice: no em-dash
  });

  it('builds a password-reset email that expires in an hour', async () => {
    const t = memEmail();
    await emailer(t).sendPasswordReset({ to: 'a@x.example', displayName: 'Ada', resetUrl: 'https://retrostrap.dev/reset?token=xyz' });
    expect(t.sent[0].subject).toBe('Reset your Retrostrap Boards password');
    expect(t.sent[0].text).toContain('https://retrostrap.dev/reset?token=xyz');
    expect(t.sent[0].text).toContain('expires in an hour');
  });

  it('greets a member with no display name gracefully', async () => {
    const t = memEmail();
    await emailer(t).sendVerification({ to: 'x@y.example', verifyUrl: 'https://retrostrap.dev/v' });
    expect(t.sent[0].text).toContain('Hi there,');
  });
});

describe('MIME safety', () => {
  it('folds CR/LF out of header values so nobody smuggles a header', () => {
    expect(stripHeader('Subject\r\nBcc: evil@x')).toBe('Subject Bcc: evil@x');
    const mime = buildMime({
      from: 'a@x', to: 'b@x\r\nBcc: evil@x', subject: 'Hi\r\nX-Injected: 1',
      text: 'body', messageId: 'id@h', date: 'Mon, 01 Jan 2001 00:00:00 GMT',
    });
    expect(mime).not.toMatch(/\r\nBcc:/);        // no injected Bcc header line
    expect(mime).not.toMatch(/\r\nX-Injected:/); // no injected X- header line
  });

  it('RFC 2047-encodes a non-ASCII subject and leaves ASCII alone', () => {
    expect(encodeWord('Bestatige dein Konto äöü')).toMatch(/^=\?UTF-8\?B\?.+\?=$/);
    expect(encodeWord('plain ascii subject')).toBe('plain ascii subject');
  });

  it('dot-stuffs any line that starts with a dot', () => {
    expect(dotStuff('normal\n.hidden\n..already')).toBe('normal\r\n..hidden\r\n...already');
  });

  it('extracts the envelope address from a display-name header', () => {
    expect(extractAddr('The maintainers <hello@retrostrap.dev>')).toBe('hello@retrostrap.dev');
    expect(extractAddr('bare@x.example')).toBe('bare@x.example');
  });
});


describe('messageIdDomain', () => {
  it('takes the From address domain, falls back to the relay host', async () => {
    const { messageIdDomain } = await import('../src/email.js');
    expect(messageIdDomain('The Boards <boards@retrostrap.dev>', 'smtp.example')).toBe('retrostrap.dev');
    expect(messageIdDomain('nodomainhere', 'smtp.example')).toBe('smtp.example');
    expect(messageIdDomain('"odd@local" <box@retrostrap.dev>', 'smtp.example')).toBe('retrostrap.dev');
    expect(messageIdDomain('broken@', 'smtp.example')).toBe('smtp.example');
  });
});
