import { describe, expect, it } from 'vitest';
import { socialLink, socialDisplay } from '../src/socials.js';

describe('socials', () => {
  it('builds profile links from handles', () => {
    expect(socialLink('ig', '@fan')).toBe('https://instagram.com/fan');
    expect(socialLink('tt', 'fan')).toBe('https://tiktok.com/@fan');
    expect(socialLink('web', 'fan.example')).toBe('https://fan.example');
    expect(socialLink('x', 'https://x.com/fan')).toBe('https://x.com/fan');
  });

  it('does not produce javascript: links', () => {
    expect(socialLink('web', 'javascript:alert(1)')).toBe('https://javascript:alert(1)');
  });

  it('formats display text', () => {
    expect(socialDisplay('ig', 'fan')).toBe('@fan');
    expect(socialDisplay('web', 'https://fan.example/')).toBe('fan.example');
  });
});
