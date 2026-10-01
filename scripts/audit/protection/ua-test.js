const B='http://localhost:4101';
const UAS={'python-requests':'python-requests/2.31.0','curl':'curl/8.4.0','Go-http-client':'Go-http-client/1.1','Java (Sonatel-like)':'Java/17.0.2','okhttp':'okhttp/4.12.0','node (fetch undici)':'node','vide':'','navigateur spoofé':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0 Safari/537.36','Googlebot':'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)','facebookexternalhit':'facebookexternalhit/1.1','WhatsApp':'WhatsApp/2.23.20.0','python-aiohttp':'Python/3.11 aiohttp/3.9','Scrapy':'Scrapy/2.11 (+https://scrapy.org)','Wget':'Wget/1.21'};
async function g(p,ua,extra){const h={...(extra||{})};if(ua!==undefined)h['user-agent']=ua;const r=await fetch(B+p,{headers:h});return r.status}
(async()=>{
 console.log('--- GET /api/produits/?limit=1 (liste catalogue) selon le User-Agent, mode production, IP loopback');
 for(const [k,v] of Object.entries(UAS)) console.log(k.padEnd(22), await g('/api/produits/?limit=1',v));
 console.log('--- mêmes UA avec un en-tête Authorization bidon');
 for(const k of ['python-requests','curl','Scrapy']) console.log(k.padEnd(22), await g('/api/produits/?limit=1',UAS[k],{authorization:'Bearer x'}));
 console.log('--- API partenaire /api/v1/prix avec X-Api-Key (clé fausse): attendu 401 (auth), 403 = bloqué avant auth');
 for(const k of ['python-requests','curl','Java (Sonatel-like)','Go-http-client','navigateur spoofé']) console.log(k.padEnd(22), await g('/api/v1/prix',UAS[k],{'x-api-key':'nopalou_sk_live_fake'}));
 console.log('--- webhook Wave avec UA java (exempté par chemin)');
 const r=await fetch(B+'/api/paiement/wave/webhook',{method:'POST',headers:{'user-agent':'Java/17.0.2','content-type':'application/json'},body:'{}'});console.log('wave webhook UA Java',r.status);
})();
