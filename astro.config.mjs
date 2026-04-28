import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import { devEditServer } from './dev-tools/edit-server-plugin.mjs';

export default defineConfig({
  site: 'https://manzai-archive.github.io',
  base: '/web/',
  trailingSlash: 'ignore',
  integrations: [mdx()],
  vite: {
    plugins: [tailwindcss(), devEditServer()],
  },
});
