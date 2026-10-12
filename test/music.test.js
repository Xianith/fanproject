import { describe, expect, it } from 'vitest';
import { toResult } from '../src/music.js';

describe('music search results', () => {
  it('maps songs with album artwork', () => {
    const r = toResult({
      wrapperType: 'track',
      trackName: 'Pork Soda',
      artistName: 'Glass Animals',
      collectionName: 'How To Be A Human Being',
      artworkUrl100: 'https://example.com/a/100x100bb.jpg',
    });
    expect(r).toMatchObject({ kind: 'song', song: 'Pork Soda', artist: 'Glass Animals', album: 'How To Be A Human Being' });
    expect(r.art).toBe('https://example.com/a/300x300bb.jpg');
  });

  it('maps albums and artists', () => {
    expect(toResult({ wrapperType: 'collection', collectionName: 'Dreamland', artistName: 'Glass Animals', releaseDate: '2020-08-07T07:00:00Z' }))
      .toMatchObject({ kind: 'album', album: 'Dreamland', subtitle: 'Glass Animals · 2020' });
    expect(toResult({ wrapperType: 'artist', artistName: 'Glass Animals', artistId: 528928008 })).toMatchObject({ kind: 'artist', artistId: 528928008 });
    expect(toResult({ wrapperType: 'audiobook' })).toBeNull();
  });
});
