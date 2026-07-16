// ranks.js, the post-count rank ladder (docs/11 §6). Ranks confer no
// permissions; only roles (sysop, webmaster) do. Stars render under the avatar,
// phpBB-style.

const LADDER = [
  { min: 200, title: 'Old-Timer', stars: 4 },
  { min: 50, title: 'Regular', stars: 3 },
  { min: 10, title: 'Member', stars: 2 },
  { min: 1, title: 'Newbie', stars: 1 },
  { min: 0, title: 'Lurker', stars: 0 },
];

/** The rank for a member, given their approved post count and role. */
export function rankFor(postCount, role = 'member') {
  if (role === 'webmaster') return { title: 'Webmaster', stars: 5, color: 'red' };
  if (role === 'sysop') return { title: 'Sysop', stars: 5, color: 'green' };
  const n = Math.max(0, postCount | 0);
  const rung = LADDER.find((r) => n >= r.min);
  return { title: rung.title, stars: rung.stars, color: 'yellow' };
}
