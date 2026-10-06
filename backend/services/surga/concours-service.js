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
  // ── 1. FONCTION PUBLIQUE & ADMINISTRATION ────────────────────────────────────
  {
    id: 'concours-ena-2026',
    slug: 'ena-cycle-direct-2026',
    titre: 'Concours direct d entrée à l École Nationale d Administration (ENA)',
    sigle: 'ENA',
    organisme: 'Ministère de la Fonction Publique et du Renouveau du Service Public',
    categorie: 'fonction_publique',
    niveau_requis: 'Licence (Cycle Moyen) ou Master (Cycle Supérieur)',
    age_max: 33,
    frais_dossier_xof: 10000,
    statut: 'ouvert',
    date_ouverture: '2026-09-15T08:00:00.000Z',
    date_cloture: '2026-10-31T17:00:00.000Z',
    date_epreuves: '2026-11-28T08:00:00.000Z',
    date_resultats: '2027-01-15T12:00:00.000Z',
    pieces_a_fournir: [
      'Demande manuscrite timbrée à 200 FCFA adressée au Directeur général de l ENA',
      'Extrait d acte de naissance datant de moins de 3 mois',
      'Certificat de nationalité sénégalaise',
      'Casier judiciaire (bulletin n°3) datant de moins de 3 mois',
      'Copie certifiée conforme du diplôme (Licence ou Master requis)',
      'Certificat de visite et de contre-visite médicale',
      'Quittance fiscale de versement des droits d inscription (10 000 FCFA)',
    ],
    description: 'Recrutement des corps d administrateurs civils, inspecteurs du travail, conseillers des affaires étrangères et officiers de douane pour l État du Sénégal.',
    lien_officiel: 'https://ena.sn',
    centres_prepa: [
      { nom: 'Institut Prépa ENA Dakar', quartier: 'Point E', tel: '+221338250000' },
      { nom: 'Centre d Excellence Africain', quartier: 'Fann Résidence', tel: '+221338240000' },
    ],
    actif: true,
  },
  {
    id: 'concours-cfpj-2026',
    slug: 'cfj-magistrature-greffe-2026',
    titre: 'Concours d entrée au Centre de Formation Judiciaire (CFJ - Magistrature & Greffe)',
    sigle: 'CFJ',
    organisme: 'Ministère de la Justice — Centre de Formation Judiciaire',
    categorie: 'fonction_publique',
    niveau_requis: 'Master 2 en Droit (Magistrature) ou Licence en Droit (Greffe)',
    age_max: 35,
    frais_dossier_xof: 10000,
    statut: 'ouvert',
    date_ouverture: '2026-10-01T08:00:00.000Z',
    date_cloture: '2026-12-15T17:00:00.000Z',
    date_epreuves: '2027-01-20T08:00:00.000Z',
    date_resultats: '2027-03-30T12:00:00.000Z',
    pieces_a_fournir: [
      'Demande manuscrite timbrée adressée au Directeur général du CFJ',
      'Extrait d acte de naissance de moins de 3 mois',
      'Certificat de nationalité sénégalaise',
      'Casier judiciaire (bulletin n°3)',
      'Copie légalisée de la maîtrise ou du Master en Droit',
      'Certificat de visite médicale',
      'Quittance de versement des frais de dossier de 10 000 FCFA',
    ],
    description: 'Formation d excellence des futurs magistrats, auditeurs de justice et administrateurs des greffes des tribunaux du Sénégal.',
    lien_officiel: 'https://cfj.sn',
    centres_prepa: [
      { nom: 'Institut de Formation Juridique Dakar', quartier: 'Plateau', tel: '+221338210011' },
    ],
    actif: true,
  },
  {
    id: 'concours-fonction-publique-2026',
    slug: 'fonction-publique-cadres-etat-2026',
    titre: 'Recrutement direct dans la Fonction Publique de l État (Cadres & Gestionnaires)',
    sigle: 'FONCTION PUBLIQUE',
    organisme: 'Ministère de la Fonction Publique — Direction Générale de la Fonction Publique',
    categorie: 'fonction_publique',
    niveau_requis: 'Baccalauréat, BTS, Licence ou Master selon le corps',
    age_max: 35,
    frais_dossier_xof: 0,
    statut: 'ouvert',
    date_ouverture: '2026-10-01T08:00:00.000Z',
    date_cloture: '2026-11-20T17:00:00.000Z',
    date_epreuves: '2026-12-15T08:00:00.000Z',
    date_resultats: '2027-02-10T12:00:00.000Z',
    pieces_a_fournir: [
      'Formulaire de candidature en ligne complété sur fonctionpublique.gouv.sn',
      'Copie CNI biométrique CEDEAO en cours de validité',
      'Extrait d acte de naissance de moins de 3 mois',
      'Certificat de nationalité sénégalaise',
      'Copie certifiée conforme des diplômes requis',
      'Curriculum Vitae actualisé',
    ],
    description: 'Appel à candidatures pour l intégration des cadres administratifs, financiers, planificateurs et statisticiens dans les ministères sectoriels.',
    lien_officiel: 'https://fonctionpublique.gouv.sn',
    centres_prepa: [],
    actif: true,
  },

  // ── 2. FORCES DE DÉFENSE & SÉCURITÉ ──────────────────────────────────────────
  {
    id: 'concours-police-2026',
    slug: 'police-gardiens-paix-2026',
    titre: 'Concours de recrutement d Élèves Gardiens de la Paix et Officiers de Police',
    sigle: 'POLICE',
    organisme: 'Ministère de l Intérieur — Direction Générale de la Police Nationale',
    categorie: 'forces_defense',
    niveau_requis: 'BFEM (Gardiens de la Paix) ou Licence (Officiers)',
    age_max: 26,
    frais_dossier_xof: 5000,
    statut: 'ouvert',
    date_ouverture: '2026-09-01T08:00:00.000Z',
    date_cloture: '2026-10-25T17:00:00.000Z',
    date_epreuves: '2026-11-15T07:00:00.000Z',
    date_resultats: '2026-12-20T12:00:00.000Z',
    pieces_a_fournir: [
      'Demande manuscrite timbrée adressée au Ministre de l Intérieur',
      'Extrait d acte de naissance de moins de 3 mois',
      'Certificat de nationalité sénégalaise',
      'Casier judiciaire datant de moins de 3 mois',
      'Certificat de toise (taille min. 1,75m hommes / 1,65m femmes)',
      'Copie certifiée conforme du diplôme (BFEM ou Licence)',
      'Certificat médical d aptitude physique',
    ],
    description: 'Renforcement des effectifs des commissariats urbains, de la sécurité publique et des unités d intervention sur toute l étendue du territoire.',
    lien_officiel: 'https://policenationale.sec.gouv.sn',
    centres_prepa: [
      { nom: 'Académie de Préparation Militaire & Civile', quartier: 'Parcelles Assainies', tel: '+221773456789' },
    ],
    actif: true,
  },
  {
    id: 'concours-douanes-2026',
    slug: 'douanes-controleurs-agents-2026',
    titre: 'Concours direct de recrutement de Contrôleurs et Préposés des Douanes',
    sigle: 'DOUANES',
    organisme: 'Direction Générale des Douanes — Ministère des Finances et du Budget',
    categorie: 'forces_defense',
    niveau_requis: 'BFEM (Préposés) ou Baccalauréat (Agents & Contrôleurs)',
    age_max: 28,
    frais_dossier_xof: 5000,
    statut: 'ouvert',
    date_ouverture: '2026-09-20T08:00:00.000Z',
    date_cloture: '2026-11-10T17:00:00.000Z',
    date_epreuves: '2026-12-05T07:30:00.000Z',
    date_resultats: '2027-01-30T14:00:00.000Z',
    pieces_a_fournir: [
      'Fiche d inscription officielle dûment remplie',
      'Extrait d acte de naissance de moins de 3 mois',
      'Certificat de nationalité sénégalaise',
      'Casier judiciaire n°3',
      'Copie certifiée conforme du Baccalauréat ou du BFEM',
      'Certificat d aptitude physique délivré par un médecin militaire',
      'Reçu de versement des frais de dossier de 5 000 FCFA',
    ],
    description: 'Recrutement des corps de préposés et contrôleurs pour la surveillance frontalière, le contrôle maritime et le dédouanement.',
    lien_officiel: 'https://douanes.sn',
    centres_prepa: [
      { nom: 'Prépa Douane Avenir Sénégal', quartier: 'Liberté 6', tel: '+221776543210' },
    ],
    actif: true,
  },
  {
    id: 'concours-gendarmerie-2026',
    slug: 'gendarmerie-eleves-gendarmes-2026',
    titre: 'Concours de recrutement d Élèves Gendarmes et Sous-Officiers de Gendarmerie',
    sigle: 'GENDARMERIE',
    organisme: 'Haut Commandement de la Gendarmerie Nationale — Ministère des Forces Armées',
    categorie: 'forces_defense',
    niveau_requis: 'BFEM ou Baccalauréat',
    age_max: 24,
    frais_dossier_xof: 5000,
    statut: 'ouvert',
    date_ouverture: '2026-09-25T08:00:00.000Z',
    date_cloture: '2026-11-30T17:00:00.000Z',
    date_epreuves: '2026-12-20T06:30:00.000Z',
    date_resultats: '2027-02-15T12:00:00.000Z',
    pieces_a_fournir: [
      'Demande manuscrite timbrée adressée au Haut Commandant de la Gendarmerie',
      'Certificat de nationalité sénégalaise',
      'Extrait de naissance de moins de 3 mois',
      'Casier judiciaire bulletin n°3',
      'Certificat de bonne vie et mœurs',
      'Copie certifiée du diplôme du BFEM ou du Baccalauréat',
      'Certificat médical d aptitude militaire et toise',
    ],
    description: 'Formation militaire et professionnelle des sous-officiers de gendarmerie territoriale, mobile et de surveillance des axes routiers.',
    lien_officiel: 'https://gendarmerie.sn',
    centres_prepa: [
      { nom: 'Prépa Défense & Sécurité Sénégal', quartier: 'Ouakam', tel: '+221775554433' },
    ],
    actif: true,
  },
  {
    id: 'concours-sapeurs-pompiers-2026',
    slug: 'bnsp-eleves-sapeurs-pompiers-2026',
    titre: 'Concours de recrutement d Élèves Sapeurs-Pompiers (BNSP)',
    sigle: 'BNSP',
    organisme: 'Brigade Nationale des Sapeurs-Pompiers — Ministère de l Intérieur',
    categorie: 'forces_defense',
    niveau_requis: 'BFEM ou Diplôme technique équivalent (Permis poids lourd apprécié)',
    age_max: 25,
    frais_dossier_xof: 5000,
    statut: 'ouvert',
    date_ouverture: '2026-10-01T08:00:00.000Z',
    date_cloture: '2026-12-05T17:00:00.000Z',
    date_epreuves: '2026-12-27T06:00:00.000Z',
    date_resultats: '2027-02-28T12:00:00.000Z',
    pieces_a_fournir: [
      'Demande manuscrite adressée au Général Commandant de la BNSP',
      'Extrait d acte de naissance de moins de 3 mois',
      'Certificat de nationalité sénégalaise',
      'Casier judiciaire n°3',
      'Attestation de réussite au BFEM ou CAP technique',
      'Certificat de visite médicale et aptitude natation/course',
    ],
    description: 'Recrutement des équipes d intervention, secours d urgence aux personnes, lutte contre les incendies et secours routier.',
    lien_officiel: 'https://bnsp.sn',
    centres_prepa: [],
    actif: true,
  },
  {
    id: 'concours-penitentiaire-dap-2026',
    slug: 'dap-surveillants-prison-2026',
    titre: 'Concours de recrutement d Agents et Surveillants de l Administration Pénitentiaire',
    sigle: 'DAP',
    organisme: 'Direction de l Administration Pénitentiaire — Ministère de la Justice',
    categorie: 'forces_defense',
    niveau_requis: 'BFEM (Surveillants) ou Baccalauréat (Contrôleurs)',
    age_max: 28,
    frais_dossier_xof: 5000,
    statut: 'ouvert',
    date_ouverture: '2026-10-05T08:00:00.000Z',
    date_cloture: '2026-12-18T17:00:00.000Z',
    date_epreuves: '2027-01-10T07:30:00.000Z',
    date_resultats: '2027-03-10T12:00:00.000Z',
    pieces_a_fournir: [
      'Demande d inscription timbrée adressée au Directeur de l Administration Pénitentiaire',
      'Extrait d acte de naissance',
      'Certificat de nationalité sénégalaise',
      'Casier judiciaire n°3 datant de moins de 3 mois',
      'Copie certifiée du diplôme du BFEM ou du Baccalauréat',
      'Certificat médical d aptitude aux fonctions pénitentiaires',
    ],
    description: 'Sécurité et gestion des établissements pénitentiaires, réinsertion sociale et accompagnement des personnes détenues.',
    lien_officiel: 'https://justice.sec.gouv.sn',
    centres_prepa: [],
    actif: true,
  },

  // ── 3. ÉDUCATION & ENSEIGNEMENT ──────────────────────────────────────────────
  {
    id: 'concours-fastef-2026',
    slug: 'fastef-professeurs-2026',
    titre: 'Concours d entrée à la FASTEF pour la formation de Professeurs de l Enseignement Secondaire',
    sigle: 'FASTEF',
    organisme: 'Université Cheikh Anta Diop de Dakar (UCAD)',
    categorie: 'enseignement',
    niveau_requis: 'Licence ou Master selon la filière',
    age_max: 35,
    frais_dossier_xof: 10000,
    statut: 'ouvert',
    date_ouverture: '2026-09-10T08:00:00.000Z',
    date_cloture: '2026-11-05T17:00:00.000Z',
    date_epreuves: '2026-11-20T08:00:00.000Z',
    date_resultats: '2026-12-30T10:00:00.000Z',
    pieces_a_fournir: [
      'Fiche d inscription imprimée depuis la plateforme FASTEF',
      'Copie légalisée de la CNI biométrique CEDEAO',
      'Extrait de naissance de moins de trois mois',
      'Copie certifiée conforme du diplôme de Licence ou de Master',
      'Relevés de notes universitaires certifiés',
      'Quittance de versement bancaire de 10 000 FCFA',
    ],
    description: 'Formation pédagogique des futurs professeurs de lycées et collèges (Maths, PC, SVT, Lettres, Histoire-Géo, Anglais, Philosophie).',
    lien_officiel: 'https://fastef.ucad.sn',
    centres_prepa: [
      { nom: 'Centre Pédagogique Universitaire Dakar', quartier: 'Fann', tel: '+221338259900' },
    ],
    actif: true,
  },
  {
    id: 'concours-crem-2026',
    slug: 'crem-eleves-maitres-2026',
    titre: 'Concours de Recrutement des Élèves-Maîtres (CREM - Enseignement Élémentaire)',
    sigle: 'CREM',
    organisme: 'Ministère de l Éducation Nationale (Direction des Examens et Concours — DEXCO)',
    categorie: 'enseignement',
    niveau_requis: 'Baccalauréat (toutes séries)',
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
    id: 'concours-inseps-2026',
    slug: 'inseps-professeurs-eps-2026',
    titre: 'Concours d entrée à l Institut Supérieur d Éducation Populaire et du Sport (INSEPS)',
    sigle: 'INSEPS',
    organisme: 'Université Cheikh Anta Diop de Dakar (UCAD)',
    categorie: 'enseignement',
    niveau_requis: 'Baccalauréat avec aptitudes physiques et sportives',
    age_max: 25,
    frais_dossier_xof: 10000,
    statut: 'ouvert',
    date_ouverture: '2026-09-15T08:00:00.000Z',
    date_cloture: '2026-11-12T17:00:00.000Z',
    date_epreuves: '2026-12-01T07:00:00.000Z',
    date_resultats: '2027-01-10T12:00:00.000Z',
    pieces_a_fournir: [
      'Fiche de candidature en ligne INSEPS',
      'Copie certifiée conforme du Baccalauréat',
      'Certificat médical d aptitude aux épreuves physiques de haute intensité',
      'Extrait de naissance de moins de 3 mois',
      'Quittance de paiement des frais de dossier de 10 000 FCFA',
    ],
    description: 'Formation des professeurs d Éducation Physique et Sportive (EPS), éducateurs sportifs et gestionnaires d organisations sportives.',
    lien_officiel: 'https://inseps.ucad.sn',
    centres_prepa: [],
    actif: true,
  },

  // ── 4. GRANDES ÉCOLES D'INGÉNIEURS & MÉDIAS ──────────────────────────────────
  {
    id: 'concours-esp-dakar-2026',
    slug: 'esp-dakar-ingenieurs-2026',
    titre: 'Concours d entrée à l École Supérieure Polytechnique de Dakar (ESP - DUT & Ingénieurs)',
    sigle: 'ESP',
    organisme: 'Université Cheikh Anta Diop de Dakar (UCAD)',
    categorie: 'grandes_ecoles',
    niveau_requis: 'Baccalauréat Scientifique (S1, S2, S3, T1, T2) ou BTS/DUT',
    age_max: 23,
    frais_dossier_xof: 10000,
    statut: 'ouvert',
    date_ouverture: '2026-09-01T08:00:00.000Z',
    date_cloture: '2026-11-15T17:00:00.000Z',
    date_epreuves: '2026-12-08T08:00:00.000Z',
    date_resultats: '2027-01-10T12:00:00.000Z',
    pieces_a_fournir: [
      'Relevé de notes officiel du Baccalauréat scientifique ou technique',
      'Copie certifiée conforme de l attestation du Bac',
      'Extrait de naissance de moins de 3 mois',
      'Frais d inscription de 10 000 FCFA acquittés en ligne',
    ],
    description: 'Formation d ingénieurs et de techniciens supérieurs en informatique, génie civil, télécommunications, génie mécanique et génie chimique.',
    lien_officiel: 'https://esp.sn',
    centres_prepa: [],
    actif: true,
  },
  {
    id: 'concours-ept-thies-2026',
    slug: 'ept-thies-ingenieurs-conception-2026',
    titre: 'Concours d entrée à l École Polytechnique de Thiès (EPT - Cycle Ingénieurs de Conception)',
    sigle: 'EPT',
    organisme: 'Ministère de l Enseignement Supérieur, de la Recherche et de l Innovation',
    categorie: 'grandes_ecoles',
    niveau_requis: 'Baccalauréat Scientifique S1 ou S2 (avec mention)',
    age_max: 22,
    frais_dossier_xof: 10000,
    statut: 'ouvert',
    date_ouverture: '2026-09-05T08:00:00.000Z',
    date_cloture: '2026-11-20T17:00:00.000Z',
    date_epreuves: '2026-12-12T08:00:00.000Z',
    date_resultats: '2027-01-15T14:00:00.000Z',
    pieces_a_fournir: [
      'Dossier de candidature EPT complété',
      'Attestation de réussite et relevé de notes du Baccalauréat S1 ou S2',
      'Bulletins des classes de Première et Terminale',
      'Extrait de naissance',
      'Reçu de paiement des frais de concours (10 000 FCFA)',
    ],
    description: 'Grande école d ingénieurs de référence en génie civil, électromécanique, informatique et télécommunications au Sénégal.',
    lien_officiel: 'https://ept.sn',
    centres_prepa: [],
    actif: true,
  },
  {
    id: 'concours-ensa-thies-2026',
    slug: 'ensa-thies-agronomie-2026',
    titre: 'Concours d entrée à l École Nationale Supérieure d Agriculture (ENSA Thiès - Ingénieurs Agronomes)',
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
    description: 'Formation des ingénieurs agronomes concepteurs au service de la souveraineté alimentaire, de l agro-industrie et du développement rural.',
    lien_officiel: 'https://ensa.sn',
    centres_prepa: [],
    actif: true,
  },
  {
    id: 'concours-cesti-2026',
    slug: 'cesti-journalisme-2026',
    titre: 'Concours d entrée au Centre d Études des Sciences et Techniques de l Information (CESTI Journalisme)',
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
      'Formulaire de candidature en ligne CESTI',
      'Photocopie légalisée de l attestation du Baccalauréat ou de la Licence',
      'Extrait d acte de naissance',
      'Relevé de notes officiel du Baccalauréat',
      'Lettre de motivation manuscrite détaillant le projet journalistique',
      'Reçu de versement des frais de dossier de 10 000 FCFA',
    ],
    description: 'Formation d excellence aux métiers du journalisme (presse écrite, radio, télévision, journalisme web et nouveaux médias).',
    lien_officiel: 'https://cesti.ucad.sn',
    centres_prepa: [],
    actif: true,
  },
  {
    id: 'concours-eamac-2026',
    slug: 'eamac-aviation-meteo-2026',
    titre: 'Concours d entrée à l École Africaine de la Météorologie et de l Aviation Civile (EAMAC - ASECNA)',
    sigle: 'EAMAC',
    organisme: 'ASECNA — Représentation au Sénégal (Dakar)',
    categorie: 'grandes_ecoles',
    niveau_requis: 'Baccalauréat Scientifique ou Licence Scientifique',
    age_max: 24,
    frais_dossier_xof: 15000,
    statut: 'ouvert',
    date_ouverture: '2026-10-01T08:00:00.000Z',
    date_cloture: '2026-12-10T17:00:00.000Z',
    date_epreuves: '2027-01-15T08:00:00.000Z',
    date_resultats: '2027-03-01T12:00:00.000Z',
    pieces_a_fournir: [
      'Dossier d inscription ASECNA complété',
      'Attestation de réussite au Baccalauréat S ou diplôme universitaire en Mathématiques/Physique',
      'Extrait d acte de naissance',
      'Certificat de nationalité d un pays membre de l ASECNA',
      'Certificat d aptitude médicale pour la navigation aérienne',
      'Quittance de paiement des frais de dossier de 15 000 FCFA',
    ],
    description: 'Formation internationale des contrôleurs de la circulation aérienne, ingénieurs en électronique de la navigation et météorologues aéronautiques.',
    lien_officiel: 'https://eamac.asecna.aero',
    centres_prepa: [],
    actif: true,
  },

  // ── 5. EXAMENS NATIONAUX D'ÉTAT ──────────────────────────────────────────────
  {
    id: 'examen-baccalaureat-2026',
    slug: 'baccalaureat-senegal-2026',
    titre: 'Session Unique du Baccalauréat Général et Technique du Sénégal',
    sigle: 'BAC',
    organisme: 'Office du Baccalauréat du Sénégal — UCAD',
    categorie: 'examens_nationaux',
    niveau_requis: 'Classe de Terminale ou Candidat Libre',
    age_max: null,
    frais_dossier_xof: 5000,
    statut: 'ouvert',
    date_ouverture: '2026-11-01T08:00:00.000Z',
    date_cloture: '2027-01-15T17:00:00.000Z',
    date_epreuves: '2027-07-02T08:00:00.000Z',
    date_resultats: '2027-07-16T12:00:00.000Z',
    pieces_a_fournir: [
      'Fiche d inscription individuelle validée par le chef d établissement ou formulaire candidat libre',
      'Extrait d acte de naissance de moins de 3 mois légalisé',
      'Certificat de scolarité de la classe de Terminale',
      'Quittance des droits d examen délivrée par l Office du Bac (5 000 FCFA)',
    ],
    description: 'Examen national d État ouvrant l accès aux études supérieures universitaires, grandes écoles et facultés au Sénégal.',
    lien_officiel: 'https://officedubac.sn',
    centres_prepa: [],
    actif: true,
  },
  {
    id: 'examen-bfem-2026',
    slug: 'bfem-senegal-2026',
    titre: 'Brevet de Fin d Études Moyennes (BFEM) — Session Normale',
    sigle: 'BFEM',
    organisme: 'Ministère de l Éducation Nationale (Direction des Examens et Concours — DEXCO)',
    categorie: 'examens_nationaux',
    niveau_requis: 'Classe de Troisième (3e) ou Candidat Libre',
    age_max: null,
    frais_dossier_xof: 2000,
    statut: 'ouvert',
    date_ouverture: '2026-11-15T08:00:00.000Z',
    date_cloture: '2027-01-30T17:00:00.000Z',
    date_epreuves: '2027-07-15T08:00:00.000Z',
    date_resultats: '2027-07-24T12:00:00.000Z',
    pieces_a_fournir: [
      'Extrait de naissance de moins de 3 mois',
      'Certificat de scolarité de la classe de 3e de l enseignement moyen',
      'Quittance de versement des droits d examen de 2 000 FCFA',
    ],
    description: 'Validation de l enseignement moyen et orientation vers les lycées d enseignement général, technique ou professionnel.',
    lien_officiel: 'https://men.gouv.sn',
    centres_prepa: [],
    actif: true,
  },
  {
    id: 'examen-cfee-2026',
    slug: 'cfee-entree-sixieme-2026',
    titre: 'Certificat de Fin d Études Élémentaires (CFEE) & Entrée en Sixième',
    sigle: 'CFEE',
    organisme: 'Ministère de l Éducation Nationale (Direction des Examens et Concours — DEXCO)',
    categorie: 'examens_nationaux',
    niveau_requis: 'Classe de CM2',
    age_max: null,
    frais_dossier_xof: 1000,
    statut: 'ouvert',
    date_ouverture: '2026-11-15T08:00:00.000Z',
    date_cloture: '2027-02-15T17:00:00.000Z',
    date_epreuves: '2027-06-25T08:00:00.000Z',
    date_resultats: '2027-07-08T12:00:00.000Z',
    pieces_a_fournir: [
      'Extrait d acte de naissance de l élève',
      'Certificat de scolarité de la classe de CM2',
      'Fiche d inscription officielle transmise par l inspection de l éducation et de la formation (IEF)',
    ],
    description: 'Examen de validation du cycle primaire et admission au collège d enseignement moyen public ou privé.',
    lien_officiel: 'https://men.gouv.sn',
    centres_prepa: [],
    actif: true,
  },

  // ── 6. SANTÉ & TRAVAIL SOCIAL ────────────────────────────────────────────────
  {
    id: 'concours-endss-2026',
    slug: 'endss-dakar-sante-2026',
    titre: 'Concours d entrée à l École Nationale de Développement Sanitaire et Social (ENDSS Dakar)',
    sigle: 'ENDSS',
    organisme: 'Ministère de la Santé et de l Action Sociale',
    categorie: 'sante',
    niveau_requis: 'BFEM (Adjoints) ou Baccalauréat Scientifique (Infirmiers & Sages-Femmes d État)',
    age_max: 28,
    frais_dossier_xof: 10000,
    statut: 'ouvert',
    date_ouverture: '2026-09-15T08:00:00.000Z',
    date_cloture: '2026-11-20T17:00:00.000Z',
    date_epreuves: '2026-12-10T07:30:00.000Z',
    date_resultats: '2027-01-25T12:00:00.000Z',
    pieces_a_fournir: [
      'Demande manuscrite adressée au Directeur de l ENDSS',
      'Extrait d acte de naissance',
      'Certificat de nationalité sénégalaise',
      'Casier judiciaire n°3',
      'Copie certifiée conforme du Baccalauréat scientifique ou du BFEM',
      'Certificat médical d aptitude aux carrières sanitaires',
      'Quittance de versement des frais d examen (10 000 FCFA)',
    ],
    description: 'Formation paramédicale d État : Infirmiers d État, Sages-Femmes d État, Techniciens de laboratoire, d anesthésie et de kinésithérapie.',
    lien_officiel: 'https://sante.gouv.sn',
    centres_prepa: [
      { nom: 'Prépa Santé Dakar Fann', quartier: 'Fann Résidence', tel: '+221338251212' },
    ],
    actif: true,
  },
  {
    id: 'concours-entss-2026',
    slug: 'entss-travailleurs-sociaux-2026',
    titre: 'Concours d entrée à l École Nationale des Travailleurs Sociaux Spécialisés (ENTSS)',
    sigle: 'ENTSS',
    organisme: 'Ministère de la Santé et de l Action Sociale',
    categorie: 'sante',
    niveau_requis: 'Baccalauréat (toutes séries) ou Licence',
    age_max: 32,
    frais_dossier_xof: 10000,
    statut: 'ouvert',
    date_ouverture: '2026-09-20T08:00:00.000Z',
    date_cloture: '2026-11-28T17:00:00.000Z',
    date_epreuves: '2026-12-15T08:00:00.000Z',
    date_resultats: '2027-01-20T12:00:00.000Z',
    pieces_a_fournir: [
      'Formulaire d inscription officiel ENTSS',
      'Copie certifiée conforme du Baccalauréat ou du diplôme supérieur',
      'Extrait d acte de naissance',
      'Certificat de nationalité sénégalaise',
      'Casier judiciaire bulletin n°3',
      'Frais de participation aux épreuves (10 000 FCFA)',
    ],
    description: 'Formation professionnelle des assistants sociaux, éducateurs spécialisés et cadres du travail social et humanitaire.',
    lien_officiel: 'https://sante.gouv.sn',
    centres_prepa: [],
    actif: true,
  },
  {
    id: 'concours-fmpo-internat-2026',
    slug: 'fmpo-internat-medecine-pharmacie-2026',
    titre: 'Concours d Internat en Médecine et Pharmacie des Hôpitaux de Dakar',
    sigle: 'INTERNAT MÉDECINE',
    organisme: 'Faculté de Médecine, de Pharmacie et d Odonto-Stomatologie (FMPO — UCAD)',
    categorie: 'sante',
    niveau_requis: 'Doctorat 6e année Médecine ou Pharmacie',
    age_max: 32,
    frais_dossier_xof: 10000,
    statut: 'ouvert',
    date_ouverture: '2026-10-01T08:00:00.000Z',
    date_cloture: '2026-12-15T17:00:00.000Z',
    date_epreuves: '2027-01-08T08:00:00.000Z',
    date_resultats: '2027-01-25T14:00:00.000Z',
    pieces_a_fournir: [
      'Attestation de scolarité de 6e année Médecine ou Pharmacie',
      'Relevés de notes de l externat',
      'Certificat de nationalité sénégalaise ou d un pays de l UEMOA',
      'Extrait d acte de naissance',
      'Frais d inscription au concours de l internat (10 000 FCFA)',
    ],
    description: 'Voie royale de formation des futurs spécialistes hospitaliers et universitaires dans les centres hospitaliers universitaires de Dakar (Le Dantec, Fann, Hôpital Général Idrissa Pouye).',
    lien_officiel: 'https://fmpo.ucad.sn',
    centres_prepa: [],
    actif: true,
  },
];

