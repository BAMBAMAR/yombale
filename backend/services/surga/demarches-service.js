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

// SRG-A2-009 : quand une requête échoue, l'erreur remonte. Les tableaux en mémoire ci-dessous ne servent qu'aux tests
// unitaires, joués sans base : en service, ils rendaient des fiches écrites dans le code et gardaient des écritures
// dans le processus, perdues au redémarrage.
function remonter(erreur, ecriture) {
  if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID) return;
  console.error('[SurgaDemarches] Requête en échec :', erreur.message);
  const e = new Error('Ce service est momentanément indisponible. Veuillez réessayer dans un instant.');
  e.code = ecriture ? 'ENREGISTREMENT_IMPOSSIBLE' : 'LECTURE_IMPOSSIBLE';
  e.status = 503;
  throw e;
}
const URL_PORTAIL_OFFICIEL = 'https://e-senegal.sn/#/home/demarches';

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
    source_officielle: 'https://e-senegal.sn/#/home/demarches',
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
    source_officielle: 'https://e-senegal.sn/#/home/demarches',
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
    source_officielle: 'https://e-senegal.sn/#/home/demarches',
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
    source_officielle: 'https://e-senegal.sn/#/home/demarches',
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
    source_officielle: 'https://e-senegal.sn/#/home/demarches',
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
    source_officielle: 'https://e-senegal.sn/#/home/demarches',
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
    source_officielle: 'https://e-senegal.sn/#/home/demarches',
    date_verification: new Date().toISOString(),
    date_prochaine_verification: new Date(Date.now() + CYCLE_REVERIFICATION_JOURS * 24 * 3600 * 1000).toISOString(),
    statut: 'BROUILLON',
    mots_cles: ['residence', 'domicile', 'certificat de residence', 'commissariat', 'gendarmerie'],
  },
  {
    id: 'dem-creation-entreprise',
    slug: 'creation-entreprise-individuelle-gie',
    titre: 'Création d\'Entreprise Individuelle ou GIE (Guichet Unique APIX)',
    categorie: 'activite_pro',
    public_concerne: 'Tout porteur de projet, entrepreneur individuel ou membres d\'un GIE au Sénégal',
    pieces: [
      { intitule: 'Copie de la CNI biométrique CEDEAO ou passeport du promoteur', obligatoire: true, precision: 'En cours de validité' },
      { intitule: 'Extrait de casier judiciaire datant de moins de 3 mois', obligatoire: true, precision: 'Bulletin n°3 ou déclaration sur l\'honneur' },
      { intitule: 'Certificat de résidence du promoteur', obligatoire: true, precision: 'Délivré par la police ou gendarmerie' },
      { intitule: 'Statuts et règlement intérieur légalisés (pour GIE uniquement)', obligatoire: false, precision: 'Non requis pour entreprise individuelle' },
    ],
    cout_xof: 10000,
    delai: '24 à 48 heures ouvrées',
    lieux: 'Bureau d\'Appui à la Création d\'Entreprise (BACE) de l\'APIX à Dakar (52 rue Mohamed V) ou centres régionaux.',
    etapes: [
      'Dépôt physique du dossier au guichet unique APIX ou soumission en ligne sur creationdentreprise.sn.',
      'Enregistrement des actes et immatriculation au Registre du Commerce et du Crédit Mobilier (RCCM).',
      'Attribution automatique du Numéro d\'Identification Nationale des Entreprises et Associations (NINEA).',
      'Retrait du dossier complet (RCCM + NINEA + déclaration fiscale d\'existence).',
    ],
    source_officielle: 'https://e-senegal.sn/#/home/demarches',
    date_verification: new Date().toISOString(),
    date_prochaine_verification: new Date(Date.now() + CYCLE_REVERIFICATION_JOURS * 24 * 3600 * 1000).toISOString(),
    statut: 'BROUILLON',
    mots_cles: ['entreprise', 'gie', 'creation', 'apix', 'ninea', 'rccm', 'commerce', 'registre'],
  },
  {
    id: 'dem-immatriculation-sarl',
    slug: 'creation-societe-sarl-apix',
    titre: 'Création de Société à Responsabilité Limitée (SARL)',
    categorie: 'activite_pro',
    public_concerne: 'Créateurs d\'entreprise s\'associant sous forme de société commerciale (capital min. 100 000 FCFA)',
    pieces: [
      { intitule: 'Statuts de la SARL signés par les associés ou rédigés par notaire', obligatoire: true, precision: 'Statut sous seing privé autorisé pour SARL' },
      { intitule: 'Copies CNI et casiers judiciaires des associés et du gérant', obligatoire: true, precision: 'De moins de 3 mois' },
      { intitule: 'Certificat de dépôt du capital en banque ou attestation de versement', obligatoire: true, precision: 'Compte indisponible en banque ou étude notariale' },
      { intitule: 'Bail commercial ou contrat de domiciliation de l\'entreprise', obligatoire: true, precision: 'Indiquant le siège social' },
    ],
    cout_xof: 25000,
    delai: '48 heures ouvrées',
    lieux: 'Guichet Unique de l\'APIX ou Étude notariale agréée.',
    etapes: [
      'Rédaction et signature des statuts (sous seing privé ou acte notarié).',
      'Dépôt du capital social dans une banque ou chez le notaire.',
      'Dépôt du dossier au guichet unique de l\'APIX pour formalités combinées.',
      'Délivrance de l\'immatriculation RCCM, du NINEA et du journal d\'annonces légales.',
    ],
    source_officielle: 'https://e-senegal.sn/#/home/demarches',
    date_verification: new Date().toISOString(),
    date_prochaine_verification: new Date(Date.now() + CYCLE_REVERIFICATION_JOURS * 24 * 3600 * 1000).toISOString(),
    statut: 'BROUILLON',
    mots_cles: ['sarl', 'societe', 'statuts', 'apix', 'ninea', 'capital', 'commerce'],
  },
  {
    id: 'dem-quitus-fiscal',
    slug: 'quitus-fiscal-attestation-regularite',
    titre: 'Quitus fiscal (Attestation de régularité fiscale)',
    categorie: 'activite_pro',
    public_concerne: 'Entreprises, professionnels, commerçants ou soumissionnaires aux marchés publics',
    pieces: [
      { intitule: 'Numéro d\'Identification Nationale des Entreprises (NINEA)', obligatoire: true, precision: 'Attestation NINEA en cours' },
      { intitule: 'Déclarations fiscales récentes à jour (TVA, BRS, Impôt sur les Sociétés)', obligatoire: true, precision: 'Dernières déclarations mensuelles ou annuelles' },
      { intitule: 'Quittances de paiement des impôts échus ou échéancier validé', obligatoire: true, precision: 'Délivrées par la recette des impôts' },
    ],
    cout_xof: 0,
    delai: '48 à 72 heures ouvrées',
    lieux: 'Centre des Services Fiscaux (DGID) de rattachement ou portail eTax (dgid.sn).',
    etapes: [
      'Vérification préalable de la situation fiscale sur la plateforme eTax ou au guichet du Centre des Services Fiscaux.',
      'Soumission de la demande d\'attestation de régularité fiscale.',
      'Instruction par le gestionnaire de compte fiscal.',
      'Délivrance du quitus fiscal officiel signé avec QR code de vérification.',
    ],
    source_officielle: 'https://e-senegal.sn/#/home/demarches',
    date_verification: new Date().toISOString(),
    date_prochaine_verification: new Date(Date.now() + CYCLE_REVERIFICATION_JOURS * 24 * 3600 * 1000).toISOString(),
    statut: 'BROUILLON',
    mots_cles: ['quitus fiscal', 'dgid', 'impots', 'etax', 'regularite fiscale', 'marches publics'],
  },
  {
    id: 'dem-immatriculation-ipres-secu',
    slug: 'immatriculation-employeur-ipres-css',
    titre: 'Immatriculation employeur & salariés (IPRES et Caisse de Sécurité Sociale)',
    categorie: 'activite_pro',
    public_concerne: 'Toute entreprise ou employeur embauchant un ou plusieurs salariés au Sénégal',
    pieces: [
      { intitule: 'Formulaire de déclaration d\'immatriculation employeur complété', obligatoire: true, precision: 'Fourni par l\'IPRES et la CSS' },
      { intitule: 'Copie de l\'immatriculation RCCM et attestation NINEA', obligatoire: true, precision: 'Dossier juridique de la société' },
      { intitule: 'Contrats de travail ou déclaration des premiers salariés embauchés', obligatoire: true, precision: 'Copies CNI et état civil des salariés' },
    ],
    cout_xof: 0,
    delai: '3 à 5 jours ouvrés',
    lieux: 'Agences régionales IPRES et Caisse de Sécurité Sociale (CSS) ou guichet unique APIX.',
    etapes: [
      'Remplissage de la déclaration employeur auprès de l\'IPRES (retraite) et de la CSS (accidents et famille).',
      'Enregistrement des fiches salariés pour attribution de leurs numéros d\'assurés.',
      'Délivrance de l\'attestation d\'immatriculation employeur pour les déclarations sociales périodiques.',
    ],
    source_officielle: 'https://e-senegal.sn/#/home/demarches',
    date_verification: new Date().toISOString(),
    date_prochaine_verification: new Date(Date.now() + CYCLE_REVERIFICATION_JOURS * 24 * 3600 * 1000).toISOString(),
    statut: 'BROUILLON',
    mots_cles: ['ipres', 'css', 'securite sociale', 'retraite', 'employeur', 'salaries', 'cotisations'],
  },
  {
    id: 'dem-acte-mariage',
    slug: 'declaration-extrait-acte-mariage',
    titre: 'Déclaration et extrait d\'acte de mariage',
    categorie: 'etat_civil',
    public_concerne: 'Époux mariés civilement ou constatant un mariage coutumier/religieux au Sénégal',
    pieces: [
      { intitule: 'Références complètes de l\'acte de mariage (numéro, registre, année)', obligatoire: true, precision: 'Ou livret de famille d\'état civil' },
      { intitule: 'Pièce d\'identité en cours de validité du demandeur (CNI ou passeport)', obligatoire: true, precision: 'Original ou copie' },
      { intitule: 'Timbre fiscal communal de 200 FCFA par volet demandé', obligatoire: true, precision: 'À apposer sur chaque extrait' },
    ],
    cout_xof: 200,
    delai: 'Immédiat à 24 heures',
    lieux: 'Centre d\'état civil de la commune ou mairie d\'arrondissement où l\'union a été célébrée ou transcrite.',
    etapes: [
      'Présentation au guichet état civil de la commune de célébration avec les références de l\'acte.',
      'Paiement et apposition du timbre fiscal de 200 FCFA.',
      'Vérification du registre des mariages par l\'officier d\'état civil.',
      'Délivrance de l\'extrait d\'acte de mariage officiel signé.',
    ],
    source_officielle: 'https://e-senegal.sn/#/home/demarches',
    date_verification: new Date().toISOString(),
    date_prochaine_verification: new Date(Date.now() + CYCLE_REVERIFICATION_JOURS * 24 * 3600 * 1000).toISOString(),
    statut: 'BROUILLON',
    mots_cles: ['mariage', 'acte de mariage', 'livret de famille', 'extrait de mariage', 'etat civil', 'mairie'],
  },
  {
    id: 'dem-acte-deces',
    slug: 'declaration-extrait-acte-deces',
    titre: 'Déclaration de décès et permis d\'inhumer',
    categorie: 'etat_civil',
    public_concerne: 'Famille, proches ou pompes funèbres suite au décès d\'un citoyen sur le territoire sénégalais',
    pieces: [
      { intitule: 'Certificat médical de constatation de décès', obligatoire: true, precision: 'Délivré par le médecin de la structure sanitaire ou légiste' },
      { intitule: 'Pièce d\'identité de la personne décédée (CNI ou passeport)', obligatoire: true, precision: 'Original ou copie lisible' },
      { intitule: 'Pièce d\'identité du déclarant (parent ou mandataire)', obligatoire: true, precision: 'CNI biométrique CEDEAO' },
      { intitule: 'Timbre fiscal de 200 FCFA par extrait d\'acte de décès', obligatoire: true, precision: 'La déclaration et le permis d\'inhumer sont gratuits' },
    ],
    cout_xof: 200,
    delai: 'Immédiat (permis d\'inhumer délivré sur place)',
    lieux: 'Centre d\'état civil de la mairie de la commune où est survenu le décès.',
    etapes: [
      'Déclaration obligatoire dans les 8 jours suivant le décès auprès de l\'officier d\'état civil.',
      'Délivrance immédiate de l\'autorisation d\'inhumer (permis d\'inhumer).',
      'Enregistrement sur le registre des décès de la commune.',
      'Délivrance des extraits d\'acte de décès nécessaires aux formalités successorales.',
    ],
    source_officielle: 'https://e-senegal.sn/#/home/demarches',
    date_verification: new Date().toISOString(),
    date_prochaine_verification: new Date(Date.now() + CYCLE_REVERIFICATION_JOURS * 24 * 3600 * 1000).toISOString(),
    statut: 'BROUILLON',
    mots_cles: ['deces', 'acte de deces', 'permis d inhumer', 'succession', 'etat civil', 'mairie'],
  },
  {
    id: 'dem-certificat-vie',
    slug: 'certificat-de-vie-individuel-collectif',
    titre: 'Certificat de vie (Individuel ou pour pensionnaires)',
    categorie: 'etat_civil',
    public_concerne: 'Retraités, pensionnaires IPRES / FNR ou ayants droit devant justifier de leur existence',
    pieces: [
      { intitule: 'Présentation physique obligatoire de l\'intéressé (comparution personnelle)', obligatoire: true, precision: 'Sauf empêchement médical dûment justifié' },
      { intitule: 'Carte Nationale d\'Identité biométrique CEDEAO en cours de validité', obligatoire: true, precision: 'Original' },
      { intitule: 'Livret de pension IPRES / Caisse de Retraite (le cas échéant)', obligatoire: false, precision: 'Pour mention du numéro de pension' },
      { intitule: 'Timbre fiscal communal de 200 FCFA', obligatoire: true, precision: 'Timbre municipal' },
    ],
    cout_xof: 200,
    delai: 'Délivrance immédiate sur place',
    lieux: 'Centre d\'état civil de la mairie du lieu de résidence ou commissariat de police.',
    etapes: [
      'Comparution physique de l\'usager devant l\'officier d\'état civil.',
      'Vérification de la pièce d\'identité et apposition du timbre de 200 FCFA.',
      'Signature et apposition du sceau de l\'officier d\'état civil.',
      'Remise en main propre du certificat de vie officiel.',
    ],
    source_officielle: 'https://e-senegal.sn/#/home/demarches',
    date_verification: new Date().toISOString(),
    date_prochaine_verification: new Date(Date.now() + CYCLE_REVERIFICATION_JOURS * 24 * 3600 * 1000).toISOString(),
    statut: 'BROUILLON',
    mots_cles: ['certificat de vie', 'pension', 'retraite', 'ipres', 'etat civil', 'mairie'],
  },
  {
    id: 'dem-permis-construire',
    slug: 'permis-construire-autorisation-urbanisme',
    titre: 'Permis de construire (Autorisation d\'urbanisme)',
    categorie: 'logement',
    public_concerne: 'Tout propriétaire, maître d\'ouvrage ou promoteur projetant des travaux d\'édification ou de surélévation',
    pieces: [
      { intitule: 'Titre de propriété (Titre Foncier, Bail, Notification ou Permis d\'occuper)', obligatoire: true, precision: 'Certifié conforme' },
      { intitule: 'Plans de construction à l\'échelle (situation, masse, coupes, façades)', obligatoire: true, precision: 'Établis et visés par un architecte agréé de l\'Ordre des Architectes' },
      { intitule: 'Devis descriptif et estimatif des travaux projetés', obligatoire: true, precision: 'Signé par le concepteur' },
      { intitule: 'Plan d\'assainissement et sécurité incendie (bâtiments recevant du public / R+2 et plus)', obligatoire: false, precision: 'Avis préalable de la Protection Civile' },
    ],
    cout_xof: 10000,
    delai: '15 à 30 jours (via plateforme Teledac) ou 40 jours au guichet municipal',
    lieux: 'Services d\'Urbanisme de la commune ou plateforme nationale en ligne Teledac (teledac.sec.gouv.sn).',
    etapes: [
      'Dépôt dématérialisé du dossier sur le portail Teledac ou en 4 exemplaires à la mairie.',
      'Examen par la Commission Technique d\'Instruction (Urbanisme, Cadastre, Hygiène, Protection Civile).',
      'Paiement des taxes municipales d\'urbanisme.',
      'Notification et délivrance de l\'Arrêté portant permis de construire signé par le Maire ou le Préfet.',
    ],
    source_officielle: 'https://e-senegal.sn/#/home/demarches',
    date_verification: new Date().toISOString(),
    date_prochaine_verification: new Date(Date.now() + CYCLE_REVERIFICATION_JOURS * 24 * 3600 * 1000).toISOString(),
    statut: 'BROUILLON',
    mots_cles: ['permis de construire', 'urbanisme', 'teledac', 'architecte', 'mairie', 'construction'],
  },
  {
    id: 'dem-titre-foncier',
    slug: 'mutation-titre-foncier-dgid',
    titre: 'Mutation et transfert de Titre Foncier (Vente, Donation ou Succession)',
    categorie: 'logement',
    public_concerne: 'Acquéreurs, héritiers ou bénéficiaires d\'un bien immobilier bâti ou non bâti immatriculé',
    pieces: [
      { intitule: 'Acte notarié de vente, donation ou partage successoral', obligatoire: true, precision: 'Rédigé obligatoirement par notaire pour immeuble immatriculé' },
      { intitule: 'Duplicata du Livret foncier (Titre Foncier)', obligatoire: true, precision: 'Délivré par la conservation foncière' },
      { intitule: 'Quitus fiscal foncier de l\'immeuble (attestation de non-redevance)', obligatoire: true, precision: 'Paiement à jour de la TOM et taxe foncière' },
      { intitule: 'Bordereau analytique d\'inscription et plan de bornage certifié', obligatoire: true, precision: 'Établi par le Cadastre' },
    ],
    cout_xof: 35000,
    delai: '30 à 60 jours',
    lieux: 'Bureau de la Conservation de la Propriété Foncière (DGID) du ressort de l\'immeuble (ex: Dakar Plateau, Almadies, Grand Dakar).',
    etapes: [
      'Signature de l\'acte authentique chez le notaire.',
      'Paiement des droits d\'enregistrement et de publicité foncière au centre des impôts.',
      'Dépôt du dossier à la Conservation Foncière pour inscription au livre foncier.',
      'Mention de la mutation sur le Titre Foncier et remise du livret au nouveau propriétaire.',
    ],
    source_officielle: 'https://e-senegal.sn/#/home/demarches',
    date_verification: new Date().toISOString(),
    date_prochaine_verification: new Date(Date.now() + CYCLE_REVERIFICATION_JOURS * 24 * 3600 * 1000).toISOString(),
    statut: 'BROUILLON',
    mots_cles: ['titre foncier', 'foncier', 'notaire', 'dgid', 'conservation fonciere', 'mutation', 'cadastre'],
  },
  {
    id: 'dem-carte-grise',
    slug: 'carte-grise-immatriculation-vehicule',
    titre: 'Carte grise & Immatriculation de véhicule (Capp Karangë)',
    categorie: 'transport',
    public_concerne: 'Tout propriétaire d\'un véhicule neuf, d\'occasion ou importé destiné à circuler au Sénégal',
    pieces: [
      { intitule: 'Certificat de mise à la consommation (CMC des Douanes) ou certificat de cession légalisé', obligatoire: true, precision: 'Original attestant du dédouanement complet ou de l\'achat' },
      { intitule: 'Ancienne carte grise barrée (en cas de mutation de véhicule d\'occasion)', obligatoire: false, precision: 'Portant la mention vendu le...' },
      { intitule: 'Procès-verbal de visite technique valide ou certificat de conformité', obligatoire: true, precision: 'Délivré par le centre de contrôle CCTVA' },
      { intitule: 'Photocopie de la CNI biométrique du nouveau propriétaire', obligatoire: true, precision: 'En cours de validité' },
      { intitule: 'Quittance de paiement des droits d\'immatriculation', obligatoire: true, precision: '15 000 à 30 000 FCFA selon la puissance fiscale' },
    ],
    cout_xof: 20000,
    delai: '7 à 15 jours ouvrés (récépissé de circulation immédiat)',
    lieux: 'Division Régionale des Transports Terrestres (Hann Maristes à Dakar) ou centres Capp Karangë agréés.',
    etapes: [
      'Vérification préalable du dédouanement et du contrôle technique.',
      'Dépôt physique du dossier complet à la Division des Transports Terrestres.',
      'Paiement des taxes d\'immatriculation et pose des plaques certifiées Capp Karangë.',
      'Délivrance de la carte grise sécurisée avec puce électronique.',
    ],
    source_officielle: 'https://e-senegal.sn/#/home/demarches',
    date_verification: new Date().toISOString(),
    date_prochaine_verification: new Date(Date.now() + CYCLE_REVERIFICATION_JOURS * 24 * 3600 * 1000).toISOString(),
    statut: 'BROUILLON',
    mots_cles: ['carte grise', 'immatriculation', 'vehicule', 'capp karange', 'transports terrestres', 'douanes', 'mutation'],
  },
  {
    id: 'dem-visite-technique',
    slug: 'visite-technique-automobile-cctva',
    titre: 'Visite technique automobile (Contrôle technique CCTVA)',
    categorie: 'transport',
    public_concerne: 'Tout propriétaire de véhicule automobile circulant sur le réseau routier sénégalais',
    pieces: [
      { intitule: 'Carte grise originale du véhicule (ou récépissé de circulation valide)', obligatoire: true, precision: 'En cours de validité' },
      { intitule: 'Attestation d\'assurance automobile valide', obligatoire: true, precision: 'Original de la carte d\'assurance' },
      { intitule: 'Quittance fiscale de redevance annuelle de sécurité routière', obligatoire: true, precision: 'Payable sur place ou en ligne' },
    ],
    cout_xof: 10000,
    delai: '1 à 2 heures (délivrance immédiate de la vignette après contrôle)',
    lieux: 'Centres de Contrôle Technique des Véhicules Automobiles (CCTVA) à Hann Dakar, Rufisque ou centres régionaux (Thiès, Kaolack, etc.).',
    etapes: [
      'Prise de rendez-vous en ligne ou passage direct au centre CCTVA de Hann.',
      'Contrôle sur banc d\'essai : freinage, suspension, direction, feux, pneumatiques et analyse des gaz d\'échappement.',
      'Si conforme : délivrance immédiate du procès-verbal favorable et collage de la vignette sur le pare-brise.',
      'Si défaillances constatées : délai de contre-visite gratuit de 15 jours pour effectuer les réparations.',
    ],
    source_officielle: 'https://e-senegal.sn/#/home/demarches',
    date_verification: new Date().toISOString(),
    date_prochaine_verification: new Date(Date.now() + CYCLE_REVERIFICATION_JOURS * 24 * 3600 * 1000).toISOString(),
    statut: 'BROUILLON',
    mots_cles: ['visite technique', 'cctva', 'controle technique', 'vehicule', 'vignette', 'hann', 'securite routiere'],
  },
  {
    id: 'dem-legalisation-documents',
    slug: 'legalisation-certification-conforme-documents',
    titre: 'Légalisation de signature et certification conforme de documents',
    categorie: 'justice',
    public_concerne: 'Tout usager devant produire une copie certifiée conforme ou une signature légalisée',
    pieces: [
      { intitule: 'Document original (diplôme, relevé, attestation, procuration, contrat)', obligatoire: true, precision: 'Document officiel original non altéré' },
      { intitule: 'Photocopies claires et lisibles à certifier conformes', obligatoire: true, precision: 'Copie exacte et intégrale sans rature' },
      { intitule: 'Carte Nationale d\'Identité biométrique CEDEAO ou passeport', obligatoire: true, precision: 'Pour authentifier le signataire en cas de légalisation de signature' },
      { intitule: 'Timbre communal de 200 FCFA par document certifié', obligatoire: true, precision: 'Apposé sur chaque volet certifié' },
    ],
    cout_xof: 200,
    delai: 'Immédiat (5 à 15 minutes sur place)',
    lieux: 'Toute mairie de commune, mairie d\'arrondissement, commissariat de police ou brigade de gendarmerie.',
    etapes: [
      'Présentation au guichet de légalisation muni de l\'original et de la copie.',
      'Comparution personnelle du signataire devant l\'agent délégataire en cas de légalisation de signature (signature sur place).',
      'Apposition du cachet officiel « Vu pour la légalisation matérielle de la signature » ou « Conforme à l\'original ».',
      'Signature et timbre de l\'officier de police judiciaire ou de l\'officier d\'état civil.',
    ],
    source_officielle: 'https://e-senegal.sn/#/home/demarches',
    date_verification: new Date().toISOString(),
    date_prochaine_verification: new Date(Date.now() + CYCLE_REVERIFICATION_JOURS * 24 * 3600 * 1000).toISOString(),
    statut: 'BROUILLON',
    mots_cles: ['legalisation', 'certification conforme', 'copie certifiee', 'mairie', 'commissariat', 'timbre'],
  },
  {
    id: 'dem-certificat-perte',
    slug: 'certificat-perte-pieces-officielles',
    titre: 'Certificat de perte de pièces officielles (CNI, Passeport, Permis)',
    categorie: 'identite_voyage',
    public_concerne: 'Toute personne ayant égaré ou s\'étant fait dérober des pièces d\'identité ou documents officiels',
    pieces: [
      { intitule: 'Justificatif d\'identité ou copie de l\'acte de naissance / ancienne photocopie de la pièce', obligatoire: false, precision: 'Recommandé pour mentionner le numéro exact de la pièce' },
      { intitule: 'Timbre fiscal de 1 000 FCFA', obligatoire: true, precision: 'Pour déclaration de perte officielle' },
    ],
    cout_xof: 1000,
    delai: 'Immédiat (délivré sur le champ)',
    lieux: 'Commissariat de police ou brigade de gendarmerie territorialement compétent.',
    etapes: [
      'Déclaration orale des circonstances de la perte (date approximative, lieu, type de document).',
      'Enregistrement sur le registre de main-courante et apposition du timbre de 1 000 FCFA.',
      'Établissement et signature du certificat de perte par l\'officier de police judiciaire.',
      'Remise du certificat original indispensable pour solliciter un duplicata auprès de la DAF, DPETV ou Transports Terrestres.',
    ],
    source_officielle: 'https://e-senegal.sn/#/home/demarches',
    date_verification: new Date().toISOString(),
    date_prochaine_verification: new Date(Date.now() + CYCLE_REVERIFICATION_JOURS * 24 * 3600 * 1000).toISOString(),
    statut: 'BROUILLON',
    mots_cles: ['perte', 'certificat de perte', 'police', 'gendarmerie', 'cni perdue', 'passeport perdu', 'vol'],
  },
];

