# Fan Project Cards

**Live app: https://xianith.github.io/fanproject/**

Make a fan project card ("hold this up during the bridge of X!"), and share it with a QR code. Fans scan it, and their phone becomes the card.

## Features

**Creators**
- Write the instructions, song, artist and an optional project name
- Pick the starting card color
- Pull an album palette by searching for the album (iTunes Search) or uploading the cover art; edit, add or remove colors
- Choose what fans can change: album palette colors, any color, or neither
- Add your name and socials (Instagram, X, TikTok, Threads, Bluesky, YouTube, website)
- Get a QR code and link instantly, with a live phone preview. Drafts autosave in the browser.

**Fans (shared view)**
- Full-screen card in the chosen color with the instructions and song
- Swap colors with album swatches or a custom picker (remembered on their device)
- **Hold up** mode: fullscreen, keeps the screen awake, tap to exit
- **Tap to share**: shows the project's QR code, with native share, copy link and save QR image
- Creator socials and a "make your own" link

## How sharing works

There is no backend. The whole project is compressed into the link (`#/p/<data>`), so the QR code *is* the card. Nothing is uploaded, and links never expire. The catch: changing a card makes a new link, so print your QR code after you're done editing. Use **Copy edit link** to reopen a card in the editor later.

## Development

```sh
npm install
npm run dev     # local dev server
npm test        # unit tests
npm run build   # static build in dist/
```

Pushing to `main` deploys to GitHub Pages via `.github/workflows/deploy.yml`. In the repo settings, set **Pages → Source** to **GitHub Actions**.
