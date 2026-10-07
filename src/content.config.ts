import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Only this public directory is loaded. Private notes are never imported.
const labels = z.union([z.array(z.string()), z.string(), z.null()]).optional()
  .transform(value => (!value ? [] : Array.isArray(value) ? value : [value])
    .map(label => label.trim().replace(/^-Study$/, 'Study')));

const posts = defineCollection({
  loader: glob({
    base: './source/_posts',
    pattern: '**/*.md',
    generateId: ({ entry, data }) => String(data.slug ?? entry.replace(/\.md$/, '')),
  }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    description: z.string().optional(),
    tags: labels,
    categories: labels,
    draft: z.boolean().default(false),
    permalink: z.string().optional(),
  }),
});

export const collections = { posts };
