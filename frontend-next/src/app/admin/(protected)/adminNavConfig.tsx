import React from 'react'
import {
  LayoutDashboard,
  Server,
  Store,
  ShoppingBag,
  Package,
  Layers,
  Monitor,
  CreditCard,
  Rocket,
  Home,
  Building2,
  FileSpreadsheet,
  AlertTriangle,
  FileText,
  MessageSquare,
  HelpCircle,
  Activity,
  ArrowDownLeft,
  Wallet,
  Receipt,
  Crown,
  Award,
  TrendingUp,
  Target,
  Sparkles,
  Handshake,
  MousePointer,
  MessageCircle,
  Share2,
  Users,
  ShieldAlert,
  Smartphone,
  Radio,
  Search,
  Flag,
  Palette,
  ShieldCheck,
  User,
} from 'lucide-react'

export interface MenuItem {
  href: string
  label: string
  icon: React.ReactNode
  badge?: string
  highlight?: string
}

export interface DomainSection {
  id: string
  title: string
  items: MenuItem[]
}

export const DOMAINS: DomainSection[] = [
  {
    id: 'direction',
    title: 'Direction & Pilotage',
    items: [
      { href: '/admin', label: 'Dashboard Métier', icon: <LayoutDashboard size={15} /> },
      { href: '/admin/system', label: 'Santé Système & Exports', icon: <Server size={15} /> },
      { href: '/admin/surga', label: 'Surga Control Center', icon: <Sparkles size={15} />, highlight: '#C75B00', badge: 'IA' },
    ],
  },
  {
    id: 'commerce',
    title: 'Commerce & Marchands',
    items: [
      { href: '/admin/boutiques', label: 'Réseau Boutiques', icon: <Store size={15} /> },
      { href: '/admin/commandes', label: 'Commandes Web', icon: <ShoppingBag size={15} /> },
      { href: '/admin/produits', label: 'Produits & Stocks', icon: <Package size={15} />, highlight: '#0284c7' },
      { href: '/admin/categories', label: 'Arborescence Catégories', icon: <Layers size={15} /> },
      { href: '/admin/pos', label: 'Réseau POS & Caisses', icon: <Monitor size={15} />, highlight: '#10b981' },
      { href: '/admin/carnet-dettes', label: 'Carnet Dettes & Sama Xaalis', icon: <CreditCard size={15} />, highlight: '#f97316' },
      { href: '/admin/migration', label: 'Migration Marchands', icon: <Rocket size={15} /> },
    ],
  },
  {
    id: 'immo',
    title: 'Immobilier & Patrimoine',
    items: [
      { href: '/admin/immo', label: "Vue d'ensemble Immo", icon: <Home size={15} /> },
      { href: '/admin/immo/agences', label: 'Agences & Comptes Pro', icon: <Building2 size={15} />, highlight: '#8b5cf6' },
      { href: '/admin/immo/biens', label: 'Biens, Baux & Loyers', icon: <FileSpreadsheet size={15} /> },
    ],
  },
  {
    id: 'moderation',
    title: 'Modération & Confiance',
    items: [
      { href: '/admin/signalements', label: "Signalements d'Abus", icon: <AlertTriangle size={15} />, highlight: '#ef4444', badge: 'Urgent' },
      { href: '/admin/annonces', label: 'Annonces Classifiées', icon: <FileText size={15} /> },
      { href: '/admin/avis', label: 'Modération Avis Boutiques', icon: <MessageSquare size={15} />, highlight: '#8b5cf6' },
      { href: '/admin/support', label: 'Support Client & Litiges', icon: <HelpCircle size={15} />, highlight: '#06b6d4' },
      { href: '/admin/qualite', label: 'Qualité Données & Santé', icon: <Activity size={15} /> },
    ],
  },
  {
    id: 'finances',
    title: 'Finances & Monétisation',
    items: [
      { href: '/admin/reversements', label: 'Reversements Wave 1-Clic', icon: <ArrowDownLeft size={15} />, highlight: '#10b981' },
      { href: '/admin/paiements', label: 'Flux Wave/OM & Journal', icon: <Wallet size={15} />, highlight: '#3b82f6' },
      { href: '/admin/paiements-manuels', label: 'Paiements Manuels', icon: <Receipt size={15} /> },
      { href: '/admin/abonnements', label: 'Abonnements Marchands', icon: <Crown size={15} /> },
      { href: '/admin/plans', label: 'Plans & Grille Tarifaire', icon: <Award size={15} /> },
      { href: '/admin/revenus', label: "Compte d'Exploitation P&L", icon: <TrendingUp size={15} /> },
    ],
  },
  {
    id: 'croissance',
    title: 'Croissance & Canaux CRM',
    items: [
      { href: '/admin/prospection', label: 'Prospection & Leads', icon: <Target size={15} /> },
      { href: '/admin/prospection/intelligence', label: 'Intelligence Marché', icon: <Sparkles size={15} /> },
      { href: '/admin/force-de-vente', label: 'Force de Vente Terrain', icon: <Rocket size={15} /> },
      { href: '/admin/partenaires', label: 'Partenaires B2B', icon: <Handshake size={15} /> },
      { href: '/admin/affiliation', label: 'Affiliation & Apporteurs', icon: <MousePointer size={15} /> },
      { href: '/admin/whatsapp', label: 'WhatsApp Bot & Automation', icon: <MessageCircle size={15} /> },
      { href: '/admin/publications', label: 'Réseaux Sociaux Meta', icon: <Share2 size={15} />, highlight: '#0284c7' },
    ],
  },
  {
    id: 'systeme',
    title: 'Configuration & Équipe',
    items: [
      { href: '/admin/comptes', label: 'Comptes Utilisateurs', icon: <Users size={15} /> },
      { href: '/admin/equipe-admin', label: 'Équipe & Droits RBAC', icon: <ShieldAlert size={15} />, highlight: '#f59e0b' },
      { href: '/admin/telecom', label: 'Forfaits Télécom', icon: <Smartphone size={15} /> },
      { href: '/admin/integrations', label: 'Connecteurs & Pixels', icon: <Radio size={15} />, highlight: '#ec4899' },
      { href: '/admin/seo', label: 'SEO & Référencement', icon: <Search size={15} /> },
      { href: '/admin/feature-flags', label: 'Feature Flags No-Code', icon: <Flag size={15} /> },
      { href: '/admin/communication', label: 'Kit Communication', icon: <Palette size={15} /> },
      { href: '/admin/audit-logs', label: 'Audit Logs & Sécurité', icon: <ShieldCheck size={15} />, highlight: '#10b981' },
      { href: '/admin/developer', label: 'Portail Développeur API', icon: <Server size={15} /> },
      { href: '/admin/compte', label: 'Mon Profil Administrateur', icon: <User size={15} /> },
    ],
  },
]
