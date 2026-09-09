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

const SKIP = new Set(['category','tag','author','page','feed','wp-content','wp-includes','wp-json','comments','amigos','wp-admin',
  'categorias','la-trinchera',   // páginas-utilidad, no artículos (índice de categorías, portada)
  // copias duplicadas (mismo texto con otro slug); se conserva la otra versión
  'homenaje-a-marx','janos-kornai','reforma-constitucional-en-cuba-1-2','quien-es-yusuam-2','marti-y-fray-olallo-2']);
// títulos que en el origen quedaron como SEO/lema en vez del título real del artículo
const TITLE_FIX = { 'blog-la-trinchera':'Al lector', 'podcast-cubano-el-solar':'El Solar' };
const NAV_SELECTORS = '.sharedaddy,.jp-relatedposts,.sd-sharing,.pvc_stats,.wpupg-grid,.crp_related,.yarpp-related,script,style,.code-block,.wp-block-buttons,.saboxplugin-wrap,#jp-post-flair,.sharing,.entry-meta,.post-tags,.post-share,.related'
  // caja de autor duplicada al final (PublishPress Multiple Authors + widgets de bio/gravatar)
  + ',.pp-multiple-authors-wrapper,.multiple-authors-description,.multiple-authors-links,.ashe_author_widget,.ashe-widget,.author-box,.author_index_1,.author-img-circle,.wpl-avatars,.sd-like-gravatars,.wpl-likebox'
  // embeds de entradas relacionadas y párrafos ocultos de palabras clave (SEO)
  + ',.wp-embedded-content,.has-white-color';

function readable(html){ return html.replace(/\r/g,''); }
function clean(s){ return (s||'').replace(/\s+/g,' ').trim(); }

// cuentas de administración/sección: su caja de autor NO indica el autor real del texto
const BOX_ADMIN = new Set(['hayesmartinez','miguel-hayes','la-trinchera-editor','lisdds','anckla','elsolarpodcast']);
// unificar variantes del mismo autor
const NAME_FIX = {
  'Miguel Alejandro Hayes Martínez':'Miguel Alejandro Hayes',
  'Miguel Alejando Hayes Martínez':'Miguel Alejandro Hayes',
  'Miguel Alejandro Hayes Martinez':'Miguel Alejandro Hayes',
  'Rene Portuondo':'René Portuondo',
  'Julio Pernus':'Julio Pernús',
  'Alberto Miguel de La Paz Suárez':'Alberto Miguel de la Paz Suárez',
  'Ernesto Nuñez':'Ernesto Núñez',
  'Giordan Rodríguez Milanes':'Giordan Rodríguez Milanés',
  'Leonardo Manuel Férnandez Otaño':'Leonardo Manuel Fernández Otaño',
  'Carlos Avila Villamar':'Carlos Ávila Villamar',
  'Iramis Rosique':'Iramís Rosique',
  'Juan M. Ferran Oliva':'Juan M. Ferrán Oliva',
  'Marcos Paz Sablon':'Marcos Paz Sablón',
  'Alina B. López Hernández':'Alina Bárbara López Hernández',
};
const fixName = n => NAME_FIX[n] || n;

// autores recuperados desde la fuente original (URL de repost) — no están en el cuerpo
const SOURCE_AUTHOR = {
  'el-otro-pais':'René Fidel González García',       // cubaposible.com/author/rene-fidel-gonzalez-garcia
  'marx-salario-y-capital':'Miguel Alejandro Hayes',  // rebelion.org/autor/miguel-alejandro-hayes
  'los-hay-que':'Miguel Alejandro Hayes',             // rebelion.org/los-efectos-de-facundo
  // columnas cuyo slug lleva el nombre del autor (colaboradores frecuentes)
  'a-latir-de-pecho-pablo-dussac':'Pablo Dussac',
  'como-esta-la-habana-pablo-dussac':'Pablo Dussac',
  'coyuntura-pablo-dussac':'Pablo Dussac',
  'jugando-a-decir-lo-mismo-pablo-dussac':'Pablo Dussac',
  'lo-que-debo-hacer-pablo-dussac':'Pablo Dussac',
  'leonardo-padura-sender-escobar':'Sender Escobar',
  'fernando-rodriguez-sosa-sender-escobar':'Sender Escobar',
  'vicente-feliu-sender-escobar':'Sender Escobar',
  // firma al final del texto
  'fallece-enrique-colina':'René Fidel González García',
};

