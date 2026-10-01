const B='http://localhost:4100';
(async()=>{
 const im=await (await fetch(B+'/api/immo/?limit=100000')).json();
 const a=im.annonces;
 const tel=a.filter(x=>x.contact_tel&&String(x.contact_tel).replace(/\D/g,'').length>=9);
 console.log('immo lignes',a.length,'| avec téléphone en clair',tel.length,'| numéros distincts',new Set(tel.map(x=>String(x.contact_tel).replace(/\D/g,''))).size);
 console.log('immo: utilisateur_id renseigné',a.filter(x=>x.utilisateur_id).length,'| rejete=true',a.filter(x=>x.rejete===true).length,'| motif_rejet',a.filter(x=>x.motif_rejet).length,'| supprimee=true',a.filter(x=>x.supprimee===true).length,'| actif=false',a.filter(x=>x.actif===false).length,'| url_source',a.filter(x=>x.url_source).length,'| source:',JSON.stringify(a.reduce((m,x)=>(m[x.source]=(m[x.source]||0)+1,m),{})));
 console.log('immo: contact_nom renseigné',a.filter(x=>x.contact_nom).length);
 // annonces classifiées : paginer jusqu'au bout
 let all=[],page=1;while(true){const r=await (await fetch(B+'/api/annonces/?limit=50&page='+page)).json();if(!r.annonces||!r.annonces.length)break;all=all.concat(r.annonces);if(all.length>=r.total||page>200)break;page++}
 const tel2=all.filter(x=>x.contact_tel&&String(x.contact_tel).replace(/\D/g,'').length>=9);
 console.log('annonces: pages',page,'lignes',all.length,'| téléphone en clair',tel2.length,'| distincts',new Set(tel2.map(x=>String(x.contact_tel).replace(/\D/g,''))).size,'| contact_nom',all.filter(x=>x.contact_nom).length);
 const bq=await (await fetch(B+'/api/boutiques/?limit=50')).json();
 const bs=bq.boutiques;console.log('boutiques',bs.length,'/',bq.total,'| tel',bs.filter(b=>b.telephone).length,'| whatsapp',bs.filter(b=>b.whatsapp).length,'| plan_actif:',JSON.stringify(bs.reduce((m,x)=>(m[x.plan_actif]=(m[x.plan_actif]||0)+1,m),{})));
 // détail d'une boutique
 const id=bs[0].id;const d=await (await fetch(B+'/api/boutiques/'+id)).json();
 const keys=[];(function w(x,p){if(Array.isArray(x))x.slice(0,2).forEach(i=>w(i,p));else if(x&&typeof x==='object')for(const k of Object.keys(x)){keys.push(p+k);w(x[k],p+k+'.')}})(d,'');
 console.log('détail boutique clés:',keys.join(','));
})();
