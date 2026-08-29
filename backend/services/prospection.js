// backend/services/prospection.js — Moteur d'automatisation et de collecte de leads (Nopalou)
const { pool } = require('../models/db');
const { sendWhatsAppText, normalisePhone, estDesinscrit } = require('./whatsapp');

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

const FOOTER_OPTOUT = '\n\n_Pour ne plus recevoir de message de notre part, répondez simplement STOP._';

// ── Templates de prospection sénégalaise haute performance ───────────────────
const TEMPLATES_PAR_DEFAUT = [
  {
    id: 'creation_whatsapp_30s',
    titre: '⚡ Création 100% WhatsApp en 30s — Zéro Ordinateur, Zéro Formulaire',
    canal: 'whatsapp',
    categorie: 'general',
    texte: `{Salam|Bonjour} {nom_boutique} ! 👋

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
    texte: `{Salam alaykoum|Bonjour} {nom_boutique} ! 📦

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
    texte: `{Salam|Bonjour} {nom_boutique} ! 👋

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
    texte: `{Salam alaykoum|Bonjour} {nom_boutique} ! 📱

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
    texte: `{Salam|Bonjour} {nom_boutique} ! 🚗

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
    texte: `{Salam|Bonjour} {nom_boutique} ! 🏠

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
    texte: `{Salam|Bonjour} {nom_boutique} ! 👋

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
    texte: `{Salam|Bonjour} {nom_boutique} ! 👋

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
    texte: `{Bonjour|Salam} {nom_boutique} ! 📦

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
  if (
    texte.includes('cherche travail') ||
    texte.includes('cherche emploi') ||
    texte.includes('cherche un travail') ||
    texte.includes('chercheuse d\'emploi') ||
    texte.includes('demande d\'emploi') ||
    texte.includes('agent de securite') ||
    texte.includes('agents de séc') ||
    texte.includes('recrutement femmes') ||
    texte.includes('chauffeur cherche') ||
    texte.includes('cherche stage') ||
    texte.includes('recherche d\'emploi') ||
    texte.includes('recherche emploi') ||
    texte.includes('call center') ||
    texte.includes('avis de recherche') ||
    texte.includes('perte de piece') ||
    texte.includes('perdu cle') ||
    texte.includes('donne contre bon soin')
  ) {
    return true;
  }

  return false;
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

  return {
    nom_boutique: nomPropre,
    contact_nom: contactNom,
    quartier: quartierFinal,
    categorie: rawCat,
    statut: estInvalide ? 'invalide' : (lead.statut === 'invalide' ? 'nouveau' : (lead.statut || 'nouveau')),
    notes: estInvalide ? (lead.notes ? `${lead.notes} | Hors-cible (Emploi/Recrutement)` : 'Hors-cible (Emploi/Recrutement)') : lead.notes,
  };
}

async function nettoyerTousLesLeadsBdd() {
  // 1. Garantir l'existence de toutes les colonnes requises
  try {
    await pool.query(`
      ALTER TABLE prospection_leads ADD COLUMN IF NOT EXISTS nom_boutique VARCHAR(255);
      ALTER TABLE prospection_leads ADD COLUMN IF NOT EXISTS contact_nom VARCHAR(150);
      ALTER TABLE prospection_leads ADD COLUMN IF NOT EXISTS telephone VARCHAR(50);
      ALTER TABLE prospection_leads ADD COLUMN IF NOT EXISTS telephone_brut VARCHAR(100);
      ALTER TABLE prospection_leads ADD COLUMN IF NOT EXISTS operateur VARCHAR(50) DEFAULT 'Orange';
      ALTER TABLE prospection_leads ADD COLUMN IF NOT EXISTS email VARCHAR(255);
      ALTER TABLE prospection_leads ADD COLUMN IF NOT EXISTS categorie VARCHAR(100) DEFAULT 'mode';
      ALTER TABLE prospection_leads ADD COLUMN IF NOT EXISTS ville VARCHAR(100) DEFAULT 'Dakar';
      ALTER TABLE prospection_leads ADD COLUMN IF NOT EXISTS quartier VARCHAR(150);
      ALTER TABLE prospection_leads ADD COLUMN IF NOT EXISTS source VARCHAR(100) DEFAULT 'manuel';
      ALTER TABLE prospection_leads ADD COLUMN IF NOT EXISTS statut VARCHAR(50) DEFAULT 'nouveau';
      ALTER TABLE prospection_leads ADD COLUMN IF NOT EXISTS score INT DEFAULT 0;
      ALTER TABLE prospection_leads ADD COLUMN IF NOT EXISTS notes TEXT;
      ALTER TABLE prospection_leads ADD COLUMN IF NOT EXISTS derniere_action_at TIMESTAMPTZ;
      ALTER TABLE prospection_leads ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
      ALTER TABLE prospection_leads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
    `);
  } catch (errAlter) {
    console.warn('[PROSPECTION] ALTER TABLE inline warning:', errAlter.message);
  }

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

      if (changed) {
        await pool.query(`
          UPDATE prospection_leads
          SET
            nom_boutique = $1,
            contact_nom = $2,
            quartier = $3,
            categorie = $4,
            statut = $5,
            notes = $6,
            updated_at = NOW()
          WHERE id = $7
        `, [enrichi.nom_boutique, enrichi.contact_nom, enrichi.quartier, enrichi.categorie, enrichi.statut, enrichi.notes, lead.id]);
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
function estNomPropreAuthentique(nom) {
  if (!nom || typeof nom !== 'string') return false;
  const str = nom.trim();
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
    'maison', 'ameublement', 'alimentation & supérette', 'alimentation', 'superette',
    'beauté & cosmétique', 'beaute & cosmetique', 'grossiste arrivages', 'grossiste',
    'services', 'service', 'de livraison', 'enseigne', 'divers', 'mixte', 'général', 'general'
  ];

  if (GENERIQUES.includes(low)) return false;

  // Détection de catégories pures ou expressions génériques
  if (
    /^(boutique|vendeur|commerce|magasin|agence|groupe|grossiste)\s+(mode|tech|informatique|auto|immo|véhicules|vehicules|electromenager|beaute|maison|alimentation)$/i.test(str) ||
    /^(agence\s+immobilière|vendeur\s+véhicules|boutique\s+mode|commerce\s+&\s+boutique)/i.test(str)
  ) {
    return false;
  }

  // Pollutions techniques : numéros de téléphone, indicatifs, slashs, emails, urls
  if (/\d{3,}/.test(str) || /\//.test(str) || /wa\.me/i.test(str) || /@/.test(str)) {
    return false;
  }

  // Pollutions de petites annonces et titres d'articles
  if (
    /^(dakar|senegal|thies|mbour|touba)\s*,\s*/i.test(str) ||
    /^(dakar|senegal|thies|mbour|touba)\s+(ville|région|region|sn|senegal)\b/i.test(str) ||
    /\b(disponible|disponibi|livraison|groupée|groupee|arrivage|promo|hyundai|tucson|lite\s*5g|galaxy|iphone|peugeot|terrain|appartement|chambre)\b/i.test(str)
  ) {
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

  // Nom ou prénom cible pour les salutations
  let salutationTarget = null;
  if (estPrenomAuth) {
    salutationTarget = toTitleCase(rawPrenom);
  } else if (estNomBoutiqueAuth) {
    salutationTarget = toTitleCase(rawNom);
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

  // 3. Remplacement des formules de salutation directes contenant {nom_boutique} ou {prenom}
  // Supprime proprement le nom s'il est générique (ex: "Salam Mode !" -> "Salam !")
  message = message.replace(/(salam(?:\s+alaykoum)?|bonjour|hello)\s+\{prenom\}\s*\(\s*\{nom_boutique\}\s*\)\s*!/gi, (match, salut) => {
    if (estPrenomAuth && estNomBoutiqueAuth) {
      return `${salut} ${salutationTarget} (${toTitleCase(rawNom)}) !`;
    }
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

// ── Auto-Sourcing depuis les Annonces & Commerces Existants ───────────────────
async function autoSourcerDepuisAnnonces() {
  try {
    const resAnnonces = await pool.query(`
      SELECT contact_nom, contact_tel, titre, categorie_slug, quartier, ville
      FROM annonces_classifiees
      WHERE contact_tel IS NOT NULL AND contact_tel != '' AND contact_tel != 'Voir sur Facebook'
      ORDER BY created_at DESC
      LIMIT 1000
    `);

    let inseres = 0;
    let doublons = 0;

    for (const a of resAnnonces.rows) {
      const norm = normaliserTelephoneSenegal(a.contact_tel);
      if (!norm.valide) continue;

      if (estDesinscrit && (await estDesinscrit(norm.national))) continue;

      // Filtrer les annonces d'emploi
      if (a.categorie_slug === 'emploi' || a.categorie_slug === 'recrutement') continue;

      const quartierDetecte = detecterQuartier(`${a.titre || ''} ${a.quartier || ''} ${a.ville || ''}`) || a.quartier || a.ville || 'Dakar';
      const nomNettoye = a.contact_nom ? toTitleCase(a.contact_nom) : nettoyerNomBoutique(a.titre, a.categorie_slug || 'mode', quartierDetecte);
      const categorie = a.categorie_slug || 'mode';
      const source = 'annonces_classifiees';

      try {
        const query = `
          INSERT INTO prospection_leads (
            nom_boutique, contact_nom, telephone, telephone_brut, operateur,
            categorie, ville, quartier, source, statut
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'nouveau')
          ON CONFLICT (telephone) DO NOTHING
          RETURNING id
        `;
        const values = [nomNettoye, a.contact_nom ? toTitleCase(a.contact_nom) : null, norm.national, norm.brut, norm.operateur, categorie, a.ville || 'Dakar', quartierDetecte, source];
        const resDb = await pool.query(query, values);
        if (resDb.rows.length > 0) inseres++;
        else doublons++;
      } catch (e) {
        // Ignore single row err
      }
    }

    return { success: true, trouves: resAnnonces.rows.length, inseres, doublons };
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
    await pool.query(`
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
        notes              TEXT,
        derniere_action_at TIMESTAMPTZ,
        created_at         TIMESTAMPTZ DEFAULT NOW(),
        updated_at         TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS prospection_campagnes (
        id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        titre              VARCHAR(255) NOT NULL,
        canal              VARCHAR(50) NOT NULL DEFAULT 'whatsapp',
        statut             VARCHAR(50) NOT NULL DEFAULT 'brouillon',
        template_message   TEXT NOT NULL,
        sujet_email        VARCHAR(255),
        nb_total           INT DEFAULT 0,
        nb_envoyes         INT DEFAULT 0,
        nb_succes          INT DEFAULT 0,
        nb_echecs          INT DEFAULT 0,
        metadonnees        JSONB DEFAULT '{}',
        created_at         TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS prospection_messages_log (
        id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        campagne_id        UUID,
        lead_id            UUID,
        canal              VARCHAR(50) NOT NULL,
        destinataire       VARCHAR(255) NOT NULL,
        message_envoye     TEXT NOT NULL,
        statut             VARCHAR(50) DEFAULT 'envoye',
        erreur             TEXT,
        created_at         TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS whatsapp_blacklist (
        phone              VARCHAR(50) PRIMARY KEY,
        reason             VARCHAR(255) DEFAULT 'optout',
        created_at         TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_prospection_leads_tel ON prospection_leads(telephone);
      CREATE INDEX IF NOT EXISTS idx_prospection_leads_statut ON prospection_leads(statut);
      CREATE INDEX IF NOT EXISTS idx_prospection_leads_cat ON prospection_leads(categorie);
      CREATE INDEX IF NOT EXISTS idx_prospection_leads_date ON prospection_leads(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_prospection_target ON prospection_leads(statut, categorie, quartier);
      CREATE INDEX IF NOT EXISTS idx_prospection_campagnes_date ON prospection_campagnes(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_prospection_log_campagne ON prospection_messages_log(campagne_id);
      CREATE INDEX IF NOT EXISTS idx_prospection_log_lead ON prospection_messages_log(lead_id);
      CREATE INDEX IF NOT EXISTS idx_prospection_log_date ON prospection_messages_log(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_prospection_log_camp_date ON prospection_messages_log(campagne_id, created_at DESC);
    `);
  } catch (err) {
    console.warn('[PROSPECTION] ensureProspectionTables warning:', err.message);
  }
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
  let index = 0;

  for (const lead of leads) {
    index++;

    // Vérification stricte de désinscription / Blacklist
    if (lead.telephone && (await estDesinscrit(lead.telephone))) {
      await pool.query("UPDATE prospection_leads SET statut = 'desinscrit', updated_at = NOW() WHERE id = $1", [lead.id]);
      continue;
    }

    const messageFinal = interpolerMessage(templateMessage, lead);
    let statutEnvoi = simulation ? 'simule' : 'echec';
    let erreurEnvoi = null;

    if (!simulation) {
      if (canal === 'whatsapp') {
        try {
          await sendWhatsAppText(lead.telephone, messageFinal);
          statutEnvoi = 'envoye';
          nbSucces++;
        } catch (err) {
          erreurEnvoi = err.response?.data?.error?.message || err.message;
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

    // Logger le message
    try {
      await pool.query(`
        INSERT INTO prospection_messages_log (
          campagne_id, lead_id, canal, destinataire, message_envoye, statut, erreur
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [campagneId || null, lead.id, canal, lead.telephone || lead.email, messageFinal, statutEnvoi, erreurEnvoi]);

      // Mettre à jour le statut du lead si envoyé avec succès
      if (statutEnvoi === 'envoye') {
        await pool.query(`
          UPDATE prospection_leads
          SET statut = 'contacte_wa', derniere_action_at = NOW(), updated_at = NOW()
          WHERE id = $1
        `, [lead.id]);
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

  // Mettre à jour la campagne si présente
  if (campagneId) {
    try {
      await pool.query(`
        UPDATE prospection_campagnes
        SET nb_envoyes = nb_envoyes + $1, nb_succes = nb_succes + $2, nb_echecs = nb_echecs + $3, statut = 'terminee'
        WHERE id::text = $4::text
      `, [leads.length, nbSucces, nbEchecs, String(campagneId)]);
    } catch (cmpErr) {
      console.warn('[PROSPECTION] Update campagne warning:', cmpErr.message);
    }
  }

  return {
    total: leads.length,
    nbSucces,
    nbEchecs,
    simulation,
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
  autoSourcerDepuisAnnonces,
  genererRequetesDorking,
  lancerCampagne,
};
