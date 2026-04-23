// Design tokens — K&D Landscaping brand. Mirror what's in tailwind.config.ts
// so server-rendered components and email previews can use raw style values.
export const T = {
  forestThrive: '#7A9B49',     // primary green
  oliveIntegrity: '#546121',   // dark green section bg
  groundedBlack: '#212221',    // body text / dark backgrounds
  white: '#FFFFFF',

  // UI-derived neutrals
  cream: '#FBFAF6',
  creamDeep: '#F1EEE5',
  ink: '#212221',
  inkSoft: '#5C544A',
  inkFaint: '#8A8376',
  line: 'rgba(33,34,33,0.10)',
  lineSoft: 'rgba(33,34,33,0.06)',

  // status
  ok: '#3F7A4E',
  warn: '#C89A2A',
  dq: '#A23D2C',

  // typography
  display: '"Aileron", "Helvetica Neue", Arial, sans-serif',
  sans: '"Montserrat", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, monospace',
} as const;
