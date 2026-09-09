import fs from 'node:fs'; import path from 'node:path';
const DIR='src/content/posts';
const files=fs.readdirSync(DIR).filter(f=>f.endsWith('.md'));
const posts=[];
for(const f of files){
  const t=fs.readFileSync(path.join(DIR,f),'utf8');
  const m=t.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/); if(!m) continue;
  const fm={}; for(const line of m[1].split('\n')){ const i=line.indexOf(': '); if(i>0){ let v=line.slice(i+2).trim(); try{v=JSON.parse(v)}catch{}; fm[line.slice(0,i)]=v; } }
  const body=m[2].replace(/!\[[^\]]*\]\([^)]*\)/g,'').replace(/\[([^\]]*)\]\([^)]*\)/g,'$1').replace(/[#>*_`]/g,'').replace(/\s+/g,' ').trim();
  fm.slug=f.replace(/\.md$/,''); fm.excerpt=body.slice(0,180);
  if(fm.title) posts.push(fm);
}
const dated=posts.filter(p=>p.date&&p.image).sort((a,b)=>(b.date||'').localeCompare(a.date||''));
const fixCat=c=>({'Politics in Cuba':'Política en Cuba','Culture':'Cultura','Marxism':'Marxismo','Opinion.':'Opinión'}[c]||c||'');
const fmt=d=>{try{return new Date(d).toLocaleDateString('es-ES',{year:'numeric',month:'long',day:'numeric'})}catch{return ''}};
const feat=dated[0]; const grid=dated.slice(1,10);
const img=p=>p.image||'';
const esc=s=>(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;');

function page(css, header, hero){
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><style>
  *{box-sizing:border-box;margin:0;padding:0}${css}</style></head><body>
  ${header}${hero}
  <main class="wrap">
   <a class="feat" href="#">${feat.image?`<div class="fi" style="background-image:url(${img(feat)})"></div>`:''}
     <div class="ft"><span class="cat">${esc(fixCat(feat.category))}</span><h2>${esc(feat.title)}</h2>
     <p>${esc(feat.excerpt)}…</p><span class="meta">${esc(feat.author||'')}${feat.author?' · ':''}${fmt(feat.date)}</span></div></a>
   <div class="grid">${grid.map(p=>`<a class="card" href="#">${p.image?`<div class="ci" style="background-image:url(${img(p)})"></div>`:''}
     <div class="cb"><span class="cat">${esc(fixCat(p.category))}</span><h3>${esc(p.title)}</h3>
     <p>${esc(p.excerpt).slice(0,110)}…</p><span class="meta">${esc(p.author||'')}${p.author?' · ':''}${fmt(p.date)}</span></div></a>`).join('')}</div>
  </main></body></html>`;
}

// ---- 1. RESEÑA INTELECTUAL ----
const m1=page(`
 body{background:#fbf9f5;color:#1a1714;font-family:-apple-system,"Segoe UI",Roboto,Arial,sans-serif}
 .wrap{max-width:1080px;margin:0 auto;padding:0 1.2rem}
 header{border-bottom:1px solid #e7e0d6;background:#fff}
 .hdr{max-width:1080px;margin:0 auto;padding:1.1rem 1.2rem;display:flex;justify-content:space-between;align-items:center}
 .brand{font-family:Georgia,serif;font-weight:700;font-size:1.7rem}.brand small{display:block;font-size:.6rem;letter-spacing:.22em;text-transform:uppercase;color:#6b625a}
 nav a{font-size:.8rem;text-transform:uppercase;letter-spacing:.08em;color:#6b625a;margin-left:1.1rem}
 .hero{text-align:center;padding:2.4rem 1.2rem 1.4rem}.hero .k{color:#8a2b2b;text-transform:uppercase;letter-spacing:.16em;font-size:.72rem}
 .hero h1{font-family:Georgia,serif;font-size:3rem;margin:.15em 0}.hero p{color:#6b625a;max-width:640px;margin:.3rem auto 0}
 .cat{color:#8a2b2b;font-size:.7rem;letter-spacing:.12em;text-transform:uppercase;font-weight:700}
 h2,h3{font-family:Georgia,serif}
 .feat{display:grid;grid-template-columns:1.1fr 1fr;gap:1.6rem;align-items:center;background:#fff;border:1px solid #e7e0d6;border-radius:10px;overflow:hidden;margin-bottom:2rem;text-decoration:none;color:inherit}
 .fi{min-height:320px;background-size:cover;background-position:center}.ft{padding:1.6rem}.ft h2{font-size:1.9rem;margin:.3em 0}.ft p{color:#6b625a}
 .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.4rem;padding-bottom:2rem}
 .card{background:#fff;border:1px solid #e7e0d6;border-radius:9px;overflow:hidden;text-decoration:none;color:inherit;display:flex;flex-direction:column}
 .ci{height:150px;background-size:cover;background-position:center}.cb{padding:.9rem 1rem 1.1rem;display:flex;flex-direction:column;gap:.35rem}
 .cb h3{font-size:1.12rem;margin:.15em 0}.cb p{color:#6b625a;font-size:.9rem}.meta{color:#8c837a;font-size:.76rem;margin-top:auto;padding-top:.3rem}
`,
`<header><div class="hdr"><div class="brand">La Trinchera<small>muchas maneras de estar</small></div>
 <nav><a>Política</a><a>Economía</a><a>Marxismo</a><a>Cultura</a><a>Buscar</a></nav></div></header>`,
`<section class="hero"><p class="k">Archivo · 2018–2021</p><h1>La Trinchera</h1>
 <p>Debate de ideas desde Cuba. Teoría, política y economía sin filiación: izquierda, derecha, centro, marxistas, libertarios.</p></section>`);

// ---- 2. TRINCHERA / MANIFIESTO ----
const m2=page(`
 body{background:#f4f1ea;color:#111;font-family:-apple-system,"Segoe UI",Roboto,Arial,sans-serif}
 .wrap{max-width:1120px;margin:0 auto;padding:0 1.2rem}
 header{background:#111;color:#f4f1ea}
 .hdr{max-width:1120px;margin:0 auto;padding:1rem 1.2rem;display:flex;justify-content:space-between;align-items:baseline}
 .brand{font-weight:900;font-size:2rem;letter-spacing:-.02em;text-transform:uppercase}
 .brand small{display:inline;font-weight:400;font-size:.62rem;letter-spacing:.2em;text-transform:uppercase;color:#e0483b;margin-left:.6rem}
 nav a{font-size:.76rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#f4f1ea;margin-left:1rem}
 .hero{background:#e0483b;color:#fff;padding:2rem 1.2rem}.hero .wrap2{max-width:1120px;margin:0 auto}
 .hero h1{font-size:2.2rem;font-weight:900;text-transform:uppercase;letter-spacing:-.01em;line-height:1}
 .hero p{max-width:720px;margin-top:.6rem;font-weight:500}
 .strip{background:#111;color:#f4f1ea;font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;text-align:center;padding:.5rem}
 .cat{color:#e0483b;font-size:.7rem;letter-spacing:.1em;text-transform:uppercase;font-weight:800}
 h2,h3{font-weight:800;letter-spacing:-.01em;text-transform:uppercase;line-height:1.05}
 .feat{display:grid;grid-template-columns:1fr 1fr;gap:0;align-items:stretch;border:3px solid #111;margin:1.6rem 0;text-decoration:none;color:inherit}
 .fi{min-height:340px;background-size:cover;background-position:center;border-right:3px solid #111}.ft{padding:1.6rem;background:#fff}.ft h2{font-size:2rem;margin:.2em 0}.ft p{color:#333;text-transform:none;font-weight:400}
 .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:0;border:3px solid #111;border-right:0;border-bottom:0;padding-bottom:0;margin-bottom:2rem}
 .card{border-right:3px solid #111;border-bottom:3px solid #111;background:#fff;text-decoration:none;color:inherit;display:flex;flex-direction:column}
 .ci{height:150px;background-size:cover;background-position:center;border-bottom:3px solid #111}.cb{padding:.9rem 1rem;display:flex;flex-direction:column;gap:.3rem}
 .cb h3{font-size:1.05rem}.cb p{color:#444;font-size:.85rem;text-transform:none;font-weight:400}.meta{color:#888;font-size:.72rem;text-transform:uppercase;letter-spacing:.05em;margin-top:auto;padding-top:.3rem}
`,
`<header><div class="hdr"><div class="brand">La Trinchera<small>muchas maneras de estar</small></div>
 <nav><a>Política</a><a>Economía</a><a>Marxismo</a><a>Cultura</a><a>Buscar</a></nav></div></header>
 <div class="strip">Izquierda · Derecha · Centro · Sin filiación</div>`,
`<section class="hero"><div class="wrap2"><h1>Un lugar para pensar en desacuerdo</h1>
 <p>Debate de ideas desde Cuba, 2018–2021. Teoría, política y economía sin importar la filiación.</p></div></section>`);

// ---- 3. ARCHIVO CÁLIDO / REVISTA DE ENSAYO ----
const m3=page(`
 body{background:#f3ece1;color:#2b2620;font-family:"Iowan Old Style",Palatino,"Book Antiqua",Georgia,serif}
 .wrap{max-width:1000px;margin:0 auto;padding:0 1.4rem}
 header{background:#f3ece1;border-bottom:2px solid #cbb89a}
 .hdr{max-width:1000px;margin:0 auto;padding:1.4rem;display:flex;flex-direction:column;align-items:center;gap:.4rem}
 .brand{font-size:2.4rem;letter-spacing:.02em}.brand small{display:block;text-align:center;font-size:.66rem;letter-spacing:.28em;text-transform:uppercase;color:#9a8straw;color:#977f5a;font-family:-apple-system,sans-serif;margin-top:.2rem}
 nav{margin-top:.4rem}nav a{font-family:-apple-system,sans-serif;font-size:.78rem;text-transform:uppercase;letter-spacing:.12em;color:#6b5d47;margin:0 .7rem}
 .hero{text-align:center;padding:2.2rem 1.4rem 1rem}.hero p{color:#6b5d47;max-width:600px;margin:0 auto;font-style:italic;font-size:1.15rem}
 .cat{color:#a2662b;font-family:-apple-system,sans-serif;font-size:.68rem;letter-spacing:.14em;text-transform:uppercase;font-weight:700}
 .feat{display:block;background:transparent;text-decoration:none;color:inherit;margin:1.4rem 0 2.2rem;text-align:center}
 .fi{height:380px;background-size:cover;background-position:center;border-radius:4px;margin-bottom:1rem}
 .ft h2{font-size:2.3rem;margin:.2em auto;max-width:760px}.ft p{color:#6b5d47;max-width:640px;margin:.4rem auto;font-size:1.05rem}.meta{color:#977f5a;font-family:-apple-system,sans-serif;font-size:.78rem}
 .grid{display:grid;grid-template-columns:repeat(2,1fr);gap:2rem 2.4rem;padding-bottom:2rem}
 .card{background:transparent;text-decoration:none;color:inherit;display:flex;flex-direction:column}
 .ci{height:200px;background-size:cover;background-position:center;border-radius:4px}.cb{padding:.7rem 0;display:flex;flex-direction:column;gap:.3rem}
 .cb h3{font-size:1.4rem}.cb p{color:#6b5d47;font-size:1rem}.meta{color:#977f5a;font-family:-apple-system,sans-serif;font-size:.76rem;margin-top:auto;padding-top:.2rem}
`,
`<header><div class="hdr"><div class="brand">La Trinchera<small>muchas maneras de estar</small></div>
 <nav><a>Política</a><a>Economía</a><a>Marxismo</a><a>Cultura</a><a>Buscar</a></nav></div></header>`,
`<section class="hero"><p>Debate de ideas desde Cuba (2018–2021). Teoría, política y economía sin filiación — izquierda, derecha, centro, marxistas, libertarios.</p></section>`);

fs.writeFileSync('mock1.html',m1); fs.writeFileSync('mock2.html',m2); fs.writeFileSync('mock3.html',m3);
console.log('mocks generados. posts con imagen:',dated.length);
