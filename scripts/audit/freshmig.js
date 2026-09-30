// Usage : node scripts/audit/freshmig.js <nb_passes> [nobase]   (MIGRATE_STRICT=true pour faire échouer)
// Construit une base VIDE et y applique les migrations du dépôt EXACTEMENT comme le démarrage de l'API, puis compare au schéma de référence
const {spawnSync}=require('child_process');const fs=require('fs'),path=require('path');
const {Client}=require(require('path').resolve(__dirname,'../../node_modules/pg'));
const ROOT=require('path').resolve(__dirname,'../..');const pass=Number(process.argv[2]||1);
const pw=fs.readFileSync(require('path').join(__dirname,'.local','pgpass.txt'),'utf8').trim();const PG='C:/Program Files/PostgreSQL/16/bin/';
const env={...process.env,PGPASSWORD:pw,PGCLIENTENCODING:'UTF8'};const DB='nopalou_fresh';
const psql=(db,args)=>spawnSync(PG+'psql.exe',['-h','127.0.0.1','-p','54329','-U','postgres','-d',db,'-q',...args],{env,encoding:'utf8'});
(async()=>{
 psql('postgres',['-c',`DROP DATABASE IF EXISTS ${DB}`]);psql('postgres',['-c',`CREATE DATABASE ${DB} ENCODING 'UTF8'`]);
 const url=`postgresql://postgres:${pw}@127.0.0.1:54329/${DB}`; const run=(code)=>spawnSync('node',['-e',code],{cwd:ROOT,env:{...process.env,DATABASE_URL:url,NODE_ENV:'development'},encoding:'utf8',maxBuffer:1<<26});
 // même séquence que app.js au démarrage : extensions puis migrate-inline ; (migrate.js = schéma de base)
 psql(DB,['-c','CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; CREATE EXTENSION IF NOT EXISTS "pg_trgm";']);
 const withBase=process.argv[3]!=='nobase';
 if(withBase){ const b=run("require('./backend/migrate.js')"); await new Promise(r=>setTimeout(r,100)); }
 const errs=new Set();
 for(let i=1;i<=pass;i++){ const r=run("require('./backend/migrate-inline')().then(()=>process.exit(0)).catch(e=>{console.error('THROW',e.message);process.exit(1)})"); const lines=((r.stdout||'')+(r.stderr||'')).split('\n').filter(l=>/échec|echec|n'existe pas|THROW|❌|erreur/i.test(l)); if(i===pass) lines.forEach(l=>errs.add(l.replace(/\u001b\[[0-9;]*m/g,'').trim().slice(0,170))); console.log(`pass ${i}: ${lines.length} erreur(s)`) }
 console.log('--- erreurs restantes à la dernière passe:'); [...errs].slice(0,25).forEach(e=>console.log('  '+e));
 const c=new Client({connectionString:url,ssl:false});await c.connect(); const n=(await c.query("select count(*) from information_schema.tables where table_schema='public'")).rows[0].count; await c.end(); console.log('tables:',n);
})();
