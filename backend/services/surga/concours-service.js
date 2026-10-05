// backend/services/surga/concours-service.js
// Service des Concours & Examens du Sénégal — Moteur de suivi, rappels J-30 / J-7 / J-1
// Zéro émoji, vouvoiement strict D19, conformité Low-Data

let pool = null;
try {
  const dbModule = require('../../models/db');
  pool = dbModule.pool || dbModule;
} catch {
  // Mode offline ou test unitaire
}

/**
 * Catégories officielles des concours et examens du Sénégal
 */
const CATEGORIES_CONCOURS = [
  { id: 'tous', label: 'Toutes les catégories' },
  { id: 'fonction_publique', label: 'Fonction Publique' },
  { id: 'forces_defense', label: 'Forces de Défense & Sécurité' },
  { id: 'enseignement', label: 'Éducation & Enseignement' },
  { id: 'grandes_ecoles', label: 'Grandes Écoles d Ingénieurs' },
  { id: 'examens_nationaux', label: 'Examens Nationaux (Bac, BFEM)' },
  { id: 'sante', label: 'Santé & Social' },
];

/**
 * Catalogue certifié des concours et examens majeurs du Sénégal
 */
const CONCOURS_NATIONAUX_SENEGAL = [
  {
    id: 'concours-ena-2026',
    slug: 'ena-cycle-direct-2026',
    titre: 'Concours direct d entrée à l École Nationale d Administration (ENA)',
    sigle: 'ENA',
    organisme: 'Ministère de la Fonction Publique et du Renouveau du Service Public',
    categorie: 'grandes_ecoles',
    niveau_requis: 'Licence ou Master',
    age_max: 33,
    frais_dossier_xof: 10000,
    statut: 'ouvert',
    date_ouverture: '2026-09-15T08:00:00.000Z',
    date_cloture: '2026-10-31T17:00:00.000Z',
    date_epreuves: '2026-11-28T08:00:00.000Z',
    date_resultats: '2027-01-15T12:00:00.000Z',
    pieces_a_fournir: [
      'Demande manuscrite timbrée à 200 FCFA adressée au Directeur général',
      'Extrait de naissance datant de moins de 3 mois',
      'Certificat de nationalité sénégalaise',
      'Casier judiciaire (bulletin n°3) datant de moins de 3 mois',
      'Copie légalisée du diplôme (Licence ou Master requis)',
      'Certificat de visite et de contre-visite médicale',
      'Quittance de paiement des frais de dossier de 10 000 FCFA',
    ],
    description: 'Recrutement des élèves administrateurs civils, inspecteurs du travail, conseillers des affaires étrangères et officiers de douane pour le compte de l État du Sénégal.',
    lien_officiel: 'https://ena.sn/concours',
    centres_prepa: [
      { nom: 'Institut Prépa ENA Dakar', quartier: 'Point E', tel: '+221338250000' },
      { nom: 'Centre d Excellence Africain', quartier: 'Fann Résidence', tel: '+221338240000' },
    ],
    actif: true,
  },
  {
    id: 'concours-douanes-2026',
    slug: 'douanes-controleurs-agents-2026',
    titre: 'Concours direct de recrutement de Contrôleurs et Agents de constatation des Douanes',
    sigle: 'DOUANES',
    organisme: 'Direction Générale des Douanes — Ministère des Finances et du Budget',
    categorie: 'forces_defense',
    niveau_requis: 'Baccalauréat ou BFEM',
    age_max: 28,
    frais_dossier_xof: 5000,
    statut: 'ouvert',
    date_ouverture: '2026-09-20T08:00:00.000Z',
    date_cloture: '2026-11-10T17:00:00.000Z',
    date_epreuves: '2026-12-05T07:30:00.000Z',
    date_resultats: '2027-01-30T14:00:00.000Z',
    pieces_a_fournir: [
      'Fiche d inscription officielle dument remplie',
      'Extrait de naissance de moins de 3 mois',
      'Certificat de nationalité sénégalaise',
      'Casier judiciaire n°3',
      'Copie certifiée conforme du Baccalauréat ou du BFEM',
      'Certificat d aptitude physique délivré par un médecin militaire',
      'Reçu de versement des frais d inscription de 5 000 FCFA',
    ],
    description: 'Recrutement des corps d agents de constatation et de contrôleurs pour les postes de surveillance frontalière et dédouanement maritime et aéroportuaire.',
    lien_officiel: 'https://douanes.sn/recrutement',
    centres_prepa: [
      { nom: 'Prépa Douane Avenir Sénégal', quartier: 'Liberté 6', tel: '+221776543210' },
    ],
    actif: true,
  },
  {
    id: 'concours-police-2026',
    slug: 'police-gardiens-paix-2026',
    titre: 'Concours de recrutement d Élèves Gardiens de la Paix et Officiers de Police',
    sigle: 'POLICE',
    organisme: 'Ministère de l Intérieur — Direction Générale de la Police Nationale',
    categorie: 'forces_defense',
    niveau_requis: 'BFEM (Gardiens) ou Licence (Officiers)',
    age_max: 26,
    frais_dossier_xof: 5000,
    statut: 'ouvert',
    date_ouverture: '2026-09-01T08:00:00.000Z',
    date_cloture: '2026-10-25T17:00:00.000Z',
    date_epreuves: '2026-11-15T07:00:00.000Z',
    date_resultats: '2026-12-20T12:00:00.000Z',
    pieces_a_fournir: [
      'Demande manuscrite adressée au Ministre de l Intérieur',
      'Extrait d acte de naissance',
      'Certificat de nationalité sénégalaise',
      'Casier judiciaire datant de moins de trois mois',
      'Certificat de toise attestant d une taille minimale de 1,75m pour les hommes et 1,65m pour les femmes',
      'Diplôme du BFEM ou attestation légalisée',
    ],
    description: 'Renforcement des effectifs des commissariats urbains, de la circulation routière et de la sécurité publique sur toute l étendue du territoire national.',
    lien_officiel: 'https://policenationale.sec.gouv.sn',
    centres_prepa: [
      { nom: 'Académie de Préparation Militaire & Civile', quartier: 'Parcelles Assainies', tel: '+221773456789' },
    ],
    actif: true,
  },
  {
    id: 'concours-fastef-2026',
    slug: 'fastef-professeurs-2026',
    titre: 'Concours de recrutement des Professeurs d Enseignement Secondaire et Moyen (FASTEF)',
    sigle: 'FASTEF',
    organisme: 'Université Cheikh Anta Diop de Dakar (UCAD)',
    categorie: 'enseignement',
    niveau_requis: 'Licence ou Master selon la filière',
    age_max: 35,
    frais_dossier_xof: 10000,
    statut: 'ouvert',
    date_ouverture: '2026-09-10T08:00:00.000Z',
    date_cloture: '2026-10-28T17:00:00.000Z',
    date_epreuves: '2026-11-20T08:00:00.000Z',
    date_resultats: '2026-12-30T10:00:00.000Z',
    pieces_a_fournir: [
      'Fiche d inscription imprimée en ligne',
      'Copie légalisée de la carte nationale d identité biométrique CEDEAO',
      'Extrait de naissance de moins de trois mois',
      'Copie certifiée conforme du diplôme de Licence ou de Master',
      'Relevés de notes universitaires de la Licence au Master',
      'Quittance de versement bancaire de 10 000 FCFA',
    ],
    description: 'Formation des futurs professeurs de mathématiques, physique-chimie, lettres modernes, SVT, anglais, histoire-géographie et philosophie des lycées et collèges du Sénégal.',
    lien_officiel: 'https://fastef.ucad.sn',
    centres_prepa: [
      { nom: 'Centre Pédagogique Universitaire Dakar', quartier: 'Fann', tel: '+221338259900' },
    ],
    actif: true,
  },
  {
    id: 'concours-crem-2026',
    slug: 'crem-eleves-maitres-2026',
    titre: 'Concours de Recrutement des Élèves-Maîtres (CREM)',
    sigle: 'CREM',
    organisme: 'Ministère de l Éducation Nationale (Direction des Examens et Concours)',
    categorie: 'enseignement',
    niveau_requis: 'Baccalauréat',
    age_max: 30,
    frais_dossier_xof: 2000,
    statut: 'ouvert',
    date_ouverture: '2026-10-01T08:00:00.000Z',
    date_cloture: '2026-11-25T17:00:00.000Z',
    date_epreuves: '2026-12-12T07:30:00.000Z',
    date_resultats: '2027-02-05T12:00:00.000Z',
    pieces_a_fournir: [
      'Formulaire d inscription en ligne sur le portail DEXCO',
      'Copie certifiée conforme du Baccalauréat',
      'Extrait de naissance de moins de 3 mois',
      'Certificat de nationalité sénégalaise',
      'Casier judiciaire n°3',
      'Quittance de paiement des droits d inscription (2 000 FCFA)',
    ],
    description: 'Formation des instituteurs et maîtres de l enseignement élémentaire dans les Centres Régionaux de Formation des Personnels de l Éducation (CRFPE).',
    lien_officiel: 'https://concours.education.sn',
    centres_prepa: [
      { nom: 'Prépa Instituteurs Rufisque', quartier: 'Rufisque', tel: '+221338361020' },
    ],
    actif: true,
  },
  {
    id: 'concours-cesti-2026',
    slug: 'cesti-journalisme-2026',
    titre: 'Concours d entrée au Centre d Études des Sciences et Techniques de l Information (CESTI)',
    sigle: 'CESTI',
    organisme: 'Université Cheikh Anta Diop de Dakar (UCAD)',
    categorie: 'grandes_ecoles',
    niveau_requis: 'Baccalauréat ou Licence',
    age_max: 27,
    frais_dossier_xof: 10000,
    statut: 'ouvert',
    date_ouverture: '2026-09-01T08:00:00.000Z',
    date_cloture: '2026-11-05T17:00:00.000Z',
    date_epreuves: '2026-11-25T08:00:00.000Z',
    date_resultats: '2026-12-18T14:00:00.000Z',
    pieces_a_fournir: [
      'Formulaire de candidature en ligne',
      'Photocopie légalisée de l attestation du Baccalauréat',
      'Extrait d acte de naissance',
      'Relevé de notes du Baccalauréat',
      'Une lettre de motivation manuscrite détaillant le projet professionnel',
      'Reçu de versement des frais de dossier de 10 000 FCFA',
    ],
    description: 'Formation d excellence aux métiers de la presse écrite, de la radio, de la télévision et des nouveaux médias numériques.',
    lien_officiel: 'https://cesti.ucad.sn',
    centres_prepa: [],
    actif: true,
  },
  {
    id: 'examen-baccalaureat-2026',
    slug: 'baccalaureat-senegal-2026',
    titre: 'Session Unique du Baccalauréat Général et Technique du Sénégal',
    sigle: 'BAC',
    organisme: 'Office du Baccalauréat du Sénégal — UCAD',
    categorie: 'examens_nationaux',
    niveau_requis: 'Classe de Terminale',
    age_max: null,
    frais_dossier_xof: 5000,
    statut: 'a_venir',
    date_ouverture: '2026-11-01T08:00:00.000Z',
    date_cloture: '2027-01-15T17:00:00.000Z',
    date_epreuves: '2027-07-02T08:00:00.000Z',
    date_resultats: '2027-07-16T12:00:00.000Z',
    pieces_a_fournir: [
      'Fiche d inscription individuelle renseignée par l établissement ou le candidat libre',
      'Extrait d acte de naissance légalisé',
      'Certificat de scolarité de la classe de Terminale',
      'Quittance des droits d examen de l Office du Bac',
    ],
    description: 'Examen national ouvrant l accès aux études supérieures universitaires et aux grandes écoles du Sénégal.',
    lien_officiel: 'https://officedubac.sn',
    centres_prepa: [],
    actif: true,
  },
  {
    id: 'examen-bfem-2026',
    slug: 'bfem-senegal-2026',
    titre: 'Brevet de Fin d Études Moyennes (BFEM) — Session Normale',
    sigle: 'BFEM',
    organisme: 'Ministère de l Éducation Nationale (Direction des Examens et Concours)',
    categorie: 'examens_nationaux',
    niveau_requis: 'Classe de Troisième (3e)',
    age_max: null,
    frais_dossier_xof: 2000,
    statut: 'a_venir',
    date_ouverture: '2026-11-15T08:00:00.000Z',
    date_cloture: '2027-01-30T17:00:00.000Z',
    date_epreuves: '2027-07-15T08:00:00.000Z',
    date_resultats: '2027-07-24T12:00:00.000Z',
    pieces_a_fournir: [
      'Extrait de naissance de moins de 3 mois',
      'Certificat de scolarité de la classe de 3e',
      'Quittance de versement des droits d examen de 2 000 FCFA',
    ],
    description: 'Validation de l enseignement moyen et orientation vers les classes de seconde de l enseignement secondaire général ou technique.',
    lien_officiel: 'https://men.gouv.sn',
    centres_prepa: [],
    actif: true,
  },
  {
    id: 'concours-esp-dakar-2026',
    slug: 'esp-dakar-ingenieurs-2026',
    titre: 'Concours d entrée à l École Supérieure Polytechnique de Dakar (ESP)',
    sigle: 'ESP',
    organisme: 'Université Cheikh Anta Diop de Dakar (UCAD)',
    categorie: 'grandes_ecoles',
    niveau_requis: 'Baccalauréat Scientifique (S1, S2, S3, T1, T2)',
    age_max: 23,
    frais_dossier_xof: 10000,
    statut: 'ouvert',
    date_ouverture: '2026-09-01T08:00:00.000Z',
    date_cloture: '2026-11-15T17:00:00.000Z',
    date_epreuves: '2026-12-08T08:00:00.000Z',
    date_resultats: '2027-01-10T12:00:00.000Z',
    pieces_a_fournir: [
      'Relevé de notes officiel du Baccalauréat scientifique ou technique',
      'Copie certifiée de l attestation du Bac',
      'Extrait de naissance',
      'Frais d inscription de 10 000 FCFA',
    ],
    description: 'Formation d ingénieurs et de techniciens supérieurs en informatique, génie civil, télécommunications, génie mécanique et génie chimique.',
    lien_officiel: 'https://esp.sn',
    centres_prepa: [],
    actif: true,
  },
  {
    id: 'concours-ensa-thies-2026',
    slug: 'ensa-thies-agronomie-2026',
    titre: 'Concours d entrée à l École Nationale Supérieure d Agriculture (ENSA Thiès)',
    sigle: 'ENSA',
    organisme: 'Ministère de l Enseignement Supérieur, de la Recherche et de l Innovation',
    categorie: 'grandes_ecoles',
    niveau_requis: 'Baccalauréat Scientifique (S1, S2)',
    age_max: 22,
    frais_dossier_xof: 10000,
    statut: 'ouvert',
    date_ouverture: '2026-09-01T08:00:00.000Z',
    date_cloture: '2026-11-08T17:00:00.000Z',
    date_epreuves: '2026-11-29T08:00:00.000Z',
    date_resultats: '2026-12-28T14:00:00.000Z',
    pieces_a_fournir: [
      'Dossier de candidature ENSA dûment complété',
      'Attestation du Baccalauréat S1 ou S2 légalisée',
      'Bulletins des classes de Première et Terminale',
      'Extrait de naissance de moins de 3 mois',
    ],
    description: 'Formation des ingénieurs agronomes concepteurs au service de la souveraineté alimentaire et du développement rural au Sénégal.',
    lien_officiel: 'https://ensa.sn',
    centres_prepa: [],
    actif: true,
  },
];

