// guardrails.mjs - the five laws as data (docs/02, docs/09). External tools,
// linters and coding assistants validate against this instead of parsing our
// prose. The palette comes from the same module the framework and audit use,
// so there is exactly one source of truth.
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LEGAL_HEX } from '../src/js/core/palette.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

const guardrails = {
  version: 1,
  palette: {
    law: 'Only the 216 web-safe colors plus the 16 classic named colors. UI colors are opaque.',
    colors: LEGAL_HEX,
  },
  fonts: {
    law: 'Nine sanctioned era font stacks; no @font-face in core.',
    stacks: {
      serif: '"Times New Roman", Times, serif',
      sans: 'Verdana, Geneva, "DejaVu Sans", sans-serif',
      narrow: 'Tahoma, "Segoe UI", Geneva, sans-serif',
      arial: 'Arial, Helvetica, sans-serif',
      comic: '"Comic Sans MS", "Comic Neue", "Chalkboard SE", cursive',
      mono: '"Courier New", Courier, monospace',
      display: 'Impact, "Arial Black", Haettenschweiler, sans-serif',
      fancy: 'Georgia, "Times New Roman", serif',
      trebuchet: '"Trebuchet MS", Tahoma, sans-serif',
    },
    sizesPx: [10, 13, 16, 18, 24, 32, 48],
  },
  shape: {
    law: 'border-radius is 0 everywhere; shadows have 0 blur. Rounding only via border-image pixel assets.',
    borderRadius: 0,
    shadowBlur: 0,
  },
  motion: {
    law: 'Only linear and steps() easing. Everything honors prefers-reduced-motion.',
    easing: ['linear', 'steps', 'step-start', 'step-end'],
    blinkHz: 1,
    marqueeSpeedsPxPerSec: [30, 60, 120],
    maxFlashesPerSecond: 3,
  },
  decency: {
    law: 'No autoplaying audio, no tracking, no external network calls from shipped code, progressive enhancement.',
    autoplayAudio: false,
    tracking: false,
    externalRequests: false,
  },
  breakpointsPx: { vga: 640, svga: 800, xga: 1024, sxga: 1280 },
};

await mkdir(join(ROOT, 'dist'), { recursive: true });
await writeFile(join(ROOT, 'dist', 'guardrails.json'), JSON.stringify(guardrails, null, 2) + '\n');
console.log(`guardrails: emitted (${LEGAL_HEX.length} legal colors).`);
