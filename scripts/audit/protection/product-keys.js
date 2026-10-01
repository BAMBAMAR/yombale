const B='http://localhost:4101',BR='Mozilla/5.0 Chrome/122';
const keysOf=(o)=>{const k=new Set();(function w(x,p){if(Array.isArray(x))x.slice(0,3).forEach(i=>w(i,p));else if(x&&typeof x==='object')for(const a of Object.keys(x)){k.add(p+a);w(x[a],p+a+'.')}})(o,'');return[...k]};
(async()=>{
 const bs=(await (await fetch(B+'/api/boutiques/?limit=50',{headers:{'user-agent':BR}})).json()).boutiques;
 const b=bs.find(x=>x.slug==='dievo-style')||bs[0];
 const l=await (await fetch(B+'/api/boutiques/'+b.id+'/produits',{headers:{'user-agent':BR}})).json();
 console.log('liste produits boutique: clés ->',keysOf(l).join(','));
 const p=l.produits&&l.produits[0];
 if(p){const d=await fetch(B+'/api/boutiques/'+b.id+'/produits/'+p.id,{headers:{'user-agent':BR}});const dj=await d.json();console.log('détail produit ->',d.status,'clés ->',keysOf(dj).join(','))}
 const SENS=/(prix_achat|cout|cost|marge|fournisseur|stock_alerte|stock_min|seuil|code_barre|sku|quantite|stock_quantite|supplier|prix_revient)/i;
 console.log('clés sensibles (coût, fournisseur, quantités) dans la liste:',keysOf(l).filter(k=>SENS.test(k)).join(',')||'aucune');
 // produit comparateur : offres
 const pr=(await (await fetch(B+'/api/produits/?limit=1',{headers:{'user-agent':BR}})).json()).produits[0];
 const o=await (await fetch(B+'/api/produits/'+pr.id+'/offres',{headers:{'user-agent':BR}})).json();console.log('offres d\'un produit comparateur: clés ->',keysOf(o).join(','));
})();
