// backend/lib/sqlDump.js
// Sérialisation de valeurs PostgreSQL en littéraux SQL pour la sauvegarde applicative (scripts/backup-database.mjs).
// AUD-031 : l'ancien code écrivait TOUS les tableaux en `'[...]'::jsonb`, ce qui échoue à la restauration dans une
// colonne `text[]` (ex. boutique_produits.images : « la colonne est de type text[] mais l'expression est de type
// jsonb »). Et comme la sauvegarde est une seule transaction, cette seule erreur annulait toute la restauration.
//
// Règles :
//  - colonne de type tableau SQL (udt_name commençant par « _ ») -> littéral de tableau PostgreSQL '{...}'
//  - colonne json / jsonb -> '...'::jsonb (y compris quand la valeur JS est un tableau ou un objet)
//  - bytea -> '\x...'::bytea ; date -> 'YYYY-MM-DD' (composantes locales, comme les construit node-pg)
//  - timestamp / timestamptz -> ISO UTC

function quote(str) {
  return `'${String(str).replace(/'/g, "''")}'`;
}

function elementTableau(el) {
  if (el === null || el === undefined) return 'NULL';
  if (Array.isArray(el)) return litteralTableau(el);
  if (el instanceof Date) return `"${el.toISOString()}"`;
  if (Buffer.isBuffer(el)) return `"\\\\x${el.toString('hex')}"`;
  if (typeof el === 'boolean') return el ? 'true' : 'false';
  if (typeof el === 'number') return Number.isFinite(el) ? String(el) : 'NULL';
  const s = typeof el === 'object' ? JSON.stringify(el) : String(el);
  return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

/** Littéral de tableau PostgreSQL (sans les apostrophes externes) : {"a","b",NULL} */
function litteralTableau(arr) {
  return `{${arr.map(elementTableau).join(',')}}`;
}

function dateLocale(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function formaterValeurSql(val, udtName = '') {
  if (val === null || val === undefined) return 'NULL';
  const udt = String(udtName || '');

  if (udt.startsWith('_') && Array.isArray(val)) return quote(litteralTableau(val));
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return Number.isFinite(val) ? val : 'NULL';
  if (Buffer.isBuffer(val)) return `'\\x${val.toString('hex')}'::bytea`;
  if (val instanceof Date) {
    if (Number.isNaN(val.getTime())) return 'NULL';
    if (udt === 'date') return `'${dateLocale(val)}'::date`;
    return `'${val.toISOString()}'::timestamptz`;
  }
  if (Array.isArray(val) || typeof val === 'object') return `${quote(JSON.stringify(val))}::jsonb`;
  return quote(val);
}

module.exports = { formaterValeurSql, litteralTableau };
