import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// Two static pages: Swedish at / and English at /en/
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        sv: resolve(__dirname, 'index.html'),
        en: resolve(__dirname, 'en/index.html'),
      },
    },
  },
});
