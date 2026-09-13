'use server'

export {
  createBoutique,
  updateBoutique,
  deleteBoutique,
  getBoutiquesMine,
} from './server-actions/boutiqueActions'

export {
  createProduit,
  updateProduit,
  deleteProduit,
  duplicateProduit,
  publierProduitAnnonce,
  marquerProduitPartage,
  updateStock,
  getBoutiqueProduits,
} from './server-actions/produitActions'

export {
  listZones,
  createZone,
  deleteZone,
  listVentes,
  declarerVente,
  getDashboard,
  getCreditsClients,
  listDepenses,
  addDepense,
  deleteDepense,
  updateVente,
  updateDepense,
  deleteVente,
  listCommandes,
  updateStatutCommande,
  creerCommandeDirecte,
  getPosHistorique,
  creerPosVente,
  declarerIncident,
  getBilanComptable,
  getInventaireValorise,
  getPosSessions,
  getPosSessionDetail,
} from './server-actions/caisseComptaActions'

export {
  getBoutiqueDocuments,
  creerBoutiqueDocument,
  modifierBoutiqueDocument,
  supprimerBoutiqueDocument,
  getFournisseurs,
  creerFournisseur,
  modifierFournisseur,
  supprimerFournisseur,
  getCommandesFournisseurs,
  creerCommandeFournisseur,
  modifierCommandeFournisseur,
  recevoirCommandeFournisseur,
  supprimerCommandeFournisseur,
  uploadJustificatifAchat,
  verifierBonAchat,
  getBoutiquePromotions,
  createPromotion,
  deletePromotion,
} from './server-actions/documentsFournisseursActions'
