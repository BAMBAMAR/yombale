// backend/services/surga/kiosque-service.js
// Service de gestion du Kiosque des Unes de la presse sénégalaise
// Inspiré du catalogue de titres de quotidiens de projetbi.org

const { pool } = require('../../models/db');

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
 * Initialise les Unes par défaut dans la base si la table est vide
 */
async function assurerUnesInitiales() {
  try {
    const { rows } = await pool.query('SELECT COUNT(*) as count FROM surga_unes_presse');
    if (parseInt(rows[0]?.count || '0', 10) === 0) {
      for (const une of UNES_DEFAUT) {
        await pool.query(
          `INSERT INTO surga_unes_presse (nom_journal, image_url, description, date_parution)
           VALUES ($1, $2, $3, CURRENT_DATE)`,
          [une.nom_journal, une.image_url, une.description]
        );
      }
    }
  } catch (err) {
    console.warn('[SURGA KIOSQUE DB WARN]:', err.message);
  }
}

/**
 * Récupère les Unes des journaux parus récemment
 */
async function recupererUnesDuJour({ limit = 20 } = {}) {
  await assurerUnesInitiales();

  try {
    const { rows } = await pool.query(
      `SELECT id, nom_journal, image_url, description, date_parution, created_at
       FROM surga_unes_presse
       ORDER BY date_parution DESC, created_at DESC
       LIMIT $1`,
      [limit]
    );

    if (rows.length > 0) return rows;
  } catch (err) {
    console.warn('[SURGA KIOSQUE FETCH WARN]:', err.message);
  }

  return UNES_DEFAUT.map((u, idx) => ({
    id: `default_${idx}`,
    ...u,
    date_parution: new Date().toISOString().slice(0, 10),
  }));
}

module.exports = {
  UNES_DEFAUT,
  assurerUnesInitiales,
  recupererUnesDuJour,
};
