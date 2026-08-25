// backend/services/prospection.js — Moteur d'automatisation et de collecte de leads (Nopalou)
const { pool } = require('../models/db');
const { sendWhatsAppText, normalisePhone, estDesinscrit } = require('./whatsapp');

// ── Normalisation des numéros de téléphone pour le Sénégal ───────────────────
function normaliserTelephoneSenegal(rawPhone) {
  if (!rawPhone) return { valide: false, erreur: 'Numéro vide' };

  let brut = String(rawPhone).trim();
  let num = brut.replace(/[^\d+]/g, '');

  if (num.startsWith('+221')) num = num.slice(4);
  else if (num.startsWith('00221')) num = num.slice(5);
  else if (num.startsWith('221') && num.length >= 11) num = num.slice(3);
  
  num = num.replace(/[^\d]/g, '');

  // Au Sénégal, les numéros mobiles font 9 chiffres et commencent par 70, 75, 76, 77, 78
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
  else if (num.startsWith('33') || num.startsWith('30')) operateur = 'Fixe';

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
    id: 'mode_pret_a_porter',
    titre: '👗 Mode & Prêt-à-Porter — WhatsApp 1-Clic & 0% Commission',
    canal: 'whatsapp',
    categorie: 'mode',
    texte: `Salam {nom_boutique} ! 👋

J'ai vu vos magnifiques modèles. Vous perdez sûrement beaucoup de temps à envoyer les photos, tailles et prix un par un à chaque client sur WhatsApp.

Avec Nopalou (https://nopalou.com), vous avez votre boutique en ligne prête en 2 minutes :
✅ Vos clients voient vos collections et commandent seuls en 1 clic
✅ Paiement direct Wave & Orange Money sur votre compte (0% de commission)
✅ Caisse enregistreuse POS & Carnet de dettes inclus
🎁 Le 1er mois est 100% OFFERT sans engagement !

Découvrez une boutique démo ici : https://nopalou.com/guide-creer-boutique

Voulez-vous que je vous active votre lien test gratuit aujourd'hui ?` + FOOTER_OPTOUT
  },
  {
    id: 'tech_telephonie',
    titre: '📱 Téléphonie & High-Tech — Comparateur & Scanner Codes-barres',
    canal: 'whatsapp',
    categorie: 'tech',
    texte: `Salam alaykoum {nom_boutique} ! 📱

Dans la téléphonie à Dakar, les prix changent vite et les clients comparent tout.

Avec Nopalou, votre boutique est référencée sur le comparateur N°1 au Sénégal :
✅ Visibilité directe auprès de milliers d'acheteurs à Dakar
✅ Caisse tactile avec scanner de codes-barres par caméra
✅ Devis & Factures OHADA proformats en PDF en 10 secondes
🎁 30 jours 100% gratuits pour booster vos ventes !

Lien d'inscription gratuite : https://nopalou.com/creer-boutique?plan=pro

Pouvons-nous configurer vos 3 premiers téléphones ensemble ?` + FOOTER_OPTOUT
  },
  {
    id: 'carnet_dettes',
    titre: '📒 Carnet de Dettes ("Bor") — Relances Polies WhatsApp Automatiques',
    canal: 'whatsapp',
    categorie: 'general',
    texte: `Salam {prenom} ({nom_boutique}) ! 👋

Combien d'argent dort dehors dans des dettes clients oubliées sur des cahiers papier ?

Nopalou intègre le Carnet de Dettes intelligent pour commerçants :
📒 Vous notez les crédits clients en 5 secondes sur votre téléphone
🔔 Vous envoyez des rappels polis sur WhatsApp en 1 seul clic
📊 Vous suivez vos encaissements Wave et vos marges nettes
🎁 1er mois 100% offert sans carte bancaire !

Testez gratuitement dès maintenant : https://nopalou.com/tarifs-boutique` + FOOTER_OPTOUT
  },
  {
    id: 'sourcing_alibaba',
    titre: '📦 Arrivages Chine & Grossistes — Vente Flash sur WhatsApp',
    canal: 'whatsapp',
    categorie: 'grossiste',
    texte: `Bonjour {nom_boutique} ! 📦

Vous vendez des arrivages de Chine (Alibaba, AliExpress, Shein, 1688) ou Turquie ?

Fini le désordre des photos perdues dans vos statuts :
✨ Publiez votre arrivage en 2 minutes avec vos prix en FCFA
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

Je me permets de vous contacter car je suis de près le développement de {nom_boutique} à {quartier}.

Contrairement aux plateformes étrangères comme Shopify qui exigent une carte bancaire en devises ($29/mois) et ne gèrent pas nativement le paiement Wave, Nopalou est la solution e-commerce et caisse magasin conçue pour le Sénégal :

• Vitrine web connectée directement à votre WhatsApp
• Caisse tactile POS magasin (fonctionne même sans connexion Internet)
• Encaissement direct Wave & Orange Money (0% de commission)
• Facturation normalisée OHADA avec NINEA et RCCM
• Suivi des stocks et clôtures de caisse (Rapports Z)

Nous vous offrons 30 jours d'essai gratuit pour équiper vos magasins :
👉 https://nopalou.com/tarifs-boutique

Seriez-vous disponible pour un échange rapide de 5 minutes cette semaine ?

Bien cordialement,
L'équipe Déploiement Nopalou Sénégal
+221 77 000 00 00` + '\n\nPour vous désinscrire de nos communications, répondez STOP à cet email.'
  }
];

