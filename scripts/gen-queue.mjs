// Generates content-queue.yaml with a staggered drip cadence.
// Run: node scripts/gen-queue.mjs
import { writeFileSync } from 'node:fs';

// The 3 seed posts are already published (status: done) with their own dates.
const seeded = [
  { title: 'Nearshore vs. Offshore Customer Support', kw: 'nearshore vs offshore customer support', intent: 'MoFu', pillar: 'Nearshore', slug: 'nearshore-vs-offshore-customer-support', date: '2026-06-10' },
  { title: 'Why Bilingual Customer Support Is No Longer Optional', kw: 'bilingual customer support', intent: 'MoFu', pillar: 'Bilingual CX', slug: 'bilingual-customer-support-us-companies', date: '2026-06-12' },
  { title: 'The Real Cost of In-House Customer Support', kw: 'cost of in-house customer support', intent: 'BoFu', pillar: 'Operations', slug: 'cost-of-in-house-customer-support', date: '2026-06-16' },
];

// The backlog the content agent will write. Distinct real query each — no near-duplicates.
// Ordered roughly: wedge + vertical + BoFu first (rankable on a young domain), head terms later.
const queue = [
  // --- Nearshore pillar ---
  { title: 'Colombia, Mexico, or Ecuador? A Buyer\'s Guide to LatAm Support Hubs', kw: 'nearshore customer support latin america', intent: 'MoFu', pillar: 'Nearshore', slug: 'nearshore-customer-support-latin-america' },
  { title: 'Mexico Customer Support Outsourcing: What to Know', kw: 'mexico customer support outsourcing', intent: 'BoFu', pillar: 'Nearshore', slug: 'mexico-customer-support-outsourcing' },
  { title: 'Colombia Call Center Outsourcing: Talent, Cost, and Trade-offs', kw: 'colombia call center outsourcing', intent: 'BoFu', pillar: 'Nearshore', slug: 'colombia-call-center-outsourcing' },
  { title: 'Nearshore vs. Domestic U.S. Support: The Real Cost Gap', kw: 'nearshore vs domestic customer support', intent: 'MoFu', pillar: 'Nearshore', slug: 'nearshore-vs-domestic-customer-support' },
  { title: 'How to Vet a Nearshore Customer Support Provider', kw: 'how to choose a nearshore support provider', intent: 'BoFu', pillar: 'Nearshore', slug: 'how-to-vet-nearshore-support-provider' },
  { title: 'Nearshore Customer Support for Ecommerce Brands', kw: 'ecommerce customer support outsourcing', intent: 'BoFu', pillar: 'Nearshore', slug: 'ecommerce-customer-support-outsourcing' },
  { title: 'Nearshore Customer Support for SaaS Companies', kw: 'saas customer support outsourcing', intent: 'BoFu', pillar: 'Nearshore', slug: 'saas-customer-support-outsourcing' },
  { title: 'The Nearshore Time-Zone Advantage, Quantified', kw: 'nearshore time zone advantage', intent: 'ToFu', pillar: 'Nearshore', slug: 'nearshore-time-zone-advantage' },
  { title: 'Data Security and Compliance in Nearshore Support', kw: 'nearshore support data security', intent: 'MoFu', pillar: 'Nearshore', slug: 'nearshore-support-data-security' },
  { title: 'What a Nearshore Call Center Actually Costs in 2026', kw: 'nearshore call center cost', intent: 'MoFu', pillar: 'Nearshore', slug: 'nearshore-call-center-cost' },
  { title: 'Nearshore BPO vs. Boutique Support Teams', kw: 'nearshore bpo', intent: 'MoFu', pillar: 'Nearshore', slug: 'nearshore-bpo-vs-boutique' },

  // --- Bilingual CX pillar ---
  { title: 'Spanish Customer Service Outsourcing: A Practical Guide', kw: 'spanish customer service outsourcing', intent: 'BoFu', pillar: 'Bilingual CX', slug: 'spanish-customer-service-outsourcing' },
  { title: 'Serving the U.S. Hispanic Market: A CX Playbook', kw: 'hispanic market customer experience', intent: 'ToFu', pillar: 'Bilingual CX', slug: 'hispanic-market-customer-experience' },
  { title: 'How to Test an Agent\'s Spanish Fluency (Beyond “Conversational”)', kw: 'test agent spanish fluency', intent: 'MoFu', pillar: 'Bilingual CX', slug: 'test-agent-spanish-fluency' },
  { title: 'Bilingual Live Chat Support: Setup and Pitfalls', kw: 'bilingual live chat support', intent: 'BoFu', pillar: 'Bilingual CX', slug: 'bilingual-live-chat-support' },
  { title: 'Bilingual Customer Support for Healthcare Companies', kw: 'bilingual customer support healthcare', intent: 'BoFu', pillar: 'Bilingual CX', slug: 'bilingual-customer-support-healthcare' },
  { title: 'Bilingual Support for Fintech and Financial Services', kw: 'bilingual support financial services', intent: 'BoFu', pillar: 'Bilingual CX', slug: 'bilingual-support-financial-services' },
  { title: 'Training Agents to Sound Like Your Brand', kw: 'customer support agent training', intent: 'ToFu', pillar: 'Bilingual CX', slug: 'training-agents-sound-like-your-brand' },
  { title: 'Spanglish and Code-Switching: Why It Matters in Support', kw: 'code switching customer support', intent: 'ToFu', pillar: 'Bilingual CX', slug: 'code-switching-customer-support' },
  { title: 'Spanish-Language Social Media Support', kw: 'spanish social media customer support', intent: 'MoFu', pillar: 'Bilingual CX', slug: 'spanish-social-media-support' },
  { title: 'Translation vs. Native Agents: The Quality Gap', kw: 'translation vs bilingual agents', intent: 'MoFu', pillar: 'Bilingual CX', slug: 'translation-vs-bilingual-agents' },

  // --- Operations pillar ---
  { title: 'When to Outsource Customer Support: 7 Signs', kw: 'when to outsource customer support', intent: 'BoFu', pillar: 'Operations', slug: 'when-to-outsource-customer-support' },
  { title: 'Outsourced vs. In-House Support: A Build-vs-Buy Framework', kw: 'outsource customer support', intent: 'MoFu', pillar: 'Operations', slug: 'outsourced-vs-in-house-support' },
  { title: 'How to Transition Support Without Dropping Customers', kw: 'customer support transition plan', intent: 'BoFu', pillar: 'Operations', slug: 'customer-support-transition-plan' },
  { title: 'The Metrics That Actually Predict Customer Churn', kw: 'customer support metrics', intent: 'ToFu', pillar: 'Operations', slug: 'customer-support-metrics-predict-churn' },
  { title: 'CSAT vs. NPS vs. CES: Which Support Metric to Trust', kw: 'csat vs nps vs ces', intent: 'ToFu', pillar: 'Operations', slug: 'csat-vs-nps-vs-ces' },
  { title: 'How to Reduce Average Handle Time Without Hurting CX', kw: 'reduce average handle time', intent: 'ToFu', pillar: 'Operations', slug: 'reduce-average-handle-time' },
  { title: 'Offering 24/7 Support Without Burning Out Your Team', kw: '24/7 customer support', intent: 'MoFu', pillar: 'Operations', slug: 'offer-24-7-customer-support' },
  { title: 'Staffing for Seasonal Support Spikes', kw: 'seasonal customer support staffing', intent: 'BoFu', pillar: 'Operations', slug: 'seasonal-customer-support-staffing' },
  { title: 'How to Scale Customer Support at a Growing Startup', kw: 'scale customer support startup', intent: 'MoFu', pillar: 'Operations', slug: 'scale-customer-support-startup' },
  { title: 'Customer Support SLAs, Explained', kw: 'customer support sla', intent: 'ToFu', pillar: 'Operations', slug: 'customer-support-sla-explained' },
  { title: 'Outsourcing Customer Support for Small Business', kw: 'outsource customer support small business', intent: 'BoFu', pillar: 'Operations', slug: 'outsource-support-small-business' },
  { title: 'Voice, Chat, or Email: Building the Right Channel Mix', kw: 'customer support channel mix', intent: 'ToFu', pillar: 'Operations', slug: 'customer-support-channel-mix' },
  { title: 'Improving First Contact Resolution', kw: 'first contact resolution', intent: 'ToFu', pillar: 'Operations', slug: 'improving-first-contact-resolution' },
  { title: 'Building a Customer Support QA Program', kw: 'customer support quality assurance', intent: 'MoFu', pillar: 'Operations', slug: 'customer-support-qa-program' },
  { title: 'Practical Ways to Reduce Customer Support Costs', kw: 'reduce customer support costs', intent: 'BoFu', pillar: 'Operations', slug: 'reduce-customer-support-costs' },
  { title: 'Knowledge Bases and Ticket Deflection That Actually Work', kw: 'ticket deflection knowledge base', intent: 'ToFu', pillar: 'Operations', slug: 'knowledge-base-ticket-deflection' },
  { title: 'Ecommerce Support for Peak Season and Returns', kw: 'ecommerce customer support peak season', intent: 'MoFu', pillar: 'Operations', slug: 'ecommerce-support-peak-season' },
  { title: 'Call Center Outsourcing: The Complete Primer', kw: 'call center outsourcing', intent: 'ToFu', pillar: 'Operations', slug: 'call-center-outsourcing-primer' },
];

