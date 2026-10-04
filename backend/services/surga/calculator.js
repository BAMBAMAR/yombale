// backend/services/surga/calculator.js
// Moteur de calcul arithmétique déterministe (sans eval insécure, sans appel LLM)

/**
 * Nettoie et normalise l'expression mathématique
 * @param {string} expr
 * @returns {string}
 */
function normaliserExpression(expr) {
  if (!expr || typeof expr !== 'string') return '';
  return expr
    .replace(/×/g, '*')
    .replace(/x/gi, '*')
    .replace(/÷/g, '/')
    .replace(/,/g, '.')
    .replace(/\s+/g, '');
}

/**
 * Évalue une expression simple de manière déterministe avec prise en charge des pourcentages
 * @param {string} expr
 * @returns {{ success: boolean, resultat?: number, expressionNettoyee?: string, erreur?: string }}
 */
function evaluerCalcul(expr) {
  const propre = normaliserExpression(expr);
  if (!propre) {
    return { success: false, erreur: 'Expression vide' };
  }

  // Vérification de sécurité : uniquement chiffres, opérateurs, points et pourcentages
  if (!/^[0-9+\-*/().%]+$/.test(propre)) {
    return { success: false, erreur: 'Caractères non autorisés dans l’expression' };
  }

  try {
    let resolu = propre.replace(/(\d+(?:\.\d+)?)([+\-])(\d+(?:\.\d+)?)%/g, '($1$2($1*($3/100)))');
    resolu = resolu.replace(/(\d+(?:\.\d+)?)%/g, '($1/100)');

    // Tokenizer / Parser récursif déterministe sécurisé
    const resultat = evaluerTokens(resolu);
    if (!Number.isFinite(resultat)) {
      return { success: false, erreur: 'Calcul indéterminé ou division par zéro' };
    }

    return {
      success: true,
      resultat: Math.round(resultat * 100) / 100,
      expressionNettoyee: propre,
    };
  } catch (err) {
    return { success: false, erreur: err.message || 'Erreur de calcul' };
  }
}

/**
 * Évaluateur d'expressions mathématiques récursif sans eval()
 */
function evaluerTokens(str) {
  let pos = 0;

  function sauterEspaces() {
    while (pos < str.length && str[pos] === ' ') pos++;
  }

  function lireNombre() {
    sauterEspaces();
    let debut = pos;
    if (str[pos] === '-' || str[pos] === '+') pos++;
    while (pos < str.length && (/[0-9.]/.test(str[pos]))) {
      pos++;
    }
    const val = parseFloat(str.slice(debut, pos));
    if (Number.isNaN(val)) throw new Error('Nombre invalide');
    sauterEspaces();
    return val;
  }

  function facteur() {
    sauterEspaces();
    if (pos >= str.length) throw new Error('Fin d’expression inattendue');
    if (str[pos] === '(') {
      pos++; // Saute '('
      const val = expr();
      sauterEspaces();
      if (str[pos] !== ')') throw new Error('Parenthèse fermante manquante');
      pos++; // Saute ')'
      sauterEspaces();
      return val;
    }
    return lireNombre();
  }

  function terme() {
    sauterEspaces();
    let val = facteur();
    while (pos < str.length) {
      sauterEspaces();
      const op = str[pos];
      if (op === '*' || op === '/') {
        pos++;
        const second = facteur();
        if (op === '/') {
          if (second === 0) throw new Error('Division par zéro');
          val = val / second;
        } else {
          val = val * second;
        }
      } else {
        break;
      }
    }
    return val;
  }

  function expr() {
    sauterEspaces();
    let val = terme();
    while (pos < str.length) {
      sauterEspaces();
      const op = str[pos];
      if (op === '+' || op === '-') {
        pos++;
        const second = terme();
        val = op === '+' ? val + second : val - second;
      } else {
        break;
      }
    }
    return val;
  }

  const res = expr();
  sauterEspaces();
  if (pos < str.length) {
    throw new Error('Caractères résiduels invalides');
  }
  return res;
}

/**
 * Formate un montant en Franc CFA
 * @param {number} montant
 * @returns {string}
 */
function formaterFCFA(montant) {
  if (montant === null || montant === undefined || Number.isNaN(montant)) return '0 FCFA';
  const arrondi = Math.round(montant);
  return arrondi.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
}

module.exports = {
  normaliserExpression,
  evaluerCalcul,
  formaterFCFA,
};
