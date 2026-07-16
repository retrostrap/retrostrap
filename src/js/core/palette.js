// palette.js - the legal color space as data (docs/02). The 216 web-safe
// colors (each channel one of 00/33/66/99/CC/FF) plus the 8 named colors
// that live off the cube. This is the one place the palette is defined;
// the audit and the build's guardrails.json both read from here.

const STEPS = [0x00, 0x33, 0x66, 0x99, 0xcc, 0xff];

// named colors NOT already on the cube (the other 8 named ones are)
const NAMED_OFF_CUBE = {
  silver: [0xc0, 0xc0, 0xc0],
  gray: [0x80, 0x80, 0x80],
  maroon: [0x80, 0x00, 0x00],
  purple: [0x80, 0x00, 0x80],
  green: [0x00, 0x80, 0x00],
  olive: [0x80, 0x80, 0x00],
  navy: [0x00, 0x00, 0x80],
  teal: [0x00, 0x80, 0x80],
};

const hex = (n) => n.toString(16).padStart(2, '0').toUpperCase();

/** Every legal color as an uppercase #RRGGBB string (224 of them). */
export const LEGAL_HEX = (() => {
  const out = [];
  for (const r of STEPS) for (const g of STEPS) for (const b of STEPS) {
    out.push(`#${hex(r)}${hex(g)}${hex(b)}`);
  }
  for (const [r, g, b] of Object.values(NAMED_OFF_CUBE)) {
    out.push(`#${hex(r)}${hex(g)}${hex(b)}`);
  }
  return out;
})();

/** The same set keyed as "r,g,b" decimal strings, for matching computed rgb(). */
export const LEGAL_RGB = new Set(
  LEGAL_HEX.map((h) => {
    const n = parseInt(h.slice(1), 16);
    return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
  })
);
