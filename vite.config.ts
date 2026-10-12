import { defineConfig } from 'vite';

// base './' keeps every asset URL relative, so the build works under any
// GitHub Pages sub-path (e.g. https://<user>.github.io/worldspredictor2026/)
// without touching other pages hosted on the same domain.
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  },
  worker: {
    format: 'es',
  },
});
