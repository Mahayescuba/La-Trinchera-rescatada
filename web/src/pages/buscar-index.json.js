import { getCollection } from 'astro:content';
import { fixCat, excerpt } from '../lib/util';

// Texto plano a partir del markdown, para poder buscar dentro del cuerpo.
const strip = (s) => (s || '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
  .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
  .replace(/\\([.\-*_#>\[\]()`~])/g, '$1')
  .replace(/[#>*_`~]/g, ' ');
const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();

export async function GET() {
  const posts = await getCollection('posts');
  const data = posts.map(p => ({
    t: p.data.title,
    s: p.slug,
    c: fixCat(p.data.category),
    a: p.data.author || '',
    e: excerpt(p.body, 120, p.data.title),          // resumen visible en resultados
    b: norm(strip(p.body)).slice(0, 4000),          // cuerpo normalizado, para buscar
  }));
  return new Response(JSON.stringify(data), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}
