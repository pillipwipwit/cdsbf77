import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://www.cdsbf77.fr',
  integrations: [sitemap({ filter: (page) => !page.includes('/interclubs-rebais-2026/confirmation') }), react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
