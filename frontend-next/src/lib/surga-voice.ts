// frontend-next/src/lib/surga-voice.ts
// Moteur de reconnaissance vocale Web Speech et interprétation des commandes Surga
// Calculs déterministes, zéro émoji, vouvoiement strict

import { evaluerCalcul, type CalculResultat } from './surga-calculator';

export type IntentionVocale =
  | 'CALCULATE'
  | 'ADD_EXPENSE'
  | 'ADD_REMINDER'
  | 'ADD_NOTE'
  | 'SEARCH_CONCOURS'
  | 'SEARCH_PLACES'
  | 'CHECK_TRAFFIC'
  | 'SEARCH_DEMARCHES'
  | 'SEARCH_IMMO'
  | 'CHECK_METEO'
  | 'CHECK_SPORT'
  | 'OPEN_PRESSE'
  | 'PLAY_RADIO'
  | 'SEARCH_EMPLOI'
  | 'OPEN_VIDEOS'
  | 'OPEN_CALCULATOR'
  | 'OPEN_NOTES'
  | 'OPEN_DEPENSES'
  | 'OPEN_AGENDA'
  | 'OPEN_COMPTE'
  | 'OPEN_PREMIUM'
  | 'OPEN_PRO'
  | 'BRIEFING'
  | 'INCONNU'

export interface ActionVocaleDetectee {
  intention: IntentionVocale
  texteBrut: string
  calculResultat?: CalculResultat
  depenseData?: {
    montant: number
    categorie: string
    note: string
  }
  rappelData?: {
    titre: string
    date: string
    heure: string
  }
  noteData?: {
    titre: string
    contenu: string
  }
  concoursData?: {
    query: string
  }
  placesData?: {
    query: string
  }
  traficData?: {
    axe: string
  }
  demarcheData?: {
    query: string
  }
  immoData?: {
    query: string
  }
  radioData?: {
    action: 'PLAY' | 'STOP'
    station?: string
  }
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

  // 2. Rappel & Agenda (Priorité temporelle stricte : ex: "rappelle-moi demain à 14h réunion", "note réunion demain 10h")
  const matchRappel = texteBrut.match(/^(?:rappel|rappelle(?:-moi)?)\s+(.+)$/i)
  const contientDateHeure = /demain|ce soir|\b\d{1,2}\s*(?:h|:)\s*\d{0,2}\b|dans\s+\d+\s*(?:min|minute|heure)/i.test(texteNorm)

  if (matchRappel || (contientDateHeure && /^(?:note|ajouter|programme|mets)\s+/i.test(texteNorm))) {
    const reste = matchRappel
      ? matchRappel[1].trim()
      : texteBrut.replace(/^(?:note|ajouter|programme|mets)\s+/i, '').trim()

    let date = new Date().toISOString().slice(0, 10)
    let heure = '09:00'
    let titre = reste

    if (/demain/i.test(titre)) {
      const d = new Date()
      d.setDate(d.getDate() + 1)
      date = d.toISOString().slice(0, 10)
      titre = titre.replace(/demain/gi, '').trim()
    }

    const matchHeure = titre.match(/(\d{1,2})\s*(?:h|:)\s*(\d{2})?/i)
    if (matchHeure) {
      const h = String(parseInt(matchHeure[1], 10)).padStart(2, '0')
      const m = String(parseInt(matchHeure[2] || '0', 10)).padStart(2, '0')
      heure = `${h}:${m}`
      titre = titre.replace(matchHeure[0], '').replace(/\b(?:à|a)\b/gi, '').trim()
    }

    titre = titre.replace(/\s+/g, ' ').trim()

    return {
      intention: 'ADD_REMINDER',
      texteBrut,
      rappelData: {
        titre: titre || 'Rappel vocal Surga',
        date,
        heure,
      },
    }
  }

