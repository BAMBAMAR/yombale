// Usage : node scripts/audit/roundtrip.js
// Aller-retour sauvegarde -> restauration : base source (audit) -> dump applicatif -> base vide + schÃ©ma -> comparaison par table
const {spawnSync}=require('child_process');const fs=require('fs'),path=require('path'),zlib=require('zlib');
const {Client}=require(require('path').resolve(__dirname,'../../node_modules/pg'));
const ROOT=require('path').resolve(__dirname,'../..');
const pw=fs.readFileSync(require('path').join(__dirname,'.local','pgpass.txt'),'utf8').trim();
const PG='C:/Program Files/PostgreSQL/16/bin/';const env={...process.env,PGPASSWORD:pw,PGCLIENTENCODING:'UTF8'};
const SRC='nopalou_audit',DST='nopalou_restore_test';
const psql=(db,args,input)=>spawnSync(PG+'psql.exe',['-h','127.0.0.1','-p','54329','-U','postgres','-d',db,'-q','-v','ON_ERROR_STOP=0',...args],{env,input,encoding:'utf8',maxBuffer:1<<28});
(async()=>{
 psql('postgres',['-c',`DROP DATABASE IF EXISTS ${DST}`]); psql('postgres',['-c',`CREATE DATABASE ${DST} ENCODING 'UTF8'`]);
 const schema=spawnSync(PG+'pg_dump.exe',['-h','127.0.0.1','-p','54329','-U','postgres','-d',SRC,'-s'],{env,encoding:'utf8',maxBuffer:1<<28}).stdout;
 const r0=psql(DST,[],schema); const schemaErr=(r0.stderr||'').split('\n').filter(l=>/ERREUR|ERROR/.test(l)).length; console.log('schema applied, errors:',schemaErr);
 // 1) dump applicatif (script corrigÃ©)
 const b=spawnSync('node',['scripts/backup-database.mjs'],{cwd:ROOT,env:{...process.env,DATABASE_URL:`postgresql://postgres:${pw}@127.0.0.1:54329/${SRC}`,BACKUP_LABEL:'roundtrip'},encoding:'utf8',maxBuffer:1<<28});
 const gz=fs.readdirSync(ROOT+'/backups').filter(f=>f.endsWith('.sql.gz')).map(f=>({f,t:fs.statSync(ROOT+'/backups/'+f).mtimeMs})).sort((a,c)=>c.t-a.t)[0].f;
 console.log('backup exit',b.status,'file',gz);
 // 2) restauration dans la base vide
 const sql=zlib.gunzipSync(fs.readFileSync(ROOT+'/backups/'+gz)); const r=psql(DST,[],sql);
 const errs=(r.stderr||'').split('\n').filter(l=>/ERREUR|ERROR/.test(l)); console.log('restore errors:',errs.length); errs.slice(0,3).forEach(e=>console.log('  ',e.slice(0,160)));
 // 3) comparaison ligne Ã  ligne (comptage + somme de hachage par table)
 const a=new Client({connectionString:`postgresql://postgres:${pw}@127.0.0.1:54329/${SRC}`,ssl:false}),d=new Client({connectionString:`postgresql://postgres:${pw}@127.0.0.1:54329/${DST}`,ssl:false}); await a.connect();await d.connect();
 const tables=(await a.query("select tablename from pg_tables where schemaname='public' order by 1")).rows.map(r=>r.tablename);
 let diffs=0,total=0,rows=0;
 for(const t of tables){ const q=`select count(*) c, coalesce(md5(string_agg(md5(regexp_replace(to_jsonb(x)::text, '(\\d\\d:\\d\\d:\\d\\d\\.\\d{3})\\d{3}', '\\1', 'g')),'' order by md5(regexp_replace(to_jsonb(x)::text, '(\\d\\d:\\d\\d:\\d\\d\\.\\d{3})\\d{3}', '\\1', 'g')))),'') h from "${t}" x`; const ra=(await a.query(q)).rows[0]; let rd; try{rd=(await d.query(q)).rows[0]}catch(e){rd={c:'ERR',h:''}}; total++; rows+=Number(ra.c); if(ra.c!==rd.c||ra.h!==rd.h){diffs++; console.log('DIFF',t,'source',ra.c,'restaurÃ©',rd.c,ra.h===rd.h?'':'(contenu diffÃ©rent)')} }
 console.log(`\nRESULT tables comparÃ©es: ${total}, lignes: ${rows}, tables diffÃ©rentes: ${diffs}`); await a.end();await d.end();
})();


