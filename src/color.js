export function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex([r, g, b]) {
  return '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
}

// Relative luminance per WCAG, used to pick readable text on any card color.
export function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function textColorFor(hex) {
  return luminance(hex) > 0.36 ? '#111111' : '#ffffff';
}

function saturation([r, g, b]) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max === 0 ? 0 : (max - min) / max;
}

function distance(a, b) {
  return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
}

// Pull a small set of distinct, vivid colors out of raw RGBA pixel data
// using k-means. Vivid colors are favored since they glow best on a phone.
export function extractPalette(pixels, count = 6) {
  const samples = [];
  const step = Math.max(1, Math.floor(pixels.length / 4 / 4000)) * 4;
  for (let i = 0; i < pixels.length; i += step) {
    if (pixels[i + 3] < 128) continue;
    samples.push([pixels[i], pixels[i + 1], pixels[i + 2]]);
  }
  if (!samples.length) return [];

  const k = Math.min(count + 2, samples.length);
  let centers = [];
  // Farthest-point seeding keeps the starting clusters spread out.
  centers.push(samples[Math.floor(samples.length / 2)]);
  while (centers.length < k) {
    let best = samples[0];
    let bestDist = -1;
    for (const s of samples) {
      const d = Math.min(...centers.map((c) => distance(s, c)));
      if (d > bestDist) {
        bestDist = d;
        best = s;
      }
    }
    centers.push(best);
  }

  let sizes = new Array(k).fill(0);
  for (let iter = 0; iter < 10; iter++) {
    const sums = centers.map(() => [0, 0, 0]);
    sizes = new Array(k).fill(0);
    for (const s of samples) {
      let idx = 0;
      let min = Infinity;
      centers.forEach((c, j) => {
        const d = distance(s, c);
        if (d < min) {
          min = d;
          idx = j;
        }
      });
      sums[idx][0] += s[0];
      sums[idx][1] += s[1];
      sums[idx][2] += s[2];
      sizes[idx]++;
    }
    centers = centers.map((c, j) => (sizes[j] ? sums[j].map((v) => v / sizes[j]) : c));
  }

  const ranked = centers
    .map((c, j) => ({ c, score: sizes[j] * (0.35 + saturation(c)) }))
    .filter((_, j) => sizes[j] > 0)
    .sort((a, b) => b.score - a.score);

  const picked = [];
  for (const { c } of ranked) {
    if (picked.every((p) => distance(p, c) > 900)) picked.push(c);
    if (picked.length === count) break;
  }
  return picked.map(rgbToHex);
}

export async function paletteFromImageUrl(url, count = 6) {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = url;
  await img.decode();
  const size = 120;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, size, size);
  return extractPalette(ctx.getImageData(0, 0, size, size).data, count);
}
