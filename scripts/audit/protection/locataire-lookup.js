const B='http://localhost:4100';const tel='770000099';
(async()=>{
 const r=await fetch(B+'/api/locatif-immo/public/locataire-lookup?tel='+tel);const j=await r.json();
 console.log('GET locataire-lookup (anonyme, numéro seul) -> statut',r.status,'| clés racine:',Object.keys(j).join(','));
 console.log(' locataire:',JSON.stringify(j.locataire));
 const b=j.baux[0];console.log(' clés du bail:',Object.keys(b).join(','));console.log(' loyer',b.loyer_mensuel,'| adresse bien:',b.bien_adresse,'| pieces_jointes:',JSON.stringify(b.pieces_jointes).slice(0,120));
 const p=await fetch(B+b.contrat_pdf_url);console.log(' contrat PDF via téléphone seul ->',p.status,p.headers.get('content-type'));
 const nok=await fetch(B+'/api/locatif-immo/public/bail/'+b.id+'.pdf?tel=770000000');console.log(' même PDF avec un mauvais numéro ->',nok.status);
 let c={};for(let i=0;i<60;i++){const x=await fetch(B+'/api/locatif-immo/public/locataire-lookup?tel='+(770000000+i),{headers:{'x-forwarded-for':'203.0.113.88'}});c[x.status]=(c[x.status]||0)+1}console.log(' 60 numéros consécutifs depuis une IP (dev) :',JSON.stringify(c),'(aucun 429 = pas de limiteur dédié)');
 // upload anonyme (bail+tel): fichier html factice
 const fd=new FormData();fd.append('tel',tel);fd.append('type_piece','autre');fd.append('file',new Blob(['<html><script>1</script></html>'],{type:'text/html'}),'test.html');
 const u=await fetch(B+'/api/locatif-immo/public/bail/'+b.id+'/documents',{method:'POST',body:fd});const uj=await u.text();console.log(' dépôt anonyme d\'un fichier text/html (bail+tel) ->',u.status,uj.slice(0,140));
})();
