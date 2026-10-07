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
function genererModeleLocal(requete) {
  const reqLower = requete.toLowerCase().trim();

  // 1. DISCOURS OU MOT DE BIENVENUE
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

  // 2. REFORMULATION DE TEXTE
  if (reqLower.includes('reformule') || reqLower.includes('ameliore') || reqLower.includes('corrige')) {
    const texteAExtraire = requete
      .replace(/^.*?(reformule|ameliore|corrige)\s*(ce\s+texte|ceci|le\s+message)?\s*[:\-]?\s*/i, '')
      .trim();

    const base = texteAExtraire || requete;
    return {
      texte: `Voici 3 propositions de reformulation soignées :\n\n1. Version Professionnelle & Formelle :\n« J'ai l'honneur de vous adresser ce message afin de faire le point avec vous sur ce dossier. Je reste à votre entière disposition pour tout complément d'information. »\n\n2. Version Chaleureuse & Teranga :\n« Bonjour, j'espère que vous vous portez bien. Je tenais à vous partager ces éléments et reste à votre écoute pour échanger ensemble à votre convenance. »\n\n3. Version Directe & Synthétique :\n« Bonjour. Voici les éléments convenus. Merci de me confirmer leur bonne réception dès que possible. Bien cordialement. »`,
      titreSuggere: 'Reformulation de texte',
    };
  }

  // 3. MESSAGE DE REMERCIEMENT OU FÉLICITATIONS
  if (reqLower.includes('remercie') || reqLower.includes('felicite') || reqLower.includes('bravo')) {
    return {
      texte: `Je tiens à vous adresser mes plus sincères félicitations pour cette belle réussite. C'est le fruit mérité de votre persévérance, de votre rigueur et de votre talent.\n\nJe vous souhaite une continuation tout aussi brillante et encore plus de succès dans tous vos futurs projets. Bravo et que la réussite vous accompagne toujours !`,
      titreSuggere: 'Message de félicitations et remerciements',
    };
  }

  // 4. RÉPONSE BIENVEILLANTE GÉNÉRALE
  return {
    texte: `Je comprends votre demande : « ${requete} ».\n\nEn tant qu'assistant de poche Surga, je peux vous aider à formuler des courriers, rédiger des discours, planifier vos rappels, enregistrer vos dépenses FCFA ou consulter en direct le trafic et les actualités de Dakar. N'hésitez pas à préciser votre besoin pour une assistance sur mesure !`,
    titreSuggere: `Note : ${requete.slice(0, 40)}`,
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
    // A. Action Dépense
    if (actionVocale.intention === 'ADD_EXPENSE' && actionVocale.depenseData) {
      return {
        type: 'ACTION_DEPENSE',
        action: 'ADD_EXPENSE',
        data: actionVocale.depenseData,
        message: `Dépense détectée : ${formaterFCFA(actionVocale.depenseData.montant)} (${actionVocale.depenseData.categorie}). Confirmer l'enregistrement ?`,
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
