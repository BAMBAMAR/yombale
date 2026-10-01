// backend/lib/abonnementsSql.js
// AUD-110 : un abonnement n'est « payant » que s'il provient d'un encaissement réel (référence abmt_).
// Avant : tout is_trial = FALSE comptait, y compris les attributions manuelles de l'admin (admin_test_…)
// et d'anciennes lignes d'essai sans indicateur : MRR affiché 65 000 FCFA pour 0 FCFA encaissé.
const PAYANT = "is_trial = FALSE AND commande_ref LIKE 'abmt\\_%'";
const ATTRIBUE_ADMIN = "is_trial = FALSE AND commande_ref LIKE 'admin\\_%'";

module.exports = { PAYANT, ATTRIBUE_ADMIN };
