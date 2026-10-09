// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const MYTELEFORCE = 'https://myteleforce.com';

// Top-level service landings that used to live on this site.
const LANDING_SLUGS = [
  'appointment-setting',
  'customer-service',
  'data-entry',
  'sales-lead-generation',
  'sdr-bdr',
];

// Every slug the services collection generated, including legacy seats.
const SERVICE_SLUGS = [
  'appointment-setting',
  'billing-account-servicing',
  'customer-service',
  'data-entry',
  'sales-lead-generation',
  'sdr-bdr',
  'tech-support',
];

// Non-EA posts. Same slug on myteleforce.com.
const RETIRED_BLOG_SLUGS = [
  'appointment-setting-home-services-healthcare',
  'bilingual-appointment-setting',
  'bilingual-customer-support-healthcare',
  'bilingual-customer-support-us-companies',
  'bilingual-early-stage-account-servicing',
  'bilingual-hispanic-account-servicing',
  'bilingual-lead-generation',
  'bilingual-live-chat-support',
  'bilingual-support-financial-services',
  'bilingual-tech-support',
  'call-center-outsourcing-primer',
  'code-switching-customer-support',
  'colombia-call-center-outsourcing',
  'cost-of-in-house-customer-support',
  'crm-data-hygiene',
  'csat-vs-nps-vs-ces',
  'customer-support-channel-mix',
  'customer-support-metrics-predict-churn',
  'customer-support-qa-program',
  'customer-support-sla-explained',
  'customer-support-transition-plan',
  'data-entry-accuracy',
  'document-processing-outsourcing',
  'ecommerce-customer-support-outsourcing',
  'ecommerce-support-peak-season',
  'first-party-vs-third-party-account-servicing',
  'hispanic-market-customer-experience',
  'how-to-vet-nearshore-support-provider',
  'improving-first-contact-resolution',
  'inbound-vs-outbound-appointment-setting',
  'knowledge-base-ticket-deflection',
  'lead-qualification-frameworks',
  'mexico-customer-support-outsourcing',
  'nearshore-account-servicing-outsourcing',
  'nearshore-bpo-vs-boutique',
  'nearshore-call-center-cost',
  'nearshore-customer-support-latin-america',
  'nearshore-data-entry',
  'nearshore-lead-generation',
  'nearshore-support-data-security',
  'nearshore-tech-support',
  'nearshore-time-zone-advantage',
  'nearshore-vs-domestic-customer-support',
  'nearshore-vs-offshore-customer-support',
  'offer-24-7-customer-support',
  'outsource-support-small-business',
  'outsourced-appointment-setting',
  'outsourced-sdr-teams',
  'outsourced-vs-in-house-support',
  'outsourcing-data-entry',
  'outsourcing-lead-generation',
  'outsourcing-tech-support',
  'pre-delinquent-account-servicing',
  'reduce-appointment-no-shows',
  'reduce-average-handle-time',
  'reduce-customer-support-costs',
  'reduce-support-escalations',
  'saas-customer-support-outsourcing',
  'scale-customer-support-startup',
  'seasonal-customer-support-staffing',
  'spanish-customer-service-outsourcing',
  'spanish-social-media-support',
  'test-agent-spanish-fluency',
  'tier-1-vs-tier-2-support',
  'training-agents-sound-like-your-brand',
  'translation-vs-bilingual-agents',
  'when-to-outsource-customer-support',
];

/** @type {Record<string, string>} */
const redirects = {
  // Indexed EA URL is the homepage.
  '/ea': '/',
  // Legacy PPC paths used to hop through a landing on this site.
  // Send them straight to the matching page on myteleforce.com.
  '/outsourced-sdr-team': `${MYTELEFORCE}/sdr-bdr/`,
  '/outsourced-saas-support': `${MYTELEFORCE}/customer-service/`,
  '/nearshore-customer-service-mexico-colombia': `${MYTELEFORCE}/customer-service/`,
  '/nearshore-bilingual-support-lenders': `${MYTELEFORCE}/customer-service/`,
  '/services': `${MYTELEFORCE}/services/`,
};

for (const slug of LANDING_SLUGS) {
  redirects[`/${slug}`] = `${MYTELEFORCE}/${slug}/`;
}
for (const slug of SERVICE_SLUGS) {
  redirects[`/services/${slug}`] = `${MYTELEFORCE}/services/${slug}/`;
}
for (const slug of RETIRED_BLOG_SLUGS) {
  redirects[`/blog/${slug}`] = `${MYTELEFORCE}/blog/${slug}/`;
}

const redirectedPaths = new Set(
  Object.keys(redirects).map((path) => (path.endsWith('/') ? path : `${path}/`)),
);

// https://astro.build/config
export default defineConfig({
  site: 'https://tryteleforce.com',
  output: 'static',
  // GitHub Pages 301s slashless directory URLs to the slashed form. Keep
  // Astro, the sitemap, and <link rel="canonical"> on that 200 URL.
  trailingSlash: 'always',
  // Static hosts get an HTML meta-refresh (delay 0), canonical, and noindex.
  redirects,
  integrations: [
    sitemap({
      // Paid-only ad LPs stay out of the organic sitemap.
      // /terms is a public legal page and stays in the sitemap.
      // Redirected BPO URLs are not pages, and are excluded here too.
      filter: (page) => {
        const path = new URL(page).pathname;
        const slashed = path.endsWith('/') ? path : `${path}/`;
        if (redirectedPaths.has(slashed)) return false;
        return (
          !page.includes('/ea/offer') &&
          !page.includes('/ea/remote-executive-assistant') &&
          !page.includes('/ea/quiz') &&
          !page.includes('/ea/match') &&
          !page.includes('/ea/signup') &&
          !page.includes('/thanks') &&
          !page.includes('/thankyou')
        );
      },
    }),
  ],
});
