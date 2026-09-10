// backend/services/prospection.js — Moteur d'automatisation et de collecte de leads (Nopalou)
const { pool } = require('../models/db');
const { sendWhatsAppText, sendWhatsAppNotification, sendWhatsAppProspectionDirecte, normalisePhone, estDesinscrit } = require('./whatsapp');

// ── Normalisation des numéros de téléphone pour le Sénégal ───────────────────
function normaliserTelephoneSenegal(rawPhone) {
  if (!rawPhone) return { valide: false, erreur: 'Numéro vide' };

  // Nettoyage Unicode (Zero-width spaces, espaces insécables, RTL markers)
  let brut = String(rawPhone)
    .replace(/[\u200B-\u200D\uFEFF\u00A0\u202F\u200E]/g, '')
    .trim();

  let num = brut.replace(/[^\d+]/g, '');

  if (num.startsWith('+221')) num = num.slice(4);
  else if (num.startsWith('00221')) num = num.slice(5);
  else if (num.startsWith('221') && num.length >= 11) num = num.slice(3);

  num = num.replace(/[^\d]/g, '');

  // Au Sénégal, les numéros mobiles/fixes font 9 chiffres
  // Mobiles : 70 (Expresso), 75 (Promobile), 76 (Free/Yas), 77 & 78 (Orange)
  // Fixes : 30, 33 (Sonatel / Expresso Fixe)
  if (num.length !== 9) {
    return {
      valide: false,
      brut,
      erreur: `Longueur invalide (${num.length} chiffres au lieu de 9)`
    };
  }

  const prefix = num.slice(0, 2);
  let operateur = 'Autre';
  if (prefix === '77' || prefix === '78') operateur = 'Orange';
  else if (prefix === '76') operateur = 'Free (Yas)';
  else if (prefix === '70') operateur = 'Expresso';
  else if (prefix === '75') operateur = 'Promobile';
  else if (prefix === '33' || prefix === '30') operateur = 'Fixe';

  const national = '221' + num;
  const e164 = '+221' + num;
  const formate = `${num.slice(0, 2)} ${num.slice(2, 5)} ${num.slice(5, 7)} ${num.slice(7, 9)}`;

  return {
    valide: true,
    local: num,
    national,
    e164,
    formate,
    operateur,
    brut,
  };
}

const FOOTER_OPTOUT = '\n\n_STOP pour vous désinscrire._';

// ── Templates de prospection sénégalaise haute performance ───────────────────
const TEMPLATES_PAR_DEFAUT = [
  {
    id: 'gestion_caisse_smartphone_nopalou',
    titre: '📱 Vente & Caisse Smartphone — 0% Commission & 30j offerts (Recommandé)',
    canal: 'whatsapp',
    categorie: 'general',
    texte: `Salam alaykoum ! 👋

📱 Vendez & encaissez par Wave / OM sans commission sur mobile.

🎁 30 jours offerts & factures (tapez Nopalou sur Google 🇸🇳)

Répondez OUI pour ouvrir votre boutique en 30 secondes !` + FOOTER_OPTOUT
  },
  {
    id: 'creation_whatsapp_30s',
    titre: '⚡ Création 100% WhatsApp en 30s — Zéro Ordinateur, Zéro Formulaire',
    canal: 'whatsapp',
    categorie: 'general',
    texte: `{salutation}

Saviez-vous que vous pouvez ouvrir votre boutique en ligne directement ici sur WhatsApp en moins de 30 secondes sans jamais toucher à un ordinateur ?

Avec Nopalou (https://nopalou.com) :
⚡ Vous donnez simplement votre nom, catégorie et ville par message
📸 Vous ajoutez vos articles en envoyant une simple photo et le prix (ex: « Robe Soie 15000 »)
🌊 Vos clients commandent en 1 clic et paient par Wave & Orange Money (0% de commission)
📊 Vous demandez votre bilan du jour par message : tapez « Bilan » et recevez vos ventes en direct !
🎁 1er mois 100% OFFERT sans engagement !

Répondez simplement « OUI » pour ouvrir votre boutique tout de suite !` + FOOTER_OPTOUT
  },
  {
    id: 'migration_shopify_excel',
    titre: '📦 Migration 1-Clic — Quittez Shopify / WooCommerce / Excel sans ressaisie',
    canal: 'whatsapp',
    categorie: 'general',
    texte: `{salutation}

Vous en avez marre des frais Shopify en dollars ($29/mois), des blocages de cartes bancaires et des commissions exorbitantes ?

Migrez sur Nopalou en 1 seul clic sans perdre vos données :
✅ Import automatique intelligent de votre catalogue Shopify, WooCommerce ou Excel
✅ Vos titres, prix, stocks et photos sont reconnus automatiquement
✅ Import de votre carnet de clients & dettes existantes
✅ Paiement direct Wave & Orange Money en FCFA à 0% de commission
🎁 30 jours 100% gratuits pour tester la puissance de la plateforme !

Testez l'import gratuit ici : https://nopalou.com/tarifs-boutique

Pouvons-nous importer votre fichier ensemble en 2 minutes ?` + FOOTER_OPTOUT
  },
  {
    id: 'mode_pret_a_porter',
    titre: '👗 Mode & Prêt-à-Porter — WhatsApp 1-Clic & 0% Commission',
    canal: 'whatsapp',
    categorie: 'mode',
    texte: `{salutation}

{J'ai vu vos magnifiques modèles|J'ai découvert vos collections|Je suis tombé sur vos superbes articles} {quartier}. Vous perdez sûrement beaucoup de temps à envoyer les photos, tailles et prix un par un à chaque client sur WhatsApp.

Avec Nopalou (https://nopalou.com), vous avez votre boutique prête en 30 secondes :
✅ Vos clients voient vos collections et commandent seuls en 1 clic
✅ Paiement direct Wave & Orange Money sur votre compte (0% de commission)
✅ Caisse enregistreuse POS & Carnet de dettes inclus
✅ Suivez votre CA du jour en tapant simplement « Bilan » sur WhatsApp
🎁 Le 1er mois est 100% OFFERT sans engagement !

Découvrez une boutique exemple ici : https://nopalou.com/guide-creer-boutique

Voulez-vous que je vous active votre lien test gratuit aujourd'hui ?` + FOOTER_OPTOUT
  },
  {
    id: 'tech_telephonie',
    titre: '📱 Téléphonie & High-Tech — Comparateur & Scanner Codes-barres',
    canal: 'whatsapp',
    categorie: 'tech',
    texte: `{salutation}

Dans la téléphonie & tech à Dakar, les prix changent vite et les clients comparent tout.

Avec Nopalou, votre boutique est référencée sur le comparateur N°1 au Sénégal :
✅ Visibilité directe auprès de milliers d'acheteurs à Dakar
✅ Caisse tactile avec scanner de codes-barres par caméra
✅ Importez tout votre catalogue existant (Excel / Shopify) en 1 seconde
✅ Devis & Factures OHADA proformas en PDF en 10 secondes
🎁 30 jours 100% gratuits pour booster vos ventes !

Lien d'inscription gratuite : https://nopalou.com/creer-boutique?plan=pro

Pouvons-nous configurer vos 3 premiers téléphones ensemble ?` + FOOTER_OPTOUT
  },
  {
    id: 'auto_vehicules',
    titre: '🚗 Véhicules & Concessionnaires — Vitrine Auto & Fiches WhatsApp',
    canal: 'whatsapp',
    categorie: 'auto-moto',
    texte: `{salutation}

Vous vendez des véhicules à Dakar ? Les clients demandent sans cesse le kilométrage, l'année, les photos et le prix net par message.

Avec Nopalou (https://nopalou.com), partagez votre parc auto en 1 seul lien pro :
✅ Fiches véhicules complètes (photos HD, transmission, carburant, prix)
✅ Prise de rendez-vous et contact direct sur votre WhatsApp
✅ Référencement sur le portail auto n°1 au Sénégal
🎁 1er mois 100% OFFERT sans aucun engagement !

Découvrez un exemple de vitrine : https://nopalou.com/annonces

Pouvons-nous ajouter votre 1er véhicule disponible aujourd'hui ?` + FOOTER_OPTOUT
  },
  {
    id: 'immo_agences',
    titre: '🏠 Immobilier & Agences — Fiches Biens & Visites WhatsApp',
    canal: 'whatsapp',
    categorie: 'immo',
    texte: `{salutation}

Gérer les demandes de location et de vente d'appartements à Dakar demande un temps fou sur WhatsApp.

Nopalou Immo (https://nopalou.com/immo) simplifie la diffusion de vos biens :
✅ Vos fiches appartements & terrains prêtes à partager en 1 clic
✅ Réception des demandes de visite qualifiées sur votre WhatsApp
✅ 0% de commission sur vos transactions
🎁 30 jours d'essai gratuit pour booster vos mandats !

Lien d'accès pro : https://nopalou.com/guide-creer-boutique

Avez-vous un bien disponible que nous pouvons mettre en avant cette semaine ?` + FOOTER_OPTOUT
  },
  {
    id: 'commerce_general',
    titre: '🛒 Commerce Général & Supérette — Caisse POS & Commandes WhatsApp',
    canal: 'whatsapp',
    categorie: 'general',
    texte: `{salutation}

{J'ai découvert votre activité commerciale|Je suis tombé sur vos offres} {quartier}. Fini la perte de temps à calculer les totaux et gérer les crédits à la main.

Nopalou équipe votre commerce d'une solution tout-en-un simple et rapide :
✅ Caisse enregistreuse tactile sur téléphone (gestion de stock & ventes)
✅ Carnet de dettes client avec rappels WhatsApp en 1 clic
✅ Bilan du jour et alertes de rupture de stock envoyés par WhatsApp
✅ Paiements Wave & Orange Money directs sans intermédiaire
🎁 1 mois d'essai offert pour équiper votre magasin !

Testez sans engagement : https://nopalou.com/tarifs-boutique

Souhaitez-vous faire un essai rapide de 5 minutes ?` + FOOTER_OPTOUT
  },
  {
    id: 'carnet_dettes',
    titre: '📒 Carnet de Dettes ("Bor") — Relances Polies WhatsApp Automatiques',
    canal: 'whatsapp',
    categorie: 'general',
    texte: `{salutation}

Combien d'argent dort dehors dans des dettes clients oubliées sur des cahiers papier ?

Nopalou intègre le Carnet de Dettes intelligent pour commerçants :
📒 Vous notez les crédits clients en 5 secondes sur votre téléphone
📥 Importez vos clients et soldes existants d'un coup depuis un fichier Excel
🔔 Vous envoyez des rappels polis sur WhatsApp en 1 seul clic avec lien Wave
📊 Vous suivez vos encaissements Wave et vos marges nettes
🎁 1er mois 100% offert sans carte bancaire !

Testez gratuitement dès maintenant : https://nopalou.com/tarifs-boutique` + FOOTER_OPTOUT
  },
  {
    id: 'sourcing_alibaba',
    titre: '📦 Arrivages Chine & Grossistes — Vente Flash sur WhatsApp',
    canal: 'whatsapp',
    categorie: 'grossiste',
    texte: `{salutation}

Vous vendez des arrivages de Chine (Alibaba, AliExpress, Shein, 1688) ou Turquie ?

Fini le désordre des photos perdues dans vos statuts :
✨ Publiez votre arrivage en 2 minutes ou envoyez directement les photos au bot WhatsApp
🌊 Recevez l'argent par Wave dès la réservation
⚡ Vos clients commandent directement sur votre WhatsApp
🎁 30 jours offerts pour écouler votre prochain arrivage !

Lien direct : https://nopalou.com/creer-boutique` + FOOTER_OPTOUT
  },
  {
    id: 'email_b2b_enseigne',
    titre: '✉️ E-mail B2B — Alternative Locale à Shopify pour {nom_boutique}',
    canal: 'email',
    categorie: 'general',
    sujet: `Solution de Caisse POS & Commandes WhatsApp pour {nom_boutique}`,
    texte: `Bonjour [Madame/Monsieur le Responsable],

Je me permets de vous contacter car je suis de près le développement de {nom_boutique} {quartier}.

Contrairement aux plateformes étrangères comme Shopify qui exigent une carte bancaire en devises ($29/mois) et ne gèrent pas nativement le paiement Wave, Nopalou est la solution e-commerce et caisse magasin conçue pour le Sénégal :

• Vitrine web connectée directement à votre WhatsApp (créable en 30 secondes)
• Moteur d'import intelligent de votre catalogue existant sans ressaisie
• Caisse tactile POS magasin (fonctionne même sans connexion Internet)
• Carnet de dettes client avec rappels WhatsApp en 1 clic
• Encaissement direct Wave & Orange Money (0% de commission)
• Facturation normalisée OHADA avec NINEA et RCCM
• Suivi des stocks et clôtures de caisse (Rapports Z & Bilan WhatsApp)

Nous vous offrons 30 jours d'essai gratuit pour équiper vos magasins :
👉 https://nopalou.com/tarifs-boutique

Seriez-vous disponible pour un échange rapide de 5 minutes cette semaine ?

Bien cordialement,
L'équipe Déploiement Nopalou Sénégal
contact@nopalou.com
WhatsApp : +221 70 871 79 42` + '\n\nPour vous désinscrire de nos communications, répondez STOP à cet email.'
  }
];

