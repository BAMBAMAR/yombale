const B='http://localhost:4100';const s=require(process.argv[2]+'/seed.json');
async function j(method,url,body,token,extra){const r=await fetch(B+url,{method,headers:{'content-type':'application/json',...(token?{authorization:'Bearer '+token}:{}),...(extra||{})},body:body?JSON.stringify(body):undefined});let t=await r.text();let d;try{d=JSON.parse(t)}catch{d=t}return {s:r.status,d,h:r.headers}}
(async()=>{
 const id=s.A.boutique.id;
 const put=await j('PUT','/api/boutiques/'+id,{rccm:'SN-DKR-2026-B-TEST1',ninea:'0099999TEST',compte_bancaire:'TEST-COMPTE-0000-FAKE',forme_juridique:'SARL',capital_social:'1000000',pos_remise_max_caissier:25},s.A.token);
 console.log('PUT boutique (propriétaire A) ->',put.s,JSON.stringify(put.d).slice(0,120));
 const anon=await j('GET','/api/boutiques/'+id);
 const d=anon.d;console.log('GET anonyme ->',anon.s,{rccm:d.rccm,ninea:d.ninea,compte_bancaire:d.compte_bancaire,forme_juridique:d.forme_juridique,capital_social:d.capital_social,pos_remise_max_caissier:d.pos_remise_max_caissier,utilisateur_id_present:!!d.utilisateur_id,plan_actif:d.plan_actif});
 const bySlug=await j('GET','/api/boutiques/'+s.A.boutique.slug);console.log('GET anonyme par slug ->',bySlug.s,'compte_bancaire:',bySlug.d.compte_bancaire);
 // les mêmes champs via la liste ?
 const list=await j('GET','/api/boutiques/?limit=50');const me=(list.d.boutiques||[]).find(b=>b.id===id);console.log('liste publique contient la boutique A:',!!me,'| champs sensibles dans la liste:',me?Object.keys(me).filter(k=>/rccm|ninea|compte|utilisateur_id|pos_remise/.test(k)):'-');
 // consommateurs légitimes du endpoint public : le frontend l'utilise-t-il pour compte_bancaire ? (voir grep côté code)
})();
