// frontend-next/src/app/(account)/compte/kalpe/types.ts
// Définitions TypeScript pour Sama Xaalis

export type ContexteType = 'personnel' | 'activite' | 'all';
export type DirectionType = 'entree' | 'sortie' | 'neutre';
export type OperationType = 'revenu' | 'depense' | 'vente_express' | 'versement_epargne' | 'remboursement_recu';

export interface KalpeConseil {
  type: 'warning' | 'success' | 'info' | 'neutral';
  titre: string;
  message: string;
  impact?: string;
}

export interface KalpeAlerte {
  type: 'danger' | 'warning' | 'info' | 'success';
  titre: string;
  description: string;
  actionLabel?: string;
  actionTab?: string;
}

export interface KalpeOperation {
  id: string;
  utilisateur_id: string;
  boutique_id?: string | null;
  contexte: 'personnel' | 'activite';
  type: OperationType;
  direction: DirectionType;
  montant: number;
  categorie: string;
  libelle: string;
  tiers_nom?: string | null;
  tiers_tel?: string | null;
  date_operation: string;
  reference?: string | null;
  created_at: string;
}

export interface KalpeDetteRemboursement {
  id: string;
  montant: number;
  date_reglement: string;
  mode_paiement?: string;
  note?: string;
}

export interface KalpeDette {
  id: string;
  tiers_nom: string;
  tiers_telephone?: string | null;
  montant_initial: number;
  montant_paye: number;
  montant_restant: number;
  direction: 'a_recevoir' | 'a_payer';
  date_pret: string;
  date_echeance?: string | null;
  statut: 'en_cours' | 'solde' | 'en_retard';
  contexte: 'personnel' | 'activite';
  note?: string | null;
  est_en_retard?: boolean;
  remboursements?: KalpeDetteRemboursement[];
  derniere_relance?: string | null;
}

export interface KalpeObjectif {
  id: string;
  titre: string;
  montant_cible: number;
  montant_actuel: number;
  date_echeance?: string | null;
  categorie: string;
  statut: 'en_cours' | 'atteint' | 'archive';
  pourcentage?: number;
  reste_a_epargner?: number;
}

export interface KalpeSynthese {
  disponible: number;
  entrees_mois: number;
  sorties_mois: number;
  a_recevoir: number;
  epargne_totale: number;
  nb_creances: number;
  nb_objectifs: number;
  operations_recentes: KalpeOperation[];
  conseils: KalpeConseil[];
}

export interface KalpeStats {
  periode: 'jour' | 'semaine' | 'mois' | 'annee';
  contexte?: 'all' | 'personnel' | 'activite';
  entrees: number;
  sorties: number;
  solde_net: number;
  categories: Array<{
    categorie: string;
    montant: number;
    pourcentage: number;
  }>;
  ratio: {
    personnel_pct: number;
    activite_pct: number;
  };
  details_contexte?: {
    personnel: { entrees: number; sorties: number; solde: number };
    activite: { entrees: number; sorties: number; solde: number };
  };
  alertes?: KalpeAlerte[];
  conseils?: KalpeConseil[];
  tendances?: {
    top_depense?: { categorie: string; montant: number; pourcentage: number } | null;
    dettes_retard_nb: number;
    dettes_retard_montant: number;
    dettes_imminentes_nb: number;
    taux_epargne: number;
    epargne_periode: number;
  };
}

export interface KalpeEtat {
  actif: boolean;
  abonnement?: any;
  hasBoutique: boolean;
  boutique?: {
    id: string;
    nom: string;
    slug: string;
  } | null;
}