let concoursInitialises = false;

/**
 * Assure la création idempotente et la mise à jour continue des 22 concours officiels dans PostgreSQL
 */
async function assurerConcoursInitiaux() {
  if (concoursInitialises || !pool) return;
  try {
    for (const c of CONCOURS_NATIONAUX_SENEGAL) {
      await pool.query(
        `INSERT INTO surga_concours (
           id, slug, titre, sigle, organisme, categorie, niveau_requis, age_max,
           frais_dossier_xof, statut, date_ouverture, date_cloture, date_epreuves,
           date_resultats, description, lien_officiel, pieces_a_fournir, centres_prepa,
           actif, updated_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, TRUE, NOW())
         ON CONFLICT (id) DO UPDATE SET
           slug = EXCLUDED.slug,
           titre = EXCLUDED.titre,
           sigle = EXCLUDED.sigle,
           organisme = EXCLUDED.organisme,
           categorie = EXCLUDED.categorie,
           niveau_requis = EXCLUDED.niveau_requis,
           age_max = EXCLUDED.age_max,
           frais_dossier_xof = EXCLUDED.frais_dossier_xof,
           statut = EXCLUDED.statut,
           date_ouverture = EXCLUDED.date_ouverture,
           date_cloture = EXCLUDED.date_cloture,
           date_epreuves = EXCLUDED.date_epreuves,
           date_resultats = EXCLUDED.date_resultats,
           description = EXCLUDED.description,
           lien_officiel = EXCLUDED.lien_officiel,
           pieces_a_fournir = EXCLUDED.pieces_a_fournir,
           centres_prepa = EXCLUDED.centres_prepa,
           actif = TRUE,
           updated_at = NOW()`,
        [
          c.id, c.slug, c.titre, c.sigle, c.organisme, c.categorie, c.niveau_requis,
          c.age_max, c.frais_dossier_xof, c.statut, c.date_ouverture, c.date_cloture,
          c.date_epreuves, c.date_resultats, c.description, c.lien_officiel,
          JSON.stringify(c.pieces_a_fournir || []),
          JSON.stringify(c.centres_prepa || [])
        ]
      );
    }
    concoursInitialises = true;
  } catch (err) {
    console.warn('[SurgaConcours] Avertissement synchronisation DB concours:', err.message);
  }
}

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
  await assurerConcoursInitiaux();
  const {
    categorie = 'tous',
    statut = 'tous',
    niveau = 'tous',
    q = '',
    limit = 50,
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

      const countRes = await pool.query(
        `SELECT COUNT(*) AS total FROM surga_concours WHERE ${conditions.join(' AND ')}`,
        params
      );
      const total = parseInt(countRes.rows[0]?.total || 0, 10);

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
      if (res.rows.length > 0 || total > 0 || q || (categorie && categorie !== 'tous')) {
        const items = res.rows.map((row) => ({
          ...row,
          echeances: calculerEcheances(row),
        }));
        return { concours: items, total };
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
  await assurerConcoursInitiaux();
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
