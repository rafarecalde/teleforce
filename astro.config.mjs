// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://tryteleforce.com',
  output: 'static',
  trailingSlash: 'ignore',
  // Retired the older overlapping PPC pages → route to the new solid landings.
  redirects: {
    '/ea': '/',
    '/outsourced-sdr-team': '/sdr-bdr',
    '/outsourced-saas-support': '/customer-service',
    '/nearshore-customer-service-mexico-colombia': '/customer-service',
    '/nearshore-bilingual-support-lenders': '/customer-service',
  },
  integrations: [
    sitemap({
      // Paid-only ad LPs stay out of the organic sitemap.
      // /terms is a public legal page and stays in the sitemap.
      filter: (page) =>
        !page.includes('/ea/offer') &&
        !page.includes('/ea/remote-executive-assistant') &&
        !page.includes('/ea/quiz') &&
        !page.includes('/ea/match'),
    }),
  ],
});
