const routes=require(process.argv[2]);const seed=require(process.argv[3]);const who=process.argv[4];const fs=require('fs');
const RISKY=/scraper|crawler|omnisource|lancer|backup|sauvegarde|restore|migration|broadcast|envoyer-tous|relance|test-alertes/i;
const U='00000000-0000-4000-8000-000000000001';const Bid=seed.B.boutique.id;const tok=seed[who].token;
const tenant=routes.filter(r=>r.p.startsWith('/api')&&r.mw.includes('verifierToken')&&/:(id|boutiqueId|boutique_id)\b/.test(r.p)&&!/^\/api\/(admin)/.test(r.p));
const todo=tenant.map(r=>({...r,url:r.p.replace(/:(id|boutiqueId|boutique_id)\b/,Bid).replace(/:[A-Za-z_]+/g,U)}));
console.log('tenant routes',todo.length);
const res=[];let i=0;
async function w(){while(i<todo.length){const r=todo[i++];
 if(RISKY.test(r.p)&&r.m!=='GET'){res.push({m:r.m,p:r.p,status:'SKIP'});continue}
 try{const c=new AbortController();const t=setTimeout(()=>c.abort(),8000);
  const f=await fetch('http://localhost:4100'+r.url,{method:r.m,headers:{'content-type':'application/json',authorization:'Bearer '+tok},body:['GET','HEAD','DELETE'].includes(r.m)?undefined:'{}',signal:c.signal});
  clearTimeout(t);const txt=(await f.text()).slice(0,110);res.push({m:r.m,p:r.p,mw:r.mw.join(','),status:f.status,body:txt})}
 catch(e){res.push({m:r.m,p:r.p,status:'ERR',body:e.message})}}}
Promise.all(Array.from({length:6},w)).then(()=>{fs.writeFileSync(process.argv[5],JSON.stringify(res,null,1));console.log('done',res.length)});
