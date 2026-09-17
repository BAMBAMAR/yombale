'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'

// Mappage des segments d'URL vers des libellés conviviaux
const SEGMENT_LABELS: Record<string, string> = {
  admin: 'Administration',
  boutiques: 'Boutiques',
  produits: 'Produits Marchands',
  commandes: 'Commandes Web',
  pos: 'Réseau POS & Caisses',
  'carnet-dettes': 'Carnet de Dettes & Crédits',
  immo: 'Immobilier',
  agences: 'Agences Immobilières',
  biens: 'Biens & Patrimoine',
  locatif: 'Baux & Loyers',
  paiements: 'Flux & Rapprochement',
  reversements: 'Reversements Wave',
  'paiements-manuels': 'Paiements Manuels',
  abonnements: 'Abonnements',
  plans: 'Plans & Grille',
  revenus: 'Revenus Plateforme',
  comptes: 'Comptes Utilisateurs',
  'equipe-admin': 'Équipe & Droits RBAC',
  compte: 'Mon Compte',
  categories: 'Catégories',
  annonces: 'Annonces Classifiées',
  prospection: 'Prospection & Leads',
  intelligence: 'Intelligence Marché',
  'force-de-vente': 'Force de Vente Terrain',
  partenaires: 'Partenaires',
  affiliation: 'Affiliation',
  apporteurs: "Apporteurs d'Affaires",
  tarifs: 'Tarifs & Promos',
  whatsapp: 'WhatsApp Bot',
  publications: 'Publications Réseaux',
  communication: 'Kit Communication',
  seo: 'Référencement SEO',
  telecom: 'Forfaits Télécom',
  'audit-logs': 'Audit Logs & Sécurité',
  'feature-flags': 'Feature Flags',
  qualite: 'Qualité Données',
  'sante-donnees': 'Santé Données',
  system: 'Santé Système & Exports',
  integrations: 'Intégrations & API',
  developer: 'Portail Développeur',
  migration: 'Migration Marchands',
}

export default function AdminBreadcrumbs() {
  const pathname = usePathname()
  if (!pathname || pathname === '/admin') return null

  const segments = pathname.split('/').filter(Boolean)
  // Ne pas afficher si pas sous /admin
  if (segments[0] !== 'admin') return null

  const crumbs = segments.map((seg, idx) => {
    const href = '/' + segments.slice(0, idx + 1).join('/')
    const isLast = idx === segments.length - 1
    const label = SEGMENT_LABELS[seg] || (seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' '))
    return { href, label, isLast }
  })

  return (
    <nav aria-label="Fil d'Ariane" className="admin-breadcrumbs">
      <Link href="/admin" className="admin-breadcrumb-home" aria-label="Accueil Admin">
        <Home size={14} />
      </Link>
      {crumbs.slice(1).map((crumb) => (
        <span key={crumb.href} className="admin-breadcrumb-segment">
          <ChevronRight size={13} className="admin-breadcrumb-sep" />
          {crumb.isLast ? (
            <span className="admin-breadcrumb-current" aria-current="page">
              {crumb.label}
            </span>
          ) : (
            <Link href={crumb.href} className="admin-breadcrumb-link">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}
