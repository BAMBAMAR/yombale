const routes=require(process.argv[2]);const fs=require('fs');
const RISKY=/scraper|crawler|omnisource|lancer|scrap|backup|sauvegarde|restore|migration|broadcast|envoyer-tous|relance|whatsapp\/send|test-alertes/i;
const U='00000000-0000-4000-8000-000000000001';
const base='http://localhost:4100';
const todo=routes.filter(r=>r.p.startsWith('/api')).map(r=>({...r,url:r.p.replace(/:p|:[A-Za-z_]+/g,U).replace(/\(.*?\)/g,'')}));
const res=[];let i=0;
async function w(){ while(i<todo.length){ const r=todo[i++]; 
  if(RISKY.test(r.p)&&r.m!=='GET'){res.push({...r,status:'SKIPPED_RISKY'});continue}
  try{ const c=new AbortController();const t=setTimeout(()=>c.abort(),8000);
   const f=await fetch(base+r.url,{method:r.m,headers:{'content-type':'application/json'},body:['GET','HEAD','DELETE'].includes(r.m)?undefined:'{}',signal:c.signal,redirect:'manual'});
   clearTimeout(t); const txt=(await f.text()).slice(0,140); res.push({m:r.m,p:r.p,mw:r.mw,status:f.status,body:txt}); }
  catch(e){ res.push({m:r.m,p:r.p,mw:r.mw,status:'ERR',body:String(e.message).slice(0,80)}) } } }
Promise.all(Array.from({length:8},w)).then(()=>{fs.writeFileSync(process.argv[3],JSON.stringify(res,null,1));console.log('probed',res.length)});
