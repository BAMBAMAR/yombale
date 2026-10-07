// backend/services/surga/assistant-llm.js
// Service Assistant IA Unifié Surga : Génération LLM (Gemini Flash) + Navigation & Actions Locales
// Supporte : Rédaction, Discours, Reformulation, Calculs, Trafic, Concours, Météo, Dépenses, Rappels

const axios = require('axios');
const cfg = require('../../lib/settingsCache');
const { evaluerCalcul, formaterFCFA } = require('./calculator');
const { interpreterCommandeVocale } = require('./voice-interpreter');
const { obtenirTraficDakar } = require('./trafic-service');
const { listerConcours } = require('./concours-service');
const { obtenirMeteoDakar } = require('./meteo-service');

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

/**
 * Récupère la clé API Gemini
 */
async function getGeminiApiKey() {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    (await cfg.get('gemini_api_key')) ||
    null
  );
}

/**
 * Générateur de modèles intelligents en fallback déterministe (0 Mo de données, zéro latence)
 */
/**
 * Extrait le texte net à reformuler en supprimant les préfixes d'instruction
 */
function extraireTexteAReformuler(requete) {
  let texte = requete
    .replace(/^.*?\b(reformule[rz]?|am[ée]liore[rz]?|corrige[rz]?|r[ée][ée]cris?|r[ée]dige|peux[- ]tu reformuler)\s*(?:ce\s+texte|ceci|le\s+message|cette\s+phrase|ces\s+mots)?\s*[:\-]?\s*/i, '')
    .trim();

  texte = texte.replace(/^["'«\s]+|["'»\s]+$/g, '').trim();
  return texte || requete;
}

/**
 * Générateur de 3 reformulations contextualisées selon le sens réel du texte
 */
function genererReformulationsIntelligentes(texteSource) {
  const tLower = texteSource.toLowerCase();

  // THÈME 1 : DÉPART / QUITTER UN SERVICE OU POSTE / ADIEU
  if (/quitte|quitter|partir|d[ée]part|d[ée]mission|fin de mission|au revoir|adieu/i.test(tLower)) {
    const avecTristesse = /tristesse|regret|peine|cœur lourd|coeur lourd|émotion|emotion|regrette|triste/i.test(tLower);
    const serviceNom = /service/i.test(tLower) ? 'ce service' : /équipe|equipe/i.test(tLower) ? 'cette équipe' : /entreprise|société|societe/i.test(tLower) ? 'l\'entreprise' : 'cette structure';

    if (avecTristesse) {
      return {
        v1: `C'est avec beaucoup d'émotion et un profond regret que je vous informe de mon départ de ${serviceNom}. Je tiens à saluer l'engagement de chacun, à remercier chaleureusement la direction et mes collègues pour la richesse de nos collaborations, et je reste à votre entière disposition pour assurer une transition harmonieuse.`,
        v2: `C'est le cœur serré et avec une sincère tristesse que je quitte aujourd'hui notre service. Je garde un souvenir précieux de nos échanges, de l'esprit d'équipe et de la Teranga partagée au quotidien. Merci du fond du cœur à tous pour cette belle aventure humaine et professionnelle. Dal leen ak jamm !`,
        v3: `C'est avec regret que je vous annonce mon départ de ${serviceNom}. Je remercie toute l'équipe pour le travail accompli ensemble et vous souhaite une excellente suite professionnelle.`
      };
    }

    return {
      v1: `Je vous informe par la présente de mon départ prochain de ${serviceNom}. Je tiens à vous exprimer toute ma gratitude pour les opportunités et les synergies développées au sein de notre équipe.`,
      v2: `Une page se tourne pour moi : je quitte bientôt notre équipe. Je tenais à vous remercier chaleureusement pour votre accueil, votre soutien et ces moments partagés tout au long de mon parcours parmi vous.`,
      v3: `Je vous annonce mon départ prochain de ${serviceNom}. Merci à tous pour votre collaboration et bonne continuation dans la réalisation de vos projets.`
    };
  }

  // THÈME 2 : ABSENCE / RETARD / EMPÊCHEMENT
  if (/absent|absence|retard|pas venir|pas l[àa]|emp[êe]ch[ée]|pas disponible|indisponible|malade|impr[ée]vu/i.test(tLower)) {
    return {
      v1: `Je vous prie de bien vouloir excuser mon indisponibilité. En raison d'un contretemps indépendant de ma volonté, je ne serai pas en mesure d'être présent comme prévu. Je reste à votre disposition pour reprogrammer cet échange dès que possible.`,
      v2: `Bonjour, j'espère que vous vous portez bien. Je suis sincèrement désolé(e), mais j'ai un empêchement de dernière minute et je ne pourrai pas vous rejoindre à l'heure convenue. Je vous recontacte très rapidement pour convenir d'un nouveau créneau !`,
      v3: `Bonjour, je serai malheureusement absent(e) suite à un imprévu. Je reviens vers vous sans délai avec des disponibilités alternatives. Merci pour votre compréhension.`
    };
  }

  // THÈME 3 : RELANCE / ATTENTE DE RÉPONSE / SUIVI DE DOSSIER
  if (/relance|nouvelle|r[ée]ponse|attente|urgent|dossier|point|retour|avancement/i.test(tLower)) {
    return {
      v1: `Je me permets de revenir vers vous afin de solliciter une mise à jour concernant l'avancement de ce dossier. Votre retour nous serait particulièrement précieux afin de finaliser nos démarches dans les meilleurs délais.`,
      v2: `Bonjour, j'espère que votre semaine se passe au mieux. Je viens gentiment aux nouvelles concernant les éléments transmis précédemment. N'hésitez pas à me faire signe si vous avez besoin d'éclaircissements. Au plaisir d'échanger avec vous !`,
      v3: `Bonjour. Je me permets de relancer notre dernier échange. Avez-vous pu prendre connaissance des éléments ? Merci d'avance pour votre confirmation.`
    };
  }

  // THÈME 4 : REMERCIEMENT / GRATITUDE
  if (/merci|remercie|reconnaissant|gratitude|aide|soutien|gentillesse/i.test(tLower)) {
    return {
      v1: `Je tiens à vous adresser mes plus vifs remerciements pour la qualité de votre accompagnement et votre disponibilité sans faille dans le cadre de cette collaboration.`,
      v2: `Un très grand merci pour votre aide précieuse et votre bienveillance ! Votre soutien a fait toute la différence et c'est un réel plaisir de collaborer avec vous au quotidien.`,
      v3: `Merci beaucoup pour votre réactivité et votre appui efficace sur ce sujet. Bien cordialement.`
    };
  }

  // THÈME 5 : EXCUSE / PARDON / ERREUR
  if (/d[ée]sol[ée]|excuse|pardon|erreur|tromp[ée]|oubli/i.test(tLower)) {
    return {
      v1: `Je vous prie d'accepter mes excuses les plus sincères pour ce désagrément regrettable. Toutes les dispositions nécessaires ont été prises sans délai afin de rectifier la situation.`,
      v2: `Je suis sincèrement navré(e) pour ce contretemps et je vous présente toutes mes excuses. Merci beaucoup pour votre patience et votre compréhension bienveillante.`,
      v3: `Veuillez m'excuser pour cette erreur. La correction a été effectuée immédiatement. Merci pour votre compréhension.`
    };
  }

  // THÈME 6 : FÉLICITATIONS / SUCCÈS
  if (/f[ée]licit|bravo|succ[èe]s|r[ée]ussite|chapeau|victoire|promu/i.test(tLower)) {
    return {
      v1: `Je tiens à vous adresser mes plus sincères félicitations pour cette remarquable réussite. C'est le juste couronnement de votre investissement constant et de votre rigueur exemplaire.`,
      v2: `Toutes mes félicitations ! C'est une magnifique nouvelle qui récompense tout votre travail et votre talent. Très heureux/se pour vous et plein succès pour la suite !`,
      v3: `Bravo pour ce succès pleinement mérité. Félicitations et excellente continuation dans cette nouvelle étape.`
    };
  }

  // THÈME 7 : DEMANDE / NÉGOCIATION / BUDGET
  if (/augmentation|salaire|prix|budget|trop cher|co[ûu]t|n[ée]goc/i.test(tLower)) {
    return {
      v1: `Au regard des résultats obtenus et des exigences de notre mission, je souhaiterais solliciter un entretien afin d'échanger sur un ajustement financier en adéquation avec nos réalisations.`,
      v2: `Bonjour, au vu du travail accompli et de notre bel engagement ces derniers mois, j'aimerais qu'on prenne un moment pour discuter sereinement d'une revalorisation de nos conditions.`,
      v3: `Bonjour, je souhaiterais convenir d'un rendez-vous afin de faire le point sur mes performances et aborder la question d'un réajustement salarial.`
    };
  }

  // THÈME UNIVERSEL ADAPTATIF
  const phraseNettoyee = texteSource.charAt(0).toLowerCase() + texteSource.slice(1).replace(/[.!?]+$/, '');

  return {
    v1: `Je me permets de vous informer que ${phraseNettoyee}. Je reste à votre entière disposition pour tout échange complémentaire sur ce point.`,
    v2: `Bonjour, j'espère que vous vous portez bien. Je tenais à vous partager ce qui suit : ${phraseNettoyee}. N'hésitez pas à me faire signe si besoin, je reste à votre écoute !`,
    v3: `Pour information : ${texteSource.charAt(0).toUpperCase() + texteSource.slice(1).replace(/[.!?]+$/, '')}. Merci de bien vouloir me confirmer la bonne prise en compte.`
  };
}

/**
 * Générateur de modèles intelligents en fallback déterministe
 */
function genererModeleLocal(requete) {
  const reqLower = requete.toLowerCase().trim();

  // 1. REFORMULATION DE TEXTE DYNAMIQUE (PRIORITAIRE)
  if (/reformule|am[ée]liore|corrige|r[ée][ée]cris/i.test(reqLower)) {
    const texteAExtraire = extraireTexteAReformuler(requete);
    const ref = genererReformulationsIntelligentes(texteAExtraire);
    return {
      texte: `Voici 3 propositions de reformulation soignées pour votre message :\n\n1. Version Professionnelle & Formelle :\n« ${ref.v1} »\n\n2. Version Chaleureuse & Teranga :\n« ${ref.v2} »\n\n3. Version Directe & Synthétique :\n« ${ref.v3} »`,
      titreSuggere: `Reformulation : « ${texteAExtraire.slice(0, 40)}${texteAExtraire.length > 40 ? '...' : ''} »`,
    };
  }

  // 2. DISCOURS OU MOT DE BIENVENUE
  if (reqLower.includes('discours') || reqLower.includes('bienvenu') || reqLower.includes('accueil')) {
    if (reqLower.includes('mariage') || reqLower.includes('famille')) {
      return {
        texte: `Chers parents, chers amis, honorables invités,\n\nC'est avec une immense joie et une profonde gratitude que nous vous accueillons aujourd'hui parmi nous. Votre présence chaleureuse honore nos deux familles et donne à cette célébration tout son sens de Teranga et de partage.\n\nQue cette union soit bénie de paix, d'harmonie et de prospérité durable. Merci du fond du cœur d'être les témoins privilégiés de ce beau moment de communion. Soyez tous les très bienvenus !`,
        titreSuggere: 'Discours de bienvenue — Mariage & Famille',
      };
    }
    return {
      texte: `Mesdames et Messieurs, chers collègues, honorables invités,\n\nC'est un honneur et un réel plaisir de vous souhaiter la plus cordiale bienvenue à cette rencontre. Votre participation témoigne de votre engagement et de l'intérêt que vous portez à nos objectifs communs.\n\nNous espérons que ces échanges seront riches, constructifs et porteurs de collaborations fructueuses. Je vous remercie pour votre présence et vous souhaite une excellente session parmi nous. Dal leen ak jamm !`,
      titreSuggere: 'Discours de bienvenue — Réunion & Cérémonie',
    };
  }

  // 3. LETTRE / COURRIER / EMAIL FORMEL
  if (reqLower.includes('lettre') || reqLower.includes('courrier') || reqLower.includes('email') || reqLower.includes('d[ée]mission')) {
    if (reqLower.includes('d[ée]mission')) {
      return {
        texte: `Madame, Monsieur,\n\nPar la présente, je vous informe de ma décision de démissionner de mes fonctions au sein de votre établissement. Conformément aux termes de mon contrat de travail, j'effectuerai la période de préavis convenue jusqu'à son terme.\n\nJe tiens à vous remercier pour les opportunités qui m'ont été accordées et pour la confiance dont vous avez fait preuve à mon égard tout au long de mon parcours parmi vous.\n\nJe reste à votre entière disposition pour assurer la passation des dossiers dans les meilleures conditions.\n\nVeuillez agréer, Madame, Monsieur, l'expression de mes salutations distinguées.`,
        titreSuggere: 'Lettre de démission formelle',
      };
    }
    return {
      texte: `Madame, Monsieur,\n\nJe me permets de vous adresser ce courrier afin de solliciter votre bienveillance sur l'objet de notre demande. Soucieux du respect des règles et des procédures en vigueur, j'ai l'honneur de porter à votre connaissance les éléments nécessaires à l'instruction de ce dossier.\n\nEspérant une suite favorable à ma requête, je reste à votre entière disposition pour tout renseignement complémentaire.\n\nJe vous prie d'agréer, Madame, Monsieur, l'assurance de ma considération distinguée.`,
      titreSuggere: 'Courrier formel soigné',
    };
  }

  // 4. MESSAGE DE REMERCIEMENT OU FÉLICITATIONS
  if (reqLower.includes('remercie') || reqLower.includes('felicite') || reqLower.includes('bravo')) {
    return {
      texte: `Je tiens à vous adresser mes plus sincères félicitations pour cette belle réussite. C'est le fruit mérité de votre persévérance, de votre rigueur et de votre talent.\n\nJe vous souhaite une continuation tout aussi brillante et encore plus de succès dans tous vos futurs projets. Bravo et que la réussite vous accompagne toujours !`,
      titreSuggere: 'Message de félicitations et remerciements',
    };
  }

  // 5. RÉPONSE D'ASSISTANCE CONTEXTUELLE
  return {
    texte: `Voici ce que je peux vous proposer pour : « ${requete} ».\n\nPour une communication percutante ou une démarche officielle à Dakar, vous pouvez préciser votre besoin :\n• Rédiger un courrier officiel ou un mot d'adieu\n• Reformuler une phrase (« reformule : ma phrase »)\n• Enregistrer une dépense ou dette (« dette 3000 »)\n• Programmer un rappel ou consulter le trafic en direct.\n\nÀ votre écoute pour vous accompagner !`,
    titreSuggere: `Assistance : ${requete.slice(0, 40)}`,
  };
}

/**
 * Appelle Gemini 1.5 Flash pour générer une réponse fluide
 */
async function appelerGeminiGeneration(requete) {
  const apiKey = await getGeminiApiKey();
  if (!apiKey) return null;

  const promptSystem = `
Tu es Surga, l'assistant personnel de poche sénégalais, bienveillant, élégant et chaleureux.
Tu réponds aux requêtes de l'utilisateur avec précision, courtoisie (Teranga sénégalaise) et un français irréprochable.
Si l'utilisateur demande de rédiger un discours, un mot de bienvenue, une lettre, ou de reformuler un texte, propose directement un contenu de haute tenue, bien structuré et prêt à l'emploi.
RÈGLES :
- Sois direct et concis (pas de bavardage introductif inutile, donne directement le texte demandé).
- Utilise un vouvoiement de respect par défaut.
- Évite les émojis superflus, privilégie une mise en page claire et aérée.
`;

  try {
    const res = await axios.post(
      `${GEMINI_API_URL}?key=${apiKey.trim()}`,
      {
        contents: [
          {
            role: 'user',
            parts: [{ text: `${promptSystem}\n\nDemande utilisateur : "${requete}"` }],
          },
        ],
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 600,
        },
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 6500,
      }
    );

    const texteGenere = res.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!texteGenere) return null;

    return {
      texte: texteGenere,
      titreSuggere: requete.slice(0, 45),
    };
  } catch (err) {
    console.warn('[SURGA GEMINI GEN WARN]:', err.message);
    return null;
  }
}