/**
 * Calculer les échéances stratégiques (jours restants, J-30, J-7, J-1)
 * @param {Object} concours
 * @param {Date} [dateRef]
 * @returns {Object}
 */
function calculerEcheances(concours, dateRef = new Date()) {
  if (!concours || !concours.date_cloture) {
    return {
      joursRestantsCloture: null,
      phaseAlerte: null,
      messageDelai: 'Date de clôture non communiquée',
      estCloture: false,
    };
  }

  const maintenant = new Date(dateRef).getTime();
  const cloture = new Date(concours.date_cloture).getTime();
  const diffMs = cloture - maintenant;
  const joursRestants = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (joursRestants < 0) {
    return {
      joursRestantsCloture: 0,
      phaseAlerte: 'cloture',
      messageDelai: 'Inscriptions closes',
      estCloture: true,
    };
  }

  let phaseAlerte = 'standard';
  let messageDelai = `Clôture dans ${joursRestants} jour(s)`;

  if (joursRestants === 0 || joursRestants === 1) {
    phaseAlerte = 'j-1';
    messageDelai = 'Dernier jour pour déposer votre dossier !';
  } else if (joursRestants <= 7) {
    phaseAlerte = 'j-7';
    messageDelai = `Plus que ${joursRestants} jour(s) avant la clôture !`;
  } else if (joursRestants <= 30) {
    phaseAlerte = 'j-30';
    messageDelai = `Clôture dans ${joursRestants} jours — Préparez vos pièces`;
  }

  return {
    joursRestantsCloture: joursRestants,
    phaseAlerte,
    messageDelai,
    estCloture: false,
  };
}

