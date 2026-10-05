// scripts/sync-projetbi-unes.js
// Synchronisation des Unes du jour depuis projetbi (LE-PROJET) vers Surga

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../backend/models/db');

const LOCAL_LE_PROJET_DIR = path.resolve(__dirname, '../../LE-PROJET');
const TARGET_UNES_DIR = path.resolve(__dirname, '../frontend-next/public/surga/unes');

const KNOWN_PAPERS = [
  { keywords: ['rewmi sport', 'rewmisport'], name: 'Rewmi Sports' },
  { keywords: ['rewmi quotidien', 'rewmi'], name: 'Rewmi Quotidien' },
  { keywords: ['soleil', 'le soleil', 'lesoleil'], name: 'Le Soleil' },
  { keywords: ['sud quotidien', 'sudonline', 'sudquotidien', 'sud'], name: 'Sud Quotidien' },
  { keywords: ['liberation'], name: 'Libération' },
  { keywords: ['observateur', 'lobservateur', "l'observateur"], name: "L'Observateur" },
  { keywords: ['le quotidien', 'lequotidien'], name: 'Le Quotidien' },
  { keywords: ['evidence', 'levidence', "l'evidence"], name: "L'Évidence" },
  { keywords: ['echos', 'les echos'], name: 'Les Échos' },
  { keywords: ['point actu', 'le point', 'le epoint'], name: 'Le Point' },
  { keywords: ['tribune sport', 'tribunesport', 'tribune'], name: 'Tribune' },
  { keywords: ['republicain', 'lerepublicain'], name: 'Le Républicain' },
  { keywords: ['las', "l'as"], name: "L'As" },
  { keywords: ['enquete'], name: 'Enquête' },
  { keywords: ['record'], name: 'Record' },
  { keywords: ['yoor-yoor', 'yooryoor', 'yoor'], name: 'Yoor-Yoor' },
  { keywords: ['direct news', 'directnews'], name: 'Direct News' },
  { keywords: ['linfo', "l'info"], name: "L'Info" },
  { keywords: ['populaire', 'pop', 'le populaire'], name: 'Le Populaire' },
  { keywords: ['bes bi', 'besbi', 'le jour'], name: 'Bès Bi' },
  { keywords: ['source a', 'sourcea'], name: 'Source A' },
  { keywords: ['walf', 'walfadjri'], name: 'Walf Quotidien' },
  { keywords: ['lii quotidien', 'lii'], name: 'Lii Quotidien' },
  { keywords: ['temoin', 'le temoin'], name: 'Le Témoin' },
  { keywords: ['vox populi', 'voxpopuli', 'vox'], name: 'Vox Populi' },
  { keywords: ['stade'], name: 'Stade' },
  { keywords: ['grand panel', 'panel'], name: 'Grand Panel' },
  { keywords: ['scoop', 'digital scoop'], name: 'Scoop' },
  { keywords: ['alerte'], name: 'Alerte Quotidien' },
  { keywords: ['independant', "l'independant"], name: "L'Indépendant" },
  { keywords: ['informateur', "l'informateur"], name: "L'Informateur" },
  { keywords: ['solo quotidien', 'solo'], name: 'Solo Quotidien' },
  { keywords: ['peuple', 'le peuple'], name: 'Le Peuple' }
];

async function sync() {
  console.log('[SYNC PROJETBI] Démarrage de la synchronisation...');

  let pressData = null;
  const localPressJson = path.join(LOCAL_LE_PROJET_DIR, 'press.json');

  if (fs.existsSync(localPressJson)) {
    console.log(`[SYNC PROJETBI] Source locale détectée : ${localPressJson}`);
    try {
      pressData = JSON.parse(fs.readFileSync(localPressJson, 'utf8'));
    } catch (e) {
      console.warn('[SYNC PROJETBI] Erreur lecture press.json local:', e.message);
    }
  }

  if (!pressData || !Array.isArray(pressData.press) || pressData.press.length === 0) {
    console.log('[SYNC PROJETBI] Tentative de récupération distante depuis https://projetbi.org/press.json...');
    try {
      const res = await fetch('https://projetbi.org/press.json');
      if (res.ok) {
        pressData = await res.json();
      }
    } catch (e) {
      console.error('[SYNC PROJETBI] Échec fetch distant:', e.message);
    }
  }

  if (!pressData || !Array.isArray(pressData.press) || pressData.press.length === 0) {
    console.error('[SYNC PROJETBI] Aucune donnée disponible.');
    process.exit(1);
  }

  console.log(`[SYNC PROJETBI] ${pressData.press.length} Unes trouvées dans press.json (Mis à jour: ${pressData.last_updated})`);

  if (!fs.existsSync(TARGET_UNES_DIR)) {
    fs.mkdirSync(TARGET_UNES_DIR, { recursive: true });
  }

  const dateAujourdhui = new Date().toISOString().slice(0, 10);
  let inserees = 0;

  for (let idx = 0; idx < pressData.press.length; idx++) {
    const item = pressData.press[idx];
    const imageRelative = item.image; // ex: "revuedepresse/revue_2026-10-05_1.webp"
    const filename = path.basename(imageRelative);
    const targetFile = path.join(TARGET_UNES_DIR, filename);

    // 1. Copier le fichier local si disponible
    const localSourceFile = path.join(LOCAL_LE_PROJET_DIR, imageRelative);
    let publicUrl = `/surga/unes/${filename}`;

    if (fs.existsSync(localSourceFile)) {
      if (!fs.existsSync(targetFile)) {
        fs.copyFileSync(localSourceFile, targetFile);
      }
    } else {
      // Si distant, utiliser l'URL complète projetbi
      publicUrl = `https://projetbi.org/${imageRelative}`;
    }

    // 2. Déterminer un nom de journal réaliste
    let nomJournal = item.title && item.title !== 'Quotidien' ? item.title : `Journal N°${idx + 1}`;
    
    // Si on a le catalogue KNOWN_PAPERS et que c'est un des premiers numéros
    if (nomJournal.startsWith('Journal N°') && idx < KNOWN_PAPERS.length) {
      nomJournal = KNOWN_PAPERS[idx].name;
    }

    // Formater la date YYYY-MM-DD
    let dateParution = dateAujourdhui;
    if (item.date && item.date.includes('/')) {
      const [d, m, y] = item.date.split('/');
      if (y && m && d) dateParution = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }

    // 3. Insérer ou mettre à jour dans PostgreSQL
    try {
      const checkExist = await pool.query(
        'SELECT id FROM surga_unes_presse WHERE date_parution = $1 AND image_url = $2',
        [dateParution, publicUrl]
      );

      if (checkExist.rows.length === 0) {
        await pool.query(
          `INSERT INTO surga_unes_presse (nom_journal, date_parution, image_url, description)
           VALUES ($1, $2, $3, $4)`,
          [nomJournal, dateParution, publicUrl, `Édition du ${dateParution} — Source ProjetBI`]
        );
        inserees++;
      }
    } catch (err) {
      console.warn(`[SYNC DB ERR] Une ${idx + 1}:`, err.message);
    }
  }

  console.log(`[SYNC PROJETBI SUCCÈS] ${inserees} nouvelles Unes insérées en base sur ${pressData.press.length} disponibles pour le ${dateAujourdhui}.`);
  await pool.end();
}

sync();
