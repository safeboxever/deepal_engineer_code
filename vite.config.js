import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Bundles everything into a single dist/index.html — upload that one file anywhere.
export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
});
