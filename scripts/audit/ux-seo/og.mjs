for (const p of ['/marchands','/categorie/smartphones','/immo/location-chambre-dakar','/boutiques','/']) {
  const r = await fetch('http://localhost:3001'+p,{headers:{'user-agent':'Mozilla/5.0 Chrome/124'}}); const t = await r.text()
  const m=[...t.matchAll(/<meta (?:property|name)="((?:og|twitter):[^"]+)" content="([^"]{0,70})/g)].map(x=>x[1]+'='+x[2])
  console.log(p, m.join(' | '))
}
for (const ua of ['Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)','facebookexternalhit/1.1','curl/8.4.0','']) {
  const r = await fetch('http://localhost:3001/immo',{headers:{'user-agent':ua}}); console.log('UA=['+ua.slice(0,30)+']', r.status)
}
