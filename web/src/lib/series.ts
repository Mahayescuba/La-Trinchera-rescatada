// Detección de series a partir de la numeración que los propios autores
// pusieron en los títulos: "(I)", "(II)", "(PARTE I)", "primera/segunda parte",
// "Episodio N: …". No inventa agrupaciones: solo agrupa textos que comparten
// un mismo tronco de título y llevan marca de entrega explícita.

const ORD: Record<string, number> = { primera:1, segunda:2, tercera:3, cuarta:4, quinta:5, sexta:6 };

function romanOrNum(s: string): number | null {
  s = s.toLowerCase();
  if (/^\d+$/.test(s)) { const n = +s; return n >= 1 && n <= 20 ? n : null; }
  const R: Record<string, number> = { i:1, ii:2, iii:3, iv:4, v:5, vi:6, vii:7, viii:8, ix:9, x:10 };
  return R[s] || null;
}

export function parsePart(titleRaw: string): { base: string; part: number } | null {
  let t = titleRaw.trim();
  const em = t.match(/^Episodio\s+(\d+)\s*[:\-–.]\s*/i);
  if (em) t = t.slice(em[0].length);
  let m: RegExpMatchArray | null, part: number | null = null, stem: string | null = null;
  m = t.match(/\(?\s*(primera|segunda|tercera|cuarta|quinta|sexta)\s+parte\s*\)?/i);
  if (m) { part = ORD[m[1].toLowerCase()]; stem = t.slice(0, m.index); }
  if (part === null) {
    m = t.match(/\(\s*parte\s+([ivx]+|\d+)\s*\)/i);
    if (m) { const v = romanOrNum(m[1]); if (v) { part = v; stem = t.slice(0, m.index); } }
  }
  if (part === null) {
    m = t.match(/\bparte\s+([ivx]+|\d+)\b/i);
    if (m) { const v = romanOrNum(m[1]); if (v) { part = v; stem = t.slice(0, m.index); } }
  }
  if (part === null) {
    const re = /\(\s*([ivx]{1,4}|\d{1,2})\s*\)/ig; let last: { idx: number; v: number } | null = null, mm: RegExpExecArray | null;
    while ((mm = re.exec(t)) !== null) { const v = romanOrNum(mm[1]); if (v) last = { idx: mm.index, v }; }
    if (last) { part = last.v; stem = t.slice(0, last.idx); }
  }
  if (part === null || stem === null) return null;
  const base = stem.replace(/[\s.·:;,–—-]+$/, '').trim();
  if (base.length < 3) return null;
  return { base, part };
}

function keyOf(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '');
}

// Primera imagen dentro del cuerpo del texto (markdown o <img>), como respaldo
// cuando el frontmatter no trae imagen destacada. Prioriza las locales.
function firstBodyImage(body: string): string {
  if (!body) return '';
  const urls: string[] = [];
  let m: RegExpExecArray | null;
  const md = /!\[[^\]]*\]\(([^)\s]+)/g;
  while ((m = md.exec(body)) !== null) urls.push(m[1]);
  const html = /<img[^>]+src=["']([^"']+)["']/gi;
  while ((m = html.exec(body)) !== null) urls.push(m[1]);
  return urls.find(u => u.startsWith('/wp-content/')) || urls[0] || '';
}

export interface SeriesPart { slug: string; title: string; part: number; date: string; image: string; }
export interface Series { key: string; base: string; author: string; parts: SeriesPart[]; cover: string; }

// Construye todas las series (≥2 partes distintas) y un índice slug→serie.
export function buildSeries(posts: any[]): { all: Series[]; bySlug: Map<string, Series> } {
  const groups = new Map<string, Series>();
  for (const p of posts) {
    const pp = parsePart(p.data.title || '');
    if (!pp) continue;
    const author = p.data.author || '';
    const key = keyOf(pp.base) + '::' + keyOf(author);
    if (!groups.has(key)) groups.set(key, { key, base: pp.base, author, parts: [], cover: '' });
    groups.get(key)!.parts.push({ slug: p.slug, title: p.data.title, part: pp.part, date: p.data.date || '', image: p.data.image || firstBodyImage(p.body || '') });
  }
  const all: Series[] = [];
  const bySlug = new Map<string, Series>();
  for (const g of groups.values()) {
    // exigir al menos 2 entregas con números de parte distintos
    const distinct = new Set(g.parts.map(x => x.part));
    if (distinct.size < 2) continue;
    // ordenar por parte; deduplicar misma parte (quedarse con la primera)
    g.parts.sort((a, b) => a.part - b.part || a.slug.localeCompare(b.slug));
    const seen = new Set<number>();
    g.parts = g.parts.filter(x => (seen.has(x.part) ? false : (seen.add(x.part), true)));
    // portada de la serie: una imagen de sus propias entregas, elegida de forma
    // estable pero distinta entre series (hash de la clave) para que no se repitan.
    const withImg = g.parts.filter(x => x.image);
    if (withImg.length) {
      let h = 0; for (const c of g.key) h = (h * 31 + c.charCodeAt(0)) >>> 0;
      g.cover = withImg[h % withImg.length].image;
    }
    all.push(g);
    for (const part of g.parts) bySlug.set(part.slug, g);
  }
  all.sort((a, b) => b.parts.length - a.parts.length || a.base.localeCompare(b.base, 'es'));
  return { all, bySlug };
}
