// frontend-next/src/lib/surga-voice.ts
// Moteur de reconnaissance vocale Web Speech et interprétation des commandes Surga
// Calculs déterministes, zéro émoji, vouvoiement strict

import { evaluerCalcul, type CalculResultat } from './surga-calculator';

export type IntentionVocale = 'CALCULATE' | 'ADD_EXPENSE' | 'ADD_REMINDER' | 'ADD_NOTE' | 'INCONNU';

export interface ActionVocaleDetectee {
  intention: IntentionVocale;
  texteBrut: string;
  calculResultat?: CalculResultat;
  depenseData?: {
    montant: number;
    categorie: string;
    note: string;
  };
  rappelData?: {
    titre: string;
    date: string;
    heure: string;
  };
  noteData?: {
    titre: string;
    contenu: string;
  };
}

/**
 * Convertit les nombres écrits en lettres françaises courantes en chiffres
 */
export function normaliserNombresVocaux(texte: string): string {
  let t = texte.toLowerCase().trim();

  // Remplacement des opérateurs mathématiques oraux
  t = t.replace(/\bdivis[ée]\s+par\b/gi, '/');
  t = t.replace(/\bmultipli[ée]\s+par\b/gi, '*');
  t = t.replace(/\bfois\b/gi, '*');
  t = t.replace(/\bplus\b/gi, '+');
  t = t.replace(/\bmoins\b/gi, '-');
  t = t.replace(/\bpour\s*cent\b/gi, '%');

  // Remplacement de grands nombres usuels
  const motsNombres: [RegExp, string][] = [
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
export function devinerCategorieVocale(texte: string): string {
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
 * Analyse une phrase dictée et extrait l'intention et ses paramètres
 */
export function interpreterCommandeVocale(transcription: string): ActionVocaleDetectee {
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

  // 2. Dépense (ex: "note 2500 de taxi", "dépense 5000 courses", "j'ai payé 1500 repas")
  const matchMontant = texteNorm.match(/(\d+)\s*(?:fcfa|cfa|f|frs)?/i);
  if (matchMontant && (/^(note|depense|dépense|j'ai payé|j'ai paye|achat)/i.test(texteNorm) || /(cfa|fcfa)/i.test(texteNorm))) {
    const montant = parseInt(matchMontant[1], 10);
    if (montant > 0) {
      let libelle = texteBrut
        .replace(/^(note|depense|dépense|j'ai payé|j'ai paye|achat)\s*/i, '')
        .replace(new RegExp(matchMontant[1], 'i'), '')
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

  // 3. Rappel (ex: "rappelle-moi demain à 14h réunion", "rappel docteur 8h30")
  const matchRappel = texteNorm.match(/^(?:rappel|rappelle(?:-moi)?)\s+(.+)$/i);
  if (matchRappel) {
    const reste = matchRappel[1].trim();
    let date = new Date().toISOString().slice(0, 10);
    let heure = '09:00';
    let titre = reste;

    if (/demain/i.test(reste)) {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      date = d.toISOString().slice(0, 10);
      titre = titre.replace(/demain/gi, '').trim();
    }

    const matchHeure = titre.match(/(\d{1,2})(?:h|:)(\d{2})?/i);
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

  // 4. Note rapide (ex: "note appeler docteur demain", "mémo liste des prix")
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

/**
 * Vérifie si le navigateur supporte l'API SpeechRecognition
 */
export function estReconnaissanceVocaleSupportee(): boolean {
  if (typeof window === 'undefined') return false;
  const win = window as unknown as {
    SpeechRecognition?: unknown;
    webkitSpeechRecognition?: unknown;
  };
  return Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
}
