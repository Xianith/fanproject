// Album search via the public iTunes Search API. JSONP is used because the
// endpoint does not reliably send CORS headers to browsers.
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
      reject(new Error('Album search timed out'));
    }, timeoutMs);
    window[name] = (data) => {
      cleanup();
      resolve(data);
    };
    script.onerror = () => {
      cleanup();
      reject(new Error('Album search failed'));
    };
    script.src = `${url}&callback=${name}`;
    document.head.appendChild(script);
  });
}

export async function searchAlbums(term) {
  const url = `https://itunes.apple.com/search?media=music&entity=album&limit=12&term=${encodeURIComponent(term)}`;
  const data = await jsonp(url);
  return (data.results || []).map((r) => ({
    album: r.collectionName,
    artist: r.artistName,
    thumb: r.artworkUrl100,
    // Smaller artwork is plenty for color extraction.
    art: r.artworkUrl100?.replace('100x100bb', '300x300bb'),
  }));
}
