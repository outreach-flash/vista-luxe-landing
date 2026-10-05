// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import keystatic from '@keystatic/astro';

// Keystatic's admin UI + API routes run on-demand (SSR). They work in `astro dev`
// (local storage mode) but cannot be prerendered into a static build, so the
// integration is only enabled during development.
const isDev = process.argv.includes('dev');

export default defineConfig({
  integrations: [react(), ...(isDev ? [keystatic()] : [])],
  vite: {
    plugins: [tailwindcss()],
    server: {
      watch: {
        usePolling: true,
      },
    },
  },
});
