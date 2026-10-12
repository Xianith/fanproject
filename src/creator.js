import { emptyProject, shareUrl, normalizeHex } from './codec.js';
import { SOCIALS } from './socials.js';
import { textColorFor, paletteFromImageUrl } from './color.js';
import { searchMusic, artistAlbums } from './music.js';
import { escapeHtml, toast, copyText } from './dom.js';
import { openShareSheet, qrDataUrl } from './share.js';

const DRAFT_KEY = 'fanproject:draft';
const MAX_PALETTE = 8;

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? { ...emptyProject(), ...JSON.parse(raw) } : null;
  } catch {
    return null;
  }
}

function saveDraft(project) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(project));
  } catch {
    // Storage unavailable; drafts just won't persist.
  }
}

export function renderCreator(app, initial) {
  const project = initial || loadDraft() || emptyProject();
  project.socials = { ...project.socials };
  project.palette = [...project.palette];

  app.innerHTML = `
    <main class="creator">
      <header class="hero">
        <h1>Fan Project Cards</h1>
        <p>Plan a crowd moment. Share one QR code. Everyone holds up the same card.</p>
      </header>

      <div class="creator-grid">
        <form class="panel" autocomplete="off" novalidate>
          <fieldset>
            <legend>Find the song <span class="opt">optional</span></legend>
            <p class="muted small">Picking a song or album fills in the details and pulls a color palette from its cover.</p>
            <div class="search-tabs" role="tablist" aria-label="Search for">
              <button type="button" role="tab" data-type="song" aria-selected="true">Songs</button>
              <button type="button" role="tab" data-type="album" aria-selected="false">Albums</button>
              <button type="button" role="tab" data-type="artist" aria-selected="false">Artists</button>
            </div>
            <div class="search-row">
              <input name="musicSearch" type="search" placeholder="Search songs" enterkeyhint="search" />
              <button type="button" class="btn" data-act="search">Search</button>
            </div>
            <div class="music-results" hidden></div>
          </fieldset>

          <fieldset>
            <legend>The moment</legend>
            <label>Instructions
              <textarea name="instructions" rows="2" maxlength="140" placeholder="Hold this up during:"></textarea>
            </label>
            <div class="two-col">
              <label>Song <input name="song" maxlength="80" placeholder="Song title" /></label>
              <label>Artist <input name="artist" maxlength="80" placeholder="Artist" /></label>
            </div>
            <label><span>Project name <span class="opt">optional</span></span>
              <input name="title" maxlength="60" placeholder="e.g. Night 2 Ocean Moment" />
            </label>
          </fieldset>

          <fieldset>
            <legend>Card color</legend>
            <div class="color-field">
              <input type="color" name="color" aria-label="Card color" />
              <input name="colorHex" maxlength="7" aria-label="Card color hex" spellcheck="false" />
              <span class="muted small">Everyone starts on this color.</span>
            </div>
          </fieldset>

          <fieldset>
            <legend>Album palette <span class="opt">optional</span></legend>
            <p class="muted small">Colors come from the cover of the song or album you pick above. You can also upload the artwork yourself.</p>
            <label class="btn ghost upload">
              Upload cover art
              <input type="file" accept="image/*" name="cover" hidden />
            </label>
            <label>Album name <input name="album" maxlength="80" placeholder="Album" /></label>
            <div class="palette-edit"></div>
          </fieldset>

          <fieldset>
            <legend>What fans can change</legend>
            <label class="check"><input type="checkbox" name="allowPalette" /> Let fans pick from the album palette</label>
            <label class="check"><input type="checkbox" name="allowCustom" /> Let fans pick any color</label>
            <label class="check"><input type="checkbox" name="allowHideText" /> Let fans hide the text in Hold up mode (screen becomes pure color)</label>
          </fieldset>

          <fieldset>
            <legend>Your socials <span class="opt">optional</span></legend>
            <label>Your name or fan account <input name="creator" maxlength="60" placeholder="e.g. The Eras Fan Club" /></label>
            <div class="socials-grid">
              ${SOCIALS.map(
                (s) => `<label>${s.label}<input data-social="${s.id}" maxlength="100" placeholder="${s.id === 'web' ? 'example.com' : '@handle'}" /></label>`,
              ).join('')}
            </div>
          </fieldset>

          <div class="form-actions">
            <button type="button" class="btn primary big" data-act="publish">Create card &amp; QR code</button>
            <button type="button" class="btn ghost" data-act="reset">Start over</button>
          </div>
        </form>

        <aside class="preview-col">
          <p class="muted small">Preview</p>
          <div class="phone"><div class="phone-card"></div></div>
          <div class="publish-result" hidden>
            <img class="qr" alt="QR code for your card" />
            <div class="sheet-actions">
              <a class="btn primary" data-act="open" target="_blank" rel="noopener">Open card</a>
              <button type="button" class="btn" data-act="copy">Copy link</button>
              <button type="button" class="btn" data-act="share">Share</button>
            </div>
            <button type="button" class="linkish small" data-act="edit-link">Copy edit link (to change this card later)</button>
            <p class="muted small link-size"></p>
          </div>
        </aside>
      </div>
    </main>`;

  const form = app.querySelector('form');
  const $ = (sel) => app.querySelector(sel);
  const field = (name) => form.elements.namedItem(name);

  // Fill the form from the project.
  for (const name of ['title', 'song', 'artist', 'album', 'instructions', 'creator']) field(name).value = project[name];
  field('color').value = project.color;
  field('colorHex').value = project.color;
  field('allowPalette').checked = project.allowPalette;
  field('allowCustom').checked = project.allowCustom;
  field('allowHideText').checked = project.allowHideText;
  form.querySelectorAll('[data-social]').forEach((el) => (el.value = project.socials[el.dataset.social] || ''));

  function renderPreview() {
    const card = $('.phone-card');
    card.style.setProperty('--card', project.color);
    card.style.setProperty('--card-text', textColorFor(project.color));
    const swatches = project.allowPalette ? project.palette : [];
    card.innerHTML = `
      ${project.title ? `<p class="eyebrow">${escapeHtml(project.title)}</p>` : ''}
      <p class="instructions">${escapeHtml(project.instructions || 'Hold this up!')}</p>
      ${project.song ? `<p class="song">${escapeHtml(project.song)}</p>` : ''}
      ${project.artist ? `<p class="artist">${escapeHtml(project.artist)}</p>` : ''}
      <div class="mini-swatches">
        ${[project.color, ...swatches].map((c) => `<span style="--c:${c}"></span>`).join('')}
        ${project.allowCustom ? '<span class="custom">+</span>' : ''}
      </div>`;
  }

  function renderPalette() {
    const wrap = $('.palette-edit');
    wrap.innerHTML = `
      <div class="swatches editable">
        ${project.palette
          .map(
            (c, i) => `<span class="swatch-edit">
              <button type="button" class="swatch" style="--c:${c}" data-use="${i}" title="Use ${c} as the card color"></button>
              <button type="button" class="remove" data-remove="${i}" aria-label="Remove ${c}">×</button>
            </span>`,
          )
          .join('')}
        ${
          project.palette.length < MAX_PALETTE
            ? `<label class="swatch add" title="Add a color"><input type="color" value="#ffffff" /><span>+</span></label>`
            : ''
        }
      </div>
      ${project.palette.length ? '<p class="muted small">Tap a color to make it the starting color. × removes it.</p>' : ''}`;
    wrap.querySelectorAll('[data-remove]').forEach((el) =>
      el.addEventListener('click', () => {
        project.palette.splice(Number(el.dataset.remove), 1);
        changed();
      }),
    );
    wrap.querySelectorAll('[data-use]').forEach((el) =>
      el.addEventListener('click', () => {
        setColor(project.palette[Number(el.dataset.use)]);
      }),
    );
    wrap.querySelector('.add input')?.addEventListener('change', (e) => {
      project.palette.push(e.target.value);
      changed();
    });
  }

  function changed() {
    saveDraft(project);
    renderPalette();
    renderPreview();
    $('.publish-result').hidden = true;
  }

  function setColor(color) {
    project.color = color;
    field('color').value = color;
    field('colorHex').value = color;
    changed();
  }

  form.addEventListener('input', (e) => {
    const t = e.target;
    if (t.dataset.social) project.socials[t.dataset.social] = t.value;
    else if (t.name === 'color') {
      project.color = t.value;
      field('colorHex').value = t.value;
    } else if (t.name === 'colorHex') {
      const hex = normalizeHex(t.value);
      if (!hex) return;
      project.color = hex;
      field('color').value = hex;
    } else if (t.type === 'checkbox') project[t.name] = t.checked;
    else if (t.name in project) project[t.name] = t.value;
    else return;
    saveDraft(project);
    renderPreview();
    $('.publish-result').hidden = true;
  });

  async function usePalette(imageUrl) {
    try {
      const colors = await paletteFromImageUrl(imageUrl, 6);
      if (!colors.length) throw new Error('no colors');
      project.palette = colors;
      project.allowPalette = true;
      field('allowPalette').checked = true;
      changed();
      toast('Palette pulled from the cover');
    } catch {
      toast('Couldn’t read that cover. Try uploading the image instead.');
    }
  }

  let searchType = 'song';
  const SEARCH_PLACEHOLDERS = { song: 'Search songs', album: 'Search albums', artist: 'Search artists' };

  function showResults(results, emptyMessage, heading = '') {
    const box = $('.music-results');
    box.hidden = false;
    if (!results.length) {
      box.innerHTML = `<p class="muted small">${emptyMessage}</p>`;
      return;
    }
    box.innerHTML = `${heading}<div class="result-list">${results
      .map(
        (r, i) => `<button type="button" class="result ${r.kind}" data-i="${i}">
          ${r.thumb ? `<img src="${escapeHtml(r.thumb)}" alt="" loading="lazy" />` : '<span class="artist-icon" aria-hidden="true">♪</span>'}
          <span class="result-text"><strong>${escapeHtml(r.title)}</strong><span class="muted">${escapeHtml(r.subtitle)}</span></span>
        </button>`,
      )
      .join('')}</div>`;
    box.querySelectorAll('.result').forEach((el) =>
      el.addEventListener('click', () => pickResult(results[Number(el.dataset.i)])),
    );
  }

  function setField(name, value) {
    project[name] = value;
    field(name).value = value;
  }

  async function pickResult(r) {
    if (r.kind === 'artist') {
      $('.music-results').innerHTML = '<p class="muted small">Loading albums…</p>';
      try {
        const albums = await artistAlbums(r.artistId);
        showResults(albums, `No albums found for ${escapeHtml(r.artist)}.`, `<p class="muted small">Albums by <strong>${escapeHtml(r.artist)}</strong></p>`);
      } catch {
        showResults([], 'Search is unavailable right now. Upload the cover art instead.');
      }
      return;
    }
    if (r.kind === 'song') setField('song', r.song);
    setField('artist', r.artist);
    setField('album', r.album);
    $('.music-results').hidden = true;
    saveDraft(project);
    renderPreview();
    await usePalette(r.art);
  }

  async function runSearch() {
    const term = field('musicSearch').value.trim();
    if (!term) return;
    const box = $('.music-results');
    box.hidden = false;
    box.innerHTML = '<p class="muted small">Searching…</p>';
    try {
      showResults(await searchMusic(term, searchType), `No ${searchType}s found. Try different words.`);
    } catch {
      showResults([], 'Search is unavailable right now. Upload the cover art instead.');
    }
  }

  app.querySelectorAll('.search-tabs [data-type]').forEach((tab) =>
    tab.addEventListener('click', () => {
      searchType = tab.dataset.type;
      app.querySelectorAll('.search-tabs [data-type]').forEach((t) => t.setAttribute('aria-selected', String(t === tab)));
      field('musicSearch').placeholder = SEARCH_PLACEHOLDERS[searchType];
      if (field('musicSearch').value.trim()) runSearch();
    }),
  );
  $('[data-act="search"]').addEventListener('click', runSearch);
  field('musicSearch').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      runSearch();
    }
  });

  field('cover').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    await usePalette(objectUrl);
    URL.revokeObjectURL(objectUrl);
    e.target.value = '';
  });

  $('[data-act="reset"]').addEventListener('click', () => {
    if (!confirm('Clear everything and start a new card?')) return;
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // ignore
    }
    history.replaceState(null, '', '#/');
    renderCreator(app, emptyProject());
  });

  $('[data-act="publish"]').addEventListener('click', async () => {
    if (!project.instructions.trim()) {
      toast('Add instructions so fans know what to do');
      field('instructions').focus();
      return;
    }
    const url = await shareUrl(project);
    const result = $('.publish-result');
    result.querySelector('.qr').src = await qrDataUrl(url);
    result.querySelector('[data-act="open"]').href = url;
    result.querySelector('.link-size').textContent =
      url.length > 900 ? 'Tip: shorter text and fewer socials make the QR code easier to scan.' : 'Your card lives entirely in this link — nothing is uploaded.';
    result.hidden = false;
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
  $('[data-act="copy"]').addEventListener('click', () => copyText(shareUrl(project)));
  $('[data-act="edit-link"]').addEventListener('click', async () => copyText((await shareUrl(project)).replace('#/p/', '#/edit/')));
  $('[data-act="share"]').addEventListener('click', () => openShareSheet(project, shareUrl(project)));

  renderPalette();
  renderPreview();
}
