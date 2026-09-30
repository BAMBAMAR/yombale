const B='http://localhost:4100';const fs=require('fs');
async function j(method,url,body,token){const r=await fetch(B+url,{method,headers:{'content-type':'application/json',...(token?{authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined});let t=await r.text();let d;try{d=JSON.parse(t)}catch{d=t}return {s:r.status,d}}
(async()=>{
 const pw='Audit!Pass2026x';const out={};
 for(const [k,nom,email] of [['A','Marchand A','a@audit.test'],['B','Marchand B','b@audit.test'],['C','Acheteur C','c@audit.test']]){
  const r=await j('POST','/api/auth/inscription',{nom,email,mot_de_passe:pw});
  out[k]={reg:r.s,token:r.d.token,uid:r.d.user&&r.d.user.id};
  if(r.s!==201) out[k].err=r.d; }
 for(const [k,tel,nom] of [['A','771110001','Boutique Audit A'],['B','771110002','Boutique Audit B']]){
  const r=await j('POST','/api/boutiques',{nom,telephone:tel,ville:'Dakar',categorie:'mode'},out[k].token);
  out[k].boutique={s:r.s,id:(r.d.boutique&&r.d.boutique.id)||r.d.id,slug:(r.d.boutique&&r.d.boutique.slug),raw:r.s===201||r.s===200?undefined:r.d};
  if(!out[k].boutique.id) out[k].boutique.dump=JSON.stringify(r.d).slice(0,300) }
 fs.writeFileSync(process.argv[2],JSON.stringify(out,null,1));console.log(JSON.stringify(out,(k,v)=>k==='token'?'<tok>':v,1));
})()
