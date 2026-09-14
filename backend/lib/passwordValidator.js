// backend/lib/passwordValidator.js
// Validation de la robustesse des mots de passe Nopalou

/**
 * Valide la robustesse d'un mot de passe :
 * - Au moins 8 caractères
 * - Au moins 1 chiffre (0-9)
 * - Au moins 1 majuscule ou 1 caractère spécial
 * 
 * @param {string} password 
 * @returns {{ valide: boolean, message: string }}
 */
function validerForceMotDePasse(password) {
  if (!password || typeof password !== 'string') {
    return { valide: false, message: 'Le mot de passe est obligatoire.' };
  }
  if (password.length < 8) {
    return { valide: false, message: 'Le mot de passe doit comporter au moins 8 caractères.' };
  }
  if (!/\d/.test(password)) {
    return { valide: false, message: 'Le mot de passe doit contenir au moins un chiffre (0-9).' };
  }
  if (!/[A-Z!@#$%^&*(),.?":{}|<>_\-+=\[\]\/\\`~;]/.test(password)) {
    return { valide: false, message: 'Le mot de passe doit contenir au moins une lettre majuscule ou un caractère spécial.' };
  }
  return { valide: true, message: 'Mot de passe robuste.' };
}

module.exports = {
  validerForceMotDePasse,
};
