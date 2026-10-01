const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36'
for (const p of ['/boutiques?v=sp','/categorie/smartphones?v=sp','/?categorie=smartphones&v=sp','/?q=itel&v=sp']) {
  const t = await (await fetch('http://localhost:3001'+p,{headers:{'user-agent':UA}})).text()
  const n=(t.match(/Sponsorisé/g)||[]).length
  const ctx=[...t.matchAll(/(.{60})Sponsorisé/g)].slice(0,2).map(m=>m[1].replace(/<[^>]+>/g,'~').slice(-50))
  console.log(p,'-> "Sponsorisé" x'+n, JSON.stringify(ctx))
}
