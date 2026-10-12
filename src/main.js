import './style.css';
import { decodeProject } from './codec.js';
import { renderCreator } from './creator.js';
import { renderViewer } from './viewer.js';
import { escapeHtml } from './dom.js';

const app = document.getElementById('app');

let routeId = 0;

async function route() {
  const id = ++routeId;
  const hash = location.hash.replace(/^#/, '');
  const [, view, data] = hash.match(/^\/(p|edit)\/(.+)$/) || [];
  document.body.className = '';
  window.scrollTo(0, 0);

  if (view) {
    let project;
    try {
      project = await decodeProject(data);
    } catch {
      app.innerHTML = `
        <main class="error-page">
          <h1>This card link looks broken</h1>
          <p>The QR code or link may have been cut off. Ask the creator to share it again.</p>
          <a class="btn primary" href="#/">${escapeHtml('Make your own card')}</a>
        </main>`;
      return;
    }
    if (id !== routeId) return;
    if (view === 'p') renderViewer(app, project, data);
    else renderCreator(app, project);
    return;
  }
  renderCreator(app);
}

window.addEventListener('hashchange', route);
route();
