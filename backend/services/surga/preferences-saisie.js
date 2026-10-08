// backend/services/surga/preferences-saisie.js
// Lecture des choix de personnalisation reçus du client (corps d'une requête ou paramètres d'adresse).
// Une liste de préférences est une liste de textes courts : tout autre contenu est écarté. Un tableau imbriqué
// enregistré comme « quartier » faisait planter l'écran d'accueil à la lecture suivante.

const HEURE = /^([01]\d|2[0-3]):[0-5]\d$/;
const IDENTIFIANT_MODULE = /^[a-z][a-z_]{0,29}$/;

function listeDeTextes(valeur, { max = 20, longueur = 80 } = {}) {
  if (!Array.isArray(valeur)) return null;
  return valeur
    .filter((v) => typeof v === 'string')
    .map((v) => v.trim())
    .filter((v) => v.length > 0 && v.length <= longueur)
    .slice(0, max);
}

const listeOu = (valeur, repli, options) => listeDeTextes(valeur, options) || listeDeTextes(repli, options) || [];

const heureValide = (valeur) => typeof valeur === 'string' && HEURE.test(valeur);

/**
 * SRG-A2-011 : un invité n'a pas de ligne de préférences, mais son appareil connaît ses choix. L'application les
 * joint à la demande du briefing (?quartier=…&modules=a,b&heure=06:30&equipes=A|B) ; ils ne servent qu'à composer
 * cette réponse, rien n'est écrit. Un paramètre absent ou mal formé est ignoré (le défaut s'applique).
 * Rend null quand aucun choix exploitable n'est présent.
 */
function choixDepuisAdresse(query) {
  if (!query || typeof query !== 'object') return null;
  const choix = {};

  const quartier = typeof query.quartier === 'string' ? query.quartier.trim() : '';
  if (quartier && quartier.length <= 80) choix.quartier = quartier;

  if (typeof query.modules === 'string') {
    const modules = query.modules.split(',').map((m) => m.trim()).filter((m) => IDENTIFIANT_MODULE.test(m));
    if (modules.length > 0) choix.modules = [...new Set(modules)].slice(0, 20);
  }

  if (heureValide(query.heure)) choix.heure = query.heure;

  if (typeof query.equipes === 'string') {
    const equipes = listeDeTextes(query.equipes.split('|'), { max: 30 });
    if (equipes && equipes.length > 0) choix.equipes = [...new Set(equipes)];
  }

  return Object.keys(choix).length > 0 ? choix : null;
}

module.exports = { listeDeTextes, listeOu, heureValide, choixDepuisAdresse };
