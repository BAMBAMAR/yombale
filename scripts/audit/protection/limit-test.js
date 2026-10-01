const B='http://localhost:4101';
const BR='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0 Safari/537.36';
async function g(p,h){const r=await fetch(B+p,{headers:h});return {s:r.status,rl:r.headers.get('ratelimit-remaining'),lim:r.headers.get('ratelimit-limit')}}
(async()=>{
 const ip1='203.0.113.9';
 console.log('--- IP publique simulée via XFF (trust proxy=1): UA nu "node" et UA vide sur /api/produits');
 console.log('node UA   ', (await g('/api/produits/?limit=1',{'x-forwarded-for':ip1,'user-agent':'node'})).s);
 console.log('UA vide   ', (await g('/api/produits/?limit=1',{'x-forwarded-for':ip1,'user-agent':''})).s);
 console.log('python UA ', (await g('/api/produits/?limit=1',{'x-forwarded-for':ip1,'user-agent':'python-requests/2.31'})).s);
 console.log('okhttp UA ', (await g('/api/produits/?limit=1',{'x-forwarded-for':ip1,'user-agent':'okhttp/4.12'})).s,'(bloqué par la liste ? 429 = oui)');
 console.log('--- limiterBulk (liste /api/produits) : navigateur spoofé, même IP, requêtes séquentielles');
 let ok=0,first429=-1;for(let i=1;i<=320;i++){const r=await g('/api/produits/?limit=1',{'x-forwarded-for':ip1,'user-agent':BR});if(r.s===200)ok++;else if(first429<0){first429=i;console.log('première réponse non-200 à la requête',i,'statut',r.s)}}
 console.log('200 obtenus:',ok);
 console.log('--- même IP réelle (rightmost), XFF gauche forgé différent');
 console.log('XFF "198.51.100.1, 203.0.113.9":',(await g('/api/produits/?limit=1',{'x-forwarded-for':'198.51.100.1, '+ip1,'user-agent':BR})).s,'(429 attendu = pas de contournement par XFF gauche)');
 console.log('autre IP 203.0.113.10:',(await g('/api/produits/?limit=1',{'x-forwarded-for':'203.0.113.10','user-agent':BR})).s);
 console.log('--- /api/offres (dump 7,9 Mo) : limiteur ? 5 appels, même IP');
 for(let i=0;i<5;i++){const t=Date.now();const r=await fetch(B+'/api/offres/',{headers:{'x-forwarded-for':'203.0.113.20','user-agent':BR}});const b=await r.arrayBuffer();console.log(' appel',i+1,r.status,b.byteLength,'octets',Date.now()-t,'ms','ratelimit-remaining(global)=',r.headers.get('ratelimit-remaining'))}
 console.log('--- /api/immo en un appel, IP publique simulée, UA navigateur');
 {const r=await fetch(B+'/api/immo/?limit=100000',{headers:{'x-forwarded-for':'203.0.113.21','user-agent':BR}});const j=await r.json();console.log(' ',r.status,'annonces',j.annonces&&j.annonces.length,'avec tel',j.annonces&&j.annonces.filter(a=>a.contact_tel).length)}
 console.log('--- /api/annonces pagination par 50 : limiteur searchLimiter (150/15 min) puis limiterBulk(300)');
 let c=0,s429=0,first=-1;for(let p=1;p<=100;p++){const r=await fetch(B+'/api/annonces/?limit=50&page='+p,{headers:{'x-forwarded-for':'203.0.113.22','user-agent':BR}});if(r.status===200)c++;else{s429++;if(first<0)first=p}}
 console.log('  pages 200:',c,' refusées:',s429,' première refusée page:',first,' (93 pages = tout le catalogue annonces)');
})();
