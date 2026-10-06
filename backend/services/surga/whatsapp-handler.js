// backend/services/surga/whatsapp-handler.js
// Gestionnaire des commandes WhatsApp pour Surga (Tranche 5)
// Zéro émoji Unicode partout, vouvoiement strict (D19), confirmation avant toute écriture

const { pool } = require('../../models/db');
const { evaluerCalcul, formaterFCFA } = require('./calculator');
const { sendWhatsAppText, normalisePhone } = require('../whatsapp');

const QUOTA_JOURNALIER_GRATUIT = 2;

/**
 * Normalise une chaîne de texte pour le parsing d'intention
 */
function normaliser(texte) {
  if (!texte || typeof texte !== 'string') return '';
  return texte
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Détermine la catégorie d'une dépense par mots-clés
 */
function devinerCategorie(texte) {
  const t = normaliser(texte);
  if (/manger|resto|restaurant|dejeuner|diner|repas|pain|lait|riz|thieb|courses|marche|supermarche|alimentation/i.test(t)) return 'Alimentation';
  if (/taxi|\bcar\b|car rapide|\bbus\b|essence|gasoil|transport|peage|\bcourse\b|\bmoto\b|tiak-tiak|tiak/i.test(t)) return 'Transport';
  if (/loyer|maison|chambre|appartement|electricite|senelec|woyofal|eau|sde|sen'eau/i.test(t)) return 'Logement';
  if (/docteur|medecin|pharmacie|medicament|hopital|sante|clinique/i.test(t)) return 'Santé';
  if (/facture|wifi|internet|orange|wave|forfait|credit|abonnement/i.test(t)) return 'Factures';
  if (/cinema|sortir|cadeau|plage|loisir|sport/i.test(t)) return 'Loisirs';
  return 'Autre';
}

/**
 * Parse l'intention d'un message textuel WhatsApp
 */
function parserIntentionWhatsApp(texteBrut) {
  if (!texteBrut || typeof texteBrut !== 'string') return { intention: 'INCONNU' };

  // Conserver le texte d'origine pour les titres/contenus (accents et casse)
  const texteNettoye = texteBrut.trim().replace(/^surga\s*[:,-]?\s*/i, '').trim();
  let texte = normaliser(texteNettoye);
  if (!texte) return { intention: 'INCONNU' };

  // 1. Confirmations & Annulations
  if (/^(oui|1|confirmer|valider|d'accord|ok)$/.test(texte)) {
    return { intention: 'CONFIRMATION_OUI' };
  }
  if (/^(non|0|annuler|arreter|stop)$/.test(texte)) {
    return { intention: 'CONFIRMATION_NON' };
  }

  // 1.2 Menu d'aide et orientation
  if (/^(aide|help|infos?|commandes?|menu|bonjour|salut|hello)$/.test(texte)) {
    return { intention: 'AIDE' };
  }

  // 1.5 Correction de montant pour une action en attente (ex: "non c'était 3500", "plutôt 3500", "c'est 3500")
  const matchCorrectionMontant = texte.match(/(?:non\s*,?\s*c['’]etait|c['’]etait|plutot|mettre|c['’]est)\s*(\d+(?:[\s.,]\d+)?)\s*(?:fcfa|cfa|f|frs)?/i);
  if (matchCorrectionMontant) {
    const rawVal = matchCorrectionMontant[1].replace(/[\s.,]/g, '');
    const montant = parseInt(rawVal, 10);
    if (montant && montant > 0) {
      return { intention: 'CORRECTION_MONTANT', montant };
    }
  }

  // 2. Briefing
  if (/^(briefing|actu|actualite|actualites|mon briefing)$/.test(texte)) {
    return { intention: 'BRIEFING' };
  }

  // 2.2 Concours & Examens Nationaux (ex: "concours", "examen", "cherche concours douanes", "concours police")
  const matchConcours = texteNettoye.match(/^(?:cherche|recherche|trouve|info|statut|date|dossier|quand(?:\s+a\s+lieu)?(?:\s+le)?|c['’]est\s+quand\s+le)?\s*(?:concours|examens?)(?:\s+(?:de\s+(?:la\s+)?|d['’]\s*)?([a-z0-9\s_-]*))?$/i);
  const matchSigleConcoursDirect = texteNettoye.match(/^(?:cherche|recherche|info|date)?\s*(douanes?|police|ena|gendarmerie|fastef|crem|cfj|sapeurs[- ]pompiers|bnsp|baccalaur[ée]at|bfem|cesti|esp|ensa)\b/i);

  if (matchConcours) {
    return {
      intention: 'SEARCH_CONCOURS',
      query: (matchConcours[1] || '').trim(),
    };
  } else if (matchSigleConcoursDirect && !/(taxi|repas|courses|cfa|fcfa)/i.test(texteNettoye)) {
    return {
      intention: 'SEARCH_CONCOURS',
      query: matchSigleConcoursDirect[1].trim(),
    };
  }

  // 2.3 Bonnes adresses & Lieux / Bon coin Dakar
  if (/^(?:bon\s*coin|bonnes?\s*adresses?|resto|restaurants?|sorties?|lieux?)\b/i.test(texteNettoye)) {
    return { intention: 'SEARCH_PLACES', query: texteNettoye };
  }

  // 2.4 Immobilier certifié
  if (/^(?:immo|immobilier|appartement|appartements?|villa|villas?|studio|studios?|location\s+maison)\b/i.test(texteNettoye) && !/(cfa|fcfa|\d{4,})/i.test(texteNettoye)) {
    return { intention: 'SEARCH_IMMO', query: texteNettoye };
  }

  // 2.5 Météo & Climat Dakar
  if (/^(?:meteo|m[ée]t[ée]o|previsions?\s+meteo|pluie|temperature|quel\s+temps)\b/i.test(texteNettoye)) {
    return { intention: 'CHECK_METEO' };
  }

  // 2.6 Sport & Lutte sénégalaise
  if (/^(?:sport|sports|foot|football|lutte|lamb|classement\s+foot)\b/i.test(texteNettoye)) {
    return { intention: 'CHECK_SPORT' };
  }

  // 2.7 Presse & Kiosque des Unes
  if (/^(?:presse|journaux|kiosque|revue\s+de\s+presse|les\s+unes)\b/i.test(texteNettoye)) {
    return { intention: 'OPEN_PRESSE' };
  }

  // 2.8 Emploi & Recrutement
  if (/^(?:emploi|emplois|offres?\s+d['’]emploi|recrutement|cv|stages?)\b/i.test(texteNettoye)) {
    return { intention: 'SEARCH_EMPLOI', query: texteNettoye };
  }

  // 2.9 Démarches administratives citoyennes (ex: "comment faire mon passeport", "pièces carte identité", "permis")
  const matchDemarche = texteNettoye.match(/^(?:comment\s+(?:faire|obtenir|renouveler)|pi[èe]ces?\s+(?:pour|du)?|d[ée]marche\s+(?:pour)?)\s+([a-z0-9\s_-]+)$/i);
  if (matchDemarche || /(?:passeport|carte\s+d['’]identit[ée]|cni|permis\s+de\s+conduire|casier\s+judiciaire|certificat\s+de\s+nationalit[ée])/i.test(texteNettoye)) {
    let qDemarche = matchDemarche ? matchDemarche[1].trim() : texteNettoye;
    qDemarche = qDemarche.replace(/^(?:comment\s+(?:faire|obtenir|renouveler)|pi[èe]ces?\s+(?:pour|du)?|d[ée]marche\s+(?:pour)?|mon|ma|mes|le|la|les)\s+/gi, '').trim();
    if (qDemarche && /(passeport|identit|cni|permis|casier|nationalit|quittance)/i.test(qDemarche)) {
      return {
        intention: 'SEARCH_DEMARCHES',
        query: qDemarche,
      };
    }
  }

  // 2.10 Trafic routier Dakar Live (ex: "quel est le trafic sur la vdn", "état du trafic", "bouchon corniche")
  const matchTrafic = texteNettoye.match(/^(?:(?:quel\s+est\s+le|point|etat\s+du)\s+)?(?:trafic|circulation|bouchons?|ralentissements?)\s*(?:sur\s+(?:la\s+)?|[àa]\s+(?:la\s+)?|de\s+)?([a-z0-9\s_-]*)$/i);
  if (matchTrafic || /(?:trafic|bouchon|circulation)\s+(vdn|corniche|p[ée]age|autoroute|patte\s+d['’]oie|rn1)/i.test(texteNettoye)) {
    const rawAxe = matchTrafic ? matchTrafic[1].trim() : texteNettoye;
    let axeExtrait = 'global';
    if (/vdn/i.test(rawAxe)) axeExtrait = 'vdn';
    else if (/corniche/i.test(rawAxe)) axeExtrait = 'corniche';
    else if (/p[ée]age|autoroute|a1/i.test(rawAxe)) axeExtrait = 'autoroute';
    else if (/patte\s+d['’]oie/i.test(rawAxe)) axeExtrait = 'patte_d_oie';
    else if (/rn1/i.test(rawAxe)) axeExtrait = 'rn1';

    return {
      intention: 'CHECK_TRAFFIC',
      axe: axeExtrait,
    };
  }

  // 2.11 Radios FM Dakar
  if (/^(?:radio|radios|ecouter\s+(?:la\s+)?radio|rfm|zik\s*fm|rfi|al\s*fayda)\b/i.test(texteNettoye)) {
    return { intention: 'OPEN_RADIO' };
  }

  // 2.12 Séries TV & Vidéos
  if (/^(?:videos?|vid[ée]os?|s[ée]ries?|marodi|evenprod|replay)\b/i.test(texteNettoye)) {
    return { intention: 'OPEN_VIDEOS' };
  }

  // 2.13 Agenda & Calendrier
  if (/^(?:agenda|calendrier|[ée]v[ée]nements?|planning)\b/i.test(texteNettoye)) {
    return { intention: 'OPEN_AGENDA' };
  }

  // 2.14 Dépenses & Kalpé (sans chiffre de dépense directe)
  if (/^(?:d[ée]penses?|budget|kalp[ée]|portefeuille|mes\s+d[ée]penses)$/i.test(texteNettoye)) {
    return { intention: 'OPEN_DEPENSES' };
  }

  // 2.15 Compte & Profil
  if (/^(?:compte|profil|param[èe]tres|mon\s+compte)$/i.test(texteNettoye)) {
    return { intention: 'OPEN_COMPTE' };
  }

  // 2.16 Premium & Abonnement
  if (/^(?:premium|abonnement|pass\s+premium)$/i.test(texteNettoye)) {
    return { intention: 'OPEN_PREMIUM' };
  }

  // 2.17 Espace Pro B2B
  if (/^(?:pro|espace\s+pro|b2b|partenaire|partenaires)$/i.test(texteNettoye)) {
    return { intention: 'OPEN_PRO' };
  }

  // 2.18 Notes & Mémos
  if (/^(?:notes?|mes\s+notes|carnet|memos?)$/i.test(texteNettoye)) {
    return { intention: 'OPEN_NOTES' };
  }

  // 3. Calculatrice
  if (/^(?:calculatrice|calculette|ouvr(?:ir|e)?\s+la\s+calculatrice)$/i.test(texteNettoye)) {
    return { intention: 'OPEN_CALCULATOR' };
  }
  const matchCalcul = texteNettoye.match(/^(?:calcule|combien fait|calcul)\s+(.+)$/i);
  if (matchCalcul) {
    return { intention: 'CALCULATE', expression: matchCalcul[1].trim() };
  }
  if (/^[0-9+\-*/().%×÷,\s]{3,}$/.test(texteNettoye) && /[+\-*/×÷%]/.test(texteNettoye)) {
    return { intention: 'CALCULATE', expression: texteNettoye };
  }

  // 4. Rappel (Cas 1, 2, 3 de l'audit : demain, dans X min, récurrent tous les jours)
  const matchRappel = texteNettoye.match(/^(?:rappel|rappelle(?:-moi)?)\s+(.+)$/i);
  if (matchRappel) {
    let reste = matchRappel[1].trim();
    const nowUtc = new Date();
    let targetDate = new Date();
    let repetition = 'AUCUNE';
    let heure = null;

    // Détection de la récurrence
    if (/tous les jours|chaque jour|quotidien/i.test(reste)) {
      repetition = 'QUOTIDIEN';
      reste = reste.replace(/tous les jours|chaque jour|quotidien/gi, '').trim();
    } else if (/toutes les semaines|chaque semaine|hebdomadaire/i.test(reste)) {
      repetition = 'HEBDOMADAIRE';
      reste = reste.replace(/toutes les semaines|chaque semaine|hebdomadaire/gi, '').trim();
    } else if (/tous les mois|chaque mois|mensuel/i.test(reste)) {
      repetition = 'MENSUEL';
      reste = reste.replace(/tous les mois|chaque mois|mensuel/gi, '').trim();
    }

    // Détection de durée relative (ex: "dans 30 minutes", "dans 15 min", "dans 2 heures")
    const matchDansMin = reste.match(/dans\s+(\d+)\s*(?:minute|minutes|min)\b/i);
    const matchDansHeure = reste.match(/dans\s+(\d+)\s*(?:heure|heures|h)\b/i);

    if (matchDansMin) {
      const minutesAjoutees = parseInt(matchDansMin[1], 10);
      targetDate = new Date(nowUtc.getTime() + minutesAjoutees * 60000);
      const hh = String(targetDate.getUTCHours()).padStart(2, '0');
      const mm = String(targetDate.getUTCMinutes()).padStart(2, '0');
      heure = `${hh}:${mm}`;
      reste = reste.replace(matchDansMin[0], '').trim();
    } else if (matchDansHeure) {
      const heuresAjoutees = parseInt(matchDansHeure[1], 10);
      targetDate = new Date(nowUtc.getTime() + heuresAjoutees * 3600000);
      const hh = String(targetDate.getUTCHours()).padStart(2, '0');
      const mm = String(targetDate.getUTCMinutes()).padStart(2, '0');
      heure = `${hh}:${mm}`;
      reste = reste.replace(matchDansHeure[0], '').trim();
    }

    // Détection de "demain"
    if (/demain/i.test(reste)) {
      targetDate.setDate(targetDate.getDate() + 1);
      reste = reste.replace(/demain/gi, '').trim();
    }

    // Détection d'heure explicite (ex: 8h, 8h30, 14:00, 14h30)
    const matchHeure = reste.match(/(\d{1,2})(?:h|:)(\d{2})?/i);
    if (matchHeure && !heure) {
      const h = String(parseInt(matchHeure[1], 10)).padStart(2, '0');
      const m = String(parseInt(matchHeure[2] || '0', 10)).padStart(2, '0');
      heure = `${h}:${m}`;
      reste = reste.replace(matchHeure[0], '').replace(/\b(?:à|a)\b/gi, '').trim();
    }

    let date = targetDate.toISOString().slice(0, 10);
    let titre = reste.replace(/\b(?:à|a|de|pour)\b/gi, ' ').replace(/\s+/g, ' ').trim();

    return {
      intention: 'ADD_REMINDER',
      titre: titre || 'Rappel Surga',
      date,
      heure: heure || '09:00',
      repetition,
    };
  }

  // 5. Dépense (ex: "note 2500 transport", "j'ai dépensé 2500 taxi", "2500 fcfa courses")
  const regexMontant = /(\d+(?:[\s.,]\d+)?)\s*(?:fcfa|cfa|f|frs)?/i;
  const matchMontant = texte.match(regexMontant);

  if (matchMontant && (/^(note|depense|dépense|j'ai depense|j'ai dépensé|j'ai paye|j'ai payé|j'ai achete|achat)/.test(texte) || /(cfa|fcfa)/.test(texte) || /^(taxi|courses|repas|pain|dejeuner)/.test(texte))) {
    const rawVal = matchMontant[1].replace(/[\s.,]/g, '');
    const montant = parseInt(rawVal, 10);
    if (montant && montant > 0) {
      let libelle = texteNettoye
        .replace(/^(note|depense|dépense|j'ai depense|j'ai dépensé|j'ai paye|j'ai payé|j'ai achete|achat)\s*/i, '')
        .replace(matchMontant[0], '')
        .replace(/\bde\b|\bpour\b/gi, '')
        .trim();

      const categorie = devinerCategorie(libelle || texte);
      return {
        intention: 'ADD_EXPENSE',
        montant,
        categorie,
        note: libelle || categorie,
      };
    }
  }

  // 6. Note textuelle
  const matchNote = texteNettoye.match(/^(?:note|ajouter note|memo)\s+(.+)$/i);
  if (matchNote) {
    const contenu = matchNote[1].trim();
    return {
      intention: 'ADD_NOTE',
      titre: contenu.slice(0, 60),
      contenu,
    };
  }

  // Mot seul "note" ou "notes" ou "carnet" -> Consultation du carnet
  if (/^(?:notes?|mes\s+notes|carnet|bloc[- ]notes?)$/i.test(texteNettoye)) {
    return { intention: 'OPEN_NOTES' };
  }

  return { intention: 'INCONNU' };
}

/**
 * Vérifie et incrémente le quota journalier d'un utilisateur
 */
async function verifierQuota(phone, isVocal = false) {
  const normPh = normalisePhone(phone);
  try {
    // Vérification préalable du statut Premium
    const suffixe = normPh.slice(-9);
    const aboCheck = await pool.query(
      `SELECT id FROM surga_abonnements
       WHERE (phone = $1 OR phone LIKE '%' || $2)
         AND statut = 'actif'
         AND fin > NOW()
       LIMIT 1`,
      [normPh, suffixe]
    );

    const estPremium = aboCheck.rows.length > 0;

    const res = await pool.query(
      `INSERT INTO surga_quotas (phone, date_jour, nb_commandes, nb_vocaux, quota_max_gratuit)
       VALUES ($1, CURRENT_DATE, 1, $2, $3)
       ON CONFLICT (phone, date_jour) DO UPDATE SET
         nb_commandes = surga_quotas.nb_commandes + 1,
         nb_vocaux = surga_quotas.nb_vocaux + $2,
         updated_at = NOW()
       RETURNING nb_commandes, quota_max_gratuit`,
      [normPh, isVocal ? 1 : 0, estPremium ? 99999 : QUOTA_JOURNALIER_GRATUIT]
    );

    const { nb_commandes, quota_max_gratuit } = res.rows[0];
    return estPremium || nb_commandes <= quota_max_gratuit;
  } catch (err) {
    console.warn('[SURGA QUOTA CHECK ERR]:', err.message);
    return true; // En cas d'erreur de base, on ne bloque pas l'utilisateur
  }
}

/**
 * Trouve l'identifiant utilisateur lié au numéro de téléphone
 */
async function trouverUserIdParTelephone(phone) {
  const normPh = normalisePhone(phone);
  const suffixe = normPh.slice(-9);
  try {
    const res = await pool.query(
      `SELECT id FROM utilisateurs
       WHERE telephone = $1 OR telephone = $2 OR telephone LIKE '%' || $3
       LIMIT 1`,
      [phone, normPh, suffixe]
    );
    return res.rows[0]?.id || null;
  } catch {
    return null;
  }
}

/**
 * Trouve ou auto-provisionne l'utilisateur lié au numéro de téléphone
 * Éradication de la perte silencieuse d'écritures pour les nouveaux utilisateurs
 */
async function obtenirOuCreerUserId(phone) {
  const normPh = normalisePhone(phone);
  let userId = await trouverUserIdParTelephone(normPh);
  if (userId) return userId;

  if (!pool) return null;

  try {
    const nomDefaut = `Utilisateur Surga ${normPh.slice(-4)}`;
    const emailDefaut = `surga_${normPh.replace(/\D/g, '')}@nopalou.local`;
    const res = await pool.query(
      `INSERT INTO utilisateurs (nom, telephone, email, role, actif)
       VALUES ($1, $2, $3, 'client', TRUE)
       ON CONFLICT (email) DO UPDATE SET telephone = EXCLUDED.telephone
       RETURNING id`,
      [nomDefaut, normPh, emailDefaut]
    );
    return res.rows[0]?.id || null;
  } catch (err) {
    console.error('[SURGA AUTO-PROVISION USER ERR]:', err.message);
    try {
      const retry = await pool.query(
        'SELECT id FROM utilisateurs WHERE telephone = $1 OR telephone = $2 LIMIT 1',
        [phone, normPh]
      );
      return retry.rows[0]?.id || null;
    } catch {
      return null;
    }
  }
}

/**
 * Traite un message entrant WhatsApp pour Surga
 * Retourne true si le message a été intercepté et traité par Surga, false sinon.
 */
async function traiterMessageWhatsAppSurga(phone, messageTexte, isVocal = false) {
  const normPh = normalisePhone(phone);
  const parseResult = parserIntentionWhatsApp(messageTexte);

  // Vérification d'une session en cours d'attente de confirmation
  let actionEnAttente = null;
  try {
    const sessRes = await pool.query(
      'SELECT action_en_attente FROM surga_whatsapp_sessions WHERE phone = $1',
      [normPh]
    );
    actionEnAttente = sessRes.rows[0]?.action_en_attente || null;
  } catch (err) {
    console.warn('[SURGA SESSION FETCH ERR]:', err.message);
  }

  // Si l'intention est inconnue, ou si c'est OUI/NON alors qu'aucune action Surga n'est en attente,
  // ne pas intercepter le message (le laisser aux autres flux : e-commerce, catalogue, etc.)
  if (parseResult.intention === 'INCONNU') {
    return false;
  }
  if ((parseResult.intention === 'CONFIRMATION_OUI' || parseResult.intention === 'CONFIRMATION_NON') && !actionEnAttente) {
    return false;
  }

  // Vérification des quotas pour cette commande valide Surga
  const quotaValide = await verifierQuota(normPh, isVocal);
  if (!quotaValide) {
    const msgPlafond =
      `Surga : Vous avez atteint votre quota découverte de ${QUOTA_JOURNALIER_GRATUIT} commandes gratuites pour aujourd'hui sur WhatsApp.\n\n` +
      `Pour profiter de commandes WhatsApp illimitées, activez Surga Premium (1 500 FCFA/mois) : https://surga.nopalou.com/premium.\n` +
      `Votre application Web & PWA reste quant à elle 100% gratuite et sans limite : https://surga.nopalou.com`;
    await sendWhatsAppText(normPh, msgPlafond);
    return true;
  }

  // ── 1. Gestion des confirmations OUI / NON ──────────────────────────────────
  if (parseResult.intention === 'CONFIRMATION_OUI') {
    const userId = await obtenirOuCreerUserId(normPh);

    if (!userId) {
      console.error(`[SURGA PERSISTENCE BLOCKED] Aucun compte pour ${normPh}, écriture annulée.`);
      await sendWhatsAppText(
        normPh,
        `Surga : Impossible de valider votre compte pour enregistrer l'action. Veuillez réessayer ou ouvrir l'application : https://surga.nopalou.com`
      );
      return true;
    }

    try {
      if (actionEnAttente.intention === 'ADD_EXPENSE') {
        const { montant, categorie, note } = actionEnAttente.data;
        await pool.query(
          `INSERT INTO surga_depenses (user_id, montant_xof, categorie, date_depense, note)
           VALUES ($1, $2, $3, CURRENT_DATE, $4)`,
          [userId, montant, categorie, note || null]
        );
        await sendWhatsAppText(
          normPh,
          `Surga : C'est enregistré. Dépense de ${formaterFCFA(montant)} ajoutée dans la catégorie ${categorie}.\n\n` +
          `Retrouvez votre récapitulatif dans votre application : https://surga.nopalou.com`
        );
      } else if (actionEnAttente.intention === 'ADD_NOTE') {
        const { titre, contenu } = actionEnAttente.data;
        await pool.query(
          `INSERT INTO surga_notes (user_id, titre, contenu)
           VALUES ($1, $2, $3)`,
          [userId, titre, contenu]
        );
        await sendWhatsAppText(
          normPh,
          `Surga : C'est noté. Votre note "${titre}" est bien conservée dans votre carnet.\n\n` +
          `Consultez vos notes sur : https://surga.nopalou.com`
        );
      } else if (actionEnAttente.intention === 'ADD_REMINDER') {
        const { titre, date, heure } = actionEnAttente.data;
        await pool.query(
          `INSERT INTO surga_agenda (user_id, titre, date_evenement, heure_evenement, est_rappel)
           VALUES ($1, $2, $3, $4, TRUE)`,
          [userId, titre, date, heure]
        );
        await sendWhatsAppText(
          normPh,
          `Surga : C'est programmé. Votre rappel "${titre}" pour le ${date} à ${heure} est activé.\n\n` +
          `Consultez votre agenda : https://surga.nopalou.com`
        );
      }

      // Nettoyer la session d'attente
      await pool.query('DELETE FROM surga_whatsapp_sessions WHERE phone = $1', [normPh]);
      return true;
    } catch (err) {
      console.error('[SURGA CONFIRMATION SAVE ERR]:', err.message);
      await sendWhatsAppText(normPh, `Surga : Une erreur est survenue lors de l'enregistrement. Veuillez réessayer.`);
      return true;
    }
  }

  if (parseResult.intention === 'CONFIRMATION_NON') {
    if (actionEnAttente) {
      await pool.query('DELETE FROM surga_whatsapp_sessions WHERE phone = $1', [normPh]);
      await sendWhatsAppText(normPh, `Surga : Action annulée. Votre saisie n'a pas été enregistrée.`);
    } else {
      await sendWhatsAppText(normPh, `Surga : Aucune action en cours. Que souhaitez-vous faire ?`);
    }
    return true;
  }

  // 1.5 Prise en charge d'une correction de montant orale ou textuelle en cours de confirmation
  if (parseResult.intention === 'CORRECTION_MONTANT') {
    if (actionEnAttente && actionEnAttente.intention === 'ADD_EXPENSE') {
      const nouveauMontant = parseResult.montant;
      actionEnAttente.data.montant = nouveauMontant;

      await pool.query(
        `UPDATE surga_whatsapp_sessions
         SET action_en_attente = $1, updated_at = NOW()
         WHERE phone = $2`,
        [JSON.stringify(actionEnAttente), normPh]
      );

      const msgDemande =
        `Surga : Montant corrigé à ${formaterFCFA(nouveauMontant)} (${actionEnAttente.data.categorie}).\n\n` +
        `Confirmez-vous cette dépense ?\n` +
        `1. OUI pour valider\n` +
        `2. NON pour annuler`;

      await sendWhatsAppText(normPh, msgDemande);
      return true;
    } else {
      await sendWhatsAppText(normPh, `Surga : Aucune dépense en attente à corriger.`);
      return true;
    }
  }

  // ── 2. Calculatrice Déterministe (Exécution directe sans confirmation) ───────
  if (parseResult.intention === 'CALCULATE') {
    const calc = evaluerCalcul(parseResult.expression);
    if (calc.success && calc.resultat !== undefined) {
      await sendWhatsAppText(
        normPh,
        `Surga : Résultat du calcul :\n` +
        `• Opération : ${calc.expressionNettoyee}\n` +
        `• Résultat : ${formaterFCFA(calc.resultat)}`
      );
    } else {
      await sendWhatsAppText(
        normPh,
        `Surga : Calcul impossible (${calc.erreur || 'expression invalide'}).\n` +
        `Exemple : "calcule 15000 * 3" ou "5000 + 18%".`
      );
    }
    return true;
  }

  // ── 3. Briefing Quotidien ───────────────────────────────────────────────────
  if (parseResult.intention === 'BRIEFING') {
    const today = new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date());
    const dateFormatted = today.charAt(0).toUpperCase() + today.slice(1);

    const msgBriefing =
      `Surga : Bonjour. Voici votre point pour ce ${dateFormatted} :\n\n` +
      `Consultez vos actualités sourcées, vos dépenses du mois et votre agenda sur votre application :\n` +
      `https://nopalou.com/surga`;

    await sendWhatsAppText(normPh, msgBriefing);
    return true;
  }

  // ── 3.2 Aide et Orientation des fonctionnalités ─────────────────────────────
  if (parseResult.intention === 'AIDE') {
    const msgAide =
      `Surga : Bonjour. Je suis votre assistant de poche du quotidien. Vous pouvez m'écrire ou m'envoyer des notes vocales :\n\n` +
      `• Concours : "cherche concours douanes", "concours police", "date concours ENA"\n` +
      `• Démarches : "comment faire mon passeport", "pièces carte identité"\n` +
      `• Trafic : "trafic sur la VDN", "bouchon corniche", "état du trafic"\n` +
      `• Rappels : "rappelle-moi demain à 8h", "dans 30 min appeler maman"\n` +
      `• Dépenses : "note 2500 taxi", "5000 courses"\n` +
      `• Calculs : "15000 * 3", "100 / 3"\n` +
      `• Actualités : "mon briefing"\n\n` +
      `Accédez à l'application complète : https://surga.nopalou.com`;
    await sendWhatsAppText(normPh, msgAide);
    return true;
  }

  // ── 3.3 Recherche Concours & Examens Nationaux ───────────────────────────────
  if (parseResult.intention === 'SEARCH_CONCOURS') {
    try {
      const { listerConcours } = require('./concours-service');
      const resultat = await listerConcours({ q: parseResult.query, limit: 3 });
      const items = resultat?.concours || [];

      if (items.length === 0) {
        await sendWhatsAppText(
          normPh,
          `Surga : Aucun concours national ne correspond à "${parseResult.query}".\n\n` +
          `Consultez la liste des 22 concours officiels sur : https://surga.nopalou.com`
        );
        return true;
      }

      const premier = items[0];
      const dateClotureFr = premier.date_cloture
        ? new Date(premier.date_cloture).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
        : 'À déterminer';
      const montantFrais = premier.frais_dossier_xof
        ? formaterFCFA(premier.frais_dossier_xof)
        : 'Gratuit';

      const msgConcours =
        `Surga : Fiche officielle du concours :\n\n` +
        `• Titre : ${premier.titre}\n` +
        `• Organisme : ${premier.organisme}\n` +
        `• Niveau requis : ${premier.niveau_requis || 'Non spécifié'}\n` +
        `• Statut : ${premier.statut === 'ouvert' ? 'Ouvert' : 'Fermé'} (Clôture le ${dateClotureFr})\n` +
        `• Quittance Trésor : ${montantFrais}\n` +
        (premier.lien_officiel ? `• Source : ${premier.lien_officiel}\n\n` : `\n`) +
        `Retrouvez le dossier complet, les pièces requises et les alertes J-30/J-7 sur votre PWA : https://surga.nopalou.com`;

      await sendWhatsAppText(normPh, msgConcours);
      return true;
    } catch (err) {
      console.warn('[SURGA WHATSAPP CONCOURS ERR]:', err.message);
      await sendWhatsAppText(
        normPh,
        `Surga : Impossible de récupérer les détails du concours pour le moment. Consultez votre application : https://surga.nopalou.com`
      );
      return true;
    }
  }

  // ── 3.4 Consultation Trafic Routier Live ────────────────────────────────────
  if (parseResult.intention === 'CHECK_TRAFFIC') {
    try {
      const { genererSyntheseBriefingTrafic, AXES_ROUTIERS_DAKAR } = require('./trafic-service');
      const synthese = await genererSyntheseBriefingTrafic();
      let detailAxe = '';

      if (parseResult.axe && parseResult.axe !== 'global') {
        const axeTrouve = AXES_ROUTIERS_DAKAR.find((a) =>
          a.id.toLowerCase().includes(parseResult.axe) || a.nom.toLowerCase().includes(parseResult.axe)
        );
        if (axeTrouve) {
          detailAxe = `\n\nAxe ciblé (${axeTrouve.nom}) : Temps habituel ~${axeTrouve.tempsHabituelMin} min (${axeTrouve.distanceKm} km).`;
        }
      }

      await sendWhatsAppText(
        normPh,
        `Surga : Point Trafic Dakar en direct :\n\n` +
        `${synthese}${detailAxe}\n\n` +
        `Consultez la carte des ralentissements en direct : https://surga.nopalou.com`
      );
      return true;
    } catch (err) {
      console.warn('[SURGA WHATSAPP TRAFIC ERR]:', err.message);
      await sendWhatsAppText(normPh, `Surga : Service trafic momentanément indisponible. Consultez https://surga.nopalou.com`);
      return true;
    }
  }

  // ── 3.5 Démarches Administratives Citoyennes ─────────────────────────────────
  if (parseResult.intention === 'SEARCH_DEMARCHES') {
    try {
      const { rechercherDemarches } = require('./demarches-service');
      const demarches = await rechercherDemarches(parseResult.query);

      if (!demarches || demarches.length === 0) {
        await sendWhatsAppText(
          normPh,
          `Surga : Aucune démarche trouvée pour "${parseResult.query}".\n\n` +
          `Consultez le guide des démarches officielles : https://surga.nopalou.com`
        );
        return true;
      }

      const d = demarches[0];
      const coutStr = d.cout_xof ? formaterFCFA(d.cout_xof) : 'Gratuit';
      const piecesList = Array.isArray(d.pieces) && d.pieces.length > 0
        ? d.pieces.slice(0, 3).map((p) => `  - ${typeof p === 'string' ? p : p.intitule}`).join('\n')
        : '  - Consulter les pièces sur le portail';

      await sendWhatsAppText(
        normPh,
        `Surga : Démarche administrative officielle :\n\n` +
        `• Titre : ${d.titre}\n` +
        `• Coût / Timbre : ${coutStr}\n` +
        `• Principales pièces :\n${piecesList}\n\n` +
        `Consultez la procédure complète : https://surga.nopalou.com`
      );
      return true;
    } catch (err) {
      console.warn('[SURGA WHATSAPP DEMARCHE ERR]:', err.message);
      await sendWhatsAppText(normPh, `Surga : Consultez votre guide des démarches : https://surga.nopalou.com`);
      return true;
    }
  }

  // ── 3.6 Bonnes Adresses & Lieux / Bon Coin Dakar ───────────────────────────
  if (parseResult.intention === 'SEARCH_PLACES') {
    await sendWhatsAppText(
      normPh,
      `Surga : Bonnes Adresses & Bon Coin Dakar :\n\n` +
      `Retrouvez les meilleures adresses, restaurants, dibiteries et sorties certifiées avec géolocalisation et contacts directs sur votre PWA :\n` +
      `https://surga.nopalou.com`
    );
    return true;
  }

  // ── 3.7 Immobilier Certifié ─────────────────────────────────────────────────
  if (parseResult.intention === 'SEARCH_IMMO') {
    await sendWhatsAppText(
      normPh,
      `Surga : Immobilier certifié Dakar :\n\n` +
      `Consultez les annonces vérifiées d'appartements, villas et studios sans commission cachée sur votre PWA :\n` +
      `https://surga.nopalou.com`
    );
    return true;
  }

  // ── 3.8 Météo Dakar Live ───────────────────────────────────────────────────
  if (parseResult.intention === 'CHECK_METEO') {
    await sendWhatsAppText(
      normPh,
      `Surga : Météo Dakar en direct :\n\n` +
      `Consultez la météo côtière, températures, indice UV et prévisions sur votre PWA :\n` +
      `https://surga.nopalou.com`
    );
    return true;
  }

  // ── 3.9 Sport & Lutte Sénégalaise ───────────────────────────────────────────
  if (parseResult.intention === 'CHECK_SPORT') {
    await sendWhatsAppText(
      normPh,
      `Surga : Sport & Lamb (Lutte sénégalaise) :\n\n` +
      `Suivez les résultats de football, l'actualité sportive et les grands combats de lutte sur votre PWA :\n` +
      `https://surga.nopalou.com`
    );
    return true;
  }

  // ── 3.10 Presse & Kiosque des Unes ──────────────────────────────────────────
  if (parseResult.intention === 'OPEN_PRESSE') {
    await sendWhatsAppText(
      normPh,
      `Surga : Revue de Presse & Kiosque des Unes :\n\n` +
      `Consultez les Unes des quotidiens nationaux sénégalais en direct sur votre PWA :\n` +
      `https://surga.nopalou.com`
    );
    return true;
  }

  // ── 3.11 Emploi & Opportunités ──────────────────────────────────────────────
  if (parseResult.intention === 'SEARCH_EMPLOI') {
    await sendWhatsAppText(
      normPh,
      `Surga : Emploi & Recrutement Sénégal :\n\n` +
      `Consultez les offres d'emploi vérifiées et préparez vos entretiens sur votre PWA :\n` +
      `https://surga.nopalou.com`
    );
    return true;
  }

  // ── 3.12 Radios FM Dakar ────────────────────────────────────────────────────
  if (parseResult.intention === 'OPEN_RADIO') {
    await sendWhatsAppText(
      normPh,
      `Surga : Radios FM Dakar en direct :\n\n` +
      `Écoutez RFM, Zik FM, RFI, Al Fayda et vos stations sénégalaises favorites en direct sur votre PWA :\n` +
      `https://surga.nopalou.com`
    );
    return true;
  }

  // ── 3.13 Séries TV & Vidéos ─────────────────────────────────────────────────
  if (parseResult.intention === 'OPEN_VIDEOS') {
    await sendWhatsAppText(
      normPh,
      `Surga : Séries TV & Replays sénégalais :\n\n` +
      `Retrouvez vos séries et émissions favorites (Marodi, EvenProd, TFM) sur votre PWA :\n` +
      `https://surga.nopalou.com`
    );
    return true;
  }

  // ── 3.14 Agenda & Événements ────────────────────────────────────────────────
  if (parseResult.intention === 'OPEN_AGENDA') {
    await sendWhatsAppText(
      normPh,
      `Surga : Agenda & Calendrier :\n\n` +
      `Consultez votre planning et vos rappels programmés sur votre PWA :\n` +
      `https://surga.nopalou.com`
    );
    return true;
  }

  // ── 3.15 Dépenses & Kalpé ───────────────────────────────────────────────────
  if (parseResult.intention === 'OPEN_DEPENSES') {
    await sendWhatsAppText(
      normPh,
      `Surga : Kalpé & Dépenses du mois :\n\n` +
      `Suivez votre budget, vos totaux par catégorie et votre solde sur votre PWA :\n` +
      `https://surga.nopalou.com`
    );
    return true;
  }

  // ── 3.16 Carnet de Notes ────────────────────────────────────────────────────
  if (parseResult.intention === 'OPEN_NOTES') {
    await sendWhatsAppText(
      normPh,
      `Surga : Carnet de Notes :\n\n` +
      `Consultez l'ensemble de vos notes et mémos enregistrés sur votre PWA :\n` +
      `https://surga.nopalou.com`
    );
    return true;
  }

  // ── 3.17 Mon Compte & Profil ────────────────────────────────────────────────
  if (parseResult.intention === 'OPEN_COMPTE') {
    await sendWhatsAppText(
      normPh,
      `Surga : Compte & Profil personnel :\n\n` +
      `Gérez vos informations de compte, vos sauvegardes et vos préférences sur : https://surga.nopalou.com`
    );
    return true;
  }

  // ── 3.18 Surga Premium ──────────────────────────────────────────────────────
  if (parseResult.intention === 'OPEN_PREMIUM') {
    await sendWhatsAppText(
      normPh,
      `Surga : Surga Premium (1 500 FCFA/mois) :\n\n` +
      `Débloquez les commandes WhatsApp illimitées et les fonctionnalités prioritaires sur : https://surga.nopalou.com/premium`
    );
    return true;
  }

  // ── 3.19 Espace Pro B2B ─────────────────────────────────────────────────────
  if (parseResult.intention === 'OPEN_PRO') {
    await sendWhatsAppText(
      normPh,
      `Surga : Espace Professionnel & Partenaires B2B :\n\n` +
      `Découvrez nos solutions entreprises et partenariats certifiés sur : https://surga.nopalou.com`
    );
    return true;
  }

  // ── 3.20 Calculatrice ───────────────────────────────────────────────────────
  if (parseResult.intention === 'OPEN_CALCULATOR') {
    await sendWhatsAppText(
      normPh,
      `Surga : Calculatrice déterministe FCFA :\n\n` +
      `Posez votre calcul directement (ex: "calcule 15000 * 3" ou "5000 + 18%") ou ouvrez la calculatrice sur votre PWA : https://surga.nopalou.com`
    );
    return true;
  }

  // ── 4. Chaîne de confirmation préalable obligatoire pour les écritures ──────
  if (parseResult.intention === 'ADD_EXPENSE') {
    const { montant, categorie, note } = parseResult;

    await pool.query(
      `INSERT INTO surga_whatsapp_sessions (phone, action_en_attente, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (phone) DO UPDATE SET action_en_attente = EXCLUDED.action_en_attente, updated_at = NOW()`,
      [normPh, JSON.stringify({ intention: 'ADD_EXPENSE', data: { montant, categorie, note } })]
    );

    const msgDemande =
      `Surga : Souhaitez-vous enregistrer cette dépense ?\n\n` +
      `• Montant : ${formaterFCFA(montant)}\n` +
      `• Catégorie : ${categorie}\n` +
      (note ? `• Détail : ${note}\n\n` : `\n`) +
      `Répondez OUI pour valider ou NON pour annuler.`;

    await sendWhatsAppText(normPh, msgDemande);
    return true;
  }

  if (parseResult.intention === 'ADD_NOTE') {
    const { titre, contenu } = parseResult;

    await pool.query(
      `INSERT INTO surga_whatsapp_sessions (phone, action_en_attente, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (phone) DO UPDATE SET action_en_attente = EXCLUDED.action_en_attente, updated_at = NOW()`,
      [normPh, JSON.stringify({ intention: 'ADD_NOTE', data: { titre, contenu } })]
    );

    const msgDemande =
      `Surga : Souhaitez-vous enregistrer cette note ?\n\n` +
      `"${titre}"\n\n` +
      `Répondez OUI pour valider ou NON pour annuler.`;

    await sendWhatsAppText(normPh, msgDemande);
    return true;
  }

  if (parseResult.intention === 'ADD_REMINDER') {
    const { titre, date, heure } = parseResult;

    await pool.query(
      `INSERT INTO surga_whatsapp_sessions (phone, action_en_attente, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (phone) DO UPDATE SET action_en_attente = EXCLUDED.action_en_attente, updated_at = NOW()`,
      [normPh, JSON.stringify({ intention: 'ADD_REMINDER', data: { titre, date, heure } })]
    );

    const msgDemande =
      `Surga : Souhaitez-vous programmer ce rappel ?\n\n` +
      `• Titre : ${titre}\n` +
      `• Date : ${date}\n` +
      `• Heure : ${heure}\n\n` +
      `Répondez OUI pour valider ou NON pour annuler.`;

    await sendWhatsAppText(normPh, msgDemande);
    return true;
  }

  return false;
}

module.exports = {
  parserIntentionWhatsApp,
  devinerCategorie,
  traiterMessageWhatsAppSurga,
  verifierQuota,
  QUOTA_JOURNALIER_GRATUIT,
};
