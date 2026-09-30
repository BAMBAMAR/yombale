// Accès SQL à la base d'audit locale uniquement. Usage : node q.js "SELECT ..."
const path = require('path');
const { Pool } = require(path.join('C:/Users/HP/.gemini/antigravity-ide/scratch/yombale/node_modules/pg'));
const url = process.env.DATABASE_URL || '';
if (!/127\.0\.0\.1:54329/.test(url) || /render/.test(url)) { console.error('REFUS: DATABASE_URL non locale'); process.exit(2); }
const p = new Pool({ connectionString: url });
p.query(process.argv[2]).then(r => { console.log(JSON.stringify(r.rows, null, 1)); return p.end(); }).catch(e => { console.error('ERR', e.message); process.exit(1); });