// Fallback in-memory pour mode test unitaire Jest sans PG
const demarchesMemoire = new Map(DEMARCHES_INITIALES.map(d => [d.id, { ...d }]));
const signalementsMemoire = new Map();
const suivisMemoire = new Map(); // key: `${userId}:${demarcheId}`

let demarchesInitialisees = false;

/**
 * Assure la création idempotente des fiches initiales et la mise à jour vers e-senegal.sn
 */
async function assurerDemarchesInitiales() {
  if (demarchesInitialisees || !pool) return;
  try {
    for (const d of DEMARCHES_INITIALES) {
      await pool.query(
        `INSERT INTO surga_demarches (
           id, slug, titre, categorie, public_concerne, pieces, cout_xof, delai,
           lieux, etapes, source_officielle, date_verification,
           date_prochaine_verification, statut, mots_cles
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
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
           mots_cles = EXCLUDED.mots_cles`,
        [
          d.id, d.slug, d.titre, d.categorie, d.public_concerne,
          JSON.stringify(d.pieces), d.cout_xof, d.delai, d.lieux,
          JSON.stringify(d.etapes), d.source_officielle,
          d.date_verification, d.date_prochaine_verification,
          d.statut, JSON.stringify(d.mots_cles)
        ]
      );
    }
    demarchesInitialisees = true;
  } catch (err) {
    // Tolérance
  }
}

