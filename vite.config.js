import { defineConfig } from 'vite';

export default defineConfig({
  // Relative asset paths so the build works on GitHub Pages project sites.
  base: './',
  test: { environment: 'jsdom' },
});
