// submit-issue.js, the git-PR moderation inbox. A Retrospace submission opens a
// GitHub issue for a human to review (infra/README.md); approval is a normal pull request
// that adds the site to the curated source, which CI republishes. No admin auth,
// no submission database. Plain fetch (in the Lambda runtime); the repo + token
// come from the environment. Deploy-time only.

// Strip control chars (a newline would escape the code span and let a heading or
// link through), then backtick-fence and truncate, a submission can't inject
// markdown into the issue a maintainer reads.
const flat = (v) => String(v).replace(/[\x00-\x1f\x7f]+/g, ' ');
const fence = (v) => '`' + flat(v).replace(/`/g, "'").slice(0, 500) + '`';
export { flat, fence }; // exported for the sanitizer tests

export async function createSubmissionIssue(s, { repo = process.env.GITHUB_REPO, token = process.env.GITHUB_TOKEN } = {}) {
  if (!repo || !token) throw new Error('submissions are not configured');
  const body = [
    '**A site was submitted to Retrospace.** Review it, then approve by adding it to the',
    'curated source in a pull request (or just close this issue).',
    '',
    `- URL: ${fence(s.url)}`,
    `- Title: ${fence(s.title)}`,
    `- Blurb: ${fence(s.blurb || '')}`,
    `- Categories: ${fence((s.categories || []).join(', '))}`,
    `- Languages: ${fence((s.languages || []).join(', '))}`,
    `- Tags: ${fence((s.tags || []).join(', '))}`,
  ].join('\n');

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000); // a slow GitHub must not pin the Lambda to its 10s ceiling
  let r;
  try {
    r = await fetch(`https://api.github.com/repos/${repo}/issues`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        accept: 'application/vnd.github+json',
        'content-type': 'application/json',
        'user-agent': 'retrospace-submit',
      },
      body: JSON.stringify({
        title: `Retrospace submission: ${flat(s.title).slice(0, 80)}`,
        body,
        labels: ['retrospace-submission'],
      }),
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(timer);
  }
  if (!r.ok) throw new Error(`github ${r.status}`);
  return (await r.json()).number;
}
