export const CAT_FIX: Record<string,string> = {
  'Politics in Cuba':'Política en Cuba','Culture':'Cultura','Marxism':'Marxismo',
  'Opinion.':'Opinión','Marxismo en Cuba':'Marxismo',
};
export const fixCat = (c:string)=> CAT_FIX[c] || c || 'Sin categoría';
export const slugify = (s:string)=> s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')
  .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
// monograma de autor (iniciales + color estable) para cuando no hay foto
const MONO_COLORS = ['#8a2b2b','#6b4f2a','#4f5d3a','#3f5666','#6d4a5c','#7a5230','#4a5a52'];
export const initials = (n:string)=>{
  const w = (n||'').trim().split(/\s+/);
  return ((w[0]?.[0]||'') + (w.length>1 ? w[w.length-1][0] : (w[0]?.[1]||''))).toUpperCase();
};
export const monoColor = (n:string)=>{
  let h=0; for(const c of (n||'')) h=(h*31+c.charCodeAt(0))>>>0;
  return MONO_COLORS[h % MONO_COLORS.length];
};

export const fmtDate = (d?:string)=>{
  if(!d) return '';
  const t=new Date(d); if(isNaN(+t)) return '';
  return t.toLocaleDateString('es-ES',{year:'numeric',month:'long',day:'numeric'});
};
// Devuelve una variante más pequeña de la imagen (las que generó WordPress: name-800x600.jpg)
// si existe en /public, para no cargar el original a tamaño completo en miniaturas.
import fs from 'node:fs';
import path from 'node:path';
const PUB = path.resolve('public');
const dirCache = new Map<string,string[]>();
export function thumb(src?:string, target=600):string {
  if(!src || !src.startsWith('/wp-content/')) return src||'';
  const rel = src.replace(/^\//,'');
  const dir = path.join(PUB, path.dirname(rel));
  const base = path.basename(rel);
  const m = base.match(/^(.*)\.([a-zA-Z0-9]+)$/); if(!m) return src;
  const stem = m[1], ext = m[2];
  let files = dirCache.get(dir);
  if(!files){ try{ files = fs.readdirSync(dir); }catch{ files = []; } dirCache.set(dir, files); }
  const re = new RegExp('^'+stem.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'-(\\d+)x(\\d+)\\.'+ext+'$','i');
  let best:string|null=null, bestDiff=Infinity;
  for(const f of files){ const mm=f.match(re); if(mm){ const w=+mm[1]; if(w>=400){ const d=Math.abs(w-target); if(d<bestDiff){ bestDiff=d; best=f; } } } }
  return best ? path.posix.join(path.posix.dirname(src), best) : src;
}

// Como thumb(), pero además devuelve ancho/alto cuando el nombre del archivo
// los codifica (name-800x600.jpg). Sirve para fijar width/height y evitar
// saltos de maquetación (CLS) sin cambiar el aspecto.
export function thumbData(src?:string, target=600):{src:string,w?:number,h?:number}{
  const out = thumb(src, target);
  const m = out.match(/-(\d+)x(\d+)\.[a-zA-Z0-9]+$/);
  return m ? { src:out, w:+m[1], h:+m[2] } : { src:out };
}

export const excerpt = (body:string, n=200)=>{
  const txt=body
    .replace(/<[^>]+>/g,' ')                        // etiquetas HTML sueltas (iframe, etc.)
    .replace(/!\[[^\]]*\]\([^)]*\)/g,'')            // imágenes
    .replace(/\[([^\]]*)\]\([^)]*\)/g,'$1')          // enlaces -> texto
    .replace(/\\([.\-*_#>\[\]()`~])/g,'$1')          // quitar escapes markdown (1\. -> 1.)
    .replace(/[#>*_`~]/g,'')                          // énfasis / encabezados
    .replace(/^\s*\d+\.\s+/,'')                       // marcador de lista inicial
    .replace(/\s+/g,' ').trim();
  return txt.length>n ? txt.slice(0,n).replace(/\s+\S*$/,'')+'…' : txt;
};
