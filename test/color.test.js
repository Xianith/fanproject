import { describe, expect, it } from 'vitest';
import { extractPalette, textColorFor, hexToRgb } from '../src/color.js';

function image(colors, perColor = 400) {
  const data = [];
  for (const hex of colors) {
    const [r, g, b] = hexToRgb(hex);
    for (let i = 0; i < perColor; i++) data.push(r, g, b, 255);
  }
  return new Uint8ClampedArray(data);
}

describe('color', () => {
  it('finds the distinct colors in an image', () => {
    const palette = extractPalette(image(['#ff0000', '#00ff00', '#0000ff']), 6);
    expect(palette).toHaveLength(3);
    expect(palette).toEqual(expect.arrayContaining(['#ff0000', '#00ff00', '#0000ff']));
  });

  it('skips transparent pixels', () => {
    expect(extractPalette(new Uint8ClampedArray([255, 0, 0, 0]))).toEqual([]);
  });

  it('picks readable text colors', () => {
    expect(textColorFor('#ffffff')).toBe('#111111');
    expect(textColorFor('#000000')).toBe('#ffffff');
    expect(textColorFor('#ffeb3b')).toBe('#111111');
  });
});
