# stylelint-retrostrap

A [stylelint](https://stylelint.io) plugin that holds your own CSS to the retrostrap
design laws, so the custom styles you write on top of the framework stay era-true too.

It reads the legal palette, easing whitelist, and shape rules from
`dist/guardrails.json`, which means it can never drift out of sync with the framework.

## Use

```js
// stylelint.config.js
export default {
  plugins: ['retrostrap/tools/stylelint-retrostrap/index.cjs'], // or the published package
  rules: { 'retrostrap/laws': true },
};
```

## What it catches

- **Palette Law**: hex colors outside the 216 web-safe + 16 named set, and any color
  carrying alpha.
- **Shape Law**: `border-radius` other than 0; `box-shadow`/`text-shadow` with non-zero blur.
- **Motion Law**: `transition`/`animation` easing other than `linear` or `steps()`.

Status: experimental. Fonts and the full easing surface are checked at runtime by
`Retrostrap.audit()`; this plugin covers the static, CSS-time subset.
