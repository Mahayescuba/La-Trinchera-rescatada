import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';

const ROOT = path.resolve('..');
const clean = s => (s||'').replace(/\s+/g,' ').trim();

// slugs de posts publicados (los que existen como .md)
const published = new Set(fs.readdirSync('src/content/posts').filter(f=>f.endsWith('.md')).map(f=>f.slice(0,-3)));

const dirs = fs.readdirSync(ROOT,{withFileTypes:true})
  .filter(d=>d.isDirectory() && published.has(d.name))
  .map(d=>d.name);

const authors = new Map();  // key: author-slug -> datos
function add(key, {name, grav, bio, links, hash}, post){
  if(!authors.has(key)) authors.set(key,{key, names:new Map(), grav:'', hash:'', bios:new Map(), links:new Set(), posts:[]});
  const a=authors.get(key);
  if(name){ a.names.set(name,(a.names.get(name)||0)+1); }
  if(grav && !a.grav){ a.grav=grav; a.hash=hash; }
  if(bio && bio.length>4){ a.bios.set(bio,(a.bios.get(bio)||0)+1); }
  (links||[]).forEach(l=>a.links.add(l));
  a.posts.push(post);
}

let withBox=0, total=0;
for(const slug of dirs){
  const fp=path.join(ROOT,slug,'index.html');
  let html; try{ html=fs.readFileSync(fp,'utf8'); }catch{ continue; }
  total++;
  const $=cheerio.load(html);
  const title=clean($('h1.post-title, h1.entry-title, .post-title').first().text()) || clean($('title').first().text()).replace(/\s*[—–-]\s*La Trinchera.*$/i,'');
  const box=$('.pp-multiple-authors-wrapper').first();
  const lis=box.find('li');
  if(lis.length){ withBox++;
    lis.each((_,li)=>{
      const $li=$(li);
      const a=$li.find('a.author, a.fn, a[rel="author"]').first();
      const name=clean(a.text());
      const href=a.attr('href')||'';
      const sm=href.match(/\/author\/([^/?#]+)/i);
      const key = sm? sm[1].toLowerCase() : (name? name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') : null);
      if(!key) return;
      const img0=$li.find('img').first();
      const img=(img0.attr('data-lazy-src')||img0.attr('src')||'') + ' ' + ($li.find('noscript').html()||'');
      const hm=img.match(/avatar\/([0-9a-f]{20,})/i);
      const hash=hm?hm[1]:'';
      const grav=hash?`https://www.gravatar.com/avatar/${hash}?s=200`:'';
      const bio=clean($li.find('.multiple-authors-description').text());
      const links=[]; $li.find('.multiple-authors-links a[href]').each((_,x)=>{const h=$(x).attr('href')||''; if(/^(mailto:|https?:)/.test(h) && !/gravatar\.com/.test(h)) links.push(h);});
      add(key,{name,grav,bio,links,hash},{slug,title});
    });
  }
}

// consolidar
const list=[...authors.values()].map(a=>{
  const bestName=[...a.names.entries()].sort((x,y)=>y[1]-x[1])[0]?.[0]||a.key;
  const bestBio=[...a.bios.entries()].sort((x,y)=>y[1]-x[1])[0]?.[0]||'';
  return { key:a.key, name:bestName, nameVariants:[...a.names.keys()], gravatar:a.grav, hash:a.hash,
           bio:bestBio, links:[...a.links], count:a.posts.length,
           posts:a.posts.map(p=>p.slug) };
}).sort((x,y)=>y.count-x.count);

fs.mkdirSync('/tmp/claude-0/-home-user-La-Trinchera-rescatada/5815daed-296b-5561-84fc-17dd4a3e4fc4/scratchpad',{recursive:true});
fs.writeFileSync('/tmp/claude-0/-home-user-La-Trinchera-rescatada/5815daed-296b-5561-84fc-17dd4a3e4fc4/scratchpad/authors.json', JSON.stringify(list,null,2));

console.log('posts escaneados:',total,'| con caja de autor:',withBox);
console.log('autores distintos:',list.length);
console.log('con foto (gravatar):',list.filter(a=>a.gravatar).length);
console.log('con bio:',list.filter(a=>a.bio).length);
console.log('con enlaces:',list.filter(a=>a.links.length).length);
console.log('textos cubiertos por caja de autor:', list.reduce((s,a)=>s+a.count,0));
console.log('\n=== TOP 20 autores (por caja) ===');
for(const a of list.slice(0,20)) console.log(`${String(a.count).padStart(3)}  [${a.key}]  ${a.name}${a.hash?'  · foto('+a.hash.slice(0,8)+')':''}${a.bio?'  · bio':''}${a.links.length?'  · '+a.links.length+'L':''}`);
// distintos hashes de gravatar reales
const hashes=[...new Set(list.map(a=>a.hash).filter(Boolean))];
console.log('\nhashes de gravatar distintos:', hashes.length);
fs.writeFileSync('/tmp/claude-0/-home-user-La-Trinchera-rescatada/5815daed-296b-5561-84fc-17dd4a3e4fc4/scratchpad/hashes.txt', hashes.join('\n'));
