import { defineConfig } from 'astro/config';
export default defineConfig({
  site: 'https://la-trinchera.pages.dev',
  trailingSlash: 'always',
  build: { format: 'directory' },
});
