// backend/services/surga/voice-interpreter.js
// Interprétation déterministe des commandes vocales transcrites pour Surga
// Utilisé pour la commande vocale dans l'app et les notes vocales WhatsApp
// Zéro émoji Unicode, calculs arithmétiques exacts, vouvoiement strict

const { evaluerCalcul } = require('./calculator');

/**
 * Convertit les expressions orales françaises usuelles en chiffres et opérateurs
 */
function normaliserNombresVocaux(texte) {
  if (!texte || typeof texte !== 'string') return '';
  let t = texte.toLowerCase().trim();

  // Opérateurs mathématiques oraux
  t = t.replace(/\bdivis[ée]\s+par\b/gi, '/');
  t = t.replace(/\bmultipli[ée]\s+par\b/gi, '*');
  t = t.replace(/\bfois\b/gi, '*');
  t = t.replace(/\bplus\b/gi, '+');
  t = t.replace(/\bmoins\b/gi, '-');
  t = t.replace(/\bpour\s*cent\b/gi, '%');

  // Mots nombres sénégalais et français courants
  const motsNombres = [
    [/\bvingt[- ]cinq\s+cents\b/gi, '2500'],
    [/\bdeux\s+mille\s+cinq\s+cents\b/gi, '2500'],
    [/\bmille\s+cinq\s+cents\b/gi, '1500'],
    [/\bquinze\s+cents\b/gi, '1500'],
    [/\bdix\s+mille\b/gi, '10000'],
    [/\bvingt\s+mille\b/gi, '20000'],
    [/\bcinquante\s+mille\b/gi, '50000'],
    [/\bcent\s+mille\b/gi, '100000'],
    [/\bcinq\s+cents?\b/gi, '500'],
    [/\bdeux\s+cents?\b/gi, '200'],
    [/\btrois\s+cents?\b/gi, '300'],
    [/\bquatre\s+cents?\b/gi, '400'],
    [/\bcinq\s+mille\b/gi, '5000'],
    [/\btrois\s+mille\b/gi, '3000'],
    [/\bdeux\s+mille\b/gi, '2000'],
    [/\bquatre\s+mille\b/gi, '4000'],
    [/\bmille\b/gi, '1000'],
    [/\bcent\b/gi, '100'],
    [/\bzero\b/gi, '0'],
    [/\bun\b/gi, '1'],
    [/\bdeux\b/gi, '2'],
    [/\btrois\b/gi, '3'],
    [/\bquatre\b/gi, '4'],
    [/\bcinq\b/gi, '5'],
    [/\bsix\b/gi, '6'],
    [/\bsept\b/gi, '7'],
    [/\bhuit\b/gi, '8'],
    [/\bneuf\b/gi, '9'],
    [/\bdix\b/gi, '10'],
    [/\bonze\b/gi, '11'],
    [/\bdouze\b/gi, '12'],
    [/\btreize\b/gi, '13'],
    [/\bquatorze\b/gi, '14'],
    [/\bquinze\b/gi, '15'],
    [/\bseize\b/gi, '16'],
    [/\bdix[- ]sept\b/gi, '17'],
    [/\bdix[- ]huit\b/gi, '18'],
    [/\bdix[- ]neuf\b/gi, '19'],
    [/\bvingt\b/gi, '20'],
    [/\btrente\b/gi, '30'],
    [/\bquarante\b/gi, '40'],
    [/\bcinquante\b/gi, '50'],
    [/\bsoixante\b/gi, '60'],
  ];

  for (const [regex, replacement] of motsNombres) {
    t = t.replace(regex, replacement);
  }

  return t;
}

/**
 * Détermine la catégorie d'une dépense dictée
 */
