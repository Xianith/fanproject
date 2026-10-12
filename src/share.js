import QRCode from 'qrcode';
import { escapeHtml, copyText } from './dom.js';

export async function qrDataUrl(url, size = 640) {
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: 'L',
    margin: 2,
    width: size,
    color: { dark: '#000000', light: '#ffffff' },
  });
}

function fileName(project) {
  const base = (project.title || project.song || 'fan-project').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${base || 'fan-project'}-qr.png`;
}

// Bottom sheet with the project's QR code plus link sharing options.
export async function openShareSheet(project, url) {
  const dataUrl = await qrDataUrl(url);
  const heading = project.title || project.song || 'Fan project';
  const overlay = document.createElement('div');
  overlay.className = 'sheet-overlay';
  overlay.innerHTML = `
    <div class="sheet" role="dialog" aria-modal="true" aria-label="Share this card">
      <button class="sheet-close" aria-label="Close">×</button>
      <h2>${escapeHtml(heading)}</h2>
      <p class="muted">Let people scan this to get the card on their phone.</p>
      <img class="qr" src="${dataUrl}" alt="QR code for this fan project" />
      <div class="sheet-actions">
        ${navigator.share ? '<button class="btn primary" data-act="native">Share link</button>' : ''}
        <button class="btn" data-act="copy">Copy link</button>
        <a class="btn" href="${dataUrl}" download="${escapeHtml(fileName(project))}">Save QR image</a>
      </div>
    </div>`;

  const close = () => {
    overlay.classList.remove('open');
    setTimeout(() => overlay.remove(), 200);
    document.removeEventListener('keydown', onKey);
  };
  const onKey = (e) => e.key === 'Escape' && close();
  document.addEventListener('keydown', onKey);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || e.target.closest('.sheet-close')) close();
  });
  overlay.querySelector('[data-act="copy"]').addEventListener('click', () => copyText(url));
  overlay.querySelector('[data-act="native"]')?.addEventListener('click', async () => {
    try {
      await navigator.share({ title: heading, text: project.instructions || heading, url });
    } catch {
      // User cancelled the share sheet.
    }
  });

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('open'));
}
