import { defineCollection, z } from 'astro:content';
const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.string().optional().default(''),
    author: z.string().optional().default(''),
    category: z.string().optional().default(''),
    image: z.string().optional().default(''),
  }),
});
export const collections = { posts };
