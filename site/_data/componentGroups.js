// Global data: the component catalog shelved by its first tag, in the same
// order the component docs have always used. Feeds the components page and
// its sidenav.
import { readFileSync } from "node:fs";

const manifest = JSON.parse(
  readFileSync(new URL("../../dist/manifest.json", import.meta.url), "utf8")
);

const ORDER = [
  ["layout", "Layout"],
  ["typography", "Typography"],
  ["content", "Content"],
  ["forms", "Forms"],
  ["navigation", "Navigation"],
  ["feedback", "Feedback"],
];

const known = new Set(ORDER.map(([tag]) => tag));

// Shelf a component by its first recognized tag; page chrome (statusbar,
// toolbar) files under Feedback, same as the component docs always did.
const shelfOf = (c) => {
  const tags = Array.isArray(c.tags) ? c.tags : [];
  return tags.find((t) => known.has(t)) || "feedback";
};

const groups = ORDER.map(([tag, label]) => ({
  tag,
  label,
  components: manifest.components.filter((c) => shelfOf(c) === tag),
})).filter((g) => g.components.length > 0);

export default groups;