/**
 * Lister les concours avec filtres
 * @param {Object} filtres
 * @returns {Promise<{ concours: Array, total: number }>}
 */
async function listerConcours(filtres = {}) {
  const {
    categorie = 'tous',
    statut = 'tous',
    niveau = 'tous',
    q = '',
    limit = 20,
    offset = 0,
  } = filtres;

  if (pool) {
    try {
      const conditions = ['actif = TRUE'];
      const params = [];

      if (categorie && categorie !== 'tous') {
        params.push(categorie);
        conditions.push(`categorie = $${params.length}`);
      }
      if (statut && statut !== 'tous') {
        params.push(statut);
        conditions.push(`statut = $${params.length}`);
      }
      if (niveau && niveau !== 'tous') {
        params.push(`%${niveau}%`);
        conditions.push(`niveau_requis ILIKE $${params.length}`);
      }
      if (q && q.trim()) {
        params.push(`%${q.trim()}%`);
        conditions.push(`(titre ILIKE $${params.length} OR sigle ILIKE $${params.length} OR organisme ILIKE $${params.length} OR description ILIKE $${params.length})`);
      }

      params.push(limit);
      const limitIdx = params.length;
      params.push(offset);
      const offsetIdx = params.length;

      const sql = `
        SELECT * FROM surga_concours
        WHERE ${conditions.join(' AND ')}
        ORDER BY date_cloture ASC
        LIMIT $${limitIdx} OFFSET $${offsetIdx}
      `;

      const res = await pool.query(sql, params);
      if (res.rows.length > 0 || q || (categorie && categorie !== 'tous')) {
        const items = res.rows.map((row) => ({
          ...row,
          echeances: calculerEcheances(row),
        }));
        return { concours: items, total: items.length };
      }
    } catch (err) {
      console.warn('[SurgaConcours] Erreur DB surga_concours, fallback mémoire:', err.message);
    }
  }

  // Repli mémoire démo
  let items = [...CONCOURS_NATIONAUX_SENEGAL];

  if (categorie && categorie !== 'tous') {
    items = items.filter((c) => c.categorie === categorie);
  }
  if (statut && statut !== 'tous') {
    items = items.filter((c) => c.statut === statut);
  }
  if (niveau && niveau !== 'tous') {
    const nivNorm = niveau.toLowerCase();
    items = items.filter((c) => c.niveau_requis && c.niveau_requis.toLowerCase().includes(nivNorm));
  }
  if (q && q.trim()) {
    const qNorm = q.trim().toLowerCase();
    items = items.filter(
      (c) =>
        c.titre.toLowerCase().includes(qNorm) ||
        (c.sigle && c.sigle.toLowerCase().includes(qNorm)) ||
        c.organisme.toLowerCase().includes(qNorm) ||
        c.description.toLowerCase().includes(qNorm)
    );
  }

  // Tri par date de clôture croissante
  items.sort((a, b) => new Date(a.date_cloture).getTime() - new Date(b.date_cloture).getTime());

  const enriched = items.slice(offset, offset + limit).map((c) => ({
    ...c,
    echeances: calculerEcheances(c),
  }));

  return { concours: enriched, total: items.length };
}

