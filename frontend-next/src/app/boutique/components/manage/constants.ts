import type { ManageTab, NavGroup } from '../../types'
import {
  LayoutDashboard,
  Package,
  Warehouse,
  Megaphone,
  Palette,
  Share2,
  Settings,
  Receipt,
  Zap,
  BarChart3,
  FileText,
  Truck,
  Gift,
  Scale,
  Users,
  ScrollText,
  Code2,
  Boxes,
  Split,
  ShoppingBag,
  ClipboardList,
  BookOpen,
  Store,
  ShieldCheck,
  LucideIcon,
} from 'lucide-react'

export const VALID_TABS: ManageTab[] = [
  'dashboard',
  'produits',
  'commandes',
  'carnet',
  'express',
  'compta',
  'analytics',
  'personnaliser',
  'infos',
  'marketing',
  'social',
  'equipe',
  'admins',
  'caissiers',
  'documents',
  'fournisseurs',
  'fiscalite',
  'journal',
  'developer',
  'fidelite',
  'appstore',
  'entrepots',
  'abtesting',
]

export function getNavEssential(t: (key: string) => string): NavGroup[] {
  return [
    {
      icon: LayoutDashboard,
      title: t('shop.navGroupSalesClients') || 'Mon activité essentielle',
      items: [
        { key: 'dashboard', icon: LayoutDashboard, label: t('shop.overview') || 'Accueil' },
        { key: 'commandes', icon: ClipboardList, label: t('shop.orders') || 'Mes commandes' },
      ],
    },
    {
      icon: Package,
      title: t('shop.navGroupCatalogStock') || 'Mes produits',
      items: [
        { key: 'produits', icon: ShoppingBag, label: t('shop.catalog') || 'Catalogue' },
      ],
    },
    {
      icon: Megaphone,
      title: t('shop.navGroupMarketingSettings') || 'Vitrine & Paramètres',
      items: [
        { key: 'personnaliser', icon: Palette, label: 'Personnaliser ma boutique' },
        { key: 'infos', icon: Settings, label: t('shop.settings') || 'Paramètres' },
      ],
    },
  ]
}

export function getNavCommerce(t: (key: string) => string): NavGroup[] {
  return [
    {
      icon: BookOpen,
      title: 'Outils commerciaux',
      items: [
        { key: 'carnet', icon: BookOpen, label: t('shop.debts') || 'Carnet de dettes' },
        { key: 'express', icon: Zap, label: t('shop.saisieExpress') || 'Ventes & Dépenses rapides' },
        { key: 'fidelite', icon: Gift, label: t('shop.fidelitePromos') || 'Fidélité & Promotions' },
        { key: 'fournisseurs', icon: Truck, label: t('shop.suppliers') || 'Fournisseurs', minPlan: 'pro' },
        { key: 'social', icon: Share2, label: 'Réseaux sociaux & Social Shop' },
        { key: 'marketing', icon: Megaphone, label: t('shop.marketing') || 'Partager ma boutique' },
        { key: 'appstore', icon: Boxes, label: 'App Store & Extensions', minPlan: 'pro' },
      ],
    },
  ]
}

export function getNavAdvanced(t: (key: string) => string): NavGroup[] {
  return [
    {
      icon: Receipt,
      title: t('shop.navGroupFinanceReports') || 'Comptabilité & Rapports',
      items: [
        { key: 'compta', icon: Receipt, label: t('shop.accounting') || 'Comptabilité détaillée', minPlan: 'pro' },
        { key: 'analytics', icon: BarChart3, label: t('shop.analytics') || 'Statistiques', minPlan: 'pro' },
        { key: 'documents', icon: FileText, label: t('shop.documents') || 'Factures & Devis', minPlan: 'pro' },
      ],
    },
    {
      icon: Settings,
      title: t('shop.navGroupSettingsTeam') || 'Gestion avancée & Équipe',
      items: [
        { key: 'entrepots', icon: Warehouse, label: 'Entrepôts & Dépôts', minPlan: 'pro' },
        { key: 'fiscalite', icon: Scale, label: t('shop.taxSettings') || 'Fiscalité & TVA', minPlan: 'pro' },
        { key: 'equipe', icon: Users, label: t('shop.team') || 'Mon équipe', minPlan: 'business' },
        { key: 'abtesting', icon: Split, label: 'A/B Testing Vitrine', minPlan: 'pro' },
        { key: 'journal', icon: ScrollText, label: t('shop.auditLog') || 'Journal d\'activité', minPlan: 'business' },
        { key: 'developer', icon: Code2, label: t('shop.developer') || 'Portail développeur', minPlan: 'business' },
      ],
    },
  ]
}

