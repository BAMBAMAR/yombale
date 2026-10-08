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
  // D53 : la mesure du trafic par le fournisseur n'est interrogée qu'une fois la source vérifiée à Dakar (SRG-A4-016).
  // Constat du 2026-10-08 : la couverture publiée par TomTom ne compte pas le Sénégal, et la mesure le confirme
  // (A5-108 : à Dakar, temps « en direct » égal au temps sans trafic, aucun segment de vitesse). Ne pas ouvrir avec ce fournisseur.
  traficSourceMesureeActive: () => actif('SURGA_TRAFIC_SOURCE_VERIFIEE'),
  // D57, D65 : marées et qualité de l'air viennent d'Open-Meteo, dont l'accès gratuit est réservé à un usage non
  // commercial. Avec une clé d'abonnement, les serveurs réservés aux clients sont interrogés ; sans clé, rien n'est
  // appelé, sauf si les essais non commerciaux sont ouverts. Rend null quand la source ne doit pas être appelée.
  openMeteo: () => {
    const cle = (process.env.SURGA_OPEN_METEO_CLE || '').trim();
    if (cle) return { cle };
    return actif('SURGA_OPEN_METEO_ESSAI') ? { cle: null } : null;
  },
  // D65 : Ligue 1 du Sénégal par TheSportsDB. Sans clé, la catégorie reste « indisponible ».
  theSportsDbCle: () => (process.env.SURGA_THESPORTSDB_CLE || '').trim() || null,
};
