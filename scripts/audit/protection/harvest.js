const B='http://localhost:4100';
async function g(p){const t0=Date.now();const r=await fetch(B+p);const t=await r.text();let j=null;try{j=JSON.parse(t)}catch{};return{s:r.status,len:t.length,ms:Date.now()-t0,j}}
const n=(x)=>Array.isArray(x)?x.length:(x&&typeof x==='object'?Object.entries(x).map(([k,v])=>Array.isArray(v)?k+':'+v.length:null).filter(Boolean).join(' '):'-');
(async()=>{
 let r=await g('/api/offres/');console.log('offres sans param: status',r.s,'rows',r.j.length,'octets',r.len,'ms',r.ms);
 const withPrice=r.j.filter(o=>o.url_achat).length;console.log(' avec url_achat:',withPrice,' marchands distincts:',new Set(r.j.map(o=>o.marchand)).size,' quarantinee exposé:',r.j.filter(o=>o.quarantinee).length);
 for(const p of ['/api/produits/?limit=100000','/api/produits/?limit=100&page=1','/api/immo/?limit=100000','/api/annonces/?limit=100000','/api/boutiques/?limit=100000','/api/agences/public?limit=100000','/api/telecom/?limit=100000','/api/search/?q=a&limit=100000','/api/produits/instantanee?q=a','/api/produits/tendances','/api/produits/categories-actives']){
  r=await g(p);console.log(p,'->',r.s,'octets',r.len,'ms',r.ms,'|',r.j?n(r.j.produits||r.j.annonces||r.j.boutiques||r.j.agences||r.j.forfaits||r.j.immo||r.j):'' ,'| total:',r.j&&(r.j.total??''),'limit:',r.j&&(r.j.limit??''));
 }
})();
