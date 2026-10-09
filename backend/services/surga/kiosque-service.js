// backend/services/surga/kiosque-service.js
// Service de gestion et synchronisation du Kiosque des Unes de la presse sénégalaise
// Raccordé au module et flux de projetbi.org (LE-PROJET)

const fs = require('fs');
const path = require('path');
const { pool } = require('../../models/db');

const LOCAL_LE_PROJET_DIR = path.resolve(__dirname, '../../../../LE-PROJET');
const LOCAL_TARGET_UNES_DIR = path.resolve(__dirname, '../../../frontend-next/public/surga/unes');
// www : le domaine sans www répond par une redirection permanente (308) ; l'adresse directe évite le détour.
const REMOTE_PROJETBI_JSON = 'https://www.projetbi.org/press.json';

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

const UNES_DEFAUT = [
  {
    nom_journal: 'Le Soleil',
    image_url: '/surga/unes/lesoleil.jpg',
    description: 'Quotidien national d information du Sénégal',
  },
  {
    nom_journal: "L'Observateur",
    image_url: '/surga/unes/observateur.jpg',
    description: 'Quotidien d informations générales',
  },
  {
    nom_journal: 'Sud Quotidien',
    image_url: '/surga/unes/sudquotidien.jpg',
    description: 'Premier quotidien indépendant du Sénégal',
  },
  {
    nom_journal: 'Libération',
    image_url: '/surga/unes/liberation.jpg',
    description: 'Quotidien d enquêtes et d informations',
  },
  {
    nom_journal: 'Enquête',
    image_url: '/surga/unes/enquete.jpg',
    description: 'Quotidien d analyse et d actualité',
  },
  {
    nom_journal: 'Le Quotidien',
    image_url: '/surga/unes/lequotidien.jpg',
    description: 'Journal d informations générales et chroniques',
  },
  {
    nom_journal: 'Yoor-Yoor',
    image_url: '/surga/unes/yooryoor.jpg',
    description: 'Quotidien national d actualités',
  },
  {
    nom_journal: "L'As",
    image_url: '/surga/unes/las.jpg',
    description: 'Quotidien d investigations et de révélations',
  },
  {
    nom_journal: 'Record',
    image_url: '/surga/unes/record.jpg',
    description: 'Quotidien omnisports sénégalais',
  },
  {
    nom_journal: 'Tribune Sport',
    image_url: '/surga/unes/tribunesport.jpg',
    description: 'Quotidien de sport et de football local',
  },
];

/**
 * Synchronise les Unes du jour depuis projetbi.org (dossier local LE-PROJET ou flux distant https://projetbi.org/press.json)
 */
async function synchroniserUnesProjetBi() {
  let pressData = null;
  const localPressJson = path.join(LOCAL_LE_PROJET_DIR, 'press.json');

  if (fs.existsSync(localPressJson)) {
    try {
      pressData = JSON.parse(fs.readFileSync(localPressJson, 'utf8'));
    } catch (e) {
      console.warn('[SURGA PROJETBI SYNC WARN] Lecture locale échouée:', e.message);
    }
  }

  if (!pressData || !Array.isArray(pressData.press) || pressData.press.length === 0) {
    try {
      const res = await fetch(REMOTE_PROJETBI_JSON, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        pressData = await res.json();
      }
    } catch (e) {
      console.warn('[SURGA PROJETBI SYNC WARN] Fetch distant échoué:', e.message);
    }
  }

  if (!pressData || !Array.isArray(pressData.press) || pressData.press.length === 0) {
    return { success: false, error: 'Aucune donnée disponible sur ProjetBI' };
  }

  if (!fs.existsSync(LOCAL_TARGET_UNES_DIR)) {
    try { fs.mkdirSync(LOCAL_TARGET_UNES_DIR, { recursive: true }); } catch (_) {}
  }

  const dateAujourdhui = new Date().toISOString().slice(0, 10);
  let inserees = 0;

  for (let idx = 0; idx < pressData.press.length; idx++) {
    const item = pressData.press[idx];
    const imageRelative = item.image;
    const filename = path.basename(imageRelative);
    const targetFile = path.join(LOCAL_TARGET_UNES_DIR, filename);

    const localSourceFile = path.join(LOCAL_LE_PROJET_DIR, imageRelative);
    let publicUrl = `/surga/unes/${filename}`;

    if (fs.existsSync(localSourceFile)) {
      if (!fs.existsSync(targetFile)) {
        try { fs.copyFileSync(localSourceFile, targetFile); } catch (_) {}
      }
    } else {
      publicUrl = `https://www.projetbi.org/${imageRelative}`;
    }

    let nomJournal = item.title && item.title !== 'Quotidien' ? item.title : `Journal N°${idx + 1}`;
    if (nomJournal.startsWith('Journal N°') && idx < KNOWN_PAPERS.length) {
      nomJournal = KNOWN_PAPERS[idx].name;
    }

    let dateParution = dateAujourdhui;
    if (item.date && item.date.includes('/')) {
      const [d, m, y] = item.date.split('/');
      if (y && m && d) dateParution = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }

    try {
      const checkExist = await pool.query(
        'SELECT id FROM surga_unes_presse WHERE date_parution = $1 AND (image_url = $2 OR (nom_journal = $3 AND date_parution = $1))',
        [dateParution, publicUrl, nomJournal]
      );

      if (checkExist.rows.length === 0) {
        await pool.query(
          `INSERT INTO surga_unes_presse (nom_journal, date_parution, image_url, description)
           VALUES ($1, $2, $3, $4)`,
          [nomJournal, dateParution, publicUrl, `Édition du ${dateParution} — Source ProjetBI`]
        );
        inserees++;
      } else {
        await pool.query(
          `UPDATE surga_unes_presse SET image_url = $1 WHERE id = $2`,
          [publicUrl, checkExist.rows[0].id]
        );
      }
    } catch (err) {
      console.warn(`[SURGA PROJETBI DB WARN]:`, err.message);
    }
  }

  return {
    success: true,
    total: pressData.press.length,
    inserees,
    date: dateAujourdhui,
    source: fs.existsSync(localPressJson) ? 'local_projetbi' : 'remote_projetbi_org',
  };
}

