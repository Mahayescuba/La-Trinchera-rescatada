// Empareja cada texto sin imagen con una obra de dominio público afín a su
// tema (según título + categoría + resumen), de forma estable por slug.
// El fondo (src/data/covers.json) es CC0 del Met Open Access, con crédito.
import covers from '../data/covers.json';

export interface Cover { id:string; file:string; themes:string[]; title:string; artist:string; date:string; url:string; }

// tema -> raíces de palabras (en minúscula y sin acentos) que lo evocan
const K: Record<string,string[]> = {
  politica:['politic','poder','gobiern','estado','partido','constituc','democrac','eleccion','dictadura','totalitar','represion','regimen','soberan','ideolog'],
  economia:['economi','mercado','salari','precio','dinero','valor','ordenamiento','cuentaprop','capital','pobreza','reforma','bloqueo'],
  muerte:['muerte','morir','duelo','fallec','cadaver','luto','suicid','tumba'],
  satira:['satir','humor','ironia','chiste','absurd','ridicul','farsa','payaso'],
  pueblo:['pueblo','gente','masa','popular','calle','ciudadan','multitud','vecino'],
  clase:['clase','obrer','proletari','burgues','trabajador','sindic','explotac'],
  guerra:['guerra','violenc','ejercito','combate','batalla','bomba','militar'],
  poder:['poder','autoritar','control','vigilanc','censura','orden'],
  historia:['histori','1959','republic','colonia','marti','independenc','siglo','pasado','memoria'],
  revolucion:['revoluc','insurrec','levantamiento','protesta','11j','san isidro','manifest'],
  cultura:['cultura','arte','cine','music','literatur','poesia','poema','novela','teatro','pintura','cancion','film','ficcion'],
  filosofia:['filosof','marx','teoria','dialectic','pensamient','hegel','concepto','razon','metafisic','etica'],
  cuerpo:['cuerpo','human','carne','deseo','sexual','genero','mujer','feminis','maternidad'],
  existencia:['existenc','soledad','angustia','sentido','vida','tiempo','miedo','esperanza'],
  retrato:['entrevista','conversa','perfil','quien es','dialogo','a fondo'],
  trabajo:['trabajo','empleo','oficio','labor','cuenta propia'],
  campo:['campo','agro','tierra','guajir','rural','cosecha','azucar'],
  identidad:['identidad','nacion','cuban','raza','negr','emigra','diaspora','exilio'],
};

const norm = (s:string)=> (s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
const hash = (s:string)=>{ let h=0; for(const c of s) h=(h*31+c.charCodeAt(0))>>>0; return h; };

export function pickCover(post:any): Cover {
  const text = norm([post.data?.title, post.data?.category, (post.body||'').slice(0,700)].join('  '));
  const score: Record<string,number> = {};
  for(const [theme,words] of Object.entries(K)){
    let s=0; for(const w of words){ if(text.includes(w)) s++; }
    if(s) score[theme]=s;
  }
  const ranked = Object.entries(score).sort((a,b)=>b[1]-a[1]).map(x=>x[0]);
  let cands: Cover[] = [];
  for(const th of ranked){ cands = (covers as Cover[]).filter(c=>c.themes.includes(th)); if(cands.length) break; }
  if(!cands.length) cands = covers as Cover[];
  return cands[hash(post.slug||post.data?.title||'x') % cands.length];
}