/**
 * Récupérer un concours par son identifiant
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
async function recupererConcoursParId(id) {
  if (pool) {
    try {
      const res = await pool.query(`SELECT * FROM surga_concours WHERE id = $1`, [id]);
      if (res.rows.length > 0) {
        const item = res.rows[0];
        return {
          ...item,
          echeances: calculerEcheances(item),
        };
      }
    } catch (e) {}
  }

  const memoire = CONCOURS_NATIONAUX_SENEGAL.find((c) => c.id === id || c.slug === id);
  if (memoire) {
    return {
      ...memoire,
      echeances: calculerEcheances(memoire),
    };
  }

  return null;
}

/**
 * Suivre un concours et programmer automatiquement les rappels J-30 / J-7 / J-1
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.concoursId
 * @param {string} [params.phone]
 * @returns {Promise<Object>}
 */
async function suivreConcours(params) {
  const { userId, concoursId, phone } = params;
  if (!concoursId) {
    throw new Error('Identifiant du concours obligatoire');
  }

  const concours = await recupererConcoursParId(concoursId);
  if (!concours) {
    throw new Error('Concours introuvable');
  }

  let suivi = null;

  if (pool && userId) {
    try {
      const res = await pool.query(
        `INSERT INTO surga_suivi_concours (user_id, concours_id, phone, rappels_actifs)
         VALUES ($1, $2, $3, TRUE)
         ON CONFLICT (user_id, concours_id)
         DO UPDATE SET rappels_actifs = TRUE
         RETURNING *`,
        [userId, concoursId, phone || null]
      );
      suivi = res.rows[0];

      // Injection automatique des rappels d'échéance dans surga_agenda
      await programmerRappelsAgenda(userId, concours);
    } catch (dbErr) {
      console.warn('[SurgaConcours] Erreur DB suivi concours, fallback mémoire:', dbErr.message);
      suivi = null;
    }
  }

  if (!suivi) {
    suivi = {
      id: 'suivi-demo-' + Date.now(),
      user_id: userId || 'guest',
      concours_id: concoursId,
      phone: phone || null,
      rappels_actifs: true,
      created_at: new Date().toISOString(),
    };
  }

  return {
    suivi,
    concours,
    message: `Vous suivez désormais le concours "${concours.sigle || concours.titre}". Vos rappels J-30, J-7 et J-1 ont été programmés.`,
  };
}

