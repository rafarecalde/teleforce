// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://tryteleforce.com',
  output: 'static',
  // GitHub Pages 301s slashless directory URLs to the slashed form. Keep
  // Astro, the sitemap, and <link rel="canonical"> on that 200 URL.
  trailingSlash: 'always',
  // Retired the older overlapping PPC pages → route to the new solid landings.
  redirects: {
    '/outsourced-sdr-team': '/sdr-bdr/',
    '/outsourced-saas-support': '/customer-service/',
    '/nearshore-customer-service-mexico-colombia': '/customer-service/',
    '/nearshore-bilingual-support-lenders': '/customer-service/',
  },
  integrations: [
    sitemap({
      // Paid-only ad LPs stay out of the organic sitemap.
      filter: (page) =>
        !page.includes('/ea/offer') &&
        !page.includes('/ea/remote-executive-assistant') &&
        !page.includes('/ea/quiz') &&
        !page.includes('/ea/match'),
    }),
  ],
});