  // 3. Dépense financière (ex: "note 2500 de taxi", "dépense 5000 courses", "j'ai payé 1500 repas")
  const matchMontant = texteNorm.match(/\b(\d+)(?!\s*h(?:eures?)?)\s*(?:fcfa|cfa|f|frs)?\b/i)
  if (matchMontant && (/^(note|depense|dépense|j'ai payé|j'ai paye|achat)/i.test(texteNorm) || /(cfa|fcfa)/i.test(texteNorm))) {
    const montant = parseInt(matchMontant[1], 10)
    if (montant > 0) {
      let libelle = texteBrut
        .replace(/^(note|depense|dépense|j'ai payé|j'ai paye|achat)\s*/i, '')
        .replace(new RegExp(`\\b${matchMontant[1]}\\b`, 'i'), '')
        .replace(/\b(?:fcfa|cfa|f|frs|de|pour)\b/gi, '')
        .trim()

      const categorie = devinerCategorieVocale(libelle || texteBrut)
      return {
        intention: 'ADD_EXPENSE',
        texteBrut,
        depenseData: {
          montant,
          categorie,
          note: libelle || categorie,
        },
      }
    }
  }

  // 4. Radio FM (ex: "mets rfm", "lance sud fm", "arrête la radio", ou simplement "radio", "les radios", "fm")
  const matchRadioArret = texteNorm.match(/^(?:arr[êe]te|coupe|stop|ferme)\s+(?:la\s+)?radio$/i)
  if (matchRadioArret) {
    return {
      intention: 'PLAY_RADIO',
      texteBrut,
      radioData: { action: 'STOP' },
    }
  }
  const matchRadio = texteNorm.match(/^(?:mets|lance|[ée]coute|allume|joue)\s+(?:la\s+radio\s+)?([a-z0-9\s_-]+)$/i)
  if (matchRadio && /(rfm|sud\s*fm|zik\s*fm|rfi|lamp\s*fall|walf|al[- ]fayda|rsi|rewmi|radio)/i.test(matchRadio[1])) {
    const stNom = matchRadio[1].replace(/^(?:la\s+)?radio\s*/i, '').trim()
    return {
      intention: 'PLAY_RADIO',
      texteBrut,
      radioData: { action: 'PLAY', station: stNom || 'rfm' },
    }
  }
  if (/^(?:les\s+)?radios?(?:\s+fm|\s+du\s+senegal|\s+en\s+direct)?$/i.test(texteNorm) || /^(?:rfm|sud\s*fm|zik\s*fm|rsi|rewmi\s*fm|lamp\s*fall)$/i.test(texteNorm)) {
    const stationDirecte = /rfm/i.test(texteNorm) ? 'rfm' : (/sud/i.test(texteNorm) ? 'sud fm' : (/zik/i.test(texteNorm) ? 'zik fm' : ''))
    return {
      intention: 'PLAY_RADIO',
      texteBrut,
      radioData: { action: 'PLAY', station: stationDirecte },
    }
  }