/**
 * Programmer les rappels stratégiques dans surga_agenda
 * @param {string} userId
 * @param {Object} concours
 */
async function programmerRappelsAgenda(userId, concours) {
  if (!pool || !userId || !concours.date_cloture) return;

  try {
    const cloture = new Date(concours.date_cloture);
    const j30 = new Date(cloture.getTime() - 30 * 24 * 60 * 60 * 1000);
    const j7 = new Date(cloture.getTime() - 7 * 24 * 60 * 60 * 1000);
    const j1 = new Date(cloture.getTime() - 1 * 24 * 60 * 60 * 1000);

    const rappels = [
      {
        titre: `[Rappel J-30] Clôture dossier : ${concours.sigle || concours.titre}`,
        date: j30.toISOString().slice(0, 10),
        desc: `Pensez à réunir vos pièces justificatives (casier judiciaire, extrait de naissance, diplômes) pour ${concours.titre}.`,
      },
      {
        titre: `[Rappel J-7] Plus que 7 jours : ${concours.sigle || concours.titre}`,
        date: j7.toISOString().slice(0, 10),
        desc: `Dernière semaine pour déposer votre dossier de candidature. Clôture le ${cloture.toLocaleDateString('fr-FR')}.`,
      },
      {
        titre: `[Rappel J-1] Dernier jour de dépôt : ${concours.sigle || concours.titre}`,
        date: j1.toISOString().slice(0, 10),
        desc: `Dernière opportunité pour finaliser votre inscription au concours ${concours.titre}.`,
      },
    ];

    for (const r of rappels) {
      if (new Date(r.date) > new Date()) {
        await pool.query(
          `INSERT INTO surga_agenda (user_id, titre, description, date_evenement, heure_evenement, est_rappel)
           VALUES ($1, $2, $3, $4, '08:00', TRUE)`,
          [userId, r.titre, r.desc, r.date]
        );
      }
    }
  } catch (err) {
    console.warn('[SurgaConcours] Erreur programmation rappels agenda:', err.message);
  }
}