/**
 * Initialise les Unes par défaut dans la base si la table est vide
 */
async function assurerUnesInitiales() {
  try {
    const { rows } = await pool.query('SELECT COUNT(*) as count FROM surga_unes_presse');
    if (parseInt(rows[0]?.count || '0', 10) === 0) {
      const syncRes = await synchroniserUnesProjetBi();
      if (!syncRes.success || syncRes.total === 0) {
        for (const une of UNES_DEFAUT) {
          await pool.query(
            `INSERT INTO surga_unes_presse (nom_journal, image_url, description, date_parution)
             VALUES ($1, $2, $3, CURRENT_DATE)`,
            [une.nom_journal, une.image_url, une.description]
          );
        }
      }
    }
  } catch (err) {
    console.warn('[SURGA KIOSQUE DB WARN]:', err.message);
  }
}

/**
 * Récupère les Unes des journaux parus récemment
 */
// Une image enregistrée avec un chemin local (« /surga/unes/… ») par un poste où le dossier LE-PROJET existe n'est pas
// servie en ligne (les fichiers sont ignorés par git) : elle est relue depuis projetbi.org, d'où elle vient.
const DOSSIER_REVUE_PROJETBI = 'https://www.projetbi.org/revuedepresse';
function urlImagePublique(url) {
  if (typeof url !== 'string' || !url.startsWith('/surga/unes/')) return url;
  const fichier = path.basename(url);
  return fs.existsSync(path.join(LOCAL_TARGET_UNES_DIR, fichier)) ? url : `${DOSSIER_REVUE_PROJETBI}/${fichier}`;
}

// Sans Une du jour, la synchronisation était tentée à chaque lecture (5 s d'attente au pire) : une fois par quart d'heure.
const INTERVALLE_SYNC_SANS_UNE_MS = 15 * 60 * 1000;
let derniereSyncSansUne = 0;
// Jours d'ancienneté au-delà desquels la Une d'un journal n'est plus montrée.
const JOURS_UNE_ACCEPTES = 3;

async function recupererUnesDuJour({ limit = 50 } = {}) {
  await assurerUnesInitiales();

  // Synchronisation proactive si aucune Une n'est datée d'aujourd'hui
  try {
    const checkToday = await pool.query(
      `SELECT COUNT(*)::int as count FROM surga_unes_presse WHERE date_parution = CURRENT_DATE`
    );
    if ((checkToday.rows[0]?.count || 0) === 0 && Date.now() - derniereSyncSansUne > INTERVALLE_SYNC_SANS_UNE_MS) {
      derniereSyncSansUne = Date.now();
      await synchroniserUnesProjetBi();
    }
  } catch (err) {
    console.warn('[SURGA KIOSQUE TODAY CHECK WARN]:', err.message);
  }

  try {
    // Pour chaque journal, sa dernière parution : celle d'hier tient lieu de Une tant que celle du jour n'est pas parue.
    const { rows } = await pool.query(
      `SELECT * FROM (
         SELECT DISTINCT ON (nom_journal) id, nom_journal, image_url, description, date_parution, created_at
         FROM surga_unes_presse
         WHERE nom_journal NOT LIKE 'Journal N°%'
           AND date_parution <= CURRENT_DATE
           AND date_parution >= CURRENT_DATE - $2::int
         ORDER BY nom_journal, date_parution DESC, created_at DESC
       ) dernieres
       ORDER BY date_parution DESC, created_at ASC
       LIMIT $1`,
      [limit, JOURS_UNE_ACCEPTES]
    );

    if (rows.length > 0) return rows.map((r) => ({ ...r, image_url: urlImagePublique(r.image_url) }));
  } catch (err) {
    console.warn('[SURGA KIOSQUE FETCH WARN]:', err.message);
  }

  return UNES_DEFAUT.map((u, idx) => ({
    id: `default_${idx}`,
    ...u,
    date_parution: null,
    est_archive_locale: true,
  }));
}

module.exports = {
  UNES_DEFAUT,
  KNOWN_PAPERS,
  assurerUnesInitiales,
  synchroniserUnesProjetBi,
  recupererUnesDuJour,
};
