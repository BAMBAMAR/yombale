// frontend-next/src/app/agence/[slug]/studio/constants.ts
// Presets, bannières et configurations par défaut pour le Studio Agence Immo

import {
  Sparkles,
  Building2,
  Sun,
  ShieldCheck
} from 'lucide-react';
import type { ThemeImmoPreset, BannerImmoOption, SectionVitrineItem } from './types';

export const THEMES_IMMO_PRESETS: ThemeImmoPreset[] = [
  {
    id: 'institutionnel',
    nom: 'Institutionnel & Confiance',
    description: 'Bleu marine statutaire, finitions sobres et rassurantes inspirant une totale sécurité juridique.',
    badge: 'Cabinet de gestion, Syndic, Baux institutionnels',
    couleurAccent: '#1C2B4A',
    couleurFond: '#FFFFFF',
    formeBoutons: 'squircle',
    exemples: 'Parfait pour les cabinets de gérance établis, transactions notariales et baux commerciaux.',
    icon: ShieldCheck,
  },
  {
    id: 'prestige',
    nom: 'Luxe & Prestige',
    description: 'Contraste sombre noble et or discret pour valoriser l\'immobilier d\'exception et le très haut standing.',
    badge: 'Villas d\'architecte, Almadies, Fann Résidence',
    couleurAccent: '#0F172A',
    couleurFond: '#FAF8F5',
    formeBoutons: 'squircle',
    exemples: 'Idéal pour les demeures de maître, résidences diplomatiques et penthouses vue mer.',
    icon: Sparkles,
  },
  {
    id: 'solaire',
    nom: 'Solaire & Terracotta',
    description: 'Nuances chaudes de terre cuite et sable fin, rappelant la convivialité et la lumière du littoral sénégalais.',
    badge: 'Saly, Somone, Résidences balnéaires',
    couleurAccent: '#C75B00',
    couleurFond: '#FFFBF5',
    formeBoutons: 'arrondi',
    exemples: 'Recommandé pour les programmes de villégiature sur la Petite Côte et les villas de vacances.',
    icon: Sun,
  },
  {
    id: 'contemporain',
    nom: 'Contemporain & Épuré',
    description: 'Design minimaliste, lignes nettes et accents minéraux pour mettre en valeur les nouveaux programmes neufs.',
    badge: 'VEFA, Plateaux bureaux, Lofts Plateau',
    couleurAccent: '#334155',
    couleurFond: '#FFFFFF',
    formeBoutons: 'droit',
    exemples: 'Conseillé pour les promoteurs neufs, lofts urbains et bureaux de standing.',
    icon: Building2,
  },
];

export const BANNIERES_IMMO_PRESETS: BannerImmoOption[] = [
  {
    id: 'villa_piscine',
    label: 'Villa Contemporaine Almadies',
    url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1400&q=80',
    tag: 'Prestige',
  },
  {
    id: 'horizon_mer',
    label: 'Horizon Océanique & Corniche',
    url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1400&q=80',
    tag: 'Vue Mer',
  },
  {
    id: 'immeuble_plateau',
    label: 'Architecture Contemporaine & Affaires',
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=80',
    tag: 'Urbain / Bureaux',
  },
  {
    id: 'palmiers_saly',
    label: 'Résidence Littorale Saly',
    url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1400&q=80',
    tag: 'Petite-Côte',
  },
];

export const SECTIONS_VITRINE_DEFAUT: SectionVitrineItem[] = [
  {
    id: 'reels',
    label: 'Visites Virtuelles & Reels',
    description: 'Flux vidéo immersif issu du Social Shop avec biens associés.',
    visible: true,
    iconName: 'Video',
  },
  {
    id: 'catalogue',
    label: 'Catalogue des Biens & Filtres',
    description: 'Grille interactive des propriétés actives (Vente, Location, Typologies).',
    visible: true,
    iconName: 'Home',
  },
  {
    id: 'confiance',
    label: 'Agrément Ministériel & Réassurance',
    description: 'Chiffres clés, agrément officiel d\'agent immobilier et garanties.',
    visible: true,
    iconName: 'ShieldCheck',
  },
  {
    id: 'contact',
    label: 'Coordonnées & Réseaux Sociaux',
    description: 'Liens WhatsApp, téléphone, adresse physique et 8 canaux officiels.',
    visible: true,
    iconName: 'Phone',
  },
];

export const PALETTES_ACCENT_IMMO = [
  { nom: 'Bleu Marine Nopalou', hex: '#1C2B4A' },
  { nom: 'Terracotta Solaire', hex: '#C75B00' },
  { nom: 'Vert Forêt Émeraude', hex: '#0A5C36' },
  { nom: 'Noir Ardoise Profond', hex: '#0F172A' },
  { nom: 'Bleu Océan VDN', hex: '#0284C7' },
  { nom: 'Bronze Doré', hex: '#9A3412' },
];
