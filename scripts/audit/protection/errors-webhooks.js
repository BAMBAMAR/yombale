const B='http://localhost:4101';const BR='Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0';
async function r(m,p,h,b){const x=await fetch(B+p,{method:m,headers:{'user-agent':BR,'content-type':'application/json',...(h||{})},body:b});const t=await x.text();return{s:x.status,t,h:x.headers}}
(async()=>{
 console.log('== A. Messages d\'erreur bruts (mode production)');
 for(const [m,p] of [['GET','/api/immo/?limit=abc'],['GET','/api/immo/?page=x'],['GET','/api/offres/?produit_id=zzz'],['GET','/api/offres/?marchand_id=1'],['GET','/api/annonces/?page=abc'],['GET','/api/produits/?limit=abc'],['GET','/api/telecom/?limit=abc'],['GET','/api/boutiques/?page=abc'],['GET','/api/immo/not-a-uuid'],['GET','/api/annonces/not-a-uuid'],['GET','/api/telecom/not-a-uuid']]){
   const x=await r(m,p);console.log(m,p.padEnd(34),x.s,x.t.replace(/\s+/g,' ').slice(0,150));
 }
 console.log('\n== B. 404 API / en-têtes d\'erreur');
 let x=await r('GET','/api/inexistant');console.log('GET /api/inexistant',x.s,x.t.slice(0,100));
 x=await r('GET','/inexistant');console.log('GET /inexistant',x.s,x.t.slice(0,100));
 x=await r('POST','/api/auth/connexion',{},'{bad json');console.log('POST JSON invalide',x.s,x.t.slice(0,100));
 x=await r('GET','/');console.log('GET / headers: x-powered-by=',x.h.get('x-powered-by'),'| server=',x.h.get('server'),'| csp present=',!!x.h.get('content-security-policy'));
 console.log('\n== C. Webhooks sans signature (mode production)');
 for(const p of ['/api/paiement/wave/webhook','/api/paiement/stripe/webhook','/api/paiement/orange/webhook','/api/whatsapp/webhook']){const y=await r('POST',p,{},'{"type":"checkout.session.completed","data":{"id":"x"}}');console.log('POST',p.padEnd(32),y.s,y.t.slice(0,80))}
 const g=await r('GET','/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=123');console.log('GET whatsapp verify mauvais jeton',g.s,g.t.slice(0,60));
 console.log('\n== D. Recoupement AUD-014 (routes internes anonymes)');
 for(const p of ['/api/scraper/status','/api/scraper/facebook/progress','/api/scraper/sites','/api/paiement/server-ip','/api/whatsapp/health','/api/admin/system','/api/abonnements/admin','/api/facebook-posts/token-status','/api/boutiques/admin/webhooks','/api/prospection/omnisource/stats']){const y=await r('GET',p);console.log('GET',p.padEnd(40),y.s,y.t.slice(0,70))}
 console.log('\n== E. Recoupement AUD-016 : /api/analytics hors limiteur global ?');
 let last;for(let i=0;i<12;i++){last=await r('POST','/api/analytics/event',{'x-forwarded-for':'203.0.113.77'},'{"type":"x"}')}
 console.log('POST /api/analytics/event x12 dernier statut',last.s,last.t.slice(0,80),'| ratelimit-remaining=',last.h.get('ratelimit-remaining'));
 console.log('\n== F. /api/settings (non admin)');
 let s=await r('GET','/api/settings');console.log('GET /api/settings anonyme',s.s,s.t.slice(0,60));
 s=await r('GET','/api/settings',{'authorization':'Bearer x'});console.log('GET /api/settings Bearer bidon',s.s,s.t.slice(0,60));
})();
