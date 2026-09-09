import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';

const ROOT = path.resolve('..');          // la-trinchera-rescatada
const OUT = path.resolve('src/content/posts');
const PUBLIC = path.resolve('public');     // assets servidos por el sitio
fs.mkdirSync(OUT, { recursive: true });
const localExists = (src)=> src.startsWith('/wp-content/') && fs.existsSync(path.join(PUBLIC, src.replace(/^\//,'')));

const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', bulletListMarker: '-' });
td.keep(['iframe']);

const SKIP = new Set(['category','tag','author','page','feed','wp-content','wp-includes','wp-json','comments','amigos','wp-admin']);
const NAV_SELECTORS = '.sharedaddy,.jp-relatedposts,.sd-sharing,.pvc_stats,.wpupg-grid,.crp_related,.yarpp-related,script,style,.code-block,.wp-block-buttons,.saboxplugin-wrap,#jp-post-flair,.sharing,.entry-meta,.post-tags,.post-share,.related'
  // caja de autor duplicada al final (PublishPress Multiple Authors + widgets de bio/gravatar)
  + ',.pp-multiple-authors-wrapper,.multiple-authors-description,.multiple-authors-links,.ashe_author_widget,.ashe-widget,.author-box,.author_index_1,.author-img-circle,.wpl-avatars,.sd-like-gravatars,.wpl-likebox'
  // embeds de entradas relacionadas y párrafos ocultos de palabras clave (SEO)
  + ',.wp-embedded-content,.has-white-color';

function readable(html){ return html.replace(/\r/g,''); }
function clean(s){ return (s||'').replace(/\s+/g,' ').trim(); }

// texto normalizado (sin markdown) para comparar párrafos duplicados
function normText(s){
  return (s||'')
    .replace(/!\[[^\]]*\]\([^)]*\)/g,'')      // imágenes
    .replace(/\[([^\]]*)\]\([^)]*\)/g,'$1')    // enlaces -> texto
    .replace(/[*_`#>]/g,'')                     // énfasis/encabezados
    .replace(/\s+/g,' ').trim().toLowerCase();
}
// colapsar un bloque que es exactamente el mismo texto repetido 2–3 veces (duplicado en el origen)
function collapseRepeat(block){
  const s=block.trim();
  for(const sep of ['',' ','\n\n','\n']){
    for(let n=2;n<=3;n++){
      const unit=(s.length-(n-1)*sep.length)/n;
      if(Number.isInteger(unit) && unit>=100){
        const first=s.slice(0,unit);
        if(s===Array(n).fill(first).join(sep)) return first.trim();
      }
    }
  }
  return block;
}
// de-duplicar párrafos repetidos y la entradilla que reaparece como prefijo de otro párrafo
function dedupeBody(body){
  let blocks=body.split(/\n\n+/).map(collapseRepeat);
  const seen=new Map(); const keep=[];
  for(const b of blocks){
    const n=normText(b);
    if(n.length>=80 && seen.has(n)) continue;   // párrafo idéntico repetido
    if(n.length>=80) seen.set(n,true);
    keep.push(b);
  }
  // entradilla (primer bloque de texto largo) que es prefijo exacto de un párrafo posterior
  const firstIdx=keep.findIndex(b=>{ const n=normText(b); return n.length>=60 && !/^!\[|^<|^#/.test(b.trim()); });
  if(firstIdx>=0){
    const lead=normText(keep[firstIdx]);
    const isPrefixLater=keep.some((b,i)=> i>firstIdx && normText(b).startsWith(lead) && normText(b).length>lead.length+20);
    if(isPrefixLater) keep.splice(firstIdx,1);
  }
  return keep.join('\n\n');
}

function mdFromContainer($, cont){
  cont.find(NAV_SELECTORS).remove();
  // quitar "También le puede interesar", "Me gusta esto", "Cargando..."
  cont.find('*').each((_,el)=>{ const t=clean($(el).text()).toLowerCase();
    if(/^(me gusta esto|cargando\.\.\.|también le puede interesar|comparte esto|relacionado)/.test(t) && $(el).children().length===0){ $(el).remove(); }
  });
  // eliminar el <noscript> de fallback de Jetpack lazy-load (duplicaba cada imagen)
  cont.find('noscript').remove();
  // eliminar iframes ocultos / de spam inyectados en el volcado (p.ej. dominios .ru, display:none)
  cont.find('iframe').each((_,el)=>{
    const src=$(el).attr('src')||'', st=($(el).attr('style')||'').replace(/\s/g,'');
    if(/:\/\/[^/]*\.ru\//i.test(src) || /display:none/i.test(st)) $(el).remove();
  });
  // reescribir imágenes: propias -> /wp-content/uploads/... ; externas -> URL directa
  cont.find('img').each((_,el)=>{
    let s=$(el).attr('data-orig-file')||$(el).attr('data-lazy-src')||$(el).attr('src')||'';
    s=s.replace(/^https?:\/\/web\.archive\.org\/web\/[^/]*\//i,'');        // quitar prefijo Wayback
    s=s.replace(/^(?:https?:)?\/\/i[0-9]\.wp\.com\//,'//');                // Photon: //iN.wp.com/HOST/… -> //HOST/…
    s=s.replace(/^(?:https?:)?\/\/(?:www\.)?(?:trincheracuba|desdetutrinchera)\.com(?=\/)/i,''); // dominio propio -> host-relativo
    s=s.replace(/^\.\.?\//,'/');                                            // ../foo -> /foo
    if(/^data:/.test(s)||!s){ $(el).remove(); return; }                    // placeholder sin fuente real
    if(/^\/\//.test(s)) s='https:'+s;                                      // protocol-relative externa
    if(/^https?:\/\//i.test(s)){                                           // imagen externa: dejar URL directa
      s=s.split('?')[0];
    } else {                                                               // imagen propia del sitio
      const m=s.match(/wp-content\/uploads\/.+$/);
      s = m ? '/'+m[0].split('?')[0] : (s.startsWith('/')?s:'/'+s).split('?')[0];
      // descartar imágenes locales que no se archivaron (evita el icono de imagen rota)
      if(s.startsWith('/wp-content/') && !localExists(s)){ $(el).remove(); return; }
    }
    $(el).attr('src',s);
    $(el).removeAttr('srcset'); $(el).removeAttr('data-orig-file'); $(el).removeAttr('data-lazy-src'); $(el).removeAttr('data-lazy-srcset');
  });
  cont.find('a[href]').each((_,el)=>{
    let h=$(el).attr('href')||'';
    // notas al pie de Word/Pages: applewebdata:// (a veces con la URL real incrustada) y anclas #_ftn/#_ftnref
    if(/^applewebdata:/i.test(h)){
      const real=h.match(/(https?):\/+([^\s#)]+)/i);
      if(real){ $(el).attr('href', real[1]+'://'+decodeURIComponent(real[2].replace(/%20/g,'')).replace(/\/+$/,'')); }
      else { $(el).replaceWith($(el).html()||$(el).text()); return; }   // sin URL real -> texto
      h=$(el).attr('href');
    } else if(/^#/.test(h)){ $(el).replaceWith($(el).html()||$(el).text()); return; }  // ancla interna rota
    let m=h.match(/(?:trincheracuba|desdetutrinchera)\.com\/([a-z0-9-]+)\/?/i);
    if(!m) m=h.match(/^\.\.\/([a-z0-9-]+)\/(?:index\.html)?$/);
    if(m && !['category','tag','author','page','wp-content','wp-includes','feed'].includes(m[1])){ $(el).attr('href','/'+m[1]+'/'); }
  });
  let html=cont.html()||'';
  let md=td.turndown(html);
  md=md.replace(/\n{3,}/g,'\n\n').trim();
  return md;
}

function extractOne(slug){
  const fp=path.join(ROOT,slug,'index.html');
  if(!fs.existsSync(fp)) return null;
  const $=cheerio.load(readable(fs.readFileSync(fp,'utf8')));
  const isClean = $('.aviso').length>0 && $('article').length>0; // recuperados por mí
  // Preferir el título real del artículo (H1 en la página) sobre el título SEO del <title>/Yoast.
  let title = clean($('h1.post-title, h1.entry-title, .entry-title h1, h1.post_title, .post-title, .entry-title').first().text());
  if(!title){
    title = clean($('title').first().text()).replace(/\s*[—–-]\s*La Trinchera.*$/i,'').replace(/^▷/,'');
  }
  title = title.replace(/^▷\s*/,'').trim();
  let date = $('meta[property="article:published_time"]').attr('content')||'';
  let image = $('meta[property="og:image"]').attr('content')||'';
  if(image){ const m=image.match(/wp-content\/uploads\/.+$/); image=m?'/'+m[0].split('?')[0]:''; }
  if(image && !localExists(image)) image='';   // no mostrar imagen destacada rota
  let category = clean($('a[rel~="category"]').first().text()) || '';
  let author='';
  let cont, body='';
  if(isClean){
    cont=$('article').first(); cont.find('.aviso,.volver,h1,.autor,footer').remove();
    author=clean($('.autor').first().text());
    body=mdFromContainer($,cont);
  } else {
    cont=$('.post-content').first();
    if(!cont.length) cont=$('.entry-content,.td-post-content').first();
    if(!cont.length) return null;
    // autor: primera línea "Por: X"
    const firstTxt=clean(cont.text());
    const am=firstTxt.match(/^Por:? *([A-ZÁÉÍÓÚÑ][^.\n]{1,50}?)(?=[A-ZÁÉÍÓÚ“"]|$)/);
    body=mdFromContainer($,cont);
    const bm=body.match(/^\**\s*Por:?\s*\**\s*([^\n*]{2,50})/);
    if(bm){ author=clean(bm[1]).replace(/\*+$/,'').trim(); body=body.replace(/^\**\s*Por:?[^\n]*\n+/, '').trim(); }
    body=body.replace(/^\s*Anuncios\s*$/gmi,'').replace(/\n{3,}/g,'\n\n').trim();
  }
  // limpiar enlaces de "contenido relacionado" inyectados por plugins
  body = body
    .replace(/^\s*\[Otro texto del autor\]\([^)]*\)\s*$/gmi,'')   // "otro texto del autor" -> categoría
    .replace(/^\s*Relacionado:\s*\[[^\]]*\]\([^)]*\)\s*$/gmi,'')   // "Relacionado: [..](..)"
    .replace(/^\s*https?:\/\/web\.archive\.org\/web\/\d+\S*\s*$/gmi,'')                       // enlaces Wayback sueltos
    .replace(/^\s*https?:\/\/(?:www\.)?(?:trincheracuba|desdetutrinchera)\.com\/\S*\s*$/gmi,'') // enlaces internos sueltos
    .replace(/^\s*(.{8,80}?),\s*\1\s*$/gmi,'')                                                // línea de palabra clave repetida (Yoast)
    .replace(/\n{3,}/g,'\n\n').trim();
  // iframe corrupto en el origen: su atributo quedó sin cerrar y arrastra HTML escapado
  // (otro iframe + la caja de autor con gravatar). Truncar la línea tras el primer iframe válido.
  body = body.split('\n').map(line=>{
    if(/&lt;\/?iframe|pp-multiple-authors|gravatar\.com\/avatar/i.test(line)){
      const i=line.indexOf('></iframe>');
      if(i>=0) return line.slice(0, i+'></iframe>'.length);
      return line.replace(/<iframe[\s\S]*$/i,'');   // sin iframe válido: quitar la basura
    }
    return line;
  }).join('\n').replace(/\n{3,}/g,'\n\n').trim();
  body = dedupeBody(body);   // quitar párrafos/entradillas duplicados del volcado
  if(!date){ // intentar de la URL wayback en algún enlace o dejar vacío
  }
  if(!title || body.length<120) return {slug, skipped:true, reason:'sin cuerpo', len:body.length};
  return {slug,title,date,image,category,author,body,isClean};
}

// recopilar slugs de primer nivel
const entries=fs.readdirSync(ROOT,{withFileTypes:true})
  .filter(d=>d.isDirectory() && !d.name.startsWith('.') && !SKIP.has(d.name))
  .map(d=>d.name)
  .filter(s=>fs.existsSync(path.join(ROOT,s,'index.html')));

const argsN = process.argv[2]?parseInt(process.argv[2]):entries.length;
let ok=0,skip=0; const cats={}, noDate=[];
for(const slug of entries.slice(0,argsN)){
  const r=extractOne(slug);
  if(!r || r.skipped){ skip++; continue; }
  const fm=[
    '---',
    'title: '+JSON.stringify(r.title),
    r.date?('date: '+JSON.stringify(r.date)) : 'date: ""',
    r.author?('author: '+JSON.stringify(r.author)) : 'author: ""',
    r.category?('category: '+JSON.stringify(r.category)) : 'category: ""',
    r.image?('image: '+JSON.stringify(r.image)) : 'image: ""',
    '---',''
  ].join('\n');
  fs.writeFileSync(path.join(OUT,r.slug+'.md'), fm+r.body+'\n');
  ok++; if(r.category) cats[r.category]=(cats[r.category]||0)+1; if(!r.date) noDate.push(r.slug);
}
console.log('OK',ok,'| omitidos',skip,'| sin fecha',noDate.length);
console.log('categorías:',JSON.stringify(cats,null,0).slice(0,400));