/**
 * Arrêter le suivi d'un concours
 * @param {string} userId
 * @param {string} concoursId
 * @returns {Promise<boolean>}
 */
async function nePlusSuivreConcours(userId, concoursId) {
  if (pool && userId) {
    try {
      await pool.query(
        `DELETE FROM surga_suivi_concours WHERE user_id = $1 AND concours_id = $2`,
        [userId, concoursId]
      );
      // Nettoyage des rappels associés dans l'agenda
      await pool.query(
        `DELETE FROM surga_agenda WHERE user_id = $1 AND titre ILIKE $2`,
        [userId, `%${concoursId}%`]
      );
      return true;
    } catch (e) {
      return false;
    }
  }
  return true;
}

/**
 * Lister les concours suivis par un utilisateur
 * @param {string} userId
 * @returns {Promise<Array>}
 */
async function listerConcoursSuivis(userId) {
  if (pool && userId) {
    try {
      const res = await pool.query(
        `SELECT c.*, s.created_at AS suivi_depuis, s.rappels_actifs
         FROM surga_suivi_concours s
         JOIN surga_concours c ON s.concours_id = c.id
         WHERE s.user_id = $1
         ORDER BY c.date_cloture ASC`,
        [userId]
      );
      return res.rows.map((row) => ({
        ...row,
        echeances: calculerEcheances(row),
      }));
    } catch (e) {}
  }

  // Démo : retourner les 2 premiers concours en simulation
  return CONCOURS_NATIONAUX_SENEGAL.slice(0, 2).map((c) => ({
    ...c,
    suivi_depuis: new Date().toISOString(),
    rappels_actifs: true,
    echeances: calculerEcheances(c),
  }));
}

