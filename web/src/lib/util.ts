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
export const excerpt = (body:string, n=200)=>{
  const txt=body.replace(/!\[[^\]]*\]\([^)]*\)/g,'').replace(/\[([^\]]*)\]\([^)]*\)/g,'$1')
    .replace(/[#>*_`]/g,'').replace(/\s+/g,' ').trim();
  return txt.length>n ? txt.slice(0,n).replace(/\s+\S*$/,'')+'…' : txt;
};