// ── Dictionnaire des Quartiers et Marchés de Dakar & Régions ───────────────
const DICTIONNAIRE_QUARTIERS = [
  'Sandaga', 'HLM', 'Colobane', 'Petersen', 'Centenaire', 'Maristes', 'Plateau',
  'Almadies', 'Ngor', 'Ouakam', 'Pikine', 'Guédiawaye', 'Guediawaye', 'Keur Massar',
  'Parcelles Assainies', 'Parcelles', 'PA', 'Tilène', 'Tilene', 'Yoff', 'Fann', 'Mermoz',
  'Grand Yoff', 'Grandyoff', 'Grand Dakar', 'Médina', 'Medina', 'Fass', 'Fann Hock',
  'Point E', 'Sacré-Cœur', 'Sacre Coeur', 'Liberté 6', 'Liberte 6', 'Liberté 1', 'Liberté 2', 'Liberté 3', 'Liberté 4', 'Liberté 5', 'Mamelles',
  'Hann Maristes', 'Hann', 'Bel Air', 'Gibraltar', 'Castors', 'Dieuppeul', 'Derklé',
  'Derkle', 'Bène Tally', 'Bene Tally', 'Geultape', 'Gueule Tapée', 'Lambay', 'Sea Plaza',
  'Nord Foire', 'Ouest Foire', 'Sud Foire', 'Foire', 'Zone de Captage', 'Keur Gorgui', 'Sipres',
  'Hamo', 'Hamo 4', 'Hamo 5', 'Hamo 6', 'Cambérène', 'Camberene', 'Malika', 'Yeumbeul', 'Thiaroye',
  'Thiès', 'Thies', 'Touba', 'Mbour', 'Saint-Louis', 'Ziguinchor', 'Diourbel', 'Kaolack',
  'Rufisque', 'Bargny', 'Diamniadio', 'Saly', 'Somone', 'Fatick', 'Kolda', 'Tambacounda', 'Louga', 'Richard-Toll', 'Matam'
];

// Quartiers triés par longueur décroissante pour prioriser les noms composés (ex: Grand Yoff avant Yoff, Nord Foire avant Foire)
const QUARTIERS_SORTED = [...DICTIONNAIRE_QUARTIERS].sort((a, b) => b.length - a.length);

function detecterQuartier(texte) {
  if (!texte || typeof texte !== 'string') return null;

  for (const q of QUARTIERS_SORTED) {
    const reg = new RegExp(`\\b${q.replace(/[-]/g, '[- ]')}\\b`, 'i');
    if (reg.test(texte)) {
      const qLow = q.toLowerCase();
      if (qLow === 'pa' || qLow === 'parcelles' || qLow === 'parcelles assainies') return 'Parcelles Assainies';
      if (qLow === 'nord foire') return 'Nord Foire';
      if (qLow === 'ouest foire') return 'Ouest Foire';
      if (qLow === 'sud foire') return 'Sud Foire';
      if (qLow === 'zone de captage') return 'Zone de Captage';
      if (qLow === 'keur gorgui') return 'Keur Gorgui';
      if (qLow === 'guediawaye') return 'Guédiawaye';
      if (qLow === 'thies') return 'Thiès';
      if (qLow === 'medina') return 'Médina';
      if (qLow === 'tilene') return 'Tilène';
      if (qLow === 'grandyoff' || qLow === 'grand yoff') return 'Grand Yoff';
      if (qLow === 'grand dakar') return 'Grand Dakar';
      if (qLow === 'sacre coeur' || qLow === 'sacré-cœur') return 'Sacré-Cœur';
      if (qLow.startsWith('liberte')) return q.replace(/liberte/i, 'Liberté');
      if (qLow === 'hann maristes' || qLow === 'maristes') return 'Maristes';
      if (qLow === 'camberene') return 'Cambérène';
      return q;
    }
  }
  return null;
}

// ── Convertisseur TitleCase intelligent ──────────────────────────────────────
function toTitleCase(str) {
  if (!str || typeof str !== 'string') return '';
  const ACRONYMES = new Set(['POS', 'GSM', 'VIP', 'BTP', 'TV', 'PC', 'SAV', 'SARL', 'SUARL', 'OHADA', 'USA', 'HLM', 'PA']);
  const MOTS_MINUSCULES = new Set(['de', 'du', 'des', 'le', 'la', 'les', 'et', 'à', 'en', 'au', 'aux', 'd\'', 'l\'']);

  return str
    .toLowerCase()
    .split(/\s+/)
    .map((mot, idx) => {
      const upper = mot.toUpperCase();
      if (ACRONYMES.has(upper)) return upper;
      if (idx > 0 && MOTS_MINUSCULES.has(mot)) return mot;
      return mot.charAt(0).toUpperCase() + mot.slice(1);
    })
    .join(' ');
}

function genererNomBoutiqueParDefaut(categorie, quartier) {
  const qStr = (quartier && quartier !== 'Dakar' && quartier !== 'Tout Dakar & Régions') ? ` ${quartier}` : '';
  switch (String(categorie || '').toLowerCase()) {
    case 'mode':
      return `Boutique Mode${qStr}`;
    case 'tech':
    case 'telephonie':
    case 'smartphones':
      return `Boutique Téléphonie & Tech${qStr}`;
    case 'informatique':
      return `Boutique Informatique${qStr}`;
    case 'tv-electro':
      return `Boutique Électroménager${qStr}`;
    case 'beaute':
    case 'cosmetique':
      return `Boutique Beauté & Cosmétique${qStr}`;
    case 'maison':
      return `Maison & Ameublement${qStr}`;
    case 'auto-moto':
      return `Vendeur Véhicules${qStr}`;
    case 'immo':
      return `Agence Immobilière${qStr}`;
    case 'grossiste':
      return `Grossiste Arrivages${qStr}`;
    case 'superette':
    case 'alimentation':
      return `Alimentation & Supérette${qStr}`;
    default:
      return `Commerce & Boutique${qStr}`;
  }
}