/**
 * Point d'entrée principal pour l'Omnibar Surga
 * Analyse si la requête est une action locale, une demande de données ou une génération LLM
 */
async function traiterRequeteSurgaAssistant({ query, userId }) {
  if (!query || typeof query !== 'string' || !query.trim()) {
    return {
      type: 'INFO',
      message: 'Veuillez saisir une demande pour Surga.',
    };
  }

  const texte = query.trim();
  const texteLower = texte.toLowerCase();

  // ── CAS 1 : CALCUL MATHÉMATIQUE INSTANTANÉ ──────────────────────────────
  const calculRes = evaluerCalcul(texte);
  if (calculRes.success) {
    return {
      type: 'CALCUL',
      expression: calculRes.expressionNettoyee,
      resultat: calculRes.resultat,
      formatFCFA: formaterFCFA(calculRes.resultat),
      message: `Résultat : ${calculRes.expressionNettoyee} = ${calculRes.resultat.toLocaleString('fr-FR')} (${formaterFCFA(calculRes.resultat)})`,
    };
  }

  // ── CAS 2 : ACTION LOCALE OU NAVIGATION SURGA (Interpréteur Fast-Path) ────
  const actionVocale = interpreterCommandeVocale(texte);

  if (actionVocale && actionVocale.intention !== 'INCONNU') {
    // A. Action Dépense & Dette
    if (actionVocale.intention === 'ADD_EXPENSE' && actionVocale.depenseData) {
      const estDette = /dette|cr[ée]dit|cr[ée]ance|pr[êe]t|emprunt/i.test(actionVocale.depenseData.categorie || actionVocale.depenseData.note || texte);
      return {
        type: 'ACTION_DEPENSE',
        action: 'ADD_EXPENSE',
        data: actionVocale.depenseData,
        message: estDette
          ? `Dette détectée : ${formaterFCFA(actionVocale.depenseData.montant)} (${actionVocale.depenseData.note || 'Dette'}). Confirmer l'enregistrement dans Sama Xaalis ?`
          : `Dépense détectée : ${formaterFCFA(actionVocale.depenseData.montant)} (${actionVocale.depenseData.categorie}). Confirmer l'enregistrement ?`,
      };
    }

    // B. Action Rappel / Agenda
    if (actionVocale.intention === 'ADD_REMINDER' && actionVocale.rappelData) {
      return {
        type: 'ACTION_RAPPEL',
        action: 'ADD_REMINDER',
        data: actionVocale.rappelData,
        message: `Rappel programmé : "${actionVocale.rappelData.titre}" le ${actionVocale.rappelData.date} à ${actionVocale.rappelData.heure}. Confirmer ?`,
      };
    }

    // C. Action Note
    if (actionVocale.intention === 'ADD_NOTE' && actionVocale.noteData) {
      return {
        type: 'ACTION_NOTE',
        action: 'ADD_NOTE',
        data: actionVocale.noteData,
        message: `Note prête à enregistrer : "${actionVocale.noteData.titre}".`,
      };
    }

    // D. Données Trafic en direct
    if (actionVocale.intention === 'CHECK_TRAFFIC') {
      try {
        const trafic = await obtenirTraficDakar();
        return {
          type: 'DATA_TRAFIC',
          titre: 'Trafic Dakar en direct',
          data: trafic,
          message: trafic?.synthese || 'Circulation fluide sur les principaux axes.',
          navigation: { tab: 'aujourdhui', modal: 'trafic' },
        };
      } catch (e) {
        return { type: 'NAVIGATION', tab: 'aujourdhui', modal: 'trafic', message: 'Ouverture du trafic Dakar.' };
      }
    }

    // E. Données Concours
    if (actionVocale.intention === 'SEARCH_CONCOURS') {
      try {
        const queryTerm = actionVocale.concoursData?.query || '';
        const concours = await listerConcours({ query: queryTerm });
        return {
          type: 'DATA_CONCOURS',
          titre: 'Concours & Examens Nationaux',
          query: queryTerm,
          data: (concours || []).slice(0, 4),
          message: `${concours.length} concours répertoriés.`,
          navigation: { tab: 'services', modal: 'concours' },
        };
      } catch (e) {
        return { type: 'NAVIGATION', tab: 'services', modal: 'concours', message: 'Ouverture des concours.' };
      }
    }

    // F. Météo & Marée
    if (actionVocale.intention === 'CHECK_METEO') {
      try {
        const meteo = await obtenirMeteoDakar('Dakar Plateau');
        return {
          type: 'DATA_METEO',
          titre: 'Météo & Marée Dakar',
          data: meteo,
          message: `${meteo.temperature}°C, ${meteo.description}. Marée haute à ${meteo.mareeHaute}.`,
        };
      } catch (e) {
        return { type: 'DATA_METEO', message: '28°C Ensoleillé • Marée haute 17h45 • Qualité air : Bonne.' };
      }
    }

    // G. Navigation simple
    if (actionVocale.intention === 'OPEN_NOTES') return { type: 'NAVIGATION', tab: 'notes', message: 'Ouverture de vos notes.' };
    if (actionVocale.intention === 'OPEN_DEPENSES') return { type: 'NAVIGATION', tab: 'depenses', message: 'Ouverture de Sama Xaalis.' };
    if (actionVocale.intention === 'OPEN_AGENDA') return { type: 'NAVIGATION', tab: 'agenda', message: 'Ouverture de votre agenda.' };
    if (actionVocale.intention === 'OPEN_PRESSE') return { type: 'NAVIGATION', tab: 'aujourdhui', modal: 'kiosque', message: 'Ouverture du Kiosque des Unes.' };
    if (actionVocale.intention === 'PLAY_RADIO') return { type: 'NAVIGATION', tab: 'services', modal: 'radio', message: 'Ouverture des Radios FM.' };
    if (actionVocale.intention === 'SEARCH_IMMO') return { type: 'NAVIGATION', tab: 'services', modal: 'immo', message: 'Recherche immobilière.' };
    if (actionVocale.intention === 'SEARCH_DEMARCHES') return { type: 'NAVIGATION', tab: 'services', modal: 'demarches', message: 'Démarches administratives.' };
    if (actionVocale.intention === 'SEARCH_PLACES') return { type: 'NAVIGATION', tab: 'services', modal: 'places', message: 'Bonnes adresses & bons plans.' };
    if (/shopping|boutique|produit|magasin|achat|acheter/i.test(texte)) {
      return { type: 'NAVIGATION', tab: 'services', modal: 'shopping', message: 'Ouverture du Shopping & Boutiques Nopalou.' };
    }
  }

  // ── CAS 3 : GÉNÉRATION LLM (DISCOURS, REFORMULATION, RÉDACTION, QUESTIONS) ─
  // Tentative Gemini Flash en premier lieu
  let llmRes = await appelerGeminiGeneration(texte);

  // Fallback intelligent déterministe immédiat si hors ligne ou sans clé API
  if (!llmRes || !llmRes.texte) {
    llmRes = genererModeleLocal(texte);
  }

  return {
    type: 'LLM_REPLY',
    query: texte,
    texte: llmRes.texte,
    titreSuggere: llmRes.titreSuggere,
    message: 'Réponse générée par l\'assistant Surga.',
  };
}

module.exports = {
  traiterRequeteSurgaAssistant,
  appelerGeminiGeneration,
  genererModeleLocal,
};
