import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(), // H1 — can be rich/long
    // Note: the URL slug is derived from the filename (Astro reserves `slug`).
    metaTitle: z.string().optional(), // <title>, ≤60 chars; falls back to title
    description: z.string(), // meta description, 140–155 chars
    excerpt: z.string().optional(), // card teaser; falls back to description
    primaryKeyword: z.string(),
    category: z.enum([
      'Customer Service',
      'Tech Support',
      'Data Entry',
      'Appointment Setting',
      'Billing & Collections',
      'Sales & Lead Gen',
      'Nearshore',
    ]),
    readMinutes: z.number(),
    publishDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    featured: z.boolean().default(false),
    faq: z
      .array(z.object({ q: z.string(), a: z.string() }))
      .optional(),
    related: z.array(z.string()).optional(), // sibling slugs
  }),
});

export const collections = { blog };