// ── Dictionnaire des Quartiers et Marchés de Dakar & Régions ───────────────
const DICTIONNAIRE_QUARTIERS = [
  'Sandaga', 'HLM', 'Colobane', 'Petersen', 'Centenaire', 'Maristes', 'Plateau',
  'Almadies', 'Ngor', 'Ouakam', 'Pikine', 'Guédiawaye', 'Guediawaye', 'Keur Massar',
  'Parcelles Assainies', 'Parcelles', 'Tilène', 'Tilene', 'Yoff', 'Fann', 'Mermoz',
  'Grand Yoff', 'Grandyoff', 'Grand Dakar', 'Médina', 'Medina', 'Fass', 'Fann Hock',
  'Point E', 'Sacré-Cœur', 'Sacre Coeur', 'Liberté 6', 'Liberte 6', 'Mamelles',
  'Hann Maristes', 'Hann', 'Bel Air', 'Gibraltar', 'Castors', 'Dieuppeul', 'Derklé',
  'Derkle', 'Bène Tally', 'Bene Tally', 'Geultape', 'Gueule Tapée', 'Lambay', 'Sea Plaza',
  'Thiès', 'Thies', 'Touba', 'Mbour', 'Saint-Louis', 'Ziguinchor', 'Diourbel', 'Kaolack',
  'Rufisque', 'Bargny', 'Diamniadio', 'Saly', 'Somone', 'Fatick', 'Kolda', 'Tambacounda'
];

