import { escapeHtml } from './dom.js';
import { textColorFor } from './color.js';
import { normalizeHex } from './codec.js';
import { SOCIALS, socialLink, socialDisplay } from './socials.js';
import { openShareSheet } from './share.js';

function storageKey(encoded) {
  return `fanproject:color:${encoded.slice(0, 64)}`;
}

function loadColor(encoded) {
  try {
    return localStorage.getItem(storageKey(encoded));
  } catch {
    return null;
  }
}

function saveColor(encoded, color) {
  try {
    localStorage.setItem(storageKey(encoded), color);
  } catch {
    // Storage unavailable (private mode); the choice just won't persist.
  }
}

export function renderViewer(app, project, encoded) {
  const url = `${location.origin}${location.pathname}#/p/${encoded}`;
  const canChoose = project.allowCustom || (project.allowPalette && project.palette.length);
  const stored = canChoose ? loadColor(encoded) : null;
  const saved = stored ? normalizeHex(stored) : null;
  let current = saved || project.color;
  let wakeLock = null;

  const subtitle = [project.song && `“${project.song}”`, project.artist].filter(Boolean).join(' · ');
  const socials = SOCIALS.filter((s) => project.socials[s.id]);

  document.body.classList.add('viewer-mode');
  app.innerHTML = `
    <main class="viewer">
      <section class="card-face" aria-live="polite">
        ${project.title ? `<p class="eyebrow">${escapeHtml(project.title)}</p>` : ''}
        <h1 class="instructions">${escapeHtml(project.instructions || 'Hold this up!')}</h1>
        ${subtitle ? `<p class="song">${escapeHtml(subtitle)}</p>` : ''}
        ${project.album ? `<p class="album-name">from ${escapeHtml(project.album)}</p>` : ''}
        <p class="hold-hint">Tap anywhere to exit · turn your brightness all the way up</p>
      </section>

      <section class="controls">
        <div class="control-row">
          <button class="btn big" data-act="hold">Hold up</button>
          <button class="btn big primary" data-act="share">Tap to share</button>
        </div>

        ${
          canChoose
            ? `<div class="color-picker">
                <h2>Pick your color</h2>
                <div class="swatches">
                  <button class="swatch" data-color="${project.color}" style="--c:${project.color}" aria-label="Creator's color ${project.color}"><span>★</span></button>
                  ${
                    project.allowPalette
                      ? project.palette
                          .filter((c) => c !== project.color)
                          .map((c) => `<button class="swatch" data-color="${c}" style="--c:${c}" aria-label="Album color ${c}"></button>`)
                          .join('')
                      : ''
                  }
                  ${
                    project.allowCustom
                      ? `<label class="swatch custom" aria-label="Choose any color">
                          <input type="color" value="${current}" />
                          <span>+</span>
                        </label>`
                      : ''
                  }
                </div>
                ${project.allowPalette && project.palette.length && project.album ? `<p class="muted small">Colors from <em>${escapeHtml(project.album)}</em></p>` : ''}
              </div>`
            : ''
        }

        ${
          project.creator || socials.length
            ? `<div class="creator-info">
                <h2>${project.creator ? `Project by ${escapeHtml(project.creator)}` : 'Follow the organizer'}</h2>
                <ul class="social-list">
                  ${socials
                    .map((s) => {
                      const href = socialLink(s.id, project.socials[s.id]);
                      return `<li><a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">
                        <span class="social-label">${s.label}</span>
                        <span>${escapeHtml(socialDisplay(s.id, project.socials[s.id]))}</span>
                      </a></li>`;
                    })
                    .join('')}
                </ul>
              </div>`
            : ''
        }

        <a class="make-own" href="#/">Make your own fan project card →</a>
      </section>
    </main>`;

  const viewer = app.querySelector('.viewer');
  const customInput = app.querySelector('.swatch.custom input');

  function applyColor(color) {
    current = color;
    viewer.style.setProperty('--card', color);
    viewer.style.setProperty('--card-text', textColorFor(color));
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color);
    app.querySelectorAll('.swatch[data-color]').forEach((el) => {
      el.classList.toggle('active', el.dataset.color === color);
    });
    const custom = app.querySelector('.swatch.custom');
    if (custom) {
      const isPreset = [...app.querySelectorAll('.swatch[data-color]')].some((el) => el.dataset.color === color);
      custom.classList.toggle('active', !isPreset);
      custom.style.setProperty('--c', isPreset ? 'transparent' : color);
    }
  }

  app.querySelectorAll('.swatch[data-color]').forEach((el) =>
    el.addEventListener('click', () => {
      applyColor(el.dataset.color);
      saveColor(encoded, el.dataset.color);
    }),
  );
  customInput?.addEventListener('input', () => {
    applyColor(customInput.value);
    saveColor(encoded, customInput.value);
  });

  async function enterHold() {
    viewer.classList.add('holding');
    try {
      await document.documentElement.requestFullscreen?.();
    } catch {
      // Fullscreen not allowed (e.g. iOS Safari); the holding layout still fills the screen.
    }
    try {
      wakeLock = await navigator.wakeLock?.request('screen');
    } catch {
      wakeLock = null;
    }
  }

  function exitHold() {
    viewer.classList.remove('holding');
    if (document.fullscreenElement) document.exitFullscreen?.();
    wakeLock?.release?.();
    wakeLock = null;
  }

  app.querySelector('[data-act="hold"]').addEventListener('click', enterHold);
  app.querySelector('.card-face').addEventListener('click', () => {
    if (viewer.classList.contains('holding')) exitHold();
  });
  document.addEventListener(
    'fullscreenchange',
    () => {
      if (!document.fullscreenElement && viewer.classList.contains('holding')) exitHold();
    },
    { signal: routeSignal() },
  );
  app.querySelector('[data-act="share"]').addEventListener('click', () => openShareSheet(project, url));

  applyColor(current);
}

// Listeners on document must be dropped when the route changes.
let controller = null;
function routeSignal() {
  controller?.abort();
  controller = new AbortController();
  window.addEventListener('hashchange', () => controller.abort(), { once: true });
  return controller.signal;
}