function devinerCategorieVocale(texte) {
  if (!texte) return 'Autre';
  const t = texte.toLowerCase();
  if (/manger|resto|restaurant|dejeuner|diner|repas|pain|lait|riz|thieb|courses|marche|supermarche|alimentation/i.test(t)) return 'Alimentation';
  if (/taxi|\bcar\b|car rapide|\bbus\b|essence|gasoil|transport|peage|\bcourse\b|\bmoto\b|tiak-tiak|tiak/i.test(t)) return 'Transport';
  if (/loyer|maison|chambre|appartement|electricite|senelec|woyofal|eau|sde|sen'eau/i.test(t)) return 'Logement';
  if (/docteur|medecin|pharmacie|medicament|hopital|sante|clinique/i.test(t)) return 'Santé';
  if (/facture|wifi|internet|orange|wave|forfait|credit|abonnement/i.test(t)) return 'Factures';
  if (/cinema|sortir|cadeau|plage|loisir|sport/i.test(t)) return 'Loisirs';
  return 'Autre';
}

/**
 * Interprète une commande vocale transcrite
 */
function interpreterCommandeVocale(transcription) {
  if (!transcription || typeof transcription !== 'string') {
    return { intention: 'INCONNU', texteBrut: '' };
  }

  const texteBrut = transcription.trim();
  const texteNorm = normaliserNombresVocaux(texteBrut);

  // 1. Calculatrice dictée (ex: "calcule 100 / 3", "100 divisé par 3", "combien fait 2500 fois 4")
  const matchCalcul = texteNorm.match(/^(?:calcule|combien fait|calcul)?\s*([0-9+\-*/().%×÷,\s]{3,})$/i);
  const contientOpMath = /[+\-*/×÷%]/.test(texteNorm);

  if ((matchCalcul && contientOpMath) || (/^(?:calcule|combien fait)\s+/i.test(texteNorm) && contientOpMath)) {
    const expr = matchCalcul ? matchCalcul[1].trim() : texteNorm.replace(/^(?:calcule|combien fait)\s+/i, '').trim();
    const resultat = evaluerCalcul(expr);
    if (resultat.success) {
      return {
        intention: 'CALCULATE',
        texteBrut,
        calculResultat: resultat,
      };
    }
  }

  // 2. Radio FM (ex: "mets rfm", "lance sud fm", "écoute zik fm", "arrête la radio")
  const matchRadioArret = texteNorm.match(/^(?:arr[êe]te|coupe|stop|ferme)\s+(?:la\s+)?radio$/i);
  if (matchRadioArret) {
    return {
      intention: 'PLAY_RADIO',
      texteBrut,
      radioData: {
        action: 'STOP',
      },
    };
  }
  const matchRadio = texteNorm.match(/^(?:mets|lance|[ée]coute|allume|joue)\s+(?:la\s+radio\s+)?([a-z0-9\s_-]+)$/i);
  if (matchRadio && /(rfm|sud\s*fm|zik\s*fm|rfi|lamp\s*fall|walf|al[- ]fayda|radio)/i.test(matchRadio[1])) {
    const stNom = matchRadio[1].replace(/^(?:la\s+)?radio\s*/i, '').trim();
    return {
      intention: 'PLAY_RADIO',
      texteBrut,
      radioData: {
        action: 'PLAY',
        station: stNom || 'rfm',
      },
    };
  }

  // 3. Briefing matinal (ex: "mon briefing", "donne-moi le briefing", "actualités du jour")
  if (/^(?:(?:donne[- ]moi\s+(?:mon\s+)?|lance\s+(?:le\s+)?|affiche\s+(?:le\s+)?)?briefing|actualit[ée]s?|point\s+du\s+jour)$/i.test(texteNorm)) {
    return {
      intention: 'BRIEFING',
      texteBrut,
    };
  }

  // 4. Concours & Examens (ex: "cherche concours douanes", "concours police", "date limite concours ena")
  const matchConcours = texteNorm.match(/^(?:cherche|recherche|trouve|info|statut|date|dossier|quand(?:\s+a\s+lieu)?(?:\s+le)?|c['’]est\s+quand\s+le)?\s*concours\s+(?:de\s+(?:la\s+)?|d['’]\s*)?([a-z0-9\s_-]+)$/i);
  const matchSigleConcoursDirect = texteNorm.match(/^(?:cherche|recherche|info|date)?\s*(douanes?|police|ena|gendarmerie|fastef|crem|cfj|sapeurs[- ]pompiers|bnsp|baccalaur[ée]at|bfem|cesti|esp|ensa)\b/i);

  if (matchConcours) {
    const qConcours = matchConcours[1].trim();
    return {
      intention: 'SEARCH_CONCOURS',
      texteBrut,
      concoursData: {
        query: qConcours,
      },
    };
  } else if (matchSigleConcoursDirect && !/(taxi|repas|courses|cfa|fcfa)/i.test(texteNorm)) {
    return {
      intention: 'SEARCH_CONCOURS',
      texteBrut,
      concoursData: {
        query: matchSigleConcoursDirect[1].trim(),
      },
    };
  }

  // 5. Démarches administratives citoyennes (ex: "comment faire mon passeport", "pièces carte identité", "renouvellement permis")
  const matchDemarche = texteNorm.match(/^(?:comment\s+(?:faire|obtenir|renouveler)|pi[èe]ces?\s+(?:pour|du)?|d[ée]marche\s+(?:pour)?)\s+([a-z0-9\s_-]+)$/i);
  if (matchDemarche || /(?:passeport|carte\s+d['’]identit[ée]|cni|permis\s+de\s+conduire|casier\s+judiciaire|certificat\s+de\s+nationalit[ée])/i.test(texteNorm)) {
    let qDemarche = matchDemarche ? matchDemarche[1].trim() : texteNorm;
    qDemarche = qDemarche.replace(/^(?:comment\s+(?:faire|obtenir|renouveler)|pi[èe]ces?\s+(?:pour|du)?|d[ée]marche\s+(?:pour)?|mon|ma|mes|le|la|les)\s+/gi, '').trim();
    if (qDemarche && /(passeport|identit|cni|permis|casier|nationalit|quittance)/i.test(qDemarche)) {
      return {
        intention: 'SEARCH_DEMARCHES',
        texteBrut,
        demarcheData: {
          query: qDemarche,
        },
      };
    }
  }

  // 6. Trafic routier live TomTom (ex: "quel est le trafic sur la vdn", "état du trafic", "bouchon corniche")
  const matchTrafic = texteNorm.match(/^(?:(?:quel\s+est\s+le|point|etat\s+du)\s+)?(?:trafic|circulation|bouchons?|ralentissements?)\s*(?:sur\s+(?:la\s+)?|[àa]\s+(?:la\s+)?|de\s+)?([a-z0-9\s_-]*)$/i);
  if (matchTrafic || /(?:trafic|bouchon|circulation)\s+(vdn|corniche|p[ée]age|autoroute|patte\s+d['’]oie|rn1)/i.test(texteNorm)) {
    const rawAxe = matchTrafic ? matchTrafic[1].trim() : texteNorm;
    let axeExtrait = 'global';
    if (/vdn/i.test(rawAxe)) axeExtrait = 'vdn';
    else if (/corniche/i.test(rawAxe)) axeExtrait = 'corniche';
    else if (/p[ée]age|autoroute|a1/i.test(rawAxe)) axeExtrait = 'autoroute';
    else if (/patte\s+d['’]oie/i.test(rawAxe)) axeExtrait = 'patte_d_oie';
    else if (/rn1/i.test(rawAxe)) axeExtrait = 'rn1';

    return {
      intention: 'CHECK_TRAFFIC',
      texteBrut,
      traficData: {
        axe: axeExtrait,
      },
    };
  }

  // 7. Rappel & Agenda (Priorité temporelle stricte : ex: "rappelle-moi demain à 14h réunion", "note réunion demain 10h")
  const matchRappel = texteBrut.match(/^(?:rappel|rappelle(?:-moi)?)\s+(.+)$/i);
  const contientDateHeure = /demain|ce soir|\b\d{1,2}\s*(?:h|:)\s*\d{0,2}\b|dans\s+\d+\s*(?:min|minute|heure)/i.test(texteNorm);

  if (matchRappel || (contientDateHeure && /^(?:note|ajouter|programme|mets)\s+/i.test(texteNorm))) {
    const reste = matchRappel
      ? matchRappel[1].trim()
      : texteBrut.replace(/^(?:note|ajouter|programme|mets)\s+/i, '').trim();

    let date = new Date().toISOString().slice(0, 10);
    let heure = '09:00';
    let titre = reste;

    if (/demain/i.test(titre)) {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      date = d.toISOString().slice(0, 10);
      titre = titre.replace(/demain/gi, '').trim();
    }

    const matchHeure = titre.match(/(\d{1,2})\s*(?:h|:)\s*(\d{2})?/i);
    if (matchHeure) {
      const h = String(parseInt(matchHeure[1], 10)).padStart(2, '0');
      const m = String(parseInt(matchHeure[2] || '0', 10)).padStart(2, '0');
      heure = `${h}:${m}`;
      titre = titre.replace(matchHeure[0], '').replace(/\b(?:à|a)\b/gi, '').trim();
    }

    titre = titre.replace(/\s+/g, ' ').trim();

    return {
      intention: 'ADD_REMINDER',
      texteBrut,
      rappelData: {
        titre: titre || 'Rappel vocal Surga',
        date,
        heure,
      },
    };
  }

  // 8. Dépense (ex: "note 2500 de taxi", "dépense 5000 courses", "j'ai payé 1500 repas")
  const matchMontant = texteNorm.match(/\b(\d+)(?!\s*h(?:eures?)?)\s*(?:fcfa|cfa|f|frs)?\b/i);
  if (matchMontant && (/^(note|depense|dépense|j'ai payé|j'ai paye|achat)/i.test(texteNorm) || /(cfa|fcfa)/i.test(texteNorm))) {
    const montant = parseInt(matchMontant[1], 10);
    if (montant > 0) {
      let libelle = texteBrut
        .replace(/^(note|depense|dépense|j'ai payé|j'ai paye|achat)\s*/i, '')
        .replace(new RegExp(`\\b${matchMontant[1]}\\b`, 'i'), '')
        .replace(/\b(?:fcfa|cfa|f|frs|de|pour)\b/gi, '')
        .trim();

      const categorie = devinerCategorieVocale(libelle || texteBrut);
      return {
        intention: 'ADD_EXPENSE',
        texteBrut,
        depenseData: {
          montant,
          categorie,
          note: libelle || categorie,
        },
      };
    }
  }

  // 9. Note rapide intemporelle (ex: "note appeler docteur", "mémo liste des prix")
  const matchNote = texteBrut.match(/^(?:note|ajouter note|mémo|memo)\s+(.+)$/i);
  if (matchNote) {
    const contenu = matchNote[1].trim();
    return {
      intention: 'ADD_NOTE',
      texteBrut,
      noteData: {
        titre: contenu.slice(0, 50),
        contenu,
      },
    };
  }

  return {
    intention: 'INCONNU',
    texteBrut,
  };
}

module.exports = {
  normaliserNombresVocaux,
  devinerCategorieVocale,
  interpreterCommandeVocale,
};
