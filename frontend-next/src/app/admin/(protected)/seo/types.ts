// frontend-next/src/app/admin/(protected)/seo/types.ts
// Interfaces TypeScript pour le cockpit de pilotage SEO Nopalou

export type PeriodeSeo = '7d' | '28d' | '90d' | '12m';

export type SourceMetrique = 
  | 'GSC'       // Google Search Console (officiel)
  | 'GA4'       // Google Analytics 4 (G-3KGE1YBMVJ)
  | 'SQL-PG'    // Base de données PostgreSQL Nopalou
  | 'SERP-SN'   // Sonde technique Google Sénégal
  | 'AUDIT-REF' // Référentiel de l'Audit SEO
  | 'ESTIME';   // Estimation de volume

export type StatutSuiviCluster = 
  | 'SUIVI ACTIF'
  | 'DONNÉES INSUFFISANTES'
  | 'SOURCE NON CONNECTÉE'
  | 'À VÉRIFIER'
  | 'SUSPENDU';

export type IntentionRecherche = 
  | 'Commerciale'
  | 'Transactionnelle'
  | 'Informationnelle'
  | 'Navigationnelle';

export type PrioriteCluster = 'P0' | 'P1' | 'P2' | 'P3';

export interface RequeteCluster {
  id: string; // Ex: GRP-0001
  requete: string;
  intention: IntentionRecherche;
  priorite: PrioriteCluster;
  categorie: string;
  pageCible: string;
  volumeEstime: string;
  positionObservee: number | null; // null si non observé
  positionPrecedente: number | null;
  clicsGsc: number;
  impressionsGsc: number;
  ctrGsc: number; // en %
  source: SourceMetrique;
  statut: StatutSuiviCluster;
  derniereObservation: string;
  actionRecommandee: string;
}

export interface PageSeoStatus {
  url: string;
  type: string;
  titre: string;
  statusHttp: number;
  robots: string;
  canonical: string;
  dansSitemap: boolean;
  scoreQualite: number; // /100
  clicsOrganiques: number;
  impressions: number;
  conversions: number;
  anomaliesOuvertes: number;
  dernierControle: string;
  derniereCorrection: string;
  statutValidation: 'VALIDÉ' | 'À REVALIDER' | 'RÉSERVE';
}

export type StatutCorrection = 
  | 'À ANALYSER'
  | 'À CORRIGER'
  | 'EN COURS'
  | 'CORRIGÉ'
  | 'À REVALIDER'
  | 'VALIDÉ'
  | 'BLOQUÉ'
  | 'RÉOUVERT';

export interface AuditCorrectionItem {
  id: string; // Ex: VAL-PIL-01 ou ANO-A11-01
  domaine: string;
  titre: string;
  preuveInitiale: string;
  causeDemontree: string;
  actionCorrective: string;
  fichiers: string[];
  priorite: 'P0' | 'P1' | 'P2';
  statut: StatutCorrection;
  dateDetection: string;
  dateCorrection: string;
  dateValidation: string;
  testsAssocies: string;
  resultatTest: 'PASS' | 'FAIL' | 'RÉSERVE' | 'BLOQUÉ';
  risqueResiduel: string;
}

export interface FunnelCommerceStep {
  id: string;
  etape: string;
  definition: string;
  source: SourceMetrique;
  volume: number;
  volumePrecedent: number;
  tauxPassage: number; // en % par rapport à l'étape précédente
  valeurFcfa?: number;
  limites: string;
}

export interface AlerteSeoItem {
  id: string;
  gravite: 'CRITIQUE' | 'MAJEURE' | 'MINEURE';
  titre: string;
  declencheur: string;
  seuil: string;
  source: SourceMetrique;
  dateDetection: string;
  actionRecommandee: string;
  statut: 'ACTIVE' | 'RÉSOLUE' | 'SOUS SURVEILLANCE';
}

export interface SourceConnexion {
  nom: string;
  badge: SourceMetrique;
  statut: 'CONNECTÉE' | 'PARTIELLE' | 'NON CONNECTÉE' | 'MANUELLE';
  methode: string;
  frequence: string;
  derniereSync: string;
  periodeCouverte: string;
  limites: string;
  actionRequise?: string;
}
