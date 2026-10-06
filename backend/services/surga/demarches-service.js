// backend/services/surga/demarches-service.js
// Service des démarches administratives sénégalaises vérifiées (Tranche 20)
// Fiches éditoriales officielles, cycle de re-vérification 90 jours, zéro-hallucination
// Zéro émoji Unicode, vouvoiement strict D19

let pool = null;
try {
  const dbModule = require('../../models/db');
  pool = dbModule.pool || dbModule;
} catch {
  // Mode offline ou test unitaire
}

let abonnementService = null;
try {
  abonnementService = require('./abonnement-service');
} catch {
  // Optionnel
}

const CYCLE_REVERIFICATION_JOURS = 90;
const URL_PORTAIL_OFFICIEL = 'https://servicepublic.gouv.sn';

/**
 * Catégories officielles des démarches administratives
 */
const CATEGORIES_DEMARCHES = [
  { id: 'tous', label: 'Toutes les démarches' },
  { id: 'identite_voyage', label: 'Identité & Titres de Voyage' },
  { id: 'etat_civil', label: 'État Civil & Famille' },
  { id: 'justice', label: 'Justice & Casier Judiciaire' },
  { id: 'transport', label: 'Transports & Permis de Conduire' },
  { id: 'logement', label: 'Logement & Résidence' },
  { id: 'activite_pro', label: 'Entreprise & Activité Pro' },
];

/**
 * Normalisation textuelle pour recherche déterministe insensible aux accents et à la casse
 */
