// scripts/poste/creer-base-locale.js
// Crée la base locale du poste si elle n'existe pas (SRG-A5-011). L'adresse vient de la variable POSTE_BASE_LOCALE,
// jamais de la ligne de commande. Refuse toute adresse qui ne désigne pas ce poste.
// Si la base modèle existe (POSTE_BASE_MODELE, par défaut nopalou_audit_data, copie locale de la production), la
// nouvelle base en est une copie ; sinon elle est créée vide, et les migrations la remplissent au démarrage du backend.
const { Client } = require('pg');

(async () => {
  const adresse = process.env.POSTE_BASE_LOCALE || '';
  let u;
  try { u = new URL(adresse); } catch { console.error('POSTE_BASE_LOCALE illisible'); process.exit(1); }
  if (!/^(127\.0\.0\.1|localhost)$/.test(u.hostname)) { console.error('REFUS : la base doit être sur ce poste'); process.exit(1); }
  const nom = u.pathname.replace(/^\//, '');
  if (!/^[a-z][a-z0-9_]{2,40}$/.test(nom)) { console.error('REFUS : nom de base inattendu'); process.exit(1); }
  const modele = process.env.POSTE_BASE_MODELE || 'nopalou_audit_data';
  u.pathname = '/postgres';
  const c = new Client({ connectionString: u.toString(), ssl: false });
  await c.connect();
  const existe = async (b) => (await c.query('select 1 from pg_database where datname = $1', [b])).rows.length > 0;
  if (await existe(nom)) { console.log(`La base ${nom} existe déjà : rien à faire.`); await c.end(); return; }
  if (/^[a-z][a-z0-9_]{2,40}$/.test(modele) && (await existe(modele))) {
    await c.query(`CREATE DATABASE ${nom} TEMPLATE ${modele}`);
    console.log(`Base ${nom} créée, copie de ${modele}.`);
  } else {
    await c.query(`CREATE DATABASE ${nom} ENCODING 'UTF8'`);
    console.log(`Base ${nom} créée, vide : les migrations la rempliront au premier démarrage du backend.`);
  }
  await c.end();
})().catch((e) => { console.error('Échec :', e.message); process.exit(1); });
