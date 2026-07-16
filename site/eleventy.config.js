// Eleventy config for the retrostrap docs site.
// Run from the repo root: `npm run site` (serve) or `npm run site:build`.
// The site is styled with retrostrap itself, dist/ is the single source of truth.

export default function (eleventyConfig) {
  // The framework, exactly as it ships: pages link /dist/retrostrap.min.css etc.
  eleventyConfig.addPassthroughCopy({ dist: "dist" });

  // Machine surfaces at the site root, the llms.txt convention wants them there.
  eleventyConfig.addPassthroughCopy({
    "dist/llms.txt": "llms.txt",
    "dist/manifest.json": "manifest.json",
    "dist/guardrails.json": "guardrails.json",
    "dist/cheatsheet.md": "cheatsheet.md",
    "dist/prompt.txt": "prompt.txt",
  });

  // robots.txt belongs at the root too; it allows everything, honestly.
  eleventyConfig.addPassthroughCopy({ "site/robots.txt": "robots.txt" });

  // the classic address browsers still try first; a floppy, of course
  eleventyConfig.addPassthroughCopy({ "site/favicon.ico": "favicon.ico" });

  // the kitchen sink: every component on one page. It lives with the e2e
  // suite (the audit walks it), and the site serves the same file verbatim.
  eleventyConfig.addPassthroughCopy({ "tests/e2e/pages/kitchen-sink.html": "kitchen-sink/index.html" });

  // Drop-in assistant templates (AGENTS.md, CLAUDE.md, copilot-instructions.md).
  eleventyConfig.addPassthroughCopy({ templates: "templates" });

  // The site's own (tiny) stylesheet. Tokens only, radius 0, promise.
  eleventyConfig.addPassthroughCopy({ "site/assets": "assets" });

  // Component snippets reference demo files (avatar.gif, my-cat.jpg …) that a
  // copy-pasting webmaster is meant to replace. In the live previews we swap
  // them for pixel art that actually ships, so nothing on our pages 404s.
  const previewArt = {
    "avatar.gif": "/dist/assets/tile-stars.png",
    "golden-floppy.gif": "/dist/assets/icon-floppy.png",
    "banner-468x60.gif": "/dist/assets/tile-dither-navy.png",
    "valid-html.gif": "/dist/assets/tile-dither-navy.png",
    "my-cat.jpg": "/dist/assets/tile-hearts.png",
  };
  eleventyConfig.addFilter("previewAssets", (html) =>
    String(html).replace(/src="([^"]+)"/g, (match, src) =>
      previewArt[src] ? `src="${previewArt[src]}"` : match
    )
  );

  // Fenced code blocks come out dressed as DOS boxes, the framework already
  // knows how to wear them, so markdown pages dogfood rs-dos for free.
  eleventyConfig.amendLibrary("md", (md) => {
    const fence = md.renderer.rules.fence.bind(md.renderer.rules);
    md.renderer.rules.fence = (tokens, idx, options, env, self) =>
      fence(tokens, idx, options, env, self).replace(
        /^<pre>/,
        '<pre class="rs-dos">'
      );
  });

  // GitHub-style ids on markdown headings so in-page contents lists work.
  eleventyConfig.amendLibrary("md", (md) => {
    const slug = (s) =>
      String(s)
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
    md.core.ruler.push("heading_ids", (state) => {
      for (let i = 0; i < state.tokens.length; i++) {
        const token = state.tokens[i];
        if (token.type === "heading_open" && !token.attrGet("id")) {
          const inline = state.tokens[i + 1];
          if (inline && inline.type === "inline") {
            token.attrSet("id", slug(inline.content));
          }
        }
      }
    });
  });

  return {
    dir: {
      input: "site",
      output: "site/_site",
      includes: "_includes",
      data: "_data",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
