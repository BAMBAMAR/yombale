// backend/services/surga/interrupteurs.js
// Interrupteurs côté serveur des fonctions de Surga qui ne font pas partie du lancement (décisions D51, D52, D54).
// Éteints par défaut : une fonction ne s'ouvre que si sa variable d'environnement vaut exactement « true ».
// Lus à chaque appel, pour qu'un changement de configuration prenne effet au redémarrage sans autre modification.

const actif = (nom) => process.env[nom] === 'true';

module.exports = {
  // D51 : le routage Surga du bot WhatsApp de Nopalou (SRG-A4-001, SRG-A4-002). Éteint, le bot se comporte comme sur main.
  whatsappActif: () => actif('SURGA_WHATSAPP_ACTIF'),
  // D52 : l'assistant de rédaction et tout appel au modèle de langage (SRG-A4-018).
  assistantActif: () => actif('SURGA_ASSISTANT_ACTIF'),
  // D54 : le podcast privé (SRG-A4-017).
  podcastActif: () => actif('SURGA_PODCAST_ACTIF'),
};
