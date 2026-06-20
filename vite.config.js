import { defineConfig } from 'vite';

// base:'./' so the built dist works from any path:
// GitHub Pages project sites, itch.io zips, Netlify, plain static hosting, file://.
export default defineConfig({
  base: './',
  build: {
    target: 'es2019',
    outDir: 'dist',
    assetsInlineLimit: 0
  }
});
