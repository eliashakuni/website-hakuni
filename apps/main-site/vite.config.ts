import { defineConfig, type Plugin } from 'vite';
import { resolve } from 'node:path';

// Replaces <script type="module" src="/assets/x.js"> with the chunk's code
// inline, then drops the .js file. Saves a request for tiny scripts.
// Build only: the dev server keeps serving src/main.ts as a normal module.
function inlineEntryScripts(): Plugin {
  return {
    name: 'inline-entry-scripts',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const htmlFiles = Object.values(bundle).filter(
        (file) => file.type === 'asset' && file.fileName.endsWith('.html'),
      );
      // The HTML pages are the entries; the scripts they load are plain chunks.
      const chunks = Object.values(bundle).filter((file) => file.type === 'chunk');
      const importedByOthers = new Set(
        chunks.flatMap((c) => (c.type === 'chunk' ? [...c.imports, ...c.dynamicImports] : [])),
      );

      for (const chunk of chunks) {
        if (chunk.type !== 'chunk') continue;
        // Inlining a chunk that imports others, or that others import,
        // would break those imports.
        if (chunk.imports.length > 0 || chunk.dynamicImports.length > 0) continue;
        if (importedByOthers.has(chunk.fileName)) continue;

        const tag = new RegExp(
          `<script type="module"[^>]*src="[^"]*/${chunk.fileName}"[^>]*></script>`,
        );
        // Escape "</script" so code containing it can't end the tag early.
        const code = chunk.code.replaceAll('</script', '<\\/script').trim();

        let inlined = false;
        for (const html of htmlFiles) {
          if (html.type !== 'asset') continue;
          const source = String(html.source);
          if (!tag.test(source)) continue;
          html.source = source.replace(tag, () => `<script type="module">${code}</script>`);
          inlined = true;
        }
        // Only drop the file if every reference to it was replaced.
        if (inlined) delete bundle[chunk.fileName];
      }
    },
  };
}

// Two static pages: Swedish at / and English at /en/
export default defineConfig({
  plugins: [inlineEntryScripts()],
  build: {
    // No code-split chunks to preload, so the preload polyfill is dead weight.
    modulePreload: { polyfill: false },
    rollupOptions: {
      input: {
        sv: resolve(import.meta.dirname, 'index.html'),
        en: resolve(import.meta.dirname, 'en/index.html'),
      },
    },
  },
});
