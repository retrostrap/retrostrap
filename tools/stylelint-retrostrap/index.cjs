// stylelint-retrostrap, a stylelint plugin that enforces the retrostrap laws
// in your own CSS (docs/09). It reads the legal colors, easing whitelist, and
// shape rules straight from dist/guardrails.json, so it can never disagree with
// the framework. One rule, `retrostrap/laws`, with everything on by default.
'use strict';
const stylelint = require('stylelint');
const fs = require('node:fs');
const path = require('node:path');

const ruleName = 'retrostrap/laws';
const messages = stylelint.utils.ruleMessages(ruleName, {
  palette: (color) => `"${color}" is off the retrostrap palette (216 web-safe + 16 named colors)`,
  radius: (value) => `border-radius must be 0, not "${value}" (Shape Law)`,
  shadowBlur: (prop, value) => `${prop} must have 0 blur, not "${value}" (Shape Law)`,
  easing: (fn) => `easing must be linear or steps(), not "${fn}" (Motion Law)`,
});

function loadGuardrails() {
  const candidates = [
    path.resolve(process.cwd(), 'node_modules/retrostrap/dist/guardrails.json'),
    path.resolve(process.cwd(), 'dist/guardrails.json'),
    path.resolve(__dirname, '../../dist/guardrails.json'),
  ];
  for (const p of candidates) {
    try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { /* try next */ }
  }
  return null;
}

const expand = (hex) => (hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex);

const plugin = stylelint.createPlugin(ruleName, (enabled) => (root, result) => {
  if (!enabled) return;
  const guard = loadGuardrails();
  if (!guard) {
    stylelint.utils.report({
      result, ruleName, node: root,
      message: 'retrostrap/laws: could not find dist/guardrails.json (build retrostrap or install it)',
    });
    return;
  }
  const legal = new Set(guard.palette.colors.map((c) => c.toUpperCase()));
  const okEasing = (fn) => fn === 'linear' || /^steps\(/.test(fn) || fn === 'step-start' || fn === 'step-end';

  root.walkDecls((decl) => {
    const prop = decl.prop.toLowerCase();
    const value = decl.value;

    // Palette: every hex must be legal, and no alpha (8/4-digit) forms
    for (const raw of value.match(/#[0-9a-fA-F]{3,8}\b/g) || []) {
      if (raw.length === 5 || raw.length === 9 || !legal.has(expand(raw).toUpperCase())) {
        stylelint.utils.report({ result, ruleName, node: decl, message: messages.palette(raw) });
      }
    }

    // Shape: radius 0
    if (/border(-[a-z]+)*-radius$|^border-radius$/.test(prop) && !/^0[a-z%]*$/.test(value.trim())) {
      stylelint.utils.report({ result, ruleName, node: decl, message: messages.radius(value) });
    }

    // Shape: shadow blur 0 (third length in each shadow layer)
    if (prop === 'box-shadow' || prop === 'text-shadow') {
      for (const layer of value.split(/,(?![^(]*\))/)) {
        const lens = layer.match(/-?\d*\.?\d+(px|em|rem|pt|pc|cm|mm|in|q|ex|ch|vh|vw|vmin|vmax)/gi);
        if (lens && lens[2] && parseFloat(lens[2]) !== 0) {
          stylelint.utils.report({ result, ruleName, node: decl, message: messages.shadowBlur(prop, value) });
        }
      }
    }

    // Motion: easing whitelist
    if (prop === 'transition' || prop === 'transition-timing-function' || prop === 'animation' || prop === 'animation-timing-function') {
      for (const fn of value.match(/cubic-bezier\([^)]*\)|ease-in-out|ease-in|ease-out|\bease\b/g) || []) {
        if (!okEasing(fn)) stylelint.utils.report({ result, ruleName, node: decl, message: messages.easing(fn) });
      }
    }
  });
});

plugin.ruleName = ruleName;
plugin.messages = messages;
module.exports = plugin;