// Cadence: first 3 backlog posts land in the next few days (so the blog isn't
// thin at launch), then drip every 4 days into the future. Future-dated posts
// stay hidden until the scheduled rebuild reaches their date — protecting SEO
// from a one-day flood of 40 posts.
const START = new Date('2026-06-22T00:00:00Z');
const STEP_DAYS = 4;
function dateForIndex(i) {
  const d = new Date(START);
  d.setUTCDate(d.getUTCDate() + i * STEP_DAYS);
  return d.toISOString().slice(0, 10);
}

let out = `# Teleforce "Signal" content queue\n`;
out += `# The content agent (see CLAUDE.md) takes the next item with status: todo,\n`;
out += `# writes it to src/content/blog/<slug>.md with publishDate set to the value\n`;
out += `# below, then flips status: done. Future dates drip-publish on the schedule.\n\n`;
out += `posts:\n`;

for (const p of seeded) {
  out += `  - title: ${JSON.stringify(p.title)}\n`;
  out += `    slug: ${p.slug}\n`;
  out += `    primaryKeyword: ${JSON.stringify(p.kw)}\n`;
  out += `    intent: ${p.intent}\n`;
  out += `    pillar: ${JSON.stringify(p.pillar)}\n`;
  out += `    publishDate: ${p.date}\n`;
  out += `    status: done\n\n`;
}

queue.forEach((p, i) => {
  out += `  - title: ${JSON.stringify(p.title)}\n`;
  out += `    slug: ${p.slug}\n`;
  out += `    primaryKeyword: ${JSON.stringify(p.kw)}\n`;
  out += `    intent: ${p.intent}\n`;
  out += `    pillar: ${JSON.stringify(p.pillar)}\n`;
  out += `    publishDate: ${dateForIndex(i)}\n`;
  out += `    status: todo\n\n`;
});

writeFileSync(new URL('../content-queue.yaml', import.meta.url), out);
console.log(`Wrote content-queue.yaml: ${seeded.length} done + ${queue.length} todo = ${seeded.length + queue.length} total`);
console.log(`First todo publishDate: ${dateForIndex(0)} · last: ${dateForIndex(queue.length - 1)}`);
