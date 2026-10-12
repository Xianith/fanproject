// A project is stored entirely in the share URL so no server is needed.
// Keys are shortened to keep the QR code small and easy to scan.

import { isShapeId } from './shapes.js';

export const SCHEMA_VERSION = 1;

const KEY_MAP = {
  title: 't',
  song: 's',
  artist: 'a',
  album: 'al',
  instructions: 'i',
  color: 'c',
  shape: 'sh',
  palette: 'p',
  allowCustom: 'cc',
  allowPalette: 'pp',
  allowHideText: 'ht',
  creator: 'cr',
  socials: 'so',
};
const REVERSE_KEY_MAP = Object.fromEntries(Object.entries(KEY_MAP).map(([k, v]) => [v, k]));

const HEX_RE = /^#?[0-9a-f]{6}$/i;

export function normalizeHex(value) {
  if (typeof value !== 'string' || !HEX_RE.test(value.trim())) return null;
  const hex = value.trim().replace('#', '').toLowerCase();
  return `#${hex}`;
}

// Base for decoding links: anything a link leaves out is blank.
function blankProject() {
  return {
    title: '',
    song: '',
    artist: '',
    album: '',
    instructions: '',
    color: '#ff3b8b',
    shape: 'none',
    palette: [],
    allowCustom: true,
    allowPalette: true,
    allowHideText: true,
    creator: '',
    socials: {},
  };
}

// Starting point for a brand new card in the creator.
export function emptyProject() {
  return {
    ...blankProject(),
    song: 'Pork Soda',
    artist: 'Glass Animals',
    instructions: 'Hold this up during:',
  };
}

// Strip empty values, validate colors and shorten keys.
export function compact(project) {
  const out = { v: SCHEMA_VERSION };
  for (const [key, short] of Object.entries(KEY_MAP)) {
    let value = project[key];
    if (key === 'color') value = normalizeHex(value);
    if (key === 'shape' && (value === 'none' || !isShapeId(value))) continue;
    if (key === 'palette') value = (value || []).map(normalizeHex).filter(Boolean).map((h) => h.slice(1));
    if (key === 'color' && value) value = value.slice(1);
    if (key === 'socials') {
      const socials = {};
      for (const [k, v] of Object.entries(value || {})) {
        if (typeof v === 'string' && v.trim()) socials[k] = v.trim();
      }
      value = socials;
    }
    if (typeof value === 'boolean') {
      out[short] = value ? 1 : 0;
      continue;
    }
    if (typeof value === 'string') value = value.trim();
    if (value === '' || value == null) continue;
    if (Array.isArray(value) && !value.length) continue;
    if (typeof value === 'object' && !Array.isArray(value) && !Object.keys(value).length) continue;
    out[short] = value;
  }
  return out;
}

export function expand(data) {
  const project = blankProject();
  if (!data || typeof data !== 'object') throw new Error('Invalid project data');
  for (const [short, value] of Object.entries(data)) {
    const key = REVERSE_KEY_MAP[short];
    if (!key) continue;
    if (key === 'color') project.color = normalizeHex(String(value)) || project.color;
    else if (key === 'shape') project.shape = isShapeId(value) ? value : 'none';
    else if (key === 'palette') project.palette = Array.isArray(value) ? value.map((h) => normalizeHex(String(h))).filter(Boolean) : [];
    else if (key === 'allowCustom' || key === 'allowPalette' || key === 'allowHideText') project[key] = Boolean(value);
    else if (key === 'socials') project.socials = value && typeof value === 'object' ? { ...value } : {};
    else project[key] = String(value);
  }
  return project;
}

function toBase64Url(bytes) {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text) {
  const b64 = text.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

// Compressed payloads start with this marker; plain base64 JSON always starts with "ey".
const DEFLATE_MARKER = '~';

async function pipe(bytes, stream) {
  const out = new Response(bytes).body.pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

export async function encodeProject(project) {
  const bytes = new TextEncoder().encode(JSON.stringify(compact(project)));
  if (typeof CompressionStream === 'undefined') return toBase64Url(bytes);
  const deflated = await pipe(bytes, new CompressionStream('deflate-raw'));
  return deflated.length < bytes.length ? DEFLATE_MARKER + toBase64Url(deflated) : toBase64Url(bytes);
}

export async function decodeProject(encoded) {
  let bytes;
  if (encoded.startsWith(DEFLATE_MARKER)) {
    bytes = await pipe(fromBase64Url(encoded.slice(1)), new DecompressionStream('deflate-raw'));
  } else {
    bytes = fromBase64Url(encoded);
  }
  return expand(JSON.parse(new TextDecoder().decode(bytes)));
}

export async function shareUrl(project, base = `${location.origin}${location.pathname}`) {
  return `${base}#/p/${await encodeProject(project)}`;
}