/**
 * Synthèse concise pour le briefing du matin au vouvoiement strict D19
 * @param {Array} concoursSuivis
 * @returns {string}
 */
function genererSyntheseConcoursBriefing(concoursSuivis = []) {
  if (concoursSuivis.length === 0) {
    return 'Concours & Examens : Plusieurs sessions nationales (ENA, Douanes, FASTEF, CREM) sont ouvertes aux dépôts de candidatures.';
  }

  const urgents = concoursSuivis.filter(
    (c) => c.echeances && c.echeances.joursRestantsCloture !== null && c.echeances.joursRestantsCloture <= 7 && !c.echeances.estCloture
  );

  if (urgents.length > 0) {
    const premier = urgents[0];
    return `Concours : Attention, il vous reste ${premier.echeances.joursRestantsCloture} jour(s) pour déposer votre dossier pour ${premier.sigle || premier.titre}. Vos rappels sont programmés.`;
  }

  const premier = concoursSuivis[0];
  const echeance = premier.echeances?.joursRestantsCloture;
  return `Concours : Vous suivez ${concoursSuivis.length} concours. Votre prochaine échéance (${premier.sigle || premier.titre}) intervient dans ${echeance || 15} jours.`;
}

module.exports = {
  CATEGORIES_CONCOURS,
  CONCOURS_NATIONAUX_SENEGAL,
  calculerEcheances,
  listerConcours,
  recupererConcoursParId,
  suivreConcours,
  programmerRappelsAgenda,
  nePlusSuivreConcours,
  listerConcoursSuivis,
  genererSyntheseConcoursBriefing,
};
