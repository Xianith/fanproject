// Song, album and artist search via the public iTunes Search API. JSONP is
// used because the endpoint does not reliably send CORS headers to browsers.
let callbackId = 0;

function jsonp(url, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const name = `__fanproject_cb${callbackId++}`;
    const script = document.createElement('script');
    const cleanup = () => {
      delete window[name];
      script.remove();
      clearTimeout(timer);
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('Music search timed out'));
    }, timeoutMs);
    window[name] = (data) => {
      cleanup();
      resolve(data);
    };
    script.onerror = () => {
      cleanup();
      reject(new Error('Music search failed'));
    };
    script.src = `${url}&callback=${name}`;
    document.head.appendChild(script);
  });
}

const ENTITIES = { song: 'song', album: 'album', artist: 'musicArtist' };
const LIMIT = 50;

// Larger artwork than the 100px thumbnail gives better palette colors.
function artwork(url) {
  return url?.replace(/\/\d+x\d+bb\./, '/300x300bb.');
}

export function toResult(r) {
  if (r.wrapperType === 'track') {
    return {
      kind: 'song',
      title: r.trackName,
      subtitle: `${r.artistName} · ${r.collectionName}`,
      song: r.trackName,
      artist: r.artistName,
      album: r.collectionName,
      thumb: r.artworkUrl100,
      art: artwork(r.artworkUrl100),
    };
  }
  if (r.wrapperType === 'collection') {
    return {
      kind: 'album',
      title: r.collectionName,
      subtitle: [r.artistName, r.releaseDate?.slice(0, 4)].filter(Boolean).join(' · '),
      artist: r.artistName,
      album: r.collectionName,
      thumb: r.artworkUrl100,
      art: artwork(r.artworkUrl100),
    };
  }
  if (r.wrapperType === 'artist') {
    return {
      kind: 'artist',
      title: r.artistName,
      subtitle: r.primaryGenreName || 'Artist',
      artist: r.artistName,
      artistId: r.artistId,
    };
  }
  return null;
}

export async function searchMusic(term, type = 'song') {
  const entity = ENTITIES[type] || 'song';
  const url = `https://itunes.apple.com/search?media=music&entity=${entity}&limit=${LIMIT}&term=${encodeURIComponent(term)}`;
  const data = await jsonp(url);
  return (data.results || []).map(toResult).filter(Boolean);
}

// All albums by an artist, newest first.
export async function artistAlbums(artistId) {
  const url = `https://itunes.apple.com/lookup?id=${encodeURIComponent(artistId)}&entity=album&limit=200`;
  const data = await jsonp(url);
  return (data.results || [])
    .filter((r) => r.wrapperType === 'collection')
    .sort((a, b) => (b.releaseDate || '').localeCompare(a.releaseDate || ''))
    .map(toResult);
}
