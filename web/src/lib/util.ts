export const CAT_FIX: Record<string,string> = {
  'Politics in Cuba':'Política en Cuba','Culture':'Cultura','Marxism':'Marxismo',
  'Opinion.':'Opinión','Marxismo en Cuba':'Marxismo',
};
export const fixCat = (c:string)=> CAT_FIX[c] || c || 'Sin categoría';
export const slugify = (s:string)=> s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')
  .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
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
