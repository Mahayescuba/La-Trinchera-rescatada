import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { excerpt } from '../lib/util';

export async function GET(context){
  const posts = (await getCollection('posts'))
    .filter(p => p.data.date)
    .sort((a,b)=> (b.data.date||'').localeCompare(a.data.date||''))
    .slice(0,50);
  return rss({
    title: 'La Trinchera',
    description: 'Archivo rescatado de La Trinchera: debate de ideas desde Cuba (2018–2021).',
    site: context.site,
    items: posts.map(p => ({
      title: p.data.title,
      link: `/${p.slug}/`,
      pubDate: p.data.date ? new Date(p.data.date) : undefined,
      description: excerpt(p.body, 300),
      ...(p.data.category ? { categories: [p.data.category] } : {}),
    })),
    customData: '<language>es</language>',
  });
}