// palabras que siguen a "por" como preposición (no son nombres)
const NOT_NAME = /^(qué|que|el|la|los|las|un|una|eso|ejemplo|ello|ende|tanto|tantos|supuesto|ahora|favor|aquí|allí|estos|estas|este|esta|cierto|momento|primera|otro|otra|medio|cada|si|más|demás)\b/i;
// palabras Título que cortan un nombre pegado al texto (inicio de la frase del artículo)
const STOP_WORD = new Set(['Por','El','La','Los','Las','Un','Una','Este','Esta','Estos','Estas','En','Al','De','Del','Con','Cuba','Y','O','Que','Se','No','Su','Sus','Lo','A','Como','Para','Desde','Hoy','Ayer','Cuando','Ahora','Hace','Si','Ha','Han','Es','Eso']);
const validName = n => n.length>=3 && n.length<=45 && !NOT_NAME.test(n) && /[A-Za-zÁÉÍÓÚÑáéíóúñ]{2,}/.test(n) && n.split(/\s+/).length<=6;
// Buscar la firma "Por: Nombre" / "Autor: Nombre" en el inicio del cuerpo (~900 car.).
// Devuelve {name, line, replaceWith?} o null.
function findByline(body){
  const lines=body.split('\n');
  let acc=0;
  for(let i=0;i<lines.length;i++){
    if(i>=30 || acc>4000) break; acc+=lines[i].length+1;   // firma cerca del inicio (por línea o por caracteres)
    const de=lines[i].replace(/[*_`]/g,'').replace(/^\s*#{1,6}\s*/,'');   // sin énfasis ni ## de encabezado
    // 1) línea que es SOLO "Por: Nombre" o "Autor: Nombre" (admite "Por :" con espacio)
    let m=de.match(/^\s*(?:[Pp]or\s*:?|[Aa]utor\s*:)\s*([A-ZÁÉÍÓÚÑ][^\n]{1,45}?)\s*$/);
    if(m){
      const name=clean(m[1]).replace(/[*_.,;:\\\s]+$/,'').trim();
      if(validName(name)) return {name, line:lines[i]};
    }
    // 2) "Por: Nombre" al inicio de línea pero pegado al texto (colon obligatorio: evita prosa "Por Fidel Castro sabemos…")
    m=de.match(/^\s*(?:[Pp]or|[Aa]utor):\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ.]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ.]+){0,4})\s+([a-záéíóúñ¿].*)?$/);
    if(m && m[2]){   // hay texto de artículo después del nombre
      const words=m[1].split(/\s+/); const keep=[];
      for(const w of words){ if(STOP_WORD.has(w)) break; keep.push(w); }
      const name=keep.join(' ').replace(/[.,;:]+$/,'').trim();
      if(keep.length>=1 && validName(name)){
        // quitar solo el prefijo "Por: Nombre" de la línea, conservando el resto
        const rx=new RegExp('^(\\s*\\**\\s*(?:[Pp]or:?|[Aa]utor:)\\s*\\**\\s*)'+name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s*[*_]*\\s*','');
        return {name, line:lines[i], replaceWith:lines[i].replace(rx,'')};
      }
    }
  }
  return null;
}

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
  // autor de la caja de WordPress (solo fiable si NO es una cuenta de admin/sección)
  const boxLink=$('.pp-multiple-authors-wrapper a.author, .pp-multiple-authors-wrapper a[rel="author"], .pp-multiple-authors-wrapper a.fn').first();
  const boxName=clean(boxLink.text());
  const boxHref=boxLink.attr('href')||'';
  const boxKey=((boxHref.match(/\/author\/([^/?#]+)/i)||[])[1]||'').toLowerCase();
  const boxAuthorTrust = (boxName && boxName.length<50 && boxKey && !BOX_ADMIN.has(boxKey) && !/tag\/autor/.test(boxHref)) ? boxName : '';
  // Preferir el título real del artículo (H1 en la página) sobre el título SEO del <title>/Yoast.
  let title = clean($('h1.post-title, h1.entry-title, .entry-title h1, h1.post_title, .post-title, .entry-title').first().text());
  if(!title){
    title = clean($('title').first().text()).replace(/\s*[—–-]\s*La Trinchera.*$/i,'').replace(/^▷/,'');
  }
  title = title.replace(/^▷\s*/,'').trim();
  if(TITLE_FIX[slug]) title=TITLE_FIX[slug];   // corregir títulos SEO/lema puntuales
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
    body=mdFromContainer($,cont);
  }
  // autor: línea de firma "Por: Nombre" en las primeras líneas del cuerpo (ambos caminos)
  if(!author){
    const bl=findByline(body);
    if(bl){ author=bl.name;
      if(bl.replaceWith!=null){ const ls=body.split('\n'); const k=ls.indexOf(bl.line); if(k>=0) ls[k]=bl.replaceWith; body=ls.join('\n'); }
      else body=body.split('\n').filter(l=>l!==bl.line).join('\n');
    }
  }
  if(!author && SOURCE_AUTHOR[slug]) author=SOURCE_AUTHOR[slug];   // recuperado de la fuente original
  if(!author && boxAuthorTrust) author=boxAuthorTrust;   // sin firma: usar caja solo si es autor real
  body=body.replace(/^\s*Anuncios\s*$/gmi,'').replace(/\n{3,}/g,'\n\n').trim();
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
  return {slug,title,date,image,category,author:fixName(author),body,isClean};
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
