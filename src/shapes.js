// Shapes shown in Hold up mode: the screen goes black and the card color
// fills the shape, with the text on top. textWidth is how much of the
// shape's width the text may use so it stays inside the shape.
export const SHAPES = [
  { id: 'none', label: 'Full screen' },
  {
    id: 'star',
    label: 'Star',
    svg: '<polygon stroke-linejoin="round" stroke-width="4" points="50,4.5 64.7,32.3 96,37.5 73.8,60.2 78.4,91.5 50,77.5 21.6,91.5 26.2,60.2 4,37.5 35.3,32.3" />',
    textWidth: 46,
    textScale: 0.7,
    textOffset: 6,
  },
  {
    id: 'heart',
    label: 'Heart',
    svg: '<path d="M50 94 C 22 74, 2 56, 2 32 C 2 15, 14 4, 28 4 C 38 4, 46 10, 50 19 C 54 10, 62 4, 72 4 C 86 4, 98 15, 98 32 C 98 56, 78 74, 50 94 Z" />',
    textWidth: 60,
    textScale: 0.82,
    textOffset: -6,
  },
];

export function getShape(id) {
  return SHAPES.find((s) => s.id === id && s.svg) || null;
}

export function isShapeId(id) {
  return SHAPES.some((s) => s.id === id);
}

export function shapeSvg(shape, className = 'shape') {
  return `<svg class="${className}" viewBox="0 0 100 100" aria-hidden="true">${shape.svg}</svg>`;
}

// Inline CSS variables that size the text for a shape.
export function shapeVars(shape) {
  return `--text-width:${shape.textWidth}%;--text-scale:${shape.textScale};--text-offset:${shape.textOffset || 0}%`;
}