// ── Détecteur automatique de catégorie métier (Auto, Immo, Tech, Mode, Beauté)
function detecterCategorieAutoEtImmo(texte) {
  if (!texte || typeof texte !== 'string') return null;
  const t = texte.toLowerCase();

  // 1. Véhicules / Auto-Moto
  if (
    /\b(hyundai|tucson|santa fe|peugeot|mercedes|toyota|corolla|rav4|prado|kia|sportage|picanto|ford|focus|ranger|nissan|qashqai|juke|range rover|evoque|citroen|renault|clio|duster|bmw|audi|volkswagen|golf|passat|voiture|véhicule|vehicule|concessionnaire|parc auto|auto dakar|moto|scooter|tmax|yamaha|honda|berline|suv|4x4|pickup|automatique|manuelle|essence|diesel|climatisation d'origine)\b/i.test(t)
  ) {
    return 'auto-moto';
  }

  // 2. Immobilier
  if (
    /\b(appartement|studio|villa|terrain|parcelle|immeuble|chambre|meublé|meuble|a louer|à louer|en location|en vente|vente terrain|bailleur|courtier|f4|f3|f2|f5|titre foncier|bail)\b/i.test(t) &&
    /\b(louer|location|vente|appartement|villa|terrain|chambre|studio|immeuble|bailleur)\b/i.test(t)
  ) {
    return 'immo';
  }

  // 3. Téléphonie & High-Tech
  if (
    /\b(iphone|samsung|galaxy|redmi|xiaomi|tecno|infinix|huawei|oppo|macbook|laptop|ordinateur|pc portable|dell|hp|lenovo|asus|ps5|ps4|playstation|xbox|smart tv|télévision|airpods|montre connectée|smartwatch|lite 5g|pro max|ultra)\b/i.test(t)
  ) {
    return 'tech';
  }

  // 4. Parfumerie & Cosmétique
  if (
    /\b(parfum|parfumerie|fragrance|eau de parfum|thiouraye|gongo|musk|musc|brume|victoria secret|bakhour|soin de visage|gamme éclaircissante|crème|savon kójic|lotion|fond de teint)\b/i.test(t)
  ) {
    return 'beaute';
  }

  // 5. Mode & Vêtements
  if (
    /\b(robe|robes|abaya|bazin|getzner|wax|boubou|couture|tailleur|costume|chemise|pantalon|chaussure|talons|escarpins|sneakers|sac à main|perruque|mèche|tissage|dentelle|voile|bijoux)\b/i.test(t)
  ) {
    return 'mode';
  }

  // 6. Électroménager & Maison
  if (
    /\b(frigo|réfrigérateur|refrigerateur|congélateur|congelateur|machine à laver|gazinière|four|micro-onde|climatiseur|split|salon|canapé|canape|table à manger|matelas|lit)\b/i.test(t)
  ) {
    return 'maison';
  }

  return null;
}

function nettoyerNomBoutique(rawNom, categorie = 'mode', quartier = '') {
  if (!rawNom || typeof rawNom !== 'string') {
    return genererNomBoutiqueParDefaut(categorie, quartier);
  }

  let clean = rawNom.trim();

  // Nettoyer les fuites CSV / guillemets
  if (clean.includes('"') || clean.includes('""')) {
    clean = clean.split('"')[0].trim();
  }

  // Enlever les URLs, emails et numéros de téléphone résiduels
  clean = clean
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/wa\.me\/\S+/gi, '')
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '')
    .replace(/(?:\+?221\s?)?(?:7[05678]|3[03])[\s.-]?[0-9]{3}[\s.-]?[0-9]{2}[\s.-]?[0-9]{2}/g, '')
    .replace(/\b\d{6,}\b/g, '')
    .trim();

  // Supprimer les mentions de prix (ex: 15000 FCFA, 5000 f, 25.000 cfa)
  clean = clean.replace(/\b\d+[\s.]*(?:fcfa|cfa|frs|fr|f)\b/gi, '').trim();

  // Supprimer les résidus de téléphones multiples et slashs (ex: 70 473 90 54/ 78 650 7272)
  if (/^(?:\+?221\s?)?(?:7[05678]|3[03])[\s./\d-]{6,}/.test(clean) || /^\d{2,}[\s./-]+\d{2,}/.test(clean)) {
    return genererNomBoutiqueParDefaut(categorie, quartier);
  }

  // Enlever les préfixes de petites annonces et pollution
  clean = clean.replace(/^(?:vendeur\s+|annonce\s+|boutique\s+de\s+|contact\s*:?\s*|urgence\s*:?\s*|disponible\s*:?\s*|promo\s*:?\s*|arrivage\s*:?\s*|vente\s+de\s+|vente\s+d'|vente\s+|de\s+livraison\s+)/i, '').trim();

  // Enlever les emojis et caractères spéciaux de mise en avant
  clean = clean.replace(/[✨🔥⚡⭐️🌟💎🛒📦👗📱🎁🎉✅👉📍🔹🔸•*~_#|\/\\()\[\]{}]/g, ' ').replace(/\s+/g, ' ').trim();

  // Détection de marques ou magasins authentiques connus dans le texte
  const matchBoutique = clean.match(/(?:chez|boutique|store|shop|bar à parfum|atelier|couture|services?|maison|groupe|agence)\s+([A-Za-z0-9À-ÿ\s&'-]{3,30})/i);
  if (matchBoutique && matchBoutique[1]) {
    const nomExtrait = matchBoutique[1].trim();
    if (!/^\d+/.test(nomExtrait) && nomExtrait.length > 2 && nomExtrait.length < 35 && !/livraison/i.test(nomExtrait)) {
      return toTitleCase(nomExtrait);
    }
  }

  // Si le nom est un titre d'annonce descriptive ou trop long
  const estTitreAnnonce = (
    clean.length > 35 ||
    /^(prix|disponible|disponibi|à vendre|a vendre|cherche|contact|suivre|recrutement|appartement|peugeot|mercedes|hyundai|kia|daewoo|service de livraison|livraison|10 h|terrains|chambre|bana bana|tout nickel|débardeur|dentelle|tablette|télévision|lg|machine|cover|summer scents|parfum dakar|faites vos|new arrival|n'hésitez|ouvert|ferme|wax|terrain|robe|costume|sac|chaussure|montre|perruque|mèche)/i.test(clean) ||
    clean.includes('·') ||
    clean.length < 3
  );

  if (estTitreAnnonce) {
    const matchNomCourt = clean.match(/^([A-Za-zÀ-ÿ]{3,20}\s+(?:Store|Shop|Boutique|Services?|Business|Couture|Tech|Auto|Immo|Design|Chic|Look|Mode))/i);
    if (matchNomCourt) {
      return toTitleCase(matchNomCourt[1].trim());
    }
    return genererNomBoutiqueParDefaut(categorie, quartier);
  }

  return toTitleCase(clean);
}

function nettoyerContactNom(rawNom) {
  if (!rawNom || typeof rawNom !== 'string') return null;
  const clean = rawNom.trim().toLowerCase();
  
  if (
    clean === 'responsable' ||
    clean === 'anonyme' ||
    clean === 'participant(e) anonyme' ||
    clean.length < 2 ||
    rawNom.includes('"')
  ) {
    return null;
  }

  // Filtrer les noms de catégories génériques qui se retrouvent souvent dans les noms de contacts WhatsApp/Groupes
  if (
    /^(mode|véhicules?|vehicules?|commerce\s*général|commerce\s*\&\s*boutique|commerce|informatique|téléphonie|tech|électroménager|beauté|cosmétique|immo|immobilière|agence|boutique|grossiste|alimentation|livraison|de\s*livraison|préféré|iphone|dakar|sénégal|senegal)$/i.test(clean) ||
    clean.includes('commerce') ||
    clean.includes('boutique') ||
    clean.includes('véhicule') ||
    clean.includes('vehicule') ||
    clean.includes('téléphone') ||
    clean.includes('livraison') ||
    clean.includes('anonyme') ||
    clean.includes('5g') ||
    clean.includes('iphone')
  ) {
    return null;
  }

  return toTitleCase(rawNom.trim());
}


function estLeadEmploiOuInvalide(lead) {
  const cat = String(lead.categorie || '').toLowerCase();
  if (cat === 'emploi' || cat === 'recrutement' || cat === 'stage') return true;

  const texte = `${lead.nom_boutique || ''} ${lead.notes || ''} ${lead.contact_nom || ''}`.toLowerCase();
  
  // Regex complète couvrant les offres, demandes d'emploi, services domestiques et annonces de perte
  const regexEmploi = /\b(cherche\s+(?:un\s+)?(?:travail|emploi|boulot|stage|job|place|poste)|demande\s+d['’]emploi|recherche\s+(?:d['’])?(?:emploi|stage|travail)|chercheuse\s+d['’]emploi|recrutement|recrute|embauche|agents?\s+de\s+s[eé]c(?:urit[eé])?|chauffeur\s+cherche|cherche\s+(?:vendeuse|chauffeur|nounou|cuisinier|serveur|femme\s+de\s+m[eé]nage|vigile|gouvernante)|call\s+center|t[eé]l[eé]conseiller|avis\s+de\s+recherche|perte\s+de\s+pi[eè]ce|perdu\s+cl[eé]|donne\s+contre\s+bon\s+soin)\b/i;

  return regexEmploi.test(texte);
}

// ── Calcul du Score de Qualité de Donnée (/100) ──────────────────────────────
function calculerLeadQualityScore(lead) {
  if (estLeadEmploiOuInvalide(lead)) return { score: 0, details: ['Lead hors-cible ou emploi'] };
  let score = 0;
  const details = [];

  const telNorm = normaliserTelephoneSenegal(lead.telephone || lead.telephone_brut);
  if (telNorm.valide && telNorm.operateur !== 'Fixe') {
    score += 25;
    details.push('+25 Numéro mobile valide');
    if (telNorm.operateur === 'Orange' || telNorm.operateur === 'Free (Yas)') {
      score += 10;
      details.push(`+10 Opérateur digital prioritaire (${telNorm.operateur})`);
    }
  }

  if (estNomPropreAuthentique(lead.nom_boutique)) {
    score += 25;
    details.push('+25 Enseigne commerciale authentique');
  } else if (lead.nom_boutique && !['mode', 'véhicules', 'immobilière', 'commerce général', 'commerce & boutique', 'emploi'].includes(lead.nom_boutique.toLowerCase())) {
    score += 10;
    details.push('+10 Nom semi-spécifique');
  }

  if (lead.ville && ['dakar', 'thiès', 'mbour', 'touba', 'saint-louis', 'ziguinchor', 'kaolack'].includes(lead.ville.toLowerCase())) {
    score += 15;
    details.push(`+15 Ville commerciale active (${lead.ville})`);
  }
  if (lead.quartier && lead.quartier !== 'Dakar' && lead.quartier !== 'Tout Dakar & Régions') {
    score += 10;
    details.push(`+10 Quartier identifié (${lead.quartier})`);
  }

  if (lead.contact_nom && estNomPropreAuthentique(lead.contact_nom)) {
    score += 15;
    details.push('+15 Nom de contact nominatif');
  }

  return {
    score: Math.min(100, Math.max(0, score)),
    details,
  };
}

// ── Calcul du Score d'Affinité Commerciale Nopalou Fit Score (/100) ──────────
function calculerNopalouFitScore(lead) {
  if (estLeadEmploiOuInvalide(lead)) return { score: 0, details: ['Hors-cible Nopalou'] };
  let fit = 0;
  const details = [];
  const cat = String(lead.categorie || '').toLowerCase();

  // 1. Potentiel selon la catégorie cible (+40)
  if (['mode', 'smartphones', 'tech', 'beaute', 'cosmetique', 'superette', 'alimentation'].includes(cat)) {
    fit += 40;
    details.push('+40 Coeur de cible catalogue WhatsApp & encaissements');
  } else if (['maison', 'tv-electro', 'grossiste', 'quincaillerie'].includes(cat)) {
    fit += 30;
    details.push('+30 Caisse POS & gestion d\'inventaire');
  } else if (['auto-moto', 'immo'].includes(cat)) {
    fit += 15;
    details.push('+15 Vitrine sans commande en ligne');
  } else {
    fit += 10;
    details.push('+10 Commerce général');
  }

  // 2. Commerce établi avec enseigne identifiable (+30)
  if (estNomPropreAuthentique(lead.nom_boutique)) {
    fit += 30;
    details.push('+30 Boutique établie avec enseigne');
  }

  // 3. Mobile WhatsApp réactif (Orange/Free) (+20)
  const telNorm = normaliserTelephoneSenegal(lead.telephone || lead.telephone_brut);
  if (telNorm.valide && (telNorm.operateur === 'Orange' || telNorm.operateur === 'Free (Yas)')) {
    fit += 20;
    details.push('+20 Couverture Wave & WhatsApp max');
  }

  // 4. Bonus marché physique dakarois stratégique (+10)
  const q = String(lead.quartier || '').toLowerCase();
  if (['sandaga', 'hlm', 'colobane', 'maristes', 'plateau', 'tilène', 'centenaire'].some(m => q.includes(m))) {
    fit += 10;
    details.push(`+10 Hub commercial stratégique (${lead.quartier})`);
  }

  return {
    score: Math.min(100, Math.max(0, fit)),
    details,
  };
}

// ── Calcul du Score d'Engagement Passé (/100) ─────────────────────────────────
function calculerEngagementScore(lead, historiqueEvents = []) {
  if (lead.statut === 'converti') return { score: 100, details: ['Boutique active créée'] };
  if (lead.statut === 'desinscrit') return { score: 0, details: ['Désinscrit / Opt-Out'] };

  let eng = 20; // Base neutre pour lead jamais sollicité
  const details = [];

  const nbContacts = lead.nb_contacts || 0;
  if (nbContacts === 0) {
    details.push('+20 Prospect réceptif non encore sollicité');
  } else {
    // Si déjà contacté
    if (lead.statut === 'en_discussion') {
      eng += 50;
      details.push('+50 Échange actif en cours sur WhatsApp');
    }
    if (lead.derniere_reponse_at) {
      eng += 30;
      details.push('+30 A déjà répondu positivement dans le passé');
    }
    // Si contacté plusieurs fois sans réponse
    if (nbContacts >= 2 && !lead.derniere_reponse_at) {
      eng -= 25;
      details.push(`-25 Sans réponse après ${nbContacts} sollicitations`);
    } else if (nbContacts === 1 && !lead.derniere_reponse_at) {
      eng -= 10;
      details.push('-10 Premier message resté sans réponse');
    }
  }

  return {
    score: Math.min(100, Math.max(0, eng)),
    details,
  };
}

// ── Calcul du Score de Probabilité de Conversion (/100) ──────────────────────
function calculerConversionScore(lead, segmentStats = {}) {
  if (lead.statut === 'converti') return { score: 100, details: ['Déjà converti en client Nopalou'] };
  if (lead.statut === 'invalide' || lead.statut === 'desinscrit') return { score: 0, details: ['Inéligible à la conversion'] };

  let conv = 15;
  const details = [];
  const cat = String(lead.categorie || '').toLowerCase();

  // Les catégories qui convertissent le mieux empiriquement
  if (['mode', 'beaute', 'maison', 'alimentation', 'superette', 'smartphones'].includes(cat)) {
    conv += 35;
    details.push('+35 Secteur à fort taux de création de boutique');
  } else if (['tech', 'tv-electro', 'quincaillerie'].includes(cat)) {
    conv += 25;
    details.push('+25 Secteur caisse & gestion de stock');
  }

  if (estNomPropreAuthentique(lead.nom_boutique)) {
    conv += 20;
    details.push('+20 Marque ou enseigne commerciale réelle');
  }

  const q = String(lead.quartier || '').toLowerCase();
  if (['sandaga', 'hlm', 'maristes', 'plateau', 'colobane'].some(m => q.includes(m))) {
    conv += 15;
    details.push('+15 Forte densité commerciale locale');
  }

  return {
    score: Math.min(100, Math.max(0, conv)),
    details,
  };
}

// ── Calcul du Score de Joignabilité / Contactability (/100) ─────────────────
function calculerContactabilityScore(lead) {
  if (lead.statut === 'desinscrit') return { score: 0, details: ['Numéro sur liste noire / Opt-out'] };
  let contact = 50;
  const details = [];

  const telNorm = normaliserTelephoneSenegal(lead.telephone || lead.telephone_brut);
  if (!telNorm.valide) {
    return { score: 0, details: ['Numéro de téléphone invalide'] };
  }

  contact += 30;
  details.push('+30 Format E.164 sénégalais vérifié');

  if (telNorm.operateur === 'Orange') {
    contact += 20;
    details.push('+20 Orange SN (99.8% joignabilité WhatsApp)');
  } else if (telNorm.operateur === 'Free (Yas)') {
    contact += 15;
    details.push('+15 Free Sénégal (Très bonne délivrabilité)');
  } else if (telNorm.operateur === 'Expresso') {
    contact += 10;
    details.push('+10 Expresso');
  }

  return {
    score: Math.min(100, Math.max(0, contact)),
    details,
  };
}

// ── Calcul du Score de Priorité & Next Best Action Global ────────────────────
function evaluerLeadComplet(lead, historiqueEvents = []) {
  const qRes = calculerLeadQualityScore(lead);
  const fRes = calculerNopalouFitScore(lead);
  const eRes = calculerEngagementScore(lead, historiqueEvents);
  const cRes = calculerConversionScore(lead);
  const ctRes = calculerContactabilityScore(lead);

  const quality = qRes.score;
  const fit = fRes.score;
  const engagement = eRes.score;
  const conversion = cRes.score;
  const contactability = ctRes.score;

  // Calcul pondéré
  let priority = Math.round(
    (0.25 * quality) +
    (0.30 * fit) +
    (0.15 * engagement) +
    (0.20 * conversion) +
    (0.10 * contactability)
  );

  // Pénalités de sur-sollicitation temporelle
  const detailsScoring = [
    ...qRes.details,
    ...fRes.details,
    ...eRes.details,
    ...cRes.details,
    ...ctRes.details,
  ];

  let nextAction = 'contacter';

  if (lead.statut === 'converti') {
    priority = 0;
    nextAction = 'client_fideliser';
    detailsScoring.push('Sorti de prospection (Boutique déjà créée)');
  } else if (lead.statut === 'desinscrit') {
    priority = 0;
    nextAction = 'ne_plus_contacter';
    detailsScoring.push('Bloqué : Opt-out formulé');
  } else if (lead.statut === 'invalide') {
    priority = 0;
    nextAction = 'exclure_hors_cible';
    detailsScoring.push('Profil non commercial (Offre/Demande d\'emploi ou particulier)');
  } else if (lead.statut === 'en_discussion') {
    priority = 95;
    nextAction = 'relance_commerciale_personnalisee';
    detailsScoring.push('🔥 En discussion active — Priorité absolue suivi manuel');
  } else if (lead.nb_contacts >= 3 && !lead.derniere_reponse_at) {
    priority = Math.min(25, priority);
    nextAction = 'pause_sollicitation';
    detailsScoring.push('⚠️ 3 relances sans retour — Mise en veille');
  } else if (lead.dernier_contact_at) {
    const joursDepuis = Math.floor((Date.now() - new Date(lead.dernier_contact_at).getTime()) / (1000 * 3600 * 24));
    if (joursDepuis < 7) {
      priority = Math.max(10, priority - 30);
      nextAction = 'attendre_delai';
      detailsScoring.push(`-30 Sollicité il y a ${joursDepuis}j (Délai de courtoisie < 7j)`);
    } else if (joursDepuis >= 7 && joursDepuis <= 21 && (lead.nb_contacts === 1)) {
      priority = Math.min(90, priority + 15);
      nextAction = 'relance_variante_b';
      detailsScoring.push('+15 Fenêtre idéale pour 2ème relance avec proposition alternative');
    }
  } else if (lead.nb_contacts === 0 && fit >= 70 && quality >= 60) {
    priority = Math.min(100, priority + 10);
    nextAction = 'lancer_premiere_campagne';
    detailsScoring.push('+10 Nouveau prospect qualifié à fort potentiel');
  }

  return {
    score: quality,
    fit_score: fit,
    engagement_score: engagement,
    conversion_score: conversion,
    contactability_score: contactability,
    priority_score: Math.min(100, Math.max(0, priority)),
    next_best_action: nextAction,
    scoring_details: detailsScoring,
  };
}

function nettoyerEtEnrichirLead(lead) {
  const rawNom = lead.nom_boutique || '';
  const rawQuartier = lead.quartier || lead.ville || 'Dakar';
  let rawCat = lead.categorie || 'mode';

  // 1. Détection automatique et reclassement intelligent de la catégorie (Auto, Immo, Tech...)
  const catDetectee = detecterCategorieAutoEtImmo(`${rawNom} ${lead.notes || ''}`);
  if (catDetectee) {
    rawCat = catDetectee;
  }

  const estInvalide = estLeadEmploiOuInvalide(lead);
  
  // 2. Détection du quartier dans le nom, notes, quartier brut
  const qDetecte = detecterQuartier(`${rawNom} ${lead.notes || ''} ${rawQuartier}`);
  const quartierFinal = qDetecte || (rawQuartier !== 'Dakar' ? rawQuartier : 'Dakar');
  
  const nomPropre = nettoyerNomBoutique(rawNom, rawCat, quartierFinal);
  
  let contactNom = lead.contact_nom;
  if (!contactNom || contactNom.toLowerCase() === 'responsable' || contactNom.toLowerCase() === 'vendeur' || contactNom.length < 2 || contactNom.includes('"') || contactNom.length > 30) {
    contactNom = null;
  } else {
    contactNom = toTitleCase(contactNom);
  }

  const leadPourScore = {
    ...lead,
    nom_boutique: nomPropre,
    contact_nom: contactNom,
    quartier: quartierFinal,
    categorie: rawCat,
    telephone: lead.telephone,
    telephone_brut: lead.telephone_brut,
    ville: lead.ville,
    statut: estInvalide ? 'invalide' : lead.statut,
  };

  const evalLead = evaluerLeadComplet(leadPourScore);

  return {
    nom_boutique: nomPropre,
    contact_nom: contactNom,
    quartier: quartierFinal,
    categorie: rawCat,
    score: evalLead.score,
    fit_score: evalLead.fit_score,
    engagement_score: evalLead.engagement_score,
    conversion_score: evalLead.conversion_score,
    contactability_score: evalLead.contactability_score,
    priority_score: evalLead.priority_score,
    next_best_action: evalLead.next_best_action,
    scoring_details: JSON.stringify(evalLead.scoring_details),
    statut: estInvalide ? 'invalide' : (lead.statut === 'invalide' ? 'nouveau' : (lead.statut || 'nouveau')),
    notes: estInvalide ? (lead.notes ? `${lead.notes} | Hors-cible (Emploi/Recrutement)` : 'Hors-cible (Emploi/Recrutement)') : lead.notes,
  };
}

async function nettoyerTousLesLeadsBdd() {
  // 1. Garantir l'existence de toutes les tables et colonnes requises
  await ensureProspectionTables();

  // 2. Dédoublonnage préalable universel des numéros existants
  try {
    await pool.query(`
      DELETE FROM prospection_leads
      WHERE id IN (
        SELECT id FROM (
          SELECT id, ROW_NUMBER() OVER (PARTITION BY telephone ORDER BY id) as rnum
          FROM prospection_leads
          WHERE telephone IS NOT NULL AND telephone != ''
        ) t
        WHERE t.rnum > 1
      )
    `);
  } catch (errDedup) {
    console.warn('[PROSPECTION] Dédoublonnage table warning:', errDedup.message);
  }

  const { rows: leads } = await pool.query('SELECT * FROM prospection_leads');
  let nettoyes = 0;
  let invalidesEmploi = 0;
  let quartiersEnrichis = 0;
  let categoriesReclassees = 0;

  for (const lead of leads) {
    try {
      const enrichi = nettoyerEtEnrichirLead(lead);

      let changed = false;
      if (enrichi.nom_boutique !== lead.nom_boutique) changed = true;
      if (enrichi.contact_nom !== lead.contact_nom) changed = true;
      if (enrichi.categorie !== lead.categorie) {
        changed = true;
        categoriesReclassees++;
      }
      if (enrichi.quartier !== lead.quartier) {
        changed = true;
        if (lead.quartier === 'Dakar' && enrichi.quartier !== 'Dakar') {
          quartiersEnrichis++;
        }
      }
      if (enrichi.statut !== lead.statut) {
        changed = true;
        if (enrichi.statut === 'invalide') {
          invalidesEmploi++;
        }
      }
      if (
        enrichi.score !== lead.score ||
        enrichi.fit_score !== lead.fit_score ||
        enrichi.priority_score !== lead.priority_score ||
        enrichi.next_best_action !== lead.next_best_action
      ) {
        changed = true;
      }

      if (changed) {
        await pool.query(`
          UPDATE prospection_leads
          SET
            nom_boutique = $1,
            contact_nom = $2,
            quartier = $3,
            categorie = $4,
            score = $5,
            fit_score = $6,
            engagement_score = $7,
            conversion_score = $8,
            contactability_score = $9,
            priority_score = $10,
            next_best_action = $11,
            scoring_details = $12::jsonb,
            statut = $13,
            notes = $14,
            updated_at = NOW()
          WHERE id = $15
        `, [
          enrichi.nom_boutique,
          enrichi.contact_nom,
          enrichi.quartier,
          enrichi.categorie,
          enrichi.score,
          enrichi.fit_score,
          enrichi.engagement_score,
          enrichi.conversion_score,
          enrichi.contactability_score,
          enrichi.priority_score,
          enrichi.next_best_action,
          enrichi.scoring_details,
          enrichi.statut,
          enrichi.notes,
          lead.id
        ]);
        nettoyes++;
      }
    } catch (rowErr) {
      console.warn('[PROSPECTION] Lead row update warning:', rowErr.message);
    }
  }

  return {
    total: leads.length,
    nettoyes,
    invalidesEmploi,
    quartiersEnrichis,
    categoriesReclassees,
  };
}

// ── Support Spintax anti-spam ({Option 1|Option 2|Option 3}) ─────────────────
function traiterSpintax(texte) {
  if (!texte || typeof texte !== 'string') return '';
  let resultat = texte;
  let hasSpintax = true;
  let iterations = 0;

  // Traitement itératif pour supporter le Spintax imbriqué sans boucle infinie de RegExp
  while (hasSpintax && iterations < 10) {
    iterations++;
    hasSpintax = false;
    resultat = resultat.replace(/\{([^{}]+)\}/g, (match, choices) => {
      const lower = choices.toLowerCase().trim();
      if (
        lower === 'nom_boutique' || lower === 'prenom' || lower === 'quartier' ||
        lower === 'secteur' || lower === 'telephone' || lower === 'lien_demo' ||
        lower === 'lien_boutique' || lower === 'lien_tarifs'
      ) {
        return match;
      }
      if (!choices.includes('|')) return match;
      hasSpintax = true;
      const options = choices.split('|');
      const idx = Math.floor(Math.random() * options.length);
      return options[idx].trim();
    });
  }

  return resultat;
}

// ── Vérification si un nom est un nom propre / enseigne authentique ─────────
// ── Vérification si un nom est un nom propre / enseigne authentique ─────────
function estNomPropreAuthentique(nom) {
  if (!nom || typeof nom !== 'string') return false;
  let str = nom.trim();
  if (str.length < 2 || str.length > 35) return false;

  const low = str.toLowerCase();

  // Noms et placeholders génériques bannis des salutations
  const GENERIQUES = [
    'votre boutique', 'boutique', 'commerce & boutique', 'commerce', 'vendeur', 'vendeuse',
    'responsable', 'partenaire', 'cher commerçant', 'client', 'particulier', 'prospect',
    'mode', 'boutique mode', 'vendeur mode', 'véhicules', 'vehicules', 'vendeur véhicules',
    'agence immobilière', 'agence immobiliere', 'immo', 'immobilier', 'téléphonie & tech',
    'telephonie & tech', 'tech', 'téléphonie', 'telephonie', 'informatique', 'boutique informatique',
    'électroménager', 'electromenager', 'boutique électroménager', 'maison & ameublement',
    'maison', 'ameublement', '& ameublement', 'alimentation & supérette', 'alimentation', 'superette',
    'beauté & cosmétique', 'beaute & cosmetique', 'grossiste arrivages', 'grossiste',
    'services', 'service', 'de livraison', 'enseigne', 'divers', 'mixte', 'général', 'general',
    'commerce général', 'commerce general', 'alimentation générale', 'alimentation generale',
    'vente en ligne', 'boutique en ligne', 'prêt à porter', 'pret a porter', 'confection',
    'quincaillerie', 'bazar', 'dépôt', 'depot', 'magasin', 'boutik', 'affaire', 'affaires',
    'marche', 'marché', 'point de vente', 'vente', 'achats', 'achat', 'promo', 'promos',
    'arrivage', 'arrivages', 'chine', 'turquie', 'dubai', 'dubaï', 'grossiste', 'détail', 'detail'
  ];

  if (GENERIQUES.includes(low)) return false;

  // Si le mot commence par un préfixe ou suffixe générique (ex: "Mode Plateau", "Véhicules Guédiawaye", "Immobilière Thiès")
  if (
    /^(mode|véhicules|vehicules|immobilière|immobiliere|téléphonie|telephonie|électroménager|electromenager|informatique|commerce|alimentation|beauté|beaute)\b/i.test(low) ||
    /\b(général|general|ameublement|livraison)$/i.test(low)
  ) {
    return false;
  }

  // Détection de catégories pures ou expressions génériques
  if (
    /^(boutique|vendeur|commerce|magasin|agence|groupe|grossiste)\s+(mode|tech|informatique|auto|immo|véhicules|vehicules|electromenager|beaute|maison|alimentation|general|général)$/i.test(str) ||
    /^(agence\s+immobilière|vendeur\s+véhicules|boutique\s+mode|commerce\s+&\s+boutique)/i.test(str)
  ) {
    return false;
  }

  // Pollutions techniques : chiffres, indicatifs, slashs, emails, urls, extensions
  if (/\d{2,}/.test(str) || /\//.test(str) || /wa\.me/i.test(str) || /@/.test(str) || /\.(com|sn|fr|org|net)\b/i.test(str)) {
    return false;
  }

  // Pollutions de petites annonces et titres d'articles ou statuts
  if (
    /^(dakar|senegal|thies|mbour|touba)\s*,\s*/i.test(str) ||
    /^(dakar|senegal|thies|mbour|touba)\s+(ville|région|region|sn|senegal)\b/i.test(str) ||
    /\b(disponible|disponibi|livraison|groupée|groupee|arrivage|promo|hyundai|tucson|lite\s*5g|galaxy|iphone|peugeot|terrain|appartement|chambre|chaise|chaises|visiteur|visiteurs|canard|moto|scooter|voiture|robe|sac|chaussure)\b/i.test(str) ||
    /\b(très réactif|tres reactif|contenu ia|est à dakar|est a dakar|tel\b)/i.test(str)
  ) {
    return false;
  }

  // Noms issus de scraping WhatsApp non identifiés ou peu qualitatifs pour une salutation directe
  if (
    /\b(anonyme|participant|membre|top|tops|sn|mbs|user|utilisateur|admin|inconnu|officiel|official|buzness|business|busness|boutique|shop|store)\b/i.test(str)
  ) {
    return false;
  }

  // Si le nom contient uniquement des caractères spéciaux ou de la ponctuation (ex: "55.", "...")
  if (/^[^a-zA-ZÀ-ÿ]+$/.test(str) || str.length <= 2) {
    return false;
  }

  return true;
}

// ── Interpolation dynamique, humaine et naturelle de message ────────────────
function interpolerMessage(template, lead) {
  if (!template) return '';

  // 1. Résolution préalable du Spintax ({Salam|Bonjour|Hello})
  let message = traiterSpintax(template);

  const rawNom = (lead.nom_boutique || '').trim();
  const rawPrenom = (lead.contact_nom || '').trim();

  const estNomBoutiqueAuth = estNomPropreAuthentique(rawNom);
  const estPrenomAuth = estNomPropreAuthentique(rawPrenom);

  // Pour la salutation directe : UNIQUEMENT un vrai prénom de personne physique.
  // Les commerçants au Sénégal préfèrent 1000x un "Salam ! 👋" direct et respectueux
  // plutôt qu'un "Salam NomDeBoutique !" artificiel et robotique.
  let salutationTarget = null;
  if (estPrenomAuth) {
    salutationTarget = toTitleCase(rawPrenom);
  }

  // 2. Remplacement intelligent de {salutation}
  if (/\{salutation\}/i.test(message)) {
    message = message.replace(/\{salutation\}/gi, () => {
      const formule = Math.random() > 0.5 ? 'Salam' : 'Bonjour';
      if (salutationTarget) {
        return `${formule} ${salutationTarget} ! 👋`;
      }
      return `${formule} ! 👋`;
    });
  }

  // 3. Remplacement / Nettoyage radical des formules de salutation directes
  // Si le template contient "{Salam|Bonjour} {nom_boutique} !", on supprime {nom_boutique}
  // pour ne jamais avoir d'incongruité du type "Bonjour Commerce Général !"
  message = message.replace(/(salam(?:\s+alaykoum)?|bonjour|hello)\s+\{prenom\}\s*\(\s*\{nom_boutique\}\s*\)\s*!/gi, (match, salut) => {
    if (salutationTarget) {
      return `${salut} ${salutationTarget} !`;
    }
    return `${salut} !`;
  });

  message = message.replace(/(salam(?:\s+alaykoum)?|bonjour|hello)\s+\{nom_boutique\}\s*!/gi, (match, salut) => {
    if (salutationTarget) {
      return `${salut} ${salutationTarget} !`;
    }
    return `${salut} !`;
  });

  message = message.replace(/(salam(?:\s+alaykoum)?|bonjour|hello)\s+\{prenom\}\s*!/gi, (match, salut) => {
    if (salutationTarget) {
      return `${salut} ${salutationTarget} !`;
    }
    return `${salut} !`;
  });

  // Salutations suivies d'un émoji (ex: "{salut} {nom_boutique} ! 👋")
  message = message.replace(/(salam(?:\s+alaykoum)?|bonjour|hello)\s+\{nom_boutique\}\s*!\s*([👋📱📦🚗🏠🛒])/gi, (match, salut, emoji) => {
    if (salutationTarget) {
      return `${salut} ${salutationTarget} ! ${emoji}`;
    }
    return `${salut} ! ${emoji}`;
  });

  // 4. Préposition de lieu naturelle adaptée au quartier
  let quartierStr = 'à Dakar';
  if (lead.quartier && lead.quartier !== 'Dakar' && lead.quartier !== 'Tout Dakar & Régions') {
    const qLow = lead.quartier.toLowerCase();
    if (qLow.startsWith('hlm') || qLow.includes('almadies') || qLow.includes('mamelles') || qLow.includes('maristes') || qLow.includes('parcelles')) {
      quartierStr = `aux ${lead.quartier}`;
    } else {
      quartierStr = `à ${lead.quartier}`;
    }
  }

  // 5. Variables contextuelles dans le corps du texte
  const nomBoutiqueCorps = estNomBoutiqueAuth ? toTitleCase(rawNom) : 'votre boutique';
  const prenomCorps = estPrenomAuth ? toTitleCase(rawPrenom) : 'cher commerçant';
  const secteur = lead.categorie || 'commerce';
  const tel = lead.telephone ? `+${lead.telephone}` : '';

  message = message
    .replace(/\{nom_boutique\}/gi, nomBoutiqueCorps)
    .replace(/\{prenom\}/gi, prenomCorps)
    .replace(/(?:à|aux|en)\s*\{quartier\}/gi, quartierStr)
    .replace(/\{quartier\}/gi, quartierStr)
    .replace(/\{secteur\}/gi, secteur)
    .replace(/\{telephone\}/gi, tel)
    .replace(/\{lien_demo\}/gi, 'https://nopalou.com/guide-creer-boutique')
    .replace(/\{lien_boutique\}/gi, 'https://nopalou.com/creer-boutique')
    .replace(/\{lien_tarifs\}/gi, 'https://nopalou.com/tarifs-boutique');

  // Nettoyage des parenthèses vides, doublons de prépositions ou espaces multiples résiduels
  message = message
    .replace(/à\s+à\s+/g, 'à ')
    .replace(/à\s+aux\s+/g, 'aux ')
    .replace(/\(\s*\)/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

  return message;
}

// ── Génération de lien WhatsApp direct (wa.me) ──────────────────────────────
function genererLienWhatsApp(telephone, message) {
  const norm = normaliserTelephoneSenegal(telephone);
  if (!norm.valide) return null;
  return `https://wa.me/${norm.national}?text=${encodeURIComponent(message)}`;
}

// ── Extraction et Import Intelligent de Leads depuis du Texte Brut ───────────
function extraireLeadsDepuisTexte(rawText, defauts = {}) {
  if (!rawText || typeof rawText !== 'string') return [];

  const lignes = rawText.split(/[\r\n]+/);
  const leadsTrouves = [];
  const telVus = new Set();

  for (const ligne of lignes) {
    const txt = ligne.trim();
    if (!txt || txt.length < 5) continue;

    // Détection de tous les numéros sénégalais possibles dans la ligne
    const phoneMatches = txt.match(/(?:\+?221\s?)?(?:7[05678]|3[03])[\s.-]?[0-9]{3}[\s.-]?[0-9]{2}[\s.-]?[0-9]{2}/g) || [];
    
    // Détection d'email optionnel
    const emailMatch = txt.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const email = emailMatch ? emailMatch[0] : (defauts.email || null);

    for (const rawNum of phoneMatches) {
      const norm = normaliserTelephoneSenegal(rawNum);
      if (norm.valide && !telVus.has(norm.national) && norm.operateur !== 'Fixe') {
        telVus.add(norm.national);

        // Détection et enrichissement automatique
        const quartierDetecte = detecterQuartier(txt) || defauts.quartier || 'Dakar';
        const rawNom = txt
          .replace(rawNum, '')
          .replace(email || '', '')
          .replace(/[-:–—|•*#~,;|\t\/\\]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        const nomNettoye = nettoyerNomBoutique(rawNom, defauts.categorie || 'mode', quartierDetecte);
        const estInvalide = estLeadEmploiOuInvalide({ nom_boutique: rawNom, notes: txt, categorie: defauts.categorie });

        leadsTrouves.push({
          nom_boutique: nomNettoye.slice(0, 255),
          contact_nom: defauts.contact_nom ? toTitleCase(defauts.contact_nom) : null,
          telephone: norm.national,
          telephone_brut: norm.brut,
          operateur: norm.operateur,
          email: email,
          categorie: defauts.categorie || 'mode',
          ville: defauts.ville || 'Dakar',
          quartier: quartierDetecte,
          source: defauts.source || 'import_texte',
          statut: estInvalide ? 'invalide' : 'nouveau',
          notes: estInvalide ? 'Hors cible (Emploi/Recrutement)' : (defauts.notes || null),
        });
      }
    }
  }

  return leadsTrouves;
}

// ── Auto-Sourcing depuis les Annonces & Commerces Existants (Optimisé Haute Performance) ───
async function autoSourcerDepuisAnnonces() {
  try {
    await ensureProspectionTables();

    const resAnnonces = await pool.query(`
      SELECT contact_nom, contact_tel, titre, categorie_slug, quartier, ville
      FROM annonces_classifiees
      WHERE contact_tel IS NOT NULL AND contact_tel != '' AND contact_tel != 'Voir sur Facebook'
      ORDER BY created_at DESC
      LIMIT 1000
    `);

    if (resAnnonces.rows.length === 0) {
      return { success: true, trouves: 0, inseres: 0, doublons: 0 };
    }

    // 1. Parsing, normalisation et déduplication préalable en mémoire (< 50ms)
    const leadsParTel = new Map();

    for (const a of resAnnonces.rows) {
      const norm = normaliserTelephoneSenegal(a.contact_tel);
      if (!norm.valide || norm.operateur === 'Fixe') continue;

      if (leadsParTel.has(norm.national)) continue;

      // Filtrer les annonces d'emploi et faux positifs
      if (a.categorie_slug === 'emploi' || a.categorie_slug === 'recrutement') continue;
      if (estLeadEmploiOuInvalide({ nom_boutique: a.titre, notes: a.contact_nom, categorie: a.categorie_slug })) continue;

      const quartierDetecte = detecterQuartier(`${a.titre || ''} ${a.quartier || ''} ${a.ville || ''}`) || a.quartier || a.ville || 'Dakar';
      const nomNettoye = a.contact_nom ? toTitleCase(a.contact_nom) : nettoyerNomBoutique(a.titre, a.categorie_slug || 'mode', quartierDetecte);
      const categorie = a.categorie_slug || 'mode';

      leadsParTel.set(norm.national, {
        nom_boutique: nomNettoye,
        contact_nom: a.contact_nom ? toTitleCase(a.contact_nom) : null,
        telephone: norm.national,
        telephone_brut: norm.brut,
        operateur: norm.operateur,
        categorie,
        ville: a.ville || 'Dakar',
        quartier: quartierDetecte,
        source: 'annonces_classifiees',
      });
    }

    const uniqueLeads = Array.from(leadsParTel.values());
    if (uniqueLeads.length === 0) {
      return { success: true, trouves: resAnnonces.rows.length, inseres: 0, doublons: 0 };
    }

    // 2. Détection en une seule requête SQL des numéros déjà présents en base
    const tousTels = uniqueLeads.map(l => l.telephone);
    const resExistants = await pool.query(
      'SELECT telephone FROM prospection_leads WHERE telephone = ANY($1::text[])',
      [tousTels]
    );
    const existantsSet = new Set(resExistants.rows.map(r => r.telephone));

    // 3. Filtrer les leads non encore insérés
    const aInserer = uniqueLeads.filter(l => !existantsSet.has(l.telephone));
    let inseres = 0;

    if (aInserer.length > 0) {
      // Insertion par batch de 50 pour rapidité maximale et sécurité
      const CHUNK_SIZE = 50;
      for (let i = 0; i < aInserer.length; i += CHUNK_SIZE) {
        const chunk = aInserer.slice(i, i + CHUNK_SIZE);
        const values = [];
        const placeholders = chunk.map((l, idx) => {
          const offset = idx * 9;
          values.push(l.nom_boutique, l.contact_nom, l.telephone, l.telephone_brut, l.operateur, l.categorie, l.ville, l.quartier, l.source);
          return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, 'nouveau')`;
        }).join(', ');

        const query = `
          INSERT INTO prospection_leads (
            nom_boutique, contact_nom, telephone, telephone_brut, operateur,
            categorie, ville, quartier, source, statut
          ) VALUES ${placeholders}
          ON CONFLICT (telephone) DO NOTHING
          RETURNING id
        `;
        const resIns = await pool.query(query, values);
        inseres += resIns.rows.length;
      }
    }

    return {
      success: true,
      trouves: resAnnonces.rows.length,
      uniques: uniqueLeads.length,
      doublons: existantsSet.size,
      inseres,
    };
  } catch (err) {
    console.error('[PROSPECTION AUTO-SOURCE ERR]:', err.message);
    throw err;
  }
}

// ── Générateur de Requêtes Dorking Google & Réseaux pour Dakar ───────────────
function genererRequetesDorking(categorie = 'tous', quartier = 'Dakar') {
  const ville = quartier || 'Dakar';
  return [
    {
      titre: `👗 Vendeurs Mode & Vêtements sur Instagram (${ville})`,
      query: `site:instagram.com ("77" OR "78" OR "76" OR "70") ("${ville}" OR "Sénégal") ("boutique" OR "mode" OR "robe" OR "chaussures" OR "livraison")`,
      urlGoogle: `https://www.google.com/search?q=${encodeURIComponent(`site:instagram.com ("77" OR "78" OR "76" OR "70") ("${ville}" OR "Sénégal") ("boutique" OR "mode" OR "livraison")`)}`,
      plateforme: 'Instagram'
    },
    {
      titre: `📱 Commerces Téléphonie & High-Tech (${ville})`,
      query: `site:tiktok.com ("wa.me" OR "77" OR "78" OR "76") ("${ville}" OR "Sénégal") ("iphone" OR "samsung" OR "téléphone" OR "accessoires")`,
      urlGoogle: `https://www.google.com/search?q=${encodeURIComponent(`site:tiktok.com ("wa.me" OR "77" OR "78" OR "76") ("${ville}" OR "Sénégal") ("téléphone" OR "iphone" OR "accessoires")`)}`,
      plateforme: 'TikTok'
    },
    {
      titre: `🔨 Quincailleries & Matériaux (${ville}) sur Google Maps`,
      query: `Quincaillerie matériaux ${ville} Sénégal`,
      urlGoogle: `https://www.google.com/maps/search/${encodeURIComponent(`Quincaillerie matériaux ${ville} Sénégal`)}`,
      plateforme: 'Google Maps'
    },
    {
      titre: `📦 Grossistes & Importateurs Chine-Dakar sur Facebook`,
      query: `site:facebook.com ("groupe" OR "arrivage") ("Chine" OR "Alibaba" OR "Shein") ("Dakar" OR "Sénégal") ("77" OR "78" OR "76")`,
      urlGoogle: `https://www.google.com/search?q=${encodeURIComponent(`site:facebook.com ("arrivage" OR "grossiste") ("Chine" OR "Alibaba") ("Dakar" OR "Sénégal") ("77" OR "78" OR "76")`)}`,
      plateforme: 'Facebook'
    },
    {
      titre: `💄 Cosmétique, Beauté & Parfumerie (${ville})`,
      query: `site:instagram.com ("77" OR "78" OR "76") ("${ville}" OR "Sénégal") ("cosmétique" OR "savon" OR "parfum" OR "gamme" OR "soin")`,
      urlGoogle: `https://www.google.com/search?q=${encodeURIComponent(`site:instagram.com ("77" OR "78" OR "76") ("${ville}" OR "Sénégal") ("cosmétique" OR "parfum" OR "beauté")`)}`,
      plateforme: 'Instagram'
    }
  ];
}

// ── Auto-Guérison et Création Préventive des Tables de Prospection ───────────
async function ensureProspectionTables() {
  try {
    // 1. Extensions optionnelles (séparées pour éviter de bloquer si permission refusée sur DB cloud)
    try { await pool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";'); } catch (_) {}
    try { await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'); } catch (_) {}

    // 2. Table prospection_leads
    await pool.query(`
      CREATE TABLE IF NOT EXISTS prospection_leads (
        id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nom_boutique       VARCHAR(255) NOT NULL,
        contact_nom        VARCHAR(150),
        telephone          VARCHAR(50) NOT NULL UNIQUE,
        telephone_brut     VARCHAR(100),
        operateur          VARCHAR(50) DEFAULT 'Orange',
        email              VARCHAR(255),
        categorie          VARCHAR(100) DEFAULT 'mode',
        ville              VARCHAR(100) DEFAULT 'Dakar',
        quartier           VARCHAR(150),
        source             VARCHAR(100) DEFAULT 'manuel',
        statut             VARCHAR(50) DEFAULT 'nouveau',
        score              INT DEFAULT 0,
        fit_score          INT DEFAULT 0,
        notes              TEXT,
        derniere_action_at TIMESTAMPTZ,
        created_at         TIMESTAMPTZ DEFAULT NOW(),
        updated_at         TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 3. Garantir l'existence de toutes les colonnes requises (migrations à chaud)
    await pool.query(`
      ALTER TABLE prospection_leads ADD COLUMN IF NOT EXISTS score INT DEFAULT 0;
      ALTER TABLE prospection_leads ADD COLUMN IF NOT EXISTS fit_score INT DEFAULT 0;
      ALTER TABLE prospection_leads ADD COLUMN IF NOT EXISTS engagement_score INT DEFAULT 0;
      ALTER TABLE prospection_leads ADD COLUMN IF NOT EXISTS conversion_score INT DEFAULT 0;
      ALTER TABLE prospection_leads ADD COLUMN IF NOT EXISTS contactability_score INT DEFAULT 100;
      ALTER TABLE prospection_leads ADD COLUMN IF NOT EXISTS priority_score INT DEFAULT 50;
      ALTER TABLE prospection_leads ADD COLUMN IF NOT EXISTS next_best_action VARCHAR(100) DEFAULT 'contacter';
      ALTER TABLE prospection_leads ADD COLUMN IF NOT EXISTS scoring_details JSONB DEFAULT '{}';
      ALTER TABLE prospection_leads ADD COLUMN IF NOT EXISTS contact_nom VARCHAR(150);
      ALTER TABLE prospection_leads ADD COLUMN IF NOT EXISTS telephone_brut VARCHAR(100);
      ALTER TABLE prospection_leads ADD COLUMN IF NOT EXISTS operateur VARCHAR(50) DEFAULT 'Orange';
      ALTER TABLE prospection_leads ADD COLUMN IF NOT EXISTS email VARCHAR(255);
      ALTER TABLE prospection_leads ADD COLUMN IF NOT EXISTS notes TEXT;
      ALTER TABLE prospection_leads ADD COLUMN IF NOT EXISTS nb_contacts INT DEFAULT 0;
      ALTER TABLE prospection_leads ADD COLUMN IF NOT EXISTS dernier_contact_at TIMESTAMPTZ;
      ALTER TABLE prospection_leads ADD COLUMN IF NOT EXISTS derniere_reponse_at TIMESTAMPTZ;
      ALTER TABLE prospection_leads ADD COLUMN IF NOT EXISTS derniere_action_at TIMESTAMPTZ;
    `);

    // 4. Table prospection_campagnes (avec granularité et mémoire complète)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS prospection_campagnes (
        id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        titre                  VARCHAR(255) NOT NULL,
        canal                  VARCHAR(50) NOT NULL DEFAULT 'whatsapp',
        statut                 VARCHAR(50) NOT NULL DEFAULT 'brouillon',
        template_message       TEXT NOT NULL,
        sujet_email            VARCHAR(255),
        segment_cible          VARCHAR(100),
        categorie_cible        VARCHAR(100),
        zone_cible             VARCHAR(100),
        source_cible           VARCHAR(100),
        variante_message       VARCHAR(50) DEFAULT 'variante_A',
        nb_total               INT DEFAULT 0,
        nb_contactables        INT DEFAULT 0,
        nb_envoyes             INT DEFAULT 0,
        nb_succes              INT DEFAULT 0,
        nb_echecs              INT DEFAULT 0,
        nb_reponses            INT DEFAULT 0,
        nb_reponses_positives  INT DEFAULT 0,
        nb_reponses_negatives  INT DEFAULT 0,
        nb_sans_reponse        INT DEFAULT 0,
        nb_interesses          INT DEFAULT 0,
        nb_inscrits            INT DEFAULT 0,
        nb_boutiques_creees    INT DEFAULT 0,
        nb_boutiques_actives   INT DEFAULT 0,
        nb_clients_payants     INT DEFAULT 0,
        nb_optout              INT DEFAULT 0,
        taux_delivrabilite     NUMERIC(5,2) DEFAULT 0,
        taux_reponse           NUMERIC(5,2) DEFAULT 0,
        taux_positif           NUMERIC(5,2) DEFAULT 0,
        taux_conversion        NUMERIC(5,2) DEFAULT 0,
        taux_optout            NUMERIC(5,2) DEFAULT 0,
        diagnostic             JSONB DEFAULT '{}',
        metadonnees            JSONB DEFAULT '{}',
        date_debut             TIMESTAMPTZ,
        date_fin               TIMESTAMPTZ,
        created_at             TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 4.b Migration à chaud des colonnes prospection_campagnes si elle existait déjà
    await pool.query(`
      ALTER TABLE prospection_campagnes ADD COLUMN IF NOT EXISTS segment_cible VARCHAR(100);
      ALTER TABLE prospection_campagnes ADD COLUMN IF NOT EXISTS categorie_cible VARCHAR(100);
      ALTER TABLE prospection_campagnes ADD COLUMN IF NOT EXISTS zone_cible VARCHAR(100);
      ALTER TABLE prospection_campagnes ADD COLUMN IF NOT EXISTS source_cible VARCHAR(100);
      ALTER TABLE prospection_campagnes ADD COLUMN IF NOT EXISTS variante_message VARCHAR(50) DEFAULT 'variante_A';
      ALTER TABLE prospection_campagnes ADD COLUMN IF NOT EXISTS nb_contactables INT DEFAULT 0;
      ALTER TABLE prospection_campagnes ADD COLUMN IF NOT EXISTS nb_reponses INT DEFAULT 0;
      ALTER TABLE prospection_campagnes ADD COLUMN IF NOT EXISTS nb_reponses_positives INT DEFAULT 0;
      ALTER TABLE prospection_campagnes ADD COLUMN IF NOT EXISTS nb_reponses_negatives INT DEFAULT 0;
      ALTER TABLE prospection_campagnes ADD COLUMN IF NOT EXISTS nb_sans_reponse INT DEFAULT 0;
      ALTER TABLE prospection_campagnes ADD COLUMN IF NOT EXISTS nb_interesses INT DEFAULT 0;
      ALTER TABLE prospection_campagnes ADD COLUMN IF NOT EXISTS nb_inscrits INT DEFAULT 0;
      ALTER TABLE prospection_campagnes ADD COLUMN IF NOT EXISTS nb_boutiques_creees INT DEFAULT 0;
      ALTER TABLE prospection_campagnes ADD COLUMN IF NOT EXISTS nb_boutiques_actives INT DEFAULT 0;
      ALTER TABLE prospection_campagnes ADD COLUMN IF NOT EXISTS nb_clients_payants INT DEFAULT 0;
      ALTER TABLE prospection_campagnes ADD COLUMN IF NOT EXISTS nb_optout INT DEFAULT 0;
      ALTER TABLE prospection_campagnes ADD COLUMN IF NOT EXISTS taux_delivrabilite NUMERIC(5,2) DEFAULT 0;
      ALTER TABLE prospection_campagnes ADD COLUMN IF NOT EXISTS taux_reponse NUMERIC(5,2) DEFAULT 0;
      ALTER TABLE prospection_campagnes ADD COLUMN IF NOT EXISTS taux_positif NUMERIC(5,2) DEFAULT 0;
      ALTER TABLE prospection_campagnes ADD COLUMN IF NOT EXISTS taux_conversion NUMERIC(5,2) DEFAULT 0;
      ALTER TABLE prospection_campagnes ADD COLUMN IF NOT EXISTS taux_optout NUMERIC(5,2) DEFAULT 0;
      ALTER TABLE prospection_campagnes ADD COLUMN IF NOT EXISTS diagnostic JSONB DEFAULT '{}';
      ALTER TABLE prospection_campagnes ADD COLUMN IF NOT EXISTS date_debut TIMESTAMPTZ;
      ALTER TABLE prospection_campagnes ADD COLUMN IF NOT EXISTS date_fin TIMESTAMPTZ;
    `);

    // 5. Table prospection_messages_log
    await pool.query(`
      CREATE TABLE IF NOT EXISTS prospection_messages_log (
        id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        campagne_id        UUID,
        lead_id            UUID,
        canal              VARCHAR(50) NOT NULL,
        destinataire       VARCHAR(255) NOT NULL,
        message_envoye     TEXT NOT NULL,
        statut             VARCHAR(50) DEFAULT 'envoye',
        variante           VARCHAR(50) DEFAULT 'A',
        erreur             TEXT,
        created_at         TIMESTAMPTZ DEFAULT NOW()
      );
      ALTER TABLE prospection_messages_log ADD COLUMN IF NOT EXISTS variante VARCHAR(50) DEFAULT 'A';
    `);

    // 6. Table de la Timeline Commerciale du Prospect (prospection_lead_events)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS prospection_lead_events (
        id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lead_id            UUID NOT NULL REFERENCES prospection_leads(id) ON DELETE CASCADE,
        campagne_id        UUID REFERENCES prospection_campagnes(id) ON DELETE SET NULL,
        type_evenement     VARCHAR(50) NOT NULL, -- collecte, qualification, message_envoye, reponse, reponse_positive, reponse_negative, sans_reponse, relance, optout, visite_web, inscription, boutique_creee
        canal              VARCHAR(50) DEFAULT 'whatsapp',
        description        TEXT,
        metadata           JSONB DEFAULT '{}',
        created_at         TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 7. Table whatsapp_blacklist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS whatsapp_blacklist (
        phone              VARCHAR(50) PRIMARY KEY,
        reason             VARCHAR(255) DEFAULT 'optout',
        created_at         TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 8. Index de performance avancés
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_prospection_leads_tel ON prospection_leads(telephone);
      CREATE INDEX IF NOT EXISTS idx_prospection_leads_statut ON prospection_leads(statut);
      CREATE INDEX IF NOT EXISTS idx_prospection_leads_cat ON prospection_leads(categorie);
      CREATE INDEX IF NOT EXISTS idx_prospection_leads_date ON prospection_leads(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_prospection_leads_score ON prospection_leads(score DESC);
      CREATE INDEX IF NOT EXISTS idx_prospection_leads_priority ON prospection_leads(priority_score DESC);
      CREATE INDEX IF NOT EXISTS idx_prospection_leads_fit ON prospection_leads(fit_score DESC);
      CREATE INDEX IF NOT EXISTS idx_prospection_target ON prospection_leads(statut, categorie, quartier);
      CREATE INDEX IF NOT EXISTS idx_prospection_campagnes_date ON prospection_campagnes(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_prospection_log_campagne ON prospection_messages_log(campagne_id);
      CREATE INDEX IF NOT EXISTS idx_prospection_log_lead ON prospection_messages_log(lead_id);
      CREATE INDEX IF NOT EXISTS idx_prospection_log_date ON prospection_messages_log(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_prospection_events_lead ON prospection_lead_events(lead_id);
      CREATE INDEX IF NOT EXISTS idx_prospection_events_type ON prospection_lead_events(type_evenement);
      CREATE INDEX IF NOT EXISTS idx_prospection_events_date ON prospection_lead_events(created_at DESC);
    `);
  } catch (err) {
    console.warn('[PROSPECTION] ensureProspectionTables warning:', err.message);
  }
}

// ── Résolution Dynamique de Template par Catégorie Métier ───────────────────
function resoudreTemplatePourLead(templateOriginal, lead) {
  if (!templateOriginal || typeof templateOriginal !== 'string') return '';
  const cat = String(lead.categorie || '').toLowerCase();
  
  // Si le template contient des références explicites à la mode/vêtements
  const estTemplateModeOuRobe = /robe|soie|taille|collection|modèle/i.test(templateOriginal);
  
  if (estTemplateModeOuRobe) {
    if (cat === 'auto-moto') {
      const tpl = TEMPLATES_PAR_DEFAUT.find(t => t.id === 'auto_vehicules');
      if (tpl) return tpl.texte;
    }
    if (cat === 'immo' || cat === 'immobilier') {
      const tpl = TEMPLATES_PAR_DEFAUT.find(t => t.id === 'immo_agences');
      if (tpl) return tpl.texte;
    }
    if (cat === 'tech' || cat === 'smartphones' || cat === 'informatique') {
      const tpl = TEMPLATES_PAR_DEFAUT.find(t => t.id === 'tech_telephonie');
      if (tpl) return tpl.texte;
    }
    if (cat === 'grossiste') {
      const tpl = TEMPLATES_PAR_DEFAUT.find(t => t.id === 'sourcing_alibaba');
      if (tpl) return tpl.texte;
    }
    if (cat === 'divers' || cat === 'superette' || cat === 'alimentation' || cat === 'quincaillerie') {
      const tpl = TEMPLATES_PAR_DEFAUT.find(t => t.id === 'commerce_general');
      if (tpl) return tpl.texte;
    }
  }

  return templateOriginal;
}

// ── Exécution de Campagne de Prospection Automatisée avec Jitter Humain ───────
async function lancerCampagne({ campagneId, leadIds, canal, templateMessage, simulation = false }) {
  if (!leadIds || leadIds.length === 0) {
    throw new Error('Aucun lead sélectionné');
  }

  // Garantir l'existence des tables
  await ensureProspectionTables();

  const validIds = (Array.isArray(leadIds) ? leadIds : [leadIds]).map(String).filter(Boolean);

  // Récupérer les leads de manière sécurisée (compatible id::text pour éviter tout bug de cast)
  const { rows: leads } = await pool.query(
    'SELECT * FROM prospection_leads WHERE id::text = ANY($1::text[])',
    [validIds]
  );

  let nbSucces = 0;
  let nbEchecs = 0;
  let nbIgnores = 0;
  let index = 0;

  for (const lead of leads) {
    index++;

    // 1. Vérification stricte de désinscription / Blacklist
    if (lead.telephone && (await estDesinscrit(lead.telephone))) {
      await pool.query("UPDATE prospection_leads SET statut = 'desinscrit', updated_at = NOW() WHERE id = $1", [lead.id]);
      continue;
    }

    // 2. Protection Anti-Doublon Absolue : ON NE DOIT JAMAIS ENVOYER AU MÊME NUMÉRO PLUSIEURS FOIS
    if (!simulation) {
      // a) Si le prospect a déjà été contacté ou n'est plus "nouveau"
      if (lead.statut !== 'nouveau' || lead.dernier_contact_at || (lead.nb_contacts && lead.nb_contacts > 0)) {
        console.log(`[PROSPECTION DOUBLON BLOQUÉ] Ignoré : lead ${lead.telephone} déjà contacté (statut: ${lead.statut}, dernier_contact: ${lead.dernier_contact_at}).`);
        nbIgnores++;
        continue;
      }

      // b) Si le prospect a déjà une boutique active
      if (lead.statut === 'converti') {
        console.log(`[PROSPECTION CONVERTI] Ignoré : lead ${lead.telephone} a déjà créé sa boutique Nopalou.`);
        nbIgnores++;
        continue;
      }

      // c) Vérification historique directe en base de données sur prospection_messages_log
      // Garantit à 100% qu'aucun message n'a déjà été envoyé ou délivré à ce numéro
      if (lead.telephone) {
        const norm = normalisePhone(lead.telephone);
        const { rows: dejaEnvoye } = await pool.query(
          `SELECT id FROM prospection_messages_log 
           WHERE (destinataire = $1 OR destinataire = $2) 
             AND statut IN ('envoye', 'livre', 'lu') 
           LIMIT 1`,
          [norm, norm.replace(/^221/, '')]
        );
        if (dejaEnvoye.length > 0) {
          console.log(`[PROSPECTION DOUBLON BLOQUÉ] Ignoré : le numéro ${lead.telephone} a déjà reçu un message par le passé.`);
          nbIgnores++;
          continue;
        }
      }
    }

    // Résolution contextuelle du template (Persona matching)
    const templateAdapte = resoudreTemplatePourLead(templateMessage, lead);
    const messageFinal = interpolerMessage(templateAdapte, lead);
    let statutEnvoi = simulation ? 'simule' : 'echec';
    let erreurEnvoi = null;
    let metaMessageId = null;

    if (!simulation) {
      if (canal === 'whatsapp') {
        try {
          // Pour la prospection à froid (fenêtre 24h fermée), on utilise le template pur texte nopalou_contact_direct.
          // Paramètres ultra-courts pour éliminer 100% l'apparition de '... Voir plus' sur smartphone.
          let metaResponse = null;
          try {
            metaResponse = await sendWhatsAppProspectionDirecte(lead.telephone, {
              features: '📱 Vendez & encaissez par Wave / OM sans commission sur mobile.',
              googleProof: '🎁 30 jours offerts & factures (tapez Nopalou sur Google 🇸🇳)',
            });
          } catch (eDir) {
            console.warn(`[PROSPECTION DIRECTE FAIL, FALLBACK NOTIF] ${lead.telephone}:`, eDir.message);
          }

          if (!metaResponse || metaResponse.success === false) {
            const enseigneAuth = estNomPropreAuthentique(lead.nom_boutique) ? lead.nom_boutique.trim() : null;
            const titreNotif = enseigneAuth ? `📱 Nopalou — ${enseigneAuth}`.slice(0, 50) : '📱 Nopalou — Caisse & Gestion';
            const detailNotif = '📱 Vendez & encaissez par Wave / OM sans commission. 30 jours offerts. Tapez Nopalou sur Google 🇸🇳. Répondez OUI pour ouvrir votre boutique en 30s.';
            metaResponse = await sendWhatsAppNotification(lead.telephone, {
              textMessage: null, // Pas de texte libre pour éviter l'erreur 131047
              title: titreNotif,
              detail: detailNotif,
              url: 'https://nopalou.com/tarifs-boutique',
              buttonParam: 'boutique',
              templateOnly: true,
            });
          }
          
          // Vérification que Meta a bien accepté et retourné un message ID (wamid)
          metaMessageId = metaResponse?.messages?.[0]?.id || null;
          if (metaResponse && metaResponse.success !== false && metaMessageId) {
            statutEnvoi = 'envoye';
            nbSucces++;
            console.log(`[PROSPECTION ✅] ${lead.telephone} → Meta wamid: ${metaMessageId}`);
          } else {
            statutEnvoi = 'echec';
            erreurEnvoi = metaResponse?.reason || 'Échec délivrance Meta (template rejeté)';
            nbEchecs++;
            console.warn(`[PROSPECTION ❌] ${lead.telephone}: ${erreurEnvoi}`);
          }
        } catch (err) {
          const metaErr = err.response?.data?.error;
          erreurEnvoi = metaErr?.message || err.message;
          // Catégorisation de l'erreur pour diagnostic
          const errCode = metaErr?.code;
          if (errCode === 131047) {
            console.warn(`[PROSPECTION ⚠️ 24H] ${lead.telephone}: Fenêtre 24h fermée ET template rejeté`);
          } else if (errCode === 131026 || errCode === 131051) {
            console.warn(`[PROSPECTION ⚠️ PHONE] ${lead.telephone}: Numéro invalide ou non-WhatsApp (code ${errCode})`);
          } else if (errCode === 131056) {
            console.warn(`[PROSPECTION ⚠️ RATE] ${lead.telephone}: Rate limit Meta atteint`);
          } else if (errCode === 132018) {
            console.warn(`[PROSPECTION ⚠️ FORMAT] ${lead.telephone}: Caractère invalide dans paramètre template (code 132018)`);
          } else {
            console.error(`[PROSPECTION ❌] ${lead.telephone}: ${erreurEnvoi} (code: ${errCode || 'N/A'})`);
          }
          nbEchecs++;
        }
      } else {
        // Simulation pour canal autre que direct API
        statutEnvoi = 'simule';
        nbSucces++;
      }
    } else {
      nbSucces++;
    }

    // Logger le message et l'événement dans la timeline
    try {
      await pool.query(`
        INSERT INTO prospection_messages_log (
          campagne_id, lead_id, canal, destinataire, message_envoye, statut, variante, erreur, meta_message_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [campagneId || null, lead.id, canal, lead.telephone || lead.email, messageFinal, statutEnvoi, 'variante_A', erreurEnvoi, metaMessageId]);

      // Mettre à jour le statut du lead et sa timeline si envoyé avec succès
      if (statutEnvoi === 'envoye') {
        await pool.query(`
          UPDATE prospection_leads
          SET 
            statut = 'contacte_wa',
            nb_contacts = COALESCE(nb_contacts, 0) + 1,
            dernier_contact_at = NOW(),
            derniere_action_at = NOW(),
            updated_at = NOW()
          WHERE id = $1
        `, [lead.id]);

        // Enregistrement dans la Timeline Commerciale 360°
        await pool.query(`
          INSERT INTO prospection_lead_events (
            lead_id, campagne_id, type_evenement, canal, description, metadata
          ) VALUES ($1, $2, 'message_envoye', $3, $4, $5)
        `, [
          lead.id,
          campagneId || null,
          canal,
          `Message de prospection envoyé sur WhatsApp (${lead.categorie || 'commerce'})`,
          JSON.stringify({ simulation, destinataire: lead.telephone, extrait: messageFinal.slice(0, 120) })
        ]);
      }
    } catch (dbErr) {
      console.error('[PROSPECTION LOG ERR]:', dbErr.message);
    }

    // Cadence Anti-Ban intelligente (Jitter aléatoire entre 2.5s et 4.5s si envoi réel)
    if (!simulation && canal === 'whatsapp') {
      // Pause de respiration de 12s tous les 25 envois
      if (index > 0 && index % 25 === 0) {
        await new Promise((r) => setTimeout(r, 12000));
      } else {
        const jitterMs = Math.floor(Math.random() * (4500 - 2500 + 1)) + 2500;
        await new Promise((r) => setTimeout(r, jitterMs));
      }
    }
  }

  // Clôturer la campagne avec ses statistiques en base réconciliées depuis les logs
  if (campagneId) {
    try {
      const { rows: statsLogs } = await pool.query(`
        SELECT 
          COUNT(*)::int as total,
          COUNT(*) FILTER (WHERE statut IN ('envoye', 'livre', 'lu'))::int as succes,
          COUNT(*) FILTER (WHERE statut = 'echec')::int as echecs,
          COUNT(*) FILTER (WHERE statut = 'lu')::int as lus,
          COUNT(*) FILTER (WHERE statut = 'livre')::int as livres
        FROM prospection_messages_log
        WHERE campagne_id = $1
      `, [campagneId]);

      const logTotal = statsLogs[0]?.total ?? (nbSucces + nbEchecs);
      const logSucces = statsLogs[0]?.succes ?? nbSucces;
      const logEchecs = statsLogs[0]?.echecs ?? nbEchecs;
      const logLus = statsLogs[0]?.lus ?? 0;
      const logLivres = statsLogs[0]?.livres ?? 0;

      let msgDiag = nbIgnores > 0 && logTotal === 0
        ? `Tous les ${nbIgnores} prospects ciblés avaient déjà été contactés (anti-doublon).`
        : logEchecs > 0
          ? `${logSucces} délivrés (${logLus} lus, ${logLivres} livrés) • ${logEchecs} rejetés par Meta`
          : `${logSucces} messages délivrés avec succès (100%)`;

      const diagnosticCampagne = {
        message: msgDiag,
        nb_ignores: nbIgnores,
        nb_lus: logLus,
        nb_livres: logLivres,
        nb_echecs: logEchecs,
      };

      await pool.query(`
        UPDATE prospection_campagnes
        SET
          statut = 'terminee',
          nb_envoyes = $1::int,
          nb_succes = $2::int,
          nb_echecs = $3::int,
          taux_delivrabilite = CASE WHEN $1::int > 0 THEN ROUND(($2::numeric / $1::numeric) * 100, 2) ELSE 0 END,
          diagnostic = $5::jsonb,
          date_fin = NOW()
        WHERE id = $4
      `, [logTotal, logSucces, logEchecs, campagneId, JSON.stringify(diagnosticCampagne)]);
    } catch (cmpCloseErr) {
      console.warn('[PROSPECTION] Fermeture campagne warning:', cmpCloseErr.message);
    }
  }

  return { nbSucces, nbEchecs, nbIgnores, total: leads.length };
}

// ── Analytics & Diagnostic Automatique d'une Campagne ─────────────────────────
async function diagnostiquerCampagne(campagneId) {
  await ensureProspectionTables();
  const { rows: cmpRows } = await pool.query('SELECT * FROM prospection_campagnes WHERE id::text = $1', [String(campagneId)]);
  if (!cmpRows.length) return null;
  const cmp = cmpRows[0];

  // Calcul du funnel réel à partir des logs et des conversions
  const { rows: logs } = await pool.query(`
    SELECT 
      l.destinataire, l.statut, l.erreur, p.id as lead_id, p.statut as lead_statut,
      p.nom_boutique, p.categorie, p.quartier, p.source
    FROM prospection_messages_log l
    LEFT JOIN prospection_leads p ON l.lead_id = p.id
    WHERE l.campagne_id::text = $1
  `, [String(campagneId)]);

  const total = logs.length;
  const envoyes = logs.filter(l => ['envoye', 'livre', 'lu'].includes(l.statut)).length;
  const lus = logs.filter(l => l.statut === 'lu').length;
  const livres = logs.filter(l => l.statut === 'livre').length;
  const simules = logs.filter(l => l.statut === 'simule').length;
  const echecs = logs.filter(l => l.statut === 'echec').length;

  // Calcul des statuts actuels des leads de cette campagne
  const convertis = logs.filter(l => l.lead_statut === 'converti').length;
  const enDiscussion = logs.filter(l => l.lead_statut === 'en_discussion').length;
  const desinscrits = logs.filter(l => l.lead_statut === 'desinscrit').length;
  const invalides = logs.filter(l => l.lead_statut === 'invalide').length;

  // Vérification si des réponses sont arrivées sur WhatsApp pour ces numéros
  const phones = logs.map(l => l.destinataire).filter(Boolean);
  let nbReponsesEstimees = enDiscussion + convertis;

  const causesEchec = [];
  const recommandations = [];

  // Diagnostic intelligent des causes
  if (total > 0 && convertis === 0) {
    if (invalides / total > 0.15) {
      causesEchec.push({
        facteur: 'Qualité du Sourcing',
        detail: `${Math.round((invalides / total) * 100)}% de profils hors-cible ou particuliers détectés dans ce lot`,
        impact: 'Fort'
      });
      recommandations.push('Activer le filtre strict anti-emploi et exclure les particuliers avant le tir');
    }

    // Détection de mismatch persona / template
    const categoriesDistinctes = [...new Set(logs.map(l => l.categorie).filter(Boolean))];
    if (categoriesDistinctes.length > 3) {
      causesEchec.push({
        facteur: 'Segmentation Trop Hétérogène',
        detail: `La campagne a arrosé ${categoriesDistinctes.length} catégories différentes avec un message générique`,
        impact: 'Très Fort'
      });
      recommandations.push('Segmenter par métier (Mode vs Auto vs Immo vs High-Tech) avec les templates sectoriels Nopalou');
    }

    if (cmp.template_message && /robe|soie|taille/i.test(cmp.template_message) && categoriesDistinctes.some(c => ['auto-moto', 'immo'].includes(c))) {
      causesEchec.push({
        facteur: 'Inadéquation Message / Persona (Mismatch)',
        detail: 'Un template de prêt-à-porter a été envoyé à des vendeurs auto ou des agents immobiliers',
        impact: 'Critique'
      });
      recommandations.push('Utiliser le moteur de template dynamique contextuel (resoudreTemplatePourLead)');
    }

    if (envoyes > 0 && nbReponsesEstimees === 0) {
      causesEchec.push({
        facteur: 'Accroche ou Call-To-Action Faible',
        detail: 'Aucun passage à l\'action enregistré (Le commerçant n\'a pas répondu OUI ou BILAN)',
        impact: 'Moyen'
      });
      recommandations.push('Tester la Variante B axée sur le Bilan WhatsApp instantané ou la migration sans ordinateur');
    }
  }

  const diagnosticResult = {
    campagne_id: cmp.id,
    titre: cmp.titre,
    date: cmp.created_at,
    canal: cmp.canal,
    funnel: {
      leads_collectes: cmp.nb_total || total,
      messages_envoyes: envoyes + simules,
      messages_delivres: envoyes,
      reponses_recues: nbReponsesEstimees,
      en_discussion: enDiscussion,
      boutiques_creees: convertis,
      taux_delivrabilite: total > 0 ? Number(((envoyes / total) * 100).toFixed(2)) : 0,
      taux_reponse: envoyes > 0 ? Number(((nbReponsesEstimees / envoyes) * 100).toFixed(2)) : 0,
      taux_conversion: envoyes > 0 ? Number(((convertis / envoyes) * 100).toFixed(2)) : 0,
      taux_desinscription: total > 0 ? Number(((desinscrits / total) * 100).toFixed(2)) : 0,
    },
    point_de_rupture_principal: (envoyes === 0) ? 'Délivrabilité / Envoi' : ((nbReponsesEstimees === 0) ? 'Engagement / Première Réponse' : 'Activation Boutique'),
    causes_echec: causesEchec,
    recommandations: recommandations.length > 0 ? recommandations : ['Segmenter davantage et tester un horaire matinal (10h-12h)'],
    echantillon_suffisant: total >= 30,
    indice_confiance: total >= 100 ? 'Élevé' : (total >= 30 ? 'Moyen' : 'Faible (Échantillon restreint)')
  };

  // Sauvegarde du diagnostic dans prospection_campagnes
  try {
    await pool.query(`
      UPDATE prospection_campagnes
      SET 
        diagnostic = $1::jsonb,
        taux_delivrabilite = $2,
        taux_reponse = $3,
        taux_conversion = $4,
        nb_boutiques_creees = $5,
        nb_reponses = $6
      WHERE id = $7
    `, [
      JSON.stringify(diagnosticResult),
      diagnosticResult.funnel.taux_delivrabilite,
      diagnosticResult.funnel.taux_reponse,
      diagnosticResult.funnel.taux_conversion,
      convertis,
      nbReponsesEstimees,
      cmp.id
    ]);
  } catch (_) {}

  return diagnosticResult;
}

// ── Analyse Macro de Toutes les Campagnes et Apprentissage Historique ────────
async function analyserToutesLesCampagnes() {
  await ensureProspectionTables();
  const { rows: campagnes } = await pool.query(`
    SELECT * FROM prospection_campagnes
    ORDER BY created_at DESC
  `);

  const diagnostics = [];
  for (const c of campagnes) {
    const diag = await diagnostiquerCampagne(c.id);
    if (diag) diagnostics.push(diag);
  }

  // Agrégation des segments
  const { rows: segmentAgg } = await pool.query(`
    SELECT 
      categorie,
      COUNT(*) as total_leads,
      COUNT(*) FILTER (WHERE statut LIKE 'contacte%') as contactes,
      COUNT(*) FILTER (WHERE statut = 'converti') as convertis,
      COUNT(*) FILTER (WHERE statut = 'en_discussion') as en_discussion,
      COUNT(*) FILTER (WHERE statut = 'desinscrit') as desinscrits,
      ROUND(AVG(score), 1) as avg_score,
      ROUND(AVG(fit_score), 1) as avg_fit
    FROM prospection_leads
    GROUP BY categorie
    ORDER BY convertis DESC, contactes DESC
  `);

  const segmentsPerformances = segmentAgg.map(s => {
    const total = parseInt(s.total_leads, 10);
    const contactes = parseInt(s.contactes, 10);
    const conv = parseInt(s.convertis, 10);
    const txConv = contactes > 0 ? Number(((conv / contactes) * 100).toFixed(2)) : (total > 0 ? Number(((conv / total) * 100).toFixed(2)) : 0);
    return {
      categorie: s.categorie,
      total_leads: total,
      contactes,
      convertis: conv,
      taux_conversion: txConv,
      indice_confiance: contactes >= 50 ? 'Élevé' : (contactes >= 15 ? 'Moyen' : 'Faible (Faible échantillon)'),
      recommandation: txConv >= 3 ? 'Segment Champion à scaler' : (contactes < 20 ? 'Segment prometteur à tester' : 'Revoir l\'offre et le ciblage'),
    };
  });

  // Agrégation des sources
  const { rows: sourceAgg } = await pool.query(`
    SELECT 
      source,
      COUNT(*) as total_leads,
      COUNT(*) FILTER (WHERE statut LIKE 'contacte%') as contactes,
      COUNT(*) FILTER (WHERE statut = 'converti') as convertis,
      COUNT(*) FILTER (WHERE statut = 'invalide') as invalides
    FROM prospection_leads
    GROUP BY source
    ORDER BY convertis DESC, total_leads DESC
    LIMIT 12
  `);

  const sourcesPerformances = sourceAgg.map(s => {
    const total = parseInt(s.total_leads, 10);
    const conv = parseInt(s.convertis, 10);
    const inv = parseInt(s.invalides, 10);
    const txInvalide = total > 0 ? Number(((inv / total) * 100).toFixed(1)) : 0;
    let etoiles = '★★★☆☆';
    if (conv >= 2) etoiles = '★★★★★';
    else if (conv === 1) etoiles = '★★★★☆';
    else if (txInvalide > 30) etoiles = '★☆☆☆☆';
    else if (txInvalide > 15) etoiles = '★★☆☆☆';

    return {
      source: s.source,
      total_leads: total,
      contactes: parseInt(s.contactes, 10),
      convertis: conv,
      taux_invalide: txInvalide,
      etoiles,
      qualite_label: txInvalide > 25 ? 'Faible (Beaucoup de hors-cible)' : 'Bonne'
    };
  });

  // Agrégation géographique
  const { rows: geoAgg } = await pool.query(`
    SELECT 
      COALESCE(quartier, ville, 'Dakar') as localisation,
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE statut = 'converti') as convertis,
      COUNT(*) FILTER (WHERE statut LIKE 'contacte%') as contactes
    FROM prospection_leads
    GROUP BY localisation
    ORDER BY convertis DESC, total DESC
    LIMIT 12
  `);

  return {
    total_campagnes: campagnes.length,
    campagnes_analysees: diagnostics,
    top_segments: segmentsPerformances,
    top_sources: sourcesPerformances,
    top_zones: geoAgg,
  };
}

// ── Moteur de Recommandation Contextuelle de Campagne ────────────────────────
async function recommanderProchaineCampagne() {
  await ensureProspectionTables();

  // 1. Détecter les meilleurs prospects prioritaires en attente de contact
  const { rows: topLeads } = await pool.query(`
    SELECT id, nom_boutique, categorie, quartier, ville, telephone, operateur, priority_score, fit_score, score, next_best_action
    FROM prospection_leads
    WHERE statut = 'nouveau'
      AND statut NOT IN ('desinscrit', 'invalide', 'converti')
      AND (nb_contacts IS NULL OR nb_contacts = 0)
    ORDER BY priority_score DESC, fit_score DESC, score DESC
    LIMIT 150
  `);

  // 2. Déterminer la catégorie dominante dans ces prospects prioritaires
  const countsCat = {};
  for (const l of topLeads) {
    countsCat[l.categorie] = (countsCat[l.categorie] || 0) + 1;
  }
  const topCat = Object.entries(countsCat).sort((a, b) => b[1] - a[1])[0]?.[0] || 'mode';

  // 3. Déterminer la zone la plus représentée
  const countsZone = {};
  for (const l of topLeads) {
    const z = l.quartier || l.ville || 'Dakar';
    countsZone[z] = (countsZone[z] || 0) + 1;
  }
  const topZone = Object.entries(countsZone).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Dakar';

  // 4. Sélectionner le template adapté
  let templateRec = TEMPLATES_PAR_DEFAUT.find(t => t.categorie === topCat) || TEMPLATES_PAR_DEFAUT[0];

  return {
    segment_recommande: topCat.toUpperCase(),
    categorie: topCat,
    zone: topZone,
    taille_lot_recommandee: Math.min(topLeads.length, 50),
    canal_recommande: 'whatsapp',
    template_id: templateRec.id,
    template_titre: templateRec.titre,
    template_texte: templateRec.texte,
    variante_recommandee: 'Variante B (Bilan WhatsApp & Sans Ordinateur)',
    creneau_horaire_recommande: 'Mardi ou Jeudi entre 10h30 et 12h00',
    niveau_confiance: topLeads.length >= 30 ? 'Élevé' : 'Moyen',
    justification_donnees: [
      `Gisement de ${topLeads.length} prospects hautement qualifiés (Priority Score moyen : ${Math.round(topLeads.slice(0, 50).reduce((acc, l) => acc + (l.priority_score || 50), 0) / Math.max(1, Math.min(topLeads.length, 50)))})`,
      `Secteur ${topCat} en tête du potentiel commercial Nopalou`,
      'Respect strict du délai anti-sur-sollicitation (Zéro contact antérieur)',
      'Couverture 100% numéros mobiles sénégalais vérifiés'
    ],
    prospects_prioritaires: topLeads.slice(0, 50),
  };
}

// ── Consultation de la Timeline Commerciale 360° d'un Lead ───────────────────
async function obtenirTimelineLead(leadId) {
  await ensureProspectionTables();
  const [resLead, resEvents, resMsgs] = await Promise.all([
    pool.query('SELECT * FROM prospection_leads WHERE id::text = $1', [String(leadId)]),
    pool.query(`
      SELECT e.*, c.titre as campagne_titre
      FROM prospection_lead_events e
      LEFT JOIN prospection_campagnes c ON e.campagne_id = c.id
      WHERE e.lead_id::text = $1
      ORDER BY e.created_at ASC
    `, [String(leadId)]),
    pool.query(`
      SELECT * FROM prospection_messages_log
      WHERE lead_id::text = $1
      ORDER BY created_at ASC
    `, [String(leadId)])
  ]);

  if (!resLead.rows.length) return null;
  const lead = resLead.rows[0];

  // Reconstitution synthétique chronologique si événements vides
  const events = [...resEvents.rows];
  if (events.length === 0) {
    events.push({
      id: 'init-collecte',
      type_evenement: 'collecte',
      canal: 'source',
      description: `Prospect collecté via la source [${lead.source}]`,
      created_at: lead.created_at,
    });
    if (lead.score > 0) {
      events.push({
        id: 'init-qualification',
        type_evenement: 'qualification',
        canal: 'crm',
        description: `Lead qualifié (Score: ${lead.score}/100, Fit: ${lead.fit_score}/100)`,
        created_at: lead.created_at,
      });
    }
    for (const m of resMsgs.rows) {
      events.push({
        id: m.id,
        type_evenement: m.statut === 'envoye' ? 'message_envoye' : 'erreur_envoi',
        canal: m.canal,
        description: `Envoi message WhatsApp (${m.statut})`,
        metadata: { message: m.message_envoye, erreur: m.erreur },
        created_at: m.created_at,
      });
    }
    if (lead.statut === 'converti') {
      events.push({
        id: 'init-converti',
        type_evenement: 'boutique_creee',
        canal: 'whatsapp',
        description: 'Conversion réussie : Boutique en ligne Nopalou créée et active !',
        created_at: lead.derniere_action_at || lead.updated_at,
      });
    }
  }

  return {
    lead,
    scoring_explications: lead.scoring_details ? (typeof lead.scoring_details === 'string' ? JSON.parse(lead.scoring_details) : lead.scoring_details) : [],
    timeline: events,
  };
}

module.exports = {
  ensureProspectionTables,
  estNomPropreAuthentique,
  normaliserTelephoneSenegal,
  toTitleCase,
  traiterSpintax,
  TEMPLATES_PAR_DEFAUT,
  DICTIONNAIRE_QUARTIERS,
  detecterQuartier,
  nettoyerNomBoutique,
  nettoyerContactNom,
  estLeadEmploiOuInvalide,
  nettoyerEtEnrichirLead,
  nettoyerTousLesLeadsBdd,
  interpolerMessage,
  genererLienWhatsApp,
  extraireLeadsDepuisTexte,
  calculerLeadQualityScore,
  calculerNopalouFitScore,
  calculerEngagementScore,
  calculerConversionScore,
  calculerContactabilityScore,
  evaluerLeadComplet,
  resoudreTemplatePourLead,
  autoSourcerDepuisAnnonces,
  genererRequetesDorking,
  lancerCampagne,
  diagnostiquerCampagne,
  analyserToutesLesCampagnes,
  recommanderProchaineCampagne,
  obtenirTimelineLead,
};
