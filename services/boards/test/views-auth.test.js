// The account form views render as JS-optional plain forms with the right fields, escape
// prior input, and (register) carry the anti-bot honeypot + signed challenge.
import { describe, it, expect } from 'vitest';
import { registerView, loginView, forgotView, resetView, noticeView, newThreadView, toHtml } from '../src/views.js';

const challenge = { question: 'What does WWW stand for?', hint: 'Three words; the first is "World".', token: 'signed.challenge.token' };

describe('register view', () => {
  it('renders the quiz, a hidden challenge, a honeypot, and csrf', () => {
    const h = toHtml(registerView({ challenge, csrf: 'csrf-123' }));
    expect(h).toContain('What does WWW stand for?');
    expect(h).toContain('name="challenge" value="signed.challenge.token"');
    expect(h).toContain('name="csrf" value="csrf-123"');
    expect(h).toContain('name="website"');                  // honeypot present in the DOM
    expect(h).toMatch(/position:absolute;left:-9999px/);     // but hidden from humans
    for (const field of ['name', 'email', 'password', 'password2', 'answer', 'age']) expect(h).toContain(`name="${field}"`);
    expect(h).toContain('16 or older');                      // the age confirmation (docs/11 §6)
    expect(h).toContain('action="/register"');
  });

  it('shows an error banner and escapes prior input', () => {
    const h = toHtml(registerView({ challenge, csrf: 'x', error: 'That name is taken.', values: { name: '<script>' } }));
    expect(h).toContain('That name is taken.');
    expect(h).toContain('rs-alert--error');
    expect(h).toContain('value="&lt;script&gt;"'); // escaped, not raw
    expect(h).not.toContain('<script>');
  });
});

describe('login / forgot / reset views', () => {
  it('login has email + password + csrf and surfaces a notice', () => {
    const h = toHtml(loginView({ csrf: 'c', notice: 'Account created, check your email.' }));
    expect(h).toContain('action="/login"');
    expect(h).toContain('name="email"');
    expect(h).toContain('name="password"');
    expect(h).toContain('name="csrf" value="c"');
    expect(h).toContain('Account created, check your email.');
  });

  it('forgot asks only for an email', () => {
    const h = toHtml(forgotView({ csrf: 'c' }));
    expect(h).toContain('action="/forgot"');
    expect(h).toContain('name="email"');
    expect(h).not.toContain('name="password"');
  });

  it('reset carries the token and takes a new password', () => {
    const h = toHtml(resetView({ token: 'reset-tok', csrf: 'c' }));
    expect(h).toContain('action="/reset"');
    expect(h).toContain('name="token" value="reset-tok"');
    expect(h).toContain('name="password"');
  });
});

describe('new-thread view', () => {
  it('renders a title + body compose form posting to the board', () => {
    const h = toHtml(newThreadView({ board: { name: 'The Talk', slug: 'talk' }, csrf: 'c', values: { title: 'Draft' } }));
    expect(h).toContain('action="/boards/talk/new"');
    expect(h).toContain('name="title"');
    expect(h).toContain('name="body"');
    expect(h).toContain('name="csrf" value="c"');
    expect(h).toContain('value="Draft"'); // keeps prior input
  });
});

describe('notice view', () => {
  it('renders a heading and message, escaped', () => {
    const h = toHtml(noticeView({ heading: 'Check your email', message: 'We sent a link to <you>.' }));
    expect(h).toContain('Check your email');
    expect(h).toContain('We sent a link to &lt;you&gt;.');
  });
});
