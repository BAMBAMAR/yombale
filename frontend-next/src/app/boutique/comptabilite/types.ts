export interface Zone {
  id: string
  nom: string
  prix: number
}

export interface Vente {
  id: string
  reference: string
  nom_produit: string
  quantite: number
  prix_unitaire: number
  frais_livraison: number
  montant_total: number
  client_nom: string | null
  methode_paiement: string
  created_at: string
  justificatif_url: string | null
}

export interface Produit {
  id: string
  nom: string
  prix: number | null
  prix_promo?: number | null
  prix_achat?: number | null
  stock_quantite: number | null
  quantite_stock?: number | null
  code_barre?: string | null
  categorie?: string | null
}

export interface Depense {
  id: string
  montant: number
  categorie: string
  description: string | null
  date_depense: string
  justificatif_url: string | null
}

export interface Dashboard {
  ca_mois: number
  ca_mois_precedent: number
  nb_ventes_mois: number
  ca_total: number
  depenses_mois: number
  depenses_total: number
  benefice_mois: number
  top_produits: { nom_produit: string; total_vendu: number; ca: number }[]
  stock_alerte: { id: string; nom: string; stock_quantite: number }[]
}

export interface BilanData {
  periode: { from: string | null; to: string | null }
  financier: {
    ca_total: number
    depenses_total: number
    benefice_net: number
    marge_nette_pct: number
    nb_ventes: number
    panier_moyen: number
    total_articles_vendus: number
    modes_paiement: { mode: string; count: number; total: number }[]
    depenses_par_categorie: Record<string, number>
    top_produits: { nom_produit: string; total_vendu: number; ca_genere: number }[]
    timeline: { jour: string; nb_ventes: number; ca: number }[]
  }
  inventaire: {
    total_references: number
    total_quantite_stock: number
    valeur_stock_achat: number
    valeur_stock_vente: number
    marge_stock_potentielle: number
    marge_stock_pct: number
    stock_alertes_count: number
    stock_ruptures_count: number
  }
  caissiers: {
    nom: string
    nb_ventes: number
    ca_total: number
    panier_moyen: number
    ca_especes: number
    ca_digital: number
    part_ca_pct: number
  }[]
}

export interface PosSessionItem {
  id: string
  boutique_id: string
  caissier_id: string | null
  caissier_nom: string
  fond_caisse_initial: number
  especes_comptees: number
  ventes_especes: number
  ventes_wave: number
  ventes_orange_money: number
  ventes_carte: number
  ventes_total: number
  nb_ventes: number
  ecart_caisse: number
  statut: 'ouverte' | 'cloturee'
  date_ouverture: string
  date_cloture: string | null
  created_at: string
}

export type DatePreset =
  | 'today'
  | 'yesterday'
  | '7d'
  | '30d'
  | 'this_month'
  | 'last_month'
  | 'this_year'
  | 'custom'
