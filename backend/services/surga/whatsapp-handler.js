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

  // 1. Confirmations
  if (/^(oui|1|confirmer|valider|d'accord|ok)$/.test(texte)) {
    return { intention: 'CONFIRMATION_OUI' };
  }
  if (/^(non|0|annuler|arreter|stop)$/.test(texte)) {
    return { intention: 'CONFIRMATION_NON' };
  }

  // 2. Briefing
  if (/^(briefing|actu|actualite|actualites|mon briefing)$/.test(texte)) {
    return { intention: 'BRIEFING' };
  }

  // 3. Calculatrice
  const matchCalcul = texteNettoye.match(/^(?:calcule|combien fait|calcul)\s+(.+)$/i);
  if (matchCalcul) {
    return { intention: 'CALCULATE', expression: matchCalcul[1].trim() };
  }
  if (/^[0-9+\-*/().%×÷,\s]{3,}$/.test(texteNettoye) && /[+\-*/×÷%]/.test(texteNettoye)) {
    return { intention: 'CALCULATE', expression: texteNettoye };
  }

  // 4. Rappel
  const matchRappel = texteNettoye.match(/^(?:rappel|rappelle(?:-moi)?)\s+(.+)$/i);
  if (matchRappel) {
    const reste = matchRappel[1].trim();
    let date = new Date().toISOString().slice(0, 10);
    let heure = null;
    let titre = reste;

    // Détection de "demain"
    if (/demain/i.test(reste)) {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      date = d.toISOString().slice(0, 10);
      titre = titre.replace(/demain/gi, '').trim();
    }

    // Détection d'heure (ex: 8h, 8h30, 14:00, 14h30)
    const matchHeure = titre.match(/(\d{1,2})(?:h|:)(\d{2})?/i);
    if (matchHeure) {
      const h = String(parseInt(matchHeure[1], 10)).padStart(2, '0');
      const m = String(parseInt(matchHeure[2] || '0', 10)).padStart(2, '0');
      heure = `${h}:${m}`;
      titre = titre.replace(matchHeure[0], '').replace(/\ba\b/gi, '').trim();
    }

    titre = titre.replace(/\s+/g, ' ').trim();

    return {
      intention: 'ADD_REMINDER',
      titre: titre || 'Rappel Surga',
      date,
      heure: heure || '09:00',
    };
  }

  // 5. Dépense (si présence de "note", "depense", "achete", "paye" suivi ou précédé d'un montant)
  const regexMontant = /(\d+(?:[\s.,]\d+)?)\s*(?:fcfa|cfa|f|frs)?/i;
  const matchMontant = texte.match(regexMontant);

  if (matchMontant && (/^(note|depense|j'ai paye|j'ai achete|achat)/.test(texte) || /(cfa|fcfa)/.test(texte))) {
    const rawVal = matchMontant[1].replace(/[\s.,]/g, '');
    const montant = parseInt(rawVal, 10);
    if (montant && montant > 0) {
      let libelle = texteNettoye
        .replace(/^(note|depense|j'ai paye|j'ai achete|achat)\s*/i, '')
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
