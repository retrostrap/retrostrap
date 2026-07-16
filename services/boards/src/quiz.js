// quiz.js, the registration anti-bot quiz (docs/11 §6). One question from a
// rotating pool; the hint guarantees any genuine human can answer. Answers are
// normalized before matching so "World Wide Web!" and "world wide web" agree.

export const QUESTIONS = [
  { q: 'What does WWW stand for?', a: ['world wide web'], hint: 'Three words; the first is "World".' },
  { q: 'The "e" in e-mail is short for…?', a: ['electronic'], hint: 'Not "enormous", not "expensive".' },
  { q: 'Our mascot Gif is what kind of animal?', a: ['cat', 'a cat', 'katze'], hint: 'It meows and sits on keyboards.' },
  { q: 'Which animated image format is our mascot named after?', a: ['gif'], hint: 'Three letters; pronounce it however you like.' },
  { q: 'What color are unvisited links on a classic web page, red, blue, or green?', a: ['blue'], hint: 'Same color as the sky.' },
  { q: 'LOL stands for "laughing out ____".', a: ['loud'], hint: 'The opposite of "quietly".' },
  { q: 'Which key refreshes the page in most browsers, F1, F5, or F9?', a: ['f5'], hint: 'It sits between F4 and F6.' },
  { q: 'How many corners does a pixel have?', a: ['4', 'four'], hint: 'A pixel is a square.' },
  { q: 'Finish our tagline: "Build like it\'s 2026, look like it\'s ____."', a: ['1999'], hint: 'The year is in the footer of every page.' },
  { q: 'In 1999 a modem got you online by ____-ing a phone number.', a: ['dial', 'dialing', 'dialling'], hint: 'Rotary phones did it too.' },
];

/** lowercase, trim, drop punctuation, collapse spaces */
export function normalizeAnswer(s) {
  return String(s).toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim();
}

/** True if `answer` matches any accepted answer for the question at `index`. */
export function checkAnswer(index, answer) {
  if (!Number.isInteger(index) || index < 0 || index >= QUESTIONS.length) return false;
  const q = QUESTIONS[index];
  const norm = normalizeAnswer(answer);
  return q.a.some((accepted) => normalizeAnswer(accepted) === norm);
}

/** Pick a question index that isn't `avoid` (so a failed attempt gets a new one).
    Deterministic given the seed, so callers can pass a rotating counter. */
export function pickQuestion(seed = 0, avoid = -1) {
  const s = Math.trunc(Number(seed)) || 0; // integer index even if a caller passes a fractional seed
  let i = ((s % QUESTIONS.length) + QUESTIONS.length) % QUESTIONS.length;
  if (i === avoid) i = (i + 1) % QUESTIONS.length;
  return i;
}
