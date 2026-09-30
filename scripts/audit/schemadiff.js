// Usage : node scripts/audit/schemadiff.js <base> <backup.sql.gz>
// Compare le schéma d'une base (argv[3]) aux tables/colonnes observées dans le dump de production (colonnes des INSERT)
const fs=require('fs'),zlib=require('zlib'),readline=require('readline');
const {Client}=require(require('path').resolve(__dirname,'../../node_modules/pg'));
(async()=>{
 const pw=fs.readFileSync(require('path').join(__dirname,'.local','pgpass.txt'),'utf8').trim(); const db=process.argv[2];
 const prod={}; const rl=readline.createInterface({input:fs.createReadStream(process.argv[3]).pipe(zlib.createGunzip()),crlfDelay:Infinity}); const re=/^INSERT INTO\s+"?([a-z0-9_]+)"?\s*\(([^)]*)\)/i;
 for await(const l of rl){ const m=re.exec(l.length>4000?l.slice(0,4000):l); if(m){ (prod[m[1]]=prod[m[1]]||new Set()); m[2].split(',').forEach(c=>prod[m[1]].add(c.trim().replace(/"/g,''))) } }
 const c=new Client({connectionString:`postgresql://postgres:${pw}@127.0.0.1:54329/${db}`,ssl:false}); await c.connect();
 const {rows}=await c.query("select table_name,column_name from information_schema.columns where table_schema='public'"); const cur={}; rows.forEach(r=>{(cur[r.table_name]=cur[r.table_name]||new Set()).add(r.column_name)});
 const missingTables=Object.keys(prod).filter(t=>!cur[t]); const missingCols={}; for(const t of Object.keys(prod)){ if(!cur[t]) continue; const m=[...prod[t]].filter(x=>!cur[t].has(x)); if(m.length) missingCols[t]=m }
 console.log(`base ${db}: ${Object.keys(cur).length} tables | tables de la prod (avec données) : ${Object.keys(prod).length}`);
 console.log('tables présentes en production mais ABSENTES de la base :',JSON.stringify(missingTables));
 console.log('colonnes présentes en production mais ABSENTES de la base :',JSON.stringify(missingCols)); await c.end(); })()