export function getTabInfoMap(t: (key: string) => string): Record<ManageTab, { title: string; icon: LucideIcon; desc: string }> {
  return {
    dashboard: { icon: LayoutDashboard, title: t('shop.overview'), desc: t('shop.overviewDesc') },
    produits: { icon: ShoppingBag, title: t('shop.catalog'), desc: t('shop.catalogDesc') },
    commandes: { icon: ClipboardList, title: t('shop.orders'), desc: t('shop.ordersDesc') },
    carnet: { icon: BookOpen, title: t('shop.debts'), desc: t('shop.debtsDesc') },
    express: {
      icon: Zap,
      title: t('shop.saisieExpress') || 'Saisie Express',
      desc: t('shop.saisieExpressDesc') || 'Enregistrement ultra-rapide des ventes et dépenses du jour avec scan OCR.',
    },
    compta: { icon: Receipt, title: t('shop.accounting'), desc: t('shop.accountingDesc') },
    analytics: { icon: BarChart3, title: t('shop.analytics'), desc: t('shop.analyticsDesc') },
    infos: { icon: Settings, title: t('shop.settings'), desc: t('shop.settingsDesc') },
    marketing: { icon: Megaphone, title: t('shop.marketing'), desc: t('shop.marketingDesc') },
    social: {
      icon: Share2,
      title: 'Réseaux Sociaux & Social Shop',
      desc: 'Connectez et transformez vos publications Instagram, TikTok et Facebook en boutique interactive.',
    },
    equipe: { icon: Users, title: t('shop.team'), desc: t('shop.teamDesc') },
    admins: { icon: ShieldCheck, title: t('shop.admins'), desc: t('shop.adminsDesc') },
    caissiers: { icon: Store, title: t('shop.caissiers'), desc: t('shop.caissiersDesc') },
    documents: { icon: FileText, title: t('shop.documents'), desc: t('shop.documentsDesc') },
    fournisseurs: { icon: Truck, title: t('shop.suppliers'), desc: t('shop.suppliersDesc') },
    fiscalite: { icon: Scale, title: t('shop.taxSettings'), desc: t('shop.taxSettingsDesc') },
    fidelite: {
      icon: Gift,
      title: t('shop.fidelitePromos') || 'Fidélité & Promotions',
      desc:
        t('shop.fidelitePromosDesc') ||
        'Configurez le programme de fidélité, le cashback, les plafonds de remise caisse et les codes promo.',
    },
    personnaliser: {
      icon: Palette,
      title: 'Personnaliser ma vitrine',
      desc: 'Définissez l\'ambiance, les couleurs, la bannière et le slogan uniques de votre boutique en ligne.',
    },
    journal: { icon: ScrollText, title: t('shop.auditLog'), desc: t('shop.auditLogDesc') },
    developer: { icon: Code2, title: t('shop.developer'), desc: t('shop.developerDesc') },
    appstore: {
      icon: Boxes,
      title: 'App Store & Intégrations',
      desc: 'Activez vos pixels Meta/TikTok/GA4, webhooks, synchronisation et outils tiers.',
    },
    entrepots: {
      icon: Warehouse,
      title: 'Multi-Entrepôts & Dépôts Physiques',
      desc: 'Ventilez et gérez vos stocks physiques par site avec réagrégation automatique du stock global.',
    },
    abtesting: {
      icon: Split,
      title: 'Moteur A/B Testing Vitrine',
      desc: 'Testez et optimisez scientifiquement les titres et sous-titres de votre vitrine marchande.',
    },
  }
}
