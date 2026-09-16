// frontend-next/src/app/agence/[slug]/studio/types.ts
// Définition des types pour le Studio de Personnalisation Agence Immo

import type { LucideIcon } from 'lucide-react';

export interface SectionVitrineItem {
  id: 'reels' | 'catalogue' | 'confiance' | 'contact' | 'description';
  label: string;
  description: string;
  visible: boolean;
  iconName: string;
}

export interface ThemeImmoPreset {
  id: string;
  nom: string;
  description: string;
  badge: string;
  couleurAccent: string;
  couleurFond: string;
  formeBoutons: 'squircle' | 'arrondi' | 'droit';
  exemples: string;
  icon: LucideIcon;
}

export interface BannerImmoOption {
  id: string;
  label: string;
  url: string;
  tag: string;
}

export interface AgenceStudioConfig {
  theme_id: string;
  couleur_accent: string;
  couleur_fond: string;
  forme_boutons: 'squircle' | 'arrondi' | 'droit';
  cover_url: string;
  logo_url: string;
  slogan: string;
  bandeau_annonce: string;
  bandeau_annonce_actif: boolean;
  message_accueil_wa: string;
  disposition_sections: SectionVitrineItem[];
}
