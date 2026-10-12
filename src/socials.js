// Supported social platforms. Creators enter a handle or a full URL.
export const SOCIALS = [
  { id: 'ig', label: 'Instagram', prefix: 'https://instagram.com/' },
  { id: 'x', label: 'X / Twitter', prefix: 'https://x.com/' },
  { id: 'tt', label: 'TikTok', prefix: 'https://tiktok.com/@' },
  { id: 'th', label: 'Threads', prefix: 'https://threads.net/@' },
  { id: 'bs', label: 'Bluesky', prefix: 'https://bsky.app/profile/' },
  { id: 'yt', label: 'YouTube', prefix: 'https://youtube.com/@' },
  { id: 'web', label: 'Website', prefix: '' },
];

export function socialLink(id, value) {
  const platform = SOCIALS.find((s) => s.id === id);
  if (!platform || !value) return null;
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (id === 'web') return `https://${trimmed}`;
  return platform.prefix + trimmed.replace(/^@/, '');
}

export function socialDisplay(id, value) {
  const trimmed = value.trim();
  if (id === 'web' || /^https?:\/\//i.test(trimmed)) return trimmed.replace(/^https?:\/\//i, '').replace(/\/$/, '');
  return `@${trimmed.replace(/^@/, '')}`;
}
