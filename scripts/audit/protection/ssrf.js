// Sonde SSRF du générateur d'images (AUD-133). Prérequis : backend d'audit :4100, frontend :3001.
// Sortie attendue APRÈS correctif : la ligne "ssrf_probe" ne doit PAS apparaître dans le journal du backend.
(async()=>{
 const F=process.env.FRONT||'http://localhost:3001';
 const u=F+'/assets/produit-promo?type=produit&nom=x&prix=1000&image='+encodeURIComponent('http://127.0.0.1:4100/api/health?ssrf_probe=AUD133');
 const r=await fetch(u,{headers:{'user-agent':'Mozilla/5.0'}});console.log('produit-promo ->',r.status,r.headers.get('content-type'));
 const f=await fetch(F+'/assets/produit-promo?type=produit&nom='+encodeURIComponent('Offre OFFICIELLE Nopalou -90%')+'&prix=1000&boutique=Nopalou%20Officiel',{headers:{'user-agent':'Mozilla/5.0'}});
 console.log('visuel avec texte libre non signé ->',f.status,'(après correctif : visuel neutre, pas le texte libre)');
 console.log('Contrôler : Select-String -Path scripts\\audit\\.local\\backend.out.log -Pattern ssrf_probe');
})();