function normaliserTexte(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Catalogue initial certifié des fiches de test (Statut BROUILLON selon la condition de démarrage)
 */
const DEMARCHES_INITIALES = [
  {
    id: 'dem-cni-cedeao',
    slug: 'carte-nationale-identite-cedeao',
    titre: 'Carte Nationale d\'Identité biométrique CEDEAO',
    categorie: 'identite_voyage',
    public_concerne: 'Citoyens sénégalais âgés d\'au moins 5 ans (obligatoire dès 15 ans)',
    pieces: [
      { intitule: 'Extrait d\'acte de naissance de moins de 3 mois', obligatoire: true, precision: 'Ou ancienne CNI en cas de renouvellement' },
      { intitule: 'Certificat de nationalité sénégalaise', obligatoire: false, precision: 'Requis si la filiation le justifie ou premier jugement supplétif' },
      { intitule: 'Certificat de perte délivré par la police', obligatoire: false, precision: 'Uniquement en cas de perte ou vol de l\'ancienne carte' },
    ],
    cout_xof: 0,
    delai: '2 à 4 semaines',
    lieux: 'Commissariats de police, brigades de gendarmerie et centres d\'enrôlement DAF à Dakar et dans les régions.',
    etapes: [
      'Présentation physique au centre d\'enrôlement muni des pièces justificatives.',
      'Enrôlement biométrique gratuit (prise de photo et empreintes digitales).',
      'Remise du récépissé d\'enrôlement portant le numéro de dossier.',
      'Retrait de la carte sur présentation du récépissé au même centre.',
    ],
    source_officielle: 'https://servicepublic.gouv.sn',
    date_verification: new Date().toISOString(),
    date_prochaine_verification: new Date(Date.now() + CYCLE_REVERIFICATION_JOURS * 24 * 3600 * 1000).toISOString(),
    statut: 'BROUILLON',
    mots_cles: ['cni', 'carte identite', 'biometrique', 'cedeao', 'enrolement', 'daf'],
  },
  {
    id: 'dem-passeport-bio',
    slug: 'passeport-biometrique-ordinaire',
    titre: 'Passeport biométrique ordinaire sénégalais',
    categorie: 'identite_voyage',
    public_concerne: 'Tout citoyen de nationalité sénégalaise souhaitant voyager à l\'étranger',
    pieces: [
      { intitule: 'Carte Nationale d\'Identité CEDEAO en cours de validité', obligatoire: true, precision: 'Original et photocopie lisible' },
      { intitule: 'Quittance fiscale de paiement des droits de timbre', obligatoire: true, precision: '20 000 FCFA acquittés au Trésor ou en ligne' },
      { intitule: 'Ancien passeport ordinaire', obligatoire: false, precision: 'En cas de renouvellement' },
      { intitule: 'Autorisation parentale légalisée', obligatoire: false, precision: 'Obligatoire pour les mineurs de moins de 18 ans' },
    ],
    cout_xof: 20000,
    delai: '48 à 72 heures ouvrées à Dakar',
    lieux: 'Direction de la Police des Étrangers et des Titres de Voyage (DPETV) à Dieuppeul Dakar ou centres régionaux agréés.',
    etapes: [
      'Achat de la quittance fiscale de 20 000 FCFA au Trésor public ou via plateforme homologuée.',
      'Prise de rendez-vous en ligne ou présentation directe au centre DPETV de Dieuppeul.',
      'Prise d\'empreintes, capture photographique et signature biométrique.',
      'Délivrance d\'un talon de retrait.',
      'Retrait du passeport par le demandeur en personne muni de son talon et de sa CNI.',
    ],
    source_officielle: 'https://servicepublic.gouv.sn',
    date_verification: new Date().toISOString(),
    date_prochaine_verification: new Date(Date.now() + CYCLE_REVERIFICATION_JOURS * 24 * 3600 * 1000).toISOString(),
    statut: 'BROUILLON',
    mots_cles: ['passeport', 'voyage', 'dpetv', 'dieuppeul', 'quittance', 'timbre'],
  },
  {
    id: 'dem-casier-judiciaire',
    slug: 'casier-judiciaire-bulletin-3',
    titre: 'Extrait de casier judiciaire (Bulletin n°3)',
    categorie: 'justice',
    public_concerne: 'Toute personne physique née au Sénégal ou de nationalité sénégalaise',
    pieces: [
      { intitule: 'Copie d\'extrait d\'acte de naissance de moins de 3 mois ou CNI', obligatoire: true, precision: 'Mentionnant lisiblement la date et le lieu de naissance' },
      { intitule: 'Timbre fiscal officiel de 300 FCFA', obligatoire: true, precision: 'À apposer sur la demande d\'extrait' },
    ],
    cout_xof: 300,
    delai: '24 à 48 heures ouvrées',
    lieux: 'Greffe du Tribunal de Grande Instance (TGI) du ressort de votre lieu de naissance ou téléservice officiel e-Casier.',
    etapes: [
      'Remplissage de la fiche de demande d\'extrait au greffe du tribunal de votre lieu de naissance.',
      'Apposition du timbre fiscal de 300 FCFA.',
      'Vérification du registre judiciaire par le greffier en chef.',
      'Délivrance du bulletin n°3 signé par le greffier.',
    ],
    source_officielle: 'https://servicepublic.gouv.sn',
    date_verification: new Date().toISOString(),
    date_prochaine_verification: new Date(Date.now() + CYCLE_REVERIFICATION_JOURS * 24 * 3600 * 1000).toISOString(),
    statut: 'BROUILLON',
    mots_cles: ['casier judiciaire', 'bulletin 3', 'tribunal', 'justice', 'greffe', 'tgi'],
  },
  {
    id: 'dem-certificat-nationalite',
    slug: 'certificat-nationalite-senegalaise',
    titre: 'Certificat de nationalité sénégalaise',
    categorie: 'etat_civil',
    public_concerne: 'Citoyens sénégalais par filiation, mariage ou naturalisation',
    pieces: [
      { intitule: 'Extrait d\'acte de naissance du demandeur datant de moins de 3 mois', obligatoire: true, precision: 'Original délivré par la mairie de naissance' },
      { intitule: 'Copie CNI ou extrait de naissance du père ou de la mère', obligatoire: true, precision: 'Justifiant de la nationalité sénégalaise d\'un parent' },
      { intitule: 'Certificat de mariage des parents', obligatoire: false, precision: 'Si les parents sont mariés à l\'état civil' },
      { intitule: 'Timbre fiscal de 2 000 FCFA', obligatoire: true, precision: 'Timbre fiscal judiciaire' },
    ],
    cout_xof: 2000,
    delai: '3 à 5 jours ouvrés',
    lieux: 'Tribunal d\'Instance du lieu de résidence du demandeur ou de son lieu de naissance.',
    etapes: [
      'Constitution du dossier complet avec les actes d\'état civil et le timbre fiscal.',
      'Dépôt au greffe du Tribunal d\'Instance.',
      'Instruction de la demande et vérification de la filiation par le juge d\'instance.',
      'Signature et délivrance du certificat de nationalité.',
    ],
    source_officielle: 'https://servicepublic.gouv.sn',
    date_verification: new Date().toISOString(),
    date_prochaine_verification: new Date(Date.now() + CYCLE_REVERIFICATION_JOURS * 24 * 3600 * 1000).toISOString(),
    statut: 'BROUILLON',
    mots_cles: ['nationalite', 'certificat de nationalite', 'tribunal d instance', 'filiation'],
  },
  {
    id: 'dem-acte-naissance',
    slug: 'declaration-extrait-acte-naissance',
    titre: 'Déclaration et extrait d\'acte de naissance',
    categorie: 'etat_civil',
    public_concerne: 'Nouveau-nés (déclaration dans le délai légal d\'un mois) ou toute personne demandant un extrait',
    pieces: [
      { intitule: 'Certificat d\'accouchement délivré par la maternité ou la sage-femme', obligatoire: true, precision: 'Indiquant l\'heure, la date et le lieu précis' },
      { intitule: 'Pièce d\'identité du déclarant (père, mère ou tuteur)', obligatoire: true, precision: 'CNI biométrique ou passeport' },
      { intitule: 'Livret de famille ou acte de mariage', obligatoire: false, precision: 'Recommandé pour l\'exactitude des mentions parentales' },
      { intitule: 'Timbre fiscal communal de 200 FCFA par extrait demandé', obligatoire: true, precision: 'Pour chaque volet d\'extrait délivré' },
    ],
    cout_xof: 200,
    delai: 'Immédiat à 48 heures',
    lieux: 'Centre d\'état civil de la commune ou mairie d\'arrondissement du lieu de naissance.',
    etapes: [
      'Déclaration obligatoire à l\'officier d\'état civil dans les 30 jours suivant l\'accouchement.',
      'Inscription officielle sur le registre d\'état civil de la commune.',
      'Délivrance de l\'acte de naissance et des extraits timbrés.',
      'Attention : passé 30 jours, un jugement supplétif au Tribunal d\'Instance est obligatoire.',
    ],
    source_officielle: 'https://servicepublic.gouv.sn',
    date_verification: new Date().toISOString(),
    date_prochaine_verification: new Date(Date.now() + CYCLE_REVERIFICATION_JOURS * 24 * 3600 * 1000).toISOString(),
    statut: 'BROUILLON',
    mots_cles: ['naissance', 'extrait de naissance', 'etat civil', 'mairie', 'jugement suppletif'],
  },
  {
    id: 'dem-permis-conduire',
    slug: 'permis-conduire-senegalais',
    titre: 'Permis de conduire sénégalais (Catégorie B)',
    categorie: 'transport',
    public_concerne: 'Candidats âgés d\'au moins 18 ans ayant réussi les examens théorique et pratique',
    pieces: [
      { intitule: 'Certificat de réussite aux épreuves du permis de conduire', obligatoire: true, precision: 'Délivré par le centre d\'examen' },
      { intitule: 'Certificat médical d\'aptitude physique et visuelle', obligatoire: true, precision: 'Établi par un médecin agréé' },
      { intitule: 'Extrait d\'acte de naissance de moins de 3 mois', obligatoire: true, precision: 'Original' },
      { intitule: 'Quittance fiscale de 10 000 FCFA', obligatoire: true, precision: 'Frais de délivrance et timbre Trésor public' },
      { intitule: '3 photos d\'identité récentes sur fond clair', obligatoire: true, precision: 'Format officiel' },
    ],
    cout_xof: 10000,
    delai: '3 à 6 semaines (certificat provisoire immédiat)',
    lieux: 'Division Régionale des Transports Terrestres (ex: Hann Maristes à Dakar) ou centre Capp Karangë.',
    etapes: [
      'Réussite aux épreuves du code et de la conduite automobile.',
      'Paiement des droits de délivrance de 10 000 FCFA au Trésor.',
      'Dépôt du dossier physique complet à la Division des Transports Terrestres.',
      'Délivrance d\'une autorisation provisoire de conduire valable 3 mois.',
      'Enrôlement et remise du permis biométrique Capp Karangë.',
    ],
    source_officielle: 'https://servicepublic.gouv.sn',
    date_verification: new Date().toISOString(),
    date_prochaine_verification: new Date(Date.now() + CYCLE_REVERIFICATION_JOURS * 24 * 3600 * 1000).toISOString(),
    statut: 'BROUILLON',
    mots_cles: ['permis', 'conduire', 'transports terrestres', 'capp karange', 'auto-ecole'],
  },
  {
    id: 'dem-certificat-residence',
    slug: 'certificat-residence-senegal',
    titre: 'Certificat de résidence',
    categorie: 'logement',
    public_concerne: 'Toute personne physique résidant dans une commune sénégalaise',
    pieces: [
      { intitule: 'Pièce d\'identité en cours de validité (CNI ou passeport)', obligatoire: true, precision: 'Original et photocopie' },
      { intitule: 'Justificatif de domicile récent (Facture Senelec, Sen\'Eau ou bail)', obligatoire: true, precision: 'À votre nom ou attestation d\'hébergement légalisée' },
      { intitule: 'Timbre fiscal de 200 FCFA', obligatoire: true, precision: 'Timbre communal' },
    ],
    cout_xof: 200,
    delai: '24 heures ouvrées',
    lieux: 'Commissariat de police ou brigade de gendarmerie de votre lieu de résidence, ou mairie de quartier.',
    etapes: [
      'Présentation au commissariat ou à la brigade territoriale avec le justificatif de domicile.',
      'Vérification par l\'officier de police judiciaire de la résidence effective.',
      'Apposition du timbre fiscal de 200 FCFA.',
      'Signature et délivrance du certificat de résidence.',
    ],
    source_officielle: 'https://servicepublic.gouv.sn',
    date_verification: new Date().toISOString(),
    date_prochaine_verification: new Date(Date.now() + CYCLE_REVERIFICATION_JOURS * 24 * 3600 * 1000).toISOString(),
    statut: 'BROUILLON',
    mots_cles: ['residence', 'domicile', 'certificat de residence', 'commissariat', 'gendarmerie'],
  },
];

// Fallback in-memory pour mode test unitaire Jest sans PG
const demarchesMemoire = new Map(DEMARCHES_INITIALES.map(d => [d.id, { ...d }]));
const signalementsMemoire = new Map();
const suivisMemoire = new Map(); // key: `${userId}:${demarcheId}`

/**
 * Met à jour automatiquement les démarches dont le cycle de 90 jours est dépassé
 */
async function actualiserStatutsPerimes() {
  const maintenant = new Date();

  if (pool) {
    try {
      await pool.query(
        `UPDATE surga_demarches
         SET statut = 'A_REVERIFIER', updated_at = NOW()
         WHERE statut = 'PUBLIE'
           AND date_prochaine_verification IS NOT NULL
           AND date_prochaine_verification <= NOW()`
      );
    } catch {
      // repli mémoire
    }
  }

  // Repli mémoire
  for (const [id, d] of demarchesMemoire.entries()) {
    if (d.statut === 'PUBLIE' && d.date_prochaine_verification) {
      const echeance = new Date(d.date_prochaine_verification);
      if (echeance <= maintenant) {
        d.statut = 'A_REVERIFIER';
        d.updated_at = maintenant.toISOString();
      }
    }
  }
}

/**
 * Recherche déterministe de démarches (Zéro IA générative)
 * En cas de recherche sans résultat : renvoie un flag `non_couvert: true` avec lien vers le portail officiel.
 */
async function rechercherDemarches({ query, categorie, statut, includeBrouillons = false } = {}) {
  await actualiserStatutsPerimes();

  const qNorm = normaliserTexte(query);
  const cat = categorie && categorie !== 'tous' ? categorie : null;

  let fiches = [];

  if (pool) {
    try {
      const conds = [];
      const vals = [];
      let i = 1;

      if (!includeBrouillons) {
        conds.push(`statut = 'PUBLIE'`);
      } else if (statut) {
        conds.push(`statut = $${i}`);
        vals.push(statut);
        i++;
      }

      if (cat) {
        conds.push(`categorie = $${i}`);
        vals.push(cat);
        i++;
      }

      if (qNorm) {
        conds.push(`(
          LOWER(titre) ILIKE $${i} OR
          LOWER(public_concerne) ILIKE $${i} OR
          LOWER(slug) ILIKE $${i} OR
          LOWER(lieux) ILIKE $${i}
        )`);
        vals.push(`%${qNorm}%`);
        i++;
      }

      const whereClause = conds.length > 0 ? `WHERE ${conds.join(' AND ')}` : '';
      const sql = `SELECT * FROM surga_demarches ${whereClause} ORDER BY created_at DESC`;
      const { rows } = await pool.query(sql, vals);
      fiches = rows;
    } catch {
      // Repli mémoire
      fiches = [];
    }
  }

  if (fiches.length === 0) {
    // Mode mémoire
    const tous = Array.from(demarchesMemoire.values());
    fiches = tous.filter(d => {
      if (!includeBrouillons && d.statut !== 'PUBLIE') return false;
      if (includeBrouillons && statut && d.statut !== statut) return false;
      if (cat && d.categorie !== cat) return false;

      if (qNorm) {
        const titreNorm = normaliserTexte(d.titre);
        const publicNorm = normaliserTexte(d.public_concerne);
        const lieuxNorm = normaliserTexte(d.lieux);
        const motsClesNorm = Array.isArray(d.mots_cles)
          ? d.mots_cles.map(normaliserTexte).join(' ')
          : '';

        const correspond =
          titreNorm.includes(qNorm) ||
          publicNorm.includes(qNorm) ||
          lieuxNorm.includes(qNorm) ||
          motsClesNorm.includes(qNorm);

        if (!correspond) return false;
      }

      return true;
    });
  }

  // Zéro-Hallucination : si une recherche par mots-clés est demandée et ne renvoie rien
  if (qNorm && fiches.length === 0) {
    return {
      fiches: [],
      total: 0,
      non_couvert: true,
      query: query,
      message: "Cette démarche n'est pas encore couverte par notre guide officiel.",
      portail_officiel: URL_PORTAIL_OFFICIEL,
      categories: CATEGORIES_DEMARCHES,
    };
  }

  return {
    fiches,
    total: fiches.length,
    non_couvert: false,
    categories: CATEGORIES_DEMARCHES,
    portail_officiel: URL_PORTAIL_OFFICIEL,
  };
}

/**
 * Récupère une démarche par son ID ou son slug
 */
async function getDemarcheParIdOuSlug(identifiant, { includeBrouillons = false } = {}) {
  await actualiserStatutsPerimes();

  if (pool) {
    try {
      const query = includeBrouillons
        ? 'SELECT * FROM surga_demarches WHERE id = $1 OR slug = $1'
        : `SELECT * FROM surga_demarches WHERE (id = $1 OR slug = $1) AND statut = 'PUBLIE'`;
      const { rows } = await pool.query(query, [identifiant]);
      if (rows.length > 0) return rows[0];
    } catch {
      // Repli mémoire
    }
  }

  // Repli mémoire
  for (const d of demarchesMemoire.values()) {
    if (d.id === identifiant || d.slug === identifiant) {
      if (!includeBrouillons && d.statut !== 'PUBLIE') return null;
      return d;
    }
  }

  return null;
}

/**
 * Création ou mise à jour d'une démarche (Console Admin)
 */
async function sauvegarderDemarcheAdmin(donnees) {
  const id = donnees.id || `dem-${Date.now()}`;
  const slug = donnees.slug || normaliserTexte(donnees.titre || id).replace(/\s+/g, '-').slice(0, 100);
  const titre = String(donnees.titre || '').trim();
  const categorie = donnees.categorie || 'identite_voyage';
  const publicConcerne = donnees.public_concerne || '';
  const pieces = Array.isArray(donnees.pieces) ? donnees.pieces : [];
  const coutXof = parseInt(donnees.cout_xof, 10) || 0;
  const delai = donnees.delai || '';
  const lieux = donnees.lieux || '';
  const etapes = Array.isArray(donnees.etapes) ? donnees.etapes : [];
  const sourceOfficielle = donnees.source_officielle || URL_PORTAIL_OFFICIEL;
  const statut = donnees.statut || 'BROUILLON';
  const motsCles = Array.isArray(donnees.mots_cles) ? donnees.mots_cles : [];

  const dateVerification = donnees.date_verification || new Date().toISOString();
  const dateProchaineVerification =
    donnees.date_prochaine_verification ||
    new Date(Date.now() + CYCLE_REVERIFICATION_JOURS * 24 * 3600 * 1000).toISOString();

  const fiche = {
    id,
    slug,
    titre,
    categorie,
    public_concerne: publicConcerne,
    pieces,
    cout_xof: coutXof,
    delai,
    lieux,
    etapes,
    source_officielle: sourceOfficielle,
    date_verification: dateVerification,
    date_prochaine_verification: dateProchaineVerification,
    statut,
    mots_cles: motsCles,
    updated_at: new Date().toISOString(),
  };

  if (pool) {
    try {
      const sql = `
        INSERT INTO surga_demarches (
          id, slug, titre, categorie, public_concerne, pieces, cout_xof, delai, lieux,
          etapes, source_officielle, date_verification, date_prochaine_verification,
          statut, mots_cles, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
        ON CONFLICT (id) DO UPDATE SET
          slug = EXCLUDED.slug,
          titre = EXCLUDED.titre,
          categorie = EXCLUDED.categorie,
          public_concerne = EXCLUDED.public_concerne,
          pieces = EXCLUDED.pieces,
          cout_xof = EXCLUDED.cout_xof,
          delai = EXCLUDED.delai,
          lieux = EXCLUDED.lieux,
          etapes = EXCLUDED.etapes,
          source_officielle = EXCLUDED.source_officielle,
          date_verification = EXCLUDED.date_verification,
          date_prochaine_verification = EXCLUDED.date_prochaine_verification,
          statut = EXCLUDED.statut,
          mots_cles = EXCLUDED.mots_cles,
          updated_at = NOW()
        RETURNING *
      `;
      const params = [
        id, slug, titre, categorie, publicConcerne,
        JSON.stringify(pieces), coutXof, delai, lieux,
        JSON.stringify(etapes), sourceOfficielle,
        dateVerification, dateProchaineVerification,
        statut, JSON.stringify(motsCles)
      ];
      const { rows } = await pool.query(sql, params);
      return rows[0];
    } catch {
      // Repli mémoire
    }
  }

  demarchesMemoire.set(id, { ...fiche });
  return fiche;
}

/**
 * Re-vérification d'une démarche par un administrateur (Réinitialise le compteur de 90 jours)
 */
async function reverifierDemarcheAdmin(id) {
  const maintenant = new Date();
  const prochaine = new Date(Date.now() + CYCLE_REVERIFICATION_JOURS * 24 * 3600 * 1000);

  if (pool) {
    try {
      const { rows } = await pool.query(
        `UPDATE surga_demarches
         SET date_verification = $1,
             date_prochaine_verification = $2,
             statut = 'PUBLIE',
             updated_at = NOW()
         WHERE id = $3
         RETURNING *`,
        [maintenant.toISOString(), prochaine.toISOString(), id]
      );
      if (rows.length > 0) return rows[0];
    } catch {
      // repli mémoire
    }
  }

  const fiche = demarchesMemoire.get(id);
  if (!fiche) return null;

  fiche.date_verification = maintenant.toISOString();
  fiche.date_prochaine_verification = prochaine.toISOString();
  fiche.statut = 'PUBLIE';
  fiche.updated_at = maintenant.toISOString();
  return fiche;
}

/**
 * Suppression d'une démarche (Console Admin)
 */
async function supprimerDemarcheAdmin(id) {
  if (pool) {
    try {
      const res = await pool.query('DELETE FROM surga_demarches WHERE id = $1', [id]);
      return res.rowCount > 0;
    } catch {
      // Repli mémoire
    }
  }

  return demarchesMemoire.delete(id);
}

/**
 * Signalement d'une erreur sur une démarche par un utilisateur
 */
async function creerSignalement({ demarche_id, user_id, message, contact_email }) {
  if (!demarche_id || !message) {
    throw new Error('Identifiant de la démarche et message requis.');
  }

  const id = `sig-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const signalement = {
    id,
    demarche_id,
    user_id: user_id || null,
    message: String(message).trim(),
    contact_email: contact_email || null,
    statut: 'EN_ATTENTE',
    reponse_admin: null,
    created_at: new Date().toISOString(),
  };

  if (pool) {
    try {
      const { rows } = await pool.query(
        `INSERT INTO surga_demarches_signalements (
           id, demarche_id, user_id, message, contact_email, statut, created_at
         )
         VALUES (gen_random_uuid(), $1, $2, $3, $4, 'EN_ATTENTE', NOW())
         RETURNING *`,
        [demarche_id, user_id || null, signalement.message, signalement.contact_email]
      );
      return rows[0];
    } catch {
      // Repli mémoire
    }
  }

  signalementsMemoire.set(id, signalement);
  return signalement;
}

/**
 * Récupération des signalements (Console Admin)
 */
async function getSignalementsAdmin({ statut = 'EN_ATTENTE' } = {}) {
  if (pool) {
    try {
      const cond = statut && statut !== 'tous' ? 'WHERE s.statut = $1' : '';
      const params = statut && statut !== 'tous' ? [statut] : [];
      const sql = `
        SELECT s.*, d.titre AS demarche_titre, d.slug AS demarche_slug
        FROM surga_demarches_signalements s
        LEFT JOIN surga_demarches d ON s.demarche_id = d.id
        ${cond}
        ORDER BY s.created_at DESC
      `;
      const { rows } = await pool.query(sql, params);
      return rows;
    } catch {
      // Repli mémoire
    }
  }

  const tous = Array.from(signalementsMemoire.values());
  return tous
    .filter(s => (statut && statut !== 'tous' ? s.statut === statut : true))
    .map(s => {
      const demarche = demarchesMemoire.get(s.demarche_id);
      return {
        ...s,
        demarche_titre: demarche?.titre || 'Démarche inconnue',
        demarche_slug: demarche?.slug || '',
      };
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

/**
 * Traitement d'un signalement par l'administrateur
 */
async function traiterSignalementAdmin(id, { statut, reponse_admin }) {
  if (pool) {
    try {
      const { rows } = await pool.query(
        `UPDATE surga_demarches_signalements
         SET statut = $1, reponse_admin = $2, updated_at = NOW()
         WHERE id::text = $3
         RETURNING *`,
        [statut, reponse_admin || null, String(id)]
      );
      if (rows.length > 0) return rows[0];
    } catch {
      // repli mémoire
    }
  }

  const sig = signalementsMemoire.get(id);
  if (!sig) return null;
  sig.statut = statut;
  sig.reponse_admin = reponse_admin || null;
  sig.updated_at = new Date().toISOString();
  return sig;
}

/**
 * Vérification des quotas de suivi de démarches (Section 1 bis)
 * Gratuit : 1 démarche suivie maximum avec rappel.
 * Premium : démarches illimitées.
 */
async function verifierDroitSuiviDemarche(userId) {
  if (!userId) {
    throw new Error('Identifiant utilisateur requis.');
  }

  let estPremium = false;
  if (abonnementService && typeof abonnementService.estUtilisateurPremium === 'function') {
    try {
      estPremium = await abonnementService.estUtilisateurPremium(userId);
    } catch {
      estPremium = false;
    }
  }

  if (estPremium) {
    return { autorise: true, estPremium: true, totalSuivis: 0, limite: Infinity };
  }

  // Comptage des suivis existants
  let count = 0;
  let compteEnBase = false;
  if (pool) {
    try {
      const { rows } = await pool.query(
        `SELECT COUNT(*)::int AS total FROM surga_demarches_suivis WHERE user_id = $1`,
        [userId]
      );
      count = rows[0]?.total || 0;
      compteEnBase = true;
    } catch {
      compteEnBase = false;
    }
  }

  if (!compteEnBase) {
    count = 0;
    for (const [key] of suivisMemoire.entries()) {
      if (key.startsWith(`${userId}:`)) {
        count++;
      }
    }
  }

  if (count >= 1) {
    return {
      autorise: false,
      estPremium: false,
      totalSuivis: count,
      limite: 1,
      message: 'La formule gratuite vous permet de suivre 1 démarche avec rappel. Passez à Surga Premium pour des suivis et rappels illimités.',
    };
  }

  return { autorise: true, estPremium: false, totalSuivis: count, limite: 1 };
}

/**
 * Ajout d'un suivi de démarche par un utilisateur (avec Anti-IDOR et vérification de quota)
 */
async function ajouterSuiviDemarche(userId, demarcheId, { date_echeance, notes } = {}) {
  if (!userId || !demarcheId) {
    throw new Error('Identifiant utilisateur et démarche requis.');
  }

  // Vérifier si le suivi existe déjà pour cet utilisateur
  const suiviExistant = await getSuiviUtilisateurDemarche(userId, demarcheId);
  if (suiviExistant) {
    // Mise à jour sans consommer de nouveau quota
    if (pool) {
      try {
        const { rows } = await pool.query(
          `UPDATE surga_demarches_suivis
           SET date_echeance = $1, notes = $2, updated_at = NOW()
           WHERE user_id = $3 AND demarche_id = $4
           RETURNING *`,
          [date_echeance || null, notes || null, userId, demarcheId]
        );
        return rows[0];
      } catch {
        // repli mémoire
      }
    }
    const mem = suivisMemoire.get(`${userId}:${demarcheId}`);
    if (mem) {
      mem.date_echeance = date_echeance || null;
      mem.notes = notes || null;
      mem.updated_at = new Date().toISOString();
      return mem;
    }
  }

  // Nouveau suivi : vérification du quota
  const droit = await verifierDroitSuiviDemarche(userId);
  if (!droit.autorise) {
    const err = new Error(droit.message);
    err.code = 'QUOTA_ATTEINT';
    err.limite = droit.limite;
    throw err;
  }

  if (pool) {
    try {
      const { rows } = await pool.query(
        `INSERT INTO surga_demarches_suivis (
           user_id, demarche_id, date_echeance, notes, created_at
         )
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (user_id, demarche_id) DO UPDATE SET
           date_echeance = EXCLUDED.date_echeance,
           notes = EXCLUDED.notes,
           updated_at = NOW()
         RETURNING *`,
        [userId, demarcheId, date_echeance || null, notes || null]
      );
      return rows[0];
    } catch {
      // repli mémoire
    }
  }

  const item = {
    id: `suivi-${Date.now()}`,
    user_id: userId,
    demarche_id: demarcheId,
    date_echeance: date_echeance || null,
    notes: notes || null,
    statut: 'EN_COURS',
    created_at: new Date().toISOString(),
  };
  suivisMemoire.set(`${userId}:${demarcheId}`, item);
  return item;
}

/**
 * Récupère un suivi spécifique
 */
async function getSuiviUtilisateurDemarche(userId, demarcheId) {
  if (pool) {
    try {
      const { rows } = await pool.query(
        `SELECT * FROM surga_demarches_suivis WHERE user_id = $1 AND demarche_id = $2`,
        [userId, demarcheId]
      );
      if (rows.length > 0) return rows[0];
    } catch {
      // repli mémoire
    }
  }

  return suivisMemoire.get(`${userId}:${demarcheId}`) || null;
}

/**
 * Suppression d'un suivi (Anti-IDOR : restreint au userId connecté)
 */
async function supprimerSuiviDemarche(userId, demarcheId) {
  if (!userId || !demarcheId) return false;

  if (pool) {
    try {
      const res = await pool.query(
        `DELETE FROM surga_demarches_suivis WHERE user_id = $1 AND demarche_id = $2`,
        [userId, demarcheId]
      );
      return res.rowCount > 0;
    } catch {
      // repli mémoire
    }
  }

  return suivisMemoire.delete(`${userId}:${demarcheId}`);
}

/**
 * Liste des démarches suivies par un utilisateur
 */
async function getSuivisUtilisateur(userId) {
  if (!userId) return [];

  if (pool) {
    try {
      const sql = `
        SELECT s.*, d.titre, d.slug, d.categorie, d.delai, d.cout_xof, d.source_officielle, d.pieces
        FROM surga_demarches_suivis s
        JOIN surga_demarches d ON s.demarche_id = d.id
        WHERE s.user_id = $1
        ORDER BY s.created_at DESC
      `;
      const { rows } = await pool.query(sql, [userId]);
      return rows;
    } catch {
      // repli mémoire
    }
  }

  const resultats = [];
  for (const [key, val] of suivisMemoire.entries()) {
    if (key.startsWith(`${userId}:`)) {
      const demarche = demarchesMemoire.get(val.demarche_id);
      resultats.push({
        ...val,
        titre: demarche?.titre || 'Démarche',
        slug: demarche?.slug || '',
        categorie: demarche?.categorie || '',
        delai: demarche?.delai || '',
        cout_xof: demarche?.cout_xof || 0,
        source_officielle: demarche?.source_officielle || URL_PORTAIL_OFFICIEL,
        pieces: demarche?.pieces || [],
      });
    }
  }
  return resultats;
}

/**
 * Réinitialise la mémoire (utilisé dans les tests unitaires)
 */
function reinitialiserMemoire() {
  demarchesMemoire.clear();
  for (const d of DEMARCHES_INITIALES) {
    demarchesMemoire.set(d.id, { ...d });
  }
  signalementsMemoire.clear();
  suivisMemoire.clear();
}

module.exports = {
  CATEGORIES_DEMARCHES,
  DEMARCHES_INITIALES,
  CYCLE_REVERIFICATION_JOURS,
  URL_PORTAIL_OFFICIEL,
  normaliserTexte,
  actualiserStatutsPerimes,
  rechercherDemarches,
  getDemarcheParIdOuSlug,
  sauvegarderDemarcheAdmin,
  reverifierDemarcheAdmin,
  supprimerDemarcheAdmin,
  creerSignalement,
  getSignalementsAdmin,
  traiterSignalementAdmin,
  verifierDroitSuiviDemarche,
  ajouterSuiviDemarche,
  getSuiviUtilisateurDemarche,
  supprimerSuiviDemarche,
  getSuivisUtilisateur,
  reinitialiserMemoire,
};