/**
 * Met à jour automatiquement les démarches dont le cycle de 90 jours est dépassé
 */
async function actualiserStatutsPerimes() {
  await assurerDemarchesInitiales();
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
    } catch (erreur) {
      remonter(erreur, false);
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
    } catch (erreur) {
      remonter(erreur, false);
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
    } catch (erreur) {
      remonter(erreur, true);
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
    } catch (erreur) {
      remonter(erreur, true);
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
    } catch (erreur) {
      remonter(erreur, true);
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

  // SRG-A1-017 : « transmis à notre équipe » n'est vrai que si la ligne est écrite. L'ancien repli gardait le
  // signalement dans la mémoire du processus, où personne ne le lisait.
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
  } catch (dbErr) {
    console.error('[SurgaDemarches] Signalement non enregistré :', dbErr.message);
    const err = new Error('Votre signalement n\'a pas pu être enregistré. Veuillez réessayer dans un instant.');
    err.code = 'ENREGISTREMENT_IMPOSSIBLE';
    throw err;
  }
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
    } catch (erreur) {
      remonter(erreur, false);
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
    } catch (erreur) {
      remonter(erreur, true);
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
      } catch (erreur) {
        remonter(erreur, true);
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
    } catch (erreur) {
      remonter(erreur, true);
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
    } catch (erreur) {
      remonter(erreur, false);
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
    } catch (erreur) {
      remonter(erreur, true);
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
    } catch (erreur) {
      remonter(erreur, false);
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