function detecterQuartier(texte) {
  if (!texte || typeof texte !== 'string') return null;
  for (const q of DICTIONNAIRE_QUARTIERS) {
    const reg = new RegExp(`\\b${q.replace(/[-]/g, '[- ]')}\\b`, 'i');
    if (reg.test(texte)) {
      if (q.toLowerCase() === 'guediawaye') return 'Guédiawaye';
      if (q.toLowerCase() === 'thies') return 'Thiès';
      if (q.toLowerCase() === 'medina') return 'Médina';
      if (q.toLowerCase() === 'tilene') return 'Tilène';
      if (q.toLowerCase() === 'grandyoff') return 'Grand Yoff';
      return q;
    }
  }
  return null;
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

function nettoyerNomBoutique(rawNom, categorie = 'mode', quartier = '') {
  if (!rawNom || typeof rawNom !== 'string') {
    return genererNomBoutiqueParDefaut(categorie, quartier);
  }

  let clean = rawNom.trim();

  // Nettoyer les fuites CSV (ex: Vendeur mode " 221782823518" "Orange" ...)
  if (clean.includes('"') || clean.includes('""')) {
    clean = clean.split('"')[0].trim();
  }

  // Enlever les préfixes d'annonces
  clean = clean.replace(/^(vendeur\s+|annonce\s+|boutique\s+de\s+|contact\s*:?\s*)/i, '').trim();

  // Détection de marques ou magasins authentiques connus dans le texte
  const matchBoutique = clean.match(/(?:chez|boutique|store|shop|bar à parfum|service)\s+([A-Za-z0-9À-ÿ\s&'-]{3,30})/i);
  if (matchBoutique && matchBoutique[1]) {
    const nomExtrait = matchBoutique[1].trim();
    if (!/^\d+/.test(nomExtrait) && nomExtrait.length > 2 && nomExtrait.length < 35) {
      return nomExtrait.charAt(0).toUpperCase() + nomExtrait.slice(1);
    }
  }

  // Si le nom est un titre d'annonce descriptive ou trop long
  const estTitreAnnonce = (
    clean.length > 35 ||
    /^(prix|disponible|à vendre|a vendre|cherche|contact|suivre|recrutement|appartement|peugeot|mercedes|hyundai|kia|daewoo|service de livraison|10 h|terrains|chambre|bana bana|tout nickel|débardeur|dentelle|tablette|télévision|lg|machine|cover|summer scents|parfum dakar|faites vos|new arrival|livraison|n'hésitez|ouvert|ferme|wax|terrain)/i.test(clean) ||
    clean.includes('·') ||
    clean.includes('http') ||
    /\d{5,}/.test(clean) ||
    clean.length < 3
  );

  if (estTitreAnnonce) {
    const matchNomCourt = clean.match(/^([A-Za-zÀ-ÿ]{3,20}\s+(?:Store|Shop|Boutique|Services?|Business|Couture|Tech|Auto|Immo|Design))/i);
    if (matchNomCourt) {
      return matchNomCourt[1].trim();
    }
    return genererNomBoutiqueParDefaut(categorie, quartier);
  }

  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function estLeadEmploiOuInvalide(lead) {
  const cat = String(lead.categorie || '').toLowerCase();
  if (cat === 'emploi' || cat === 'recrutement' || cat === 'stage') return true;

  const texte = `${lead.nom_boutique || ''} ${lead.notes || ''} ${lead.contact_nom || ''}`.toLowerCase();
  if (
    texte.includes('cherche travail') ||
    texte.includes('cherche emploi') ||
    texte.includes('cherche un travail') ||
    texte.includes('agent de securite') ||
    texte.includes('agents de séc') ||
    texte.includes('recrutement femmes') ||
    texte.includes('chauffeur cherche') ||
    texte.includes('cherche stage') ||
    texte.includes('recherche d\'emploi') ||
    texte.includes('recherche emploi') ||
    texte.includes('call center')
  ) {
    return true;
  }

  return false;
}

function nettoyerEtEnrichirLead(lead) {
  const rawNom = lead.nom_boutique || '';
  const rawQuartier = lead.quartier || lead.ville || 'Dakar';
  const rawCat = lead.categorie || 'mode';

  const estInvalide = estLeadEmploiOuInvalide(lead);
  
  // Détection du quartier dans le nom, notes, quartier brut
  const qDetecte = detecterQuartier(`${rawNom} ${lead.notes || ''} ${rawQuartier}`);
  const quartierFinal = qDetecte || (rawQuartier !== 'Dakar' ? rawQuartier : 'Dakar');
  
  const nomPropre = nettoyerNomBoutique(rawNom, rawCat, quartierFinal);
  
  let contactNom = lead.contact_nom;
  if (!contactNom || contactNom.toLowerCase() === 'responsable' || contactNom.length < 2 || contactNom.includes('"') || contactNom.length > 30) {
    contactNom = null;
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
  const { rows: leads } = await pool.query('SELECT * FROM prospection_leads');
  let nettoyes = 0;
  let invalidesEmploi = 0;
  let quartiersEnrichis = 0;

  for (const lead of leads) {
    const enrichi = nettoyerEtEnrichirLead(lead);

    let changed = false;
    if (enrichi.nom_boutique !== lead.nom_boutique) changed = true;
    if (enrichi.contact_nom !== lead.contact_nom) changed = true;
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
          statut = $4,
          notes = $5,
          updated_at = NOW()
        WHERE id = $6
      `, [enrichi.nom_boutique, enrichi.contact_nom, enrichi.quartier, enrichi.statut, enrichi.notes, lead.id]);
      nettoyes++;
    }
  }

  return {
    total: leads.length,
    nettoyes,
    invalidesEmploi,
    quartiersEnrichis,
  };
}

// ── Interpolation dynamique de message ───────────────────────────────────────
function interpolerMessage(template, lead) {
  if (!template) return '';
  let nomBoutique = lead.nom_boutique || '';
  let prenom = lead.contact_nom || '';

  // Si nom de boutique est générique ou un placeholder
  if (
    !nomBoutique ||
    /^vendeur/i.test(nomBoutique) ||
    /^(boutique|commerce|responsable|partenaire)/i.test(nomBoutique) ||
    nomBoutique.includes('·') ||
    nomBoutique.length > 35
  ) {
    nomBoutique = 'votre boutique';
    if (!prenom || prenom.toLowerCase() === 'responsable') {
      prenom = 'Cher commerçant';
    }
  }

  if (!prenom || prenom.toLowerCase() === 'responsable') {
    prenom = (nomBoutique && nomBoutique !== 'votre boutique') ? nomBoutique : 'Cher commerçant';
  }

  const quartier = lead.quartier && lead.quartier !== 'Dakar' ? `à ${lead.quartier}` : 'à Dakar';
  const secteur = lead.categorie || 'commerce';
  const tel = lead.telephone || '';

  return template
    .replace(/\{nom_boutique\}/gi, nomBoutique)
    .replace(/\{prenom\}/gi, prenom)
    .replace(/\{quartier\}/gi, quartier)
    .replace(/\{secteur\}/gi, secteur)
    .replace(/\{telephone\}/gi, tel)
    .replace(/\{lien_demo\}/gi, 'https://nopalou.com/guide-creer-boutique')
    .replace(/\{lien_boutique\}/gi, 'https://nopalou.com/creer-boutique')
    .replace(/\{lien_tarifs\}/gi, 'https://nopalou.com/tarifs-boutique');
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
          contact_nom: defauts.contact_nom || null,
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
      const nomNettoye = a.contact_nom || nettoyerNomBoutique(a.titre, a.categorie_slug || 'mode', quartierDetecte);
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
        const values = [nomNettoye, a.contact_nom || null, norm.national, norm.brut, norm.operateur, categorie, a.ville || 'Dakar', quartierDetecte, source];
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

// ── Exécution de Campagne de Prospection Automatisée ─────────────────────────
async function lancerCampagne({ campagneId, leadIds, canal, templateMessage, simulation = false }) {
  if (!leadIds || leadIds.length === 0) {
    throw new Error('Aucun lead sélectionné');
  }

  // Récupérer les leads
  const { rows: leads } = await pool.query(
    'SELECT * FROM prospection_leads WHERE id = ANY($1::uuid[])',
    [leadIds]
  );

  let nbSucces = 0;
  let nbEchecs = 0;

  for (const lead of leads) {
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

    // Pause anti-ban (1.5s entre les envois si réel)
    if (!simulation) {
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  // Mettre à jour la campagne si présente
  if (campagneId) {
    await pool.query(`
      UPDATE prospection_campagnes
      SET nb_envoyes = nb_envoyes + $1, nb_succes = nb_succes + $2, nb_echecs = nb_echecs + $3, statut = 'terminee'
      WHERE id = $4
    `, [leads.length, nbSucces, nbEchecs, campagneId]);
  }

  return {
    total: leads.length,
    nbSucces,
    nbEchecs,
    simulation,
  };
}

module.exports = {
  normaliserTelephoneSenegal,
  TEMPLATES_PAR_DEFAUT,
  DICTIONNAIRE_QUARTIERS,
  detecterQuartier,
  nettoyerNomBoutique,
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
