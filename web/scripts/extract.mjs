import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';

const ROOT = path.resolve('..');          // la-trinchera-rescatada
const OUT = path.resolve('src/content/posts');
fs.mkdirSync(OUT, { recursive: true });

const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', bulletListMarker: '-' });
td.keep(['iframe']);

const SKIP = new Set(['category','tag','author','page','feed','wp-content','wp-includes','wp-json','comments','amigos','wp-admin']);
const NAV_SELECTORS = '.sharedaddy,.jp-relatedposts,.sd-sharing,.pvc_stats,.wpupg-grid,.crp_related,.yarpp-related,script,style,.code-block,.wp-block-buttons,.saboxplugin-wrap,#jp-post-flair,.sharing,.entry-meta,.post-tags,.post-share,.related';

function readable(html){ return html.replace(/\r/g,''); }
function clean(s){ return (s||'').replace(/\s+/g,' ').trim(); }

function mdFromContainer($, cont){
  cont.find(NAV_SELECTORS).remove();
  // quitar "También le puede interesar", "Me gusta esto", "Cargando..."
  cont.find('*').each((_,el)=>{ const t=clean($(el).text()).toLowerCase();
    if(/^(me gusta esto|cargando\.\.\.|también le puede interesar|comparte esto|relacionado)/.test(t) && $(el).children().length===0){ $(el).remove(); }
  });
  // reescribir imágenes a rutas absolutas del sitio
  cont.find('img').each((_,el)=>{
    let s=$(el).attr('data-orig-file')||$(el).attr('src')||'';
    s=s.replace(/^\.\.\//,'/').replace(/^(?:https?:)?\/\/[^/]*\//,'/');
    const m=s.match(/wp-content\/uploads\/.+$/); if(m) s='/'+m[0].split('?')[0];
    $(el).attr('src',s); $(el).removeAttr('srcset'); $(el).removeAttr('data-orig-file');
  });
  cont.find('a[href]').each((_,el)=>{
    let h=$(el).attr('href')||'';
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
  let title = clean($('title').first().text()).replace(/\s*[—–-]\s*La Trinchera.*$/i,'').replace(/^▷/,'');
  let date = $('meta[property="article:published_time"]').attr('content')||'';
  let image = $('meta[property="og:image"]').attr('content')||'';
  if(image){ const m=image.match(/wp-content\/uploads\/.+$/); image=m?'/'+m[0].split('?')[0]:''; }
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
    'slug: '+JSON.stringify(r.slug),
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
