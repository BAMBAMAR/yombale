const fs=require('fs'),path=require('path');
const root='C:/Users/HP/.gemini/antigravity-ide/scratch/yombale';
const envFiles=[root+'/.env',root+'/frontend-next/.env.local'].filter(f=>fs.existsSync(f));
const secrets=[];
for(const f of envFiles){for(const l of fs.readFileSync(f,'utf8').split(/\r?\n/)){const m=l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);if(!m)continue;let v=m[2].trim().replace(/^['"]|['"]$/g,'');if(v.length>=10&&!/^https?:\/\/(localhost|127\.)/.test(v)&&!/^(true|false|production|development)$/.test(v))secrets.push({k:m[1],v,f:path.basename(f)})}}
console.log('valeurs recherchées (noms seulement):',secrets.length,'|',[...new Set(secrets.map(s=>s.k))].join(','));
function walk(d,out=[]){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory()){if(e.name==='cache')continue;walk(p,out)}else out.push(p)}return out}
const targets={'client (.next/static)':root+'/frontend-next/.next/static','public/':root+'/frontend-next/public','serveur (.next/server)':root+'/frontend-next/.next/server'};
for(const [name,dir] of Object.entries(targets)){
  if(!fs.existsSync(dir)){console.log(name,'absent');continue}
  const files=walk(dir).filter(f=>!/\.(png|jpg|jpeg|webp|avif|ico|woff2?|pdf|mp4)$/i.test(f));
  const hits={};let bytes=0;
  for(const f of files){let t;try{t=fs.readFileSync(f,'utf8')}catch{continue}bytes+=t.length;for(const s of secrets){if(t.includes(s.v)){(hits[s.k]=hits[s.k]||new Set()).add(path.relative(dir,f).slice(0,70))}}}
  console.log(name,'fichiers',files.length,'octets',bytes,'=> secrets du .env retrouvés:',Object.keys(hits).length?JSON.stringify(Object.fromEntries(Object.entries(hits).map(([k,v])=>[k,[...v].slice(0,3)]))):'AUCUN');
}
// motifs génériques dans le client
const cl=walk(root+'/frontend-next/.next/static').filter(f=>/\.(js|css|json|map)$/.test(f));
const pats={'.map présents':/\.map$/,};
console.log('source maps dans .next/static:',cl.filter(f=>f.endsWith('.map')).length);
const rx={sk_live:/sk_live_[A-Za-z0-9]{8,}/g,whsec:/whsec_[A-Za-z0-9]{10,}/g,fbtoken:/EAA[A-Za-z0-9]{40,}/g,jwt:/eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}/g,tg:/\b\d{8,10}:AA[\w-]{33}\b/g,pgurl:/postgres(ql)?:\/\/[^\s'"]+@/g,adminpath:/\/api\/admin\/[a-z-]+/g};
const found={};for(const f of cl.filter(f=>f.endsWith('.js'))){const t=fs.readFileSync(f,'utf8');for(const [k,r] of Object.entries(rx)){const m=t.match(r);if(m){(found[k]=found[k]||new Set());m.slice(0,200).forEach(x=>found[k].add(k==='adminpath'?x:x.slice(0,10)+'…'))}}}
for(const [k,v] of Object.entries(found))console.log('motif',k,'occurrences distinctes',v.size, k==='adminpath'?[...v].slice(0,25).join(' '):'');
console.log('motifs non trouvés:',Object.keys(rx).filter(k=>!found[k]).join(','));
