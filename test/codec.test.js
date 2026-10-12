import { describe, expect, it } from 'vitest';
import { decodeProject, emptyProject, encodeProject, compact, normalizeHex } from '../src/codec.js';

const sample = {
  ...emptyProject(),
  title: 'Night 2 Ocean Moment',
  song: 'Lavender Haze',
  artist: 'Some Artist',
  album: 'Midnights',
  instructions: 'Hold this up during the bridge! 💜',
  color: '#7B5CFF',
  palette: ['#112233', 'abcdef', 'not-a-color'],
  allowCustom: false,
  allowPalette: true,
  creator: 'Fan Club',
  socials: { ig: '@fanclub', x: '', web: 'fanclub.example' },
};

describe('codec', () => {
  it('round-trips a project through the URL encoding', async () => {
    const decoded = await decodeProject(await encodeProject(sample));
    expect(decoded).toEqual({
      ...sample,
      color: '#7b5cff',
      palette: ['#112233', '#abcdef'],
      socials: { ig: '@fanclub', web: 'fanclub.example' },
    });
  });

  it('produces compressed, URL-safe output', async () => {
    const encoded = await encodeProject(sample);
    expect(encoded).toMatch(/^~[A-Za-z0-9_-]+$/);
    expect(encoded.length).toBeLessThan(Buffer.from(JSON.stringify(compact(sample))).toString("base64url").length);
  });

  it('still reads uncompressed links', async () => {
    const plain = btoa(JSON.stringify({ v: 1, i: 'Hi' })).replace(/=+$/, '');
    expect((await decodeProject(plain)).instructions).toBe('Hi');
  });

  it('drops empty fields to keep links short', () => {
    const c = compact({ ...emptyProject(), song: '', artist: '', instructions: 'Hi' });
    expect(Object.keys(c).sort()).toEqual(['c', 'cc', 'ht', 'i', 'pp', 'v']);
  });

  it('starts new cards with the default song', () => {
    expect(emptyProject()).toMatchObject({ instructions: 'Hold this up during:', song: 'Pork Soda', artist: 'Glass Animals' });
  });

  it('does not fill creator defaults into links that leave fields out', async () => {
    const p = await decodeProject(btoa(JSON.stringify({ v: 1, i: 'Hi' })));
    expect(p.song).toBe('');
    expect(p.artist).toBe('');
    expect(p.allowHideText).toBe(true);
  });

  it('rejects garbage', async () => {
    await expect(decodeProject('%%%')).rejects.toThrow();
    await expect(decodeProject(btoa('null'))).rejects.toThrow();
    await expect(decodeProject('~abc')).rejects.toThrow();
  });

  it('ignores invalid colors from a tampered link', async () => {
    const encoded = btoa(JSON.stringify({ v: 1, c: 'red;background:url(x)', p: ['zzz', '00ff00'] }));
    const p = await decodeProject(encoded);
    expect(p.color).toBe(emptyProject().color);
    expect(p.palette).toEqual(['#00ff00']);
  });

  it('normalizes hex', () => {
    expect(normalizeHex('ABCDEF')).toBe('#abcdef');
    expect(normalizeHex('#abc')).toBeNull();
  });
});