  // 5. Concours & Examens du Sénégal (ex: "concours", "examen", "examens", "cherche concours douanes", "concours police", "douane", "date ena")
  const matchConcoursVerbe = texteNorm.match(/^(?:cherche|recherche|trouve|info|statut|date|dossier|quand(?:\s+a\s+lieu)?(?:\s+le)?|c['’]est\s+quand\s+le)?\s*concours(?:\s+(?:de\s+(?:la\s+)?|d['’]\s*)?([a-z0-9\s_-]*))?$/i)
  const matchSigleOuMotConcours = texteNorm.match(/(?:^|\b)(concours|examens?|douanes?|police|ena|gendarmerie|fastef|crem|cfj|sapeurs[- ]pompiers|bnsp|baccalaur[ée]at|bac|bfem|cesti|esp|ensa|epac|fonction\s+publique)\b/i)

  if (matchConcoursVerbe || matchSigleOuMotConcours) {
    let qConcours = ''
    if (matchConcoursVerbe && matchConcoursVerbe[1]) {
      qConcours = matchConcoursVerbe[1].trim()
    } else if (matchSigleOuMotConcours) {
      const captured = matchSigleOuMotConcours[1].trim().toLowerCase()
      if (!/^(concours|examens?)$/i.test(captured)) {
        qConcours = captured
      } else {
        qConcours = texteNorm.replace(/(?:cherche|recherche|trouve|info|date|dossier|concours|examens?|de|la|le|du)\s*/gi, '').trim()
      }
    }
    return {
      intention: 'SEARCH_CONCOURS',
      texteBrut,
      concoursData: { query: qConcours },
    }
  }

  // 6. Bonnes Adresses, Bons Plans, Restaurants & "Bon Coin" (ex: "bon coin", "bonnes adresses", "resto", "restaurant", "dibi", "ou manger")
  const matchPlaces = /(?:^|\b)(bon\s+coin|bons\s+coins|bonnes?\s+adresses?|bons?\s+plans?|restaurants?|restos?|dibiterie|dibi|fast[- ]foods?|thieboudienne|thieb|cafes?|coworking|ou\s+manger|ou\s+sortir|manger\s+a\s+dakar)(?:\b|$)/i.test(texteNorm)
  if (matchPlaces) {
    const qPlaces = texteNorm
      .replace(/^(?:cherche|recherche|trouve|donne[- ]moi|ou\s+trouver|affiche)?\s*(?:un\s+|des\s+|le\s+|la\s+|les\s+)?/gi, '')
      .replace(/^(?:bon\s+coin|bons\s+coins|bonnes?\s+adresses?|bons?\s+plans?)\s*(?:a|de|pour)?\s*/gi, '')
      .trim()
    return {
      intention: 'SEARCH_PLACES',
      texteBrut,
      placesData: { query: qPlaces || 'Dakar' },
    }
  }

  // 7. Trafic routier live TomTom Dakar (ex: "trafic", "circulation", "bouchons", "quel est le trafic sur la vdn", "etat corniche")
  const matchTraficDeclencheur = /(?:^|\b)(trafic|circulation|bouchons?|ralentissements?|embouteillages?|etat\s+de\s+la\s+route|route\s+dakar)\b/i.test(texteNorm)
  const matchAxeDirect = /(?:^|\b)(vdn|corniche|p[ée]age|autoroute|patte\s+d['’]oie|rn1|pont\s+fann|brt|ter)\b/i.test(texteNorm)

  if (matchTraficDeclencheur || matchAxeDirect) {
    let axeExtrait = 'global'
    if (/vdn/i.test(texteNorm)) axeExtrait = 'vdn'
    else if (/corniche/i.test(texteNorm)) axeExtrait = 'corniche'
    else if (/p[ée]age|autoroute|a1/i.test(texteNorm)) axeExtrait = 'autoroute'
    else if (/patte\s+d['’]oie/i.test(texteNorm)) axeExtrait = 'patte_d_oie'
    else if (/rn1/i.test(texteNorm)) axeExtrait = 'rn1'
    else if (/brt/i.test(texteNorm)) axeExtrait = 'brt'
    else if (/ter/i.test(texteNorm)) axeExtrait = 'ter'

    return {
      intention: 'CHECK_TRAFFIC',
      texteBrut,
      traficData: { axe: axeExtrait },
    }
  }

  // 8. Démarches administratives citoyennes (ex: "demarche", "papiers", "comment faire mon passeport", "carte d'identite", "cni", "permis")
  const matchDemarcheDeclencheur = /(?:^|\b)(d[ée]marches?|papiers?|formalit[ée]s?|service\s+public|etat\s+civil)\b/i.test(texteNorm)
  const matchDocDirect = /(?:^|\b)(passeport|carte\s+d['’]identit[ée]|cni|permis\s+de\s+conduire|permis|casier\s+judiciaire|casier|certificat\s+de\s+nationalit[ée]|nationalit[ée]|acte\s+de\s+naissance|extrait\s+de\s+naissance|quittance\s+tr[ée]sor|timbre\s+fiscal)\b/i.test(texteNorm)

  if (matchDemarcheDeclencheur || matchDocDirect) {
    let qDemarche = texteNorm
      .replace(/^(?:comment\s+(?:faire|obtenir|renouveler)|pi[èe]ces?\s+(?:pour|du)?|d[ée]marche\s+(?:pour)?|papiers?\s+(?:pour)?|mon|ma|mes|le|la|les)\s+/gi, '')
      .trim()
    if (!qDemarche || /^(?:d[ée]marches?|papiers?)$/i.test(qDemarche)) {
      qDemarche = 'Démarches citoyennes'
    }
    return {
      intention: 'SEARCH_DEMARCHES',
      texteBrut,
      demarcheData: { query: qDemarche },
    }
  }

  // 9. Immobilier & Logement (ex: "immo", "immobilier", "appartement", "maison", "villa", "studio", "louer a dakar", "logement")
  const matchImmo = /(?:^|\b)(immo|immobilier|appartements?|apparts?|maisons?|villas?|studios?|logements?|loyer|loyers|louer|location|a\s+louer|a\s+vendre|terrains?|parcelles?|bureaux?)\b/i.test(texteNorm)
  if (matchImmo) {
    const qImmo = texteNorm
      .replace(/^(?:cherche|recherche|trouve|annonces?|offres?|prix)?\s*(?:d['’]|de\s+l['’]|de\s+la\s+|des\s+|du\s+|un\s+|une\s+)?/gi, '')
      .replace(/^(?:immo|immobilier)\s*/gi, '')
      .trim()
    return {
      intention: 'SEARCH_IMMO',
      texteBrut,
      immoData: { query: qImmo || 'Dakar' },
    }
  }

  // 10. Météo & Climat (ex: "meteo", "temps", "temperature", "pluie", "pleuvoir", "marees")
  const matchMeteo = /(?:^|\b)(m[ée]t[ée]o|temps\s+qu['’]il\s+fait|temp[ée]ratures?|pluie|pleuvoir|orage|soleil|mar[ée]es?|climat\s+dakar|pr[ée]visions?\s+m[ée]t[ée]o)\b/i.test(texteNorm)
  if (matchMeteo) {
    return {
      intention: 'CHECK_METEO',
      texteBrut,
    }
  }

  // 11. Sport & Lutte Sénégalaise (ex: "sport", "football", "foot", "match", "score", "lutte", "lamb", "arene")
  const matchSport = /(?:^|\b)(sports?|football|foot|matchs?|scores?|classement\s+ligue\s+1|lutte|lutte\s+s[ée]n[ée]galaise|lamb|combats?|ar[èe]ne\s+nationale|lions\s+de\s+la\s+t[ée]ranga)\b/i.test(texteNorm)
  if (matchSport) {
    return {
      intention: 'CHECK_SPORT',
      texteBrut,
    }
  }

  // 12. Presse & Kiosque des Unes (ex: "presse", "revue de presse", "kiosque", "journaux", "unes", "actualites")
  const matchPresse = /(?:^|\b)(presse|revue\s+de\s+presse|kiosque|kiosque\s+des\s+unes|journaux|journal|unes?\s+des\s+journaux|actualit[ée]s?|infos\s+du\s+jour|titres\s+du\s+matin)\b/i.test(texteNorm)
  if (matchPresse) {
    return {
      intention: 'OPEN_PRESSE',
      texteBrut,
    }
  }

  // 13. Emploi, CV, Entretiens (ex: "emploi", "travail", "boulot", "cv", "stage", "entretien d'embauche", "lettre de motivation")
  const matchEmploi = /(?:^|\b)(emploi|emplois|travail|boulot|recrutement|embauche|offres?\s+d['’]emploi|(?:mon\s+)?cv|faire\s+un\s+cv|curriculum|stages?|entretien\s+d['’]embauche|lettre\s+de\s+motivation|candidature)\b/i.test(texteNorm)
  if (matchEmploi) {
    return {
      intention: 'SEARCH_EMPLOI',
      texteBrut,
    }
  }

  // 14. Séries TV & Vidéos (ex: "videos", "series", "series tv", "replay", "marodi", "evenprod")
  const matchVideos = /(?:^|\b)(vid[ée]os?|s[ée]ries?|s[ée]ries?\s+tv|replay|marodi|evenprod|lutte\s+tv)\b/i.test(texteNorm)
  if (matchVideos) {
    return {
      intention: 'OPEN_VIDEOS',
      texteBrut,
    }
  }

  // 15. Briefing matinal (ex: "briefing", "mon briefing", "sommaire")
  if (/^(?:(?:donne[- ]moi\s+(?:mon\s+)?|lance\s+(?:le\s+)?|affiche\s+(?:le\s+)?)?briefing|point\s+du\s+jour)$/i.test(texteNorm)) {
    return {
      intention: 'BRIEFING',
      texteBrut,
    }
  }

  // 16. Calculatrice (consultation sans formule : "calculatrice", "calculette", "compter")
  if (/^(?:ouvrir\s+la\s+|afficher\s+la\s+)?(?:calculatrice|calculette|calcul)$/i.test(texteNorm)) {
    return {
      intention: 'OPEN_CALCULATOR',
      texteBrut,
    }
  }

  // 17. Notes & Mémos (consultation : "mes notes", "notes", "carnet")
  if (/^(?:mes\s+notes|afficher\s+les\s+notes|carnet|notes?)$/i.test(texteNorm)) {
    return {
      intention: 'OPEN_NOTES',
      texteBrut,
    }
  }

  // 18. Dépenses & Budget (consultation : "mes depenses", "mon budget", "depenses", "kalpe")
  if (/^(?:mes\s+d[ée]penses|mon\s+budget|kalp[ée]|d[ée]penses?|mon\s+argent|mon\s+portefeuille)$/i.test(texteNorm)) {
    return {
      intention: 'OPEN_DEPENSES',
      texteBrut,
    }
  }

  // 19. Agenda & Rappels (consultation : "mon agenda", "mes rappels", "agenda", "calendrier")
  if (/^(?:mon\s+agenda|mes\s+rappels|agenda|mon\s+calendrier|rappels?)$/i.test(texteNorm)) {
    return {
      intention: 'OPEN_AGENDA',
      texteBrut,
    }
  }

  // 20. Mon Compte, Profil & Paramètres (ex: "mon compte", "compte", "profil", "parametres", "reglages", "synchroniser", "deconnexion")
  if (/(?:^|\b)((?:mon\s+)?compte|profil|mon\s+profil|param[èe]tres|r[ée]glages|synchronisation|synchroniser|d[ée]connexion|connexion|se\s+connecter|login)\b/i.test(texteNorm)) {
    return {
      intention: 'OPEN_COMPTE',
      texteBrut,
    }
  }

  // 21. Surga Premium (ex: "premium", "surga premium", "abonnement", "passer premium", "tarifs")
  if (/(?:^|\b)(premium|surga\s+premium|abonnement|passer\s+premium|formule\s+premium|tarifs\s+surga|souscrire)\b/i.test(texteNorm)) {
    return {
      intention: 'OPEN_PREMIUM',
      texteBrut,
    }
  }

  // 22. Espaces Pro B2B (ex: "espace pro", "pro", "professionnel", "b2b")
  if (/(?:^|\b)(espace\s+pro|pro|professionnel|b2b|partenaires)\b/i.test(texteNorm)) {
    return {
      intention: 'OPEN_PRO',
      texteBrut,
    }
  }

  // 23. Ajout d'une note intemporelle (ex: "note appeler docteur", "mémo liste des prix")
  const matchNote = texteBrut.match(/^(?:note|ajouter note|mémo|memo)\s+(.+)$/i)
  if (matchNote) {
    const contenu = matchNote[1].trim()
    return {
      intention: 'ADD_NOTE',
      texteBrut,
      noteData: {
        titre: contenu.slice(0, 50),
        contenu,
      },
    }
  }

  return {
    intention: 'INCONNU',
    texteBrut,
  }
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
