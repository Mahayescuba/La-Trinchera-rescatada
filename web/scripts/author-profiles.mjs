// Genera src/data/authors.json: perfil (foto Gravatar, bio, enlaces) por autor,
// indexado por el "slug" del nombre para casar con el autor de cada post.
import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';

const ROOT = path.resolve('..');
const clean = s => (s||'').replace(/\s+/g,' ').trim();
const slugify = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');

const published = new Set(fs.readdirSync('src/content/posts').filter(f=>f.endsWith('.md')).map(f=>f.slice(0,-3)));
const dirs = fs.readdirSync(ROOT,{withFileTypes:true}).filter(d=>d.isDirectory() && published.has(d.name)).map(d=>d.name);

const prof = new Map();  // slug -> {name, hash, bio, links:Set}
for(const slug of dirs){
  let html; try{ html=fs.readFileSync(path.join(ROOT,slug,'index.html'),'utf8'); }catch{ continue; }
  const $=cheerio.load(html);
  $('.pp-multiple-authors-wrapper li').each((_,li)=>{
    const $li=$(li);
    const a=$li.find('a.author, a[rel="author"], a.fn').first();
    const name=clean(a.text()); if(!name || name.length>50) return;
    const key=slugify(name); if(!key) return;
    const img0=$li.find('img').first();
    const imgsrc=(img0.attr('data-lazy-src')||img0.attr('src')||'')+' '+($li.find('noscript').html()||'');
    const hm=imgsrc.match(/avatar\/([0-9a-f]{20,})/i);
    const bio=clean($li.find('.multiple-authors-description').text());
    const links=[]; $li.find('.multiple-authors-links a[href]').each((_,x)=>{const h=$(x).attr('href')||''; if(/^(mailto:|https?:)/.test(h) && !/gravatar\.com/.test(h)) links.push(h);});
    if(!prof.has(key)) prof.set(key,{name, hash:'', bio:'', links:new Set()});
    const p=prof.get(key);
    if(hm && !p.hash) p.hash=hm[1];
    if(bio && bio.length>p.bio.length) p.bio=bio;
    links.forEach(l=>p.links.add(l));
  });
}

// verificar qué gravatars son fotos reales (d=404 -> 404 si no hay foto propia)
async function realPhoto(hash){
  try{ const r=await fetch(`https://www.gravatar.com/avatar/${hash}?s=32&d=404`,{signal:AbortSignal.timeout(15000)}); return r.ok; }catch{ return false; }
}
const out={};
for(const [key,p] of prof){
  const links=[...p.links];
  let hash=p.hash;
  if(hash && !(await realPhoto(hash))) hash='';   // descartar silueta genérica
  if(hash || p.bio || links.length) out[key]={name:p.name, ...(hash?{hash}:{}), ...(p.bio?{bio:p.bio}:{}), ...(links.length?{links}:{})};
}
fs.mkdirSync('src/data',{recursive:true});
fs.writeFileSync('src/data/authors.json', JSON.stringify(out,null,2));
console.log('perfiles escritos:',Object.keys(out).length,
  '| con foto:',Object.values(out).filter(p=>p.hash).length,
  '| con bio:',Object.values(out).filter(p=>p.bio).length,
  '| con enlaces:',Object.values(out).filter(p=>p.links).length);
