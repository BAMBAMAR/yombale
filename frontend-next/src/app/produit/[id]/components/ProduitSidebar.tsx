import React from 'react'
import Link from 'next/link'
import { ArrowLeftRight } from 'lucide-react'
import { fcfa } from '@/lib/format'
import AlertePrix from '@/app/AlertePrix'
import SponsoringProduitBtn from '../SponsoringProduitBtn'
import { Produit, Offre } from './types'

interface ProduitSidebarProps {
  produit: Produit
  prixMin: number | null
  best?: Offre
  session: any
  settings: Record<string, string>
  idsComparaison: string
  prochesCount: number
}

export default function ProduitSidebar({
  produit,
  prixMin,
  best,
  session,
  settings,
  idsComparaison,
  prochesCount,
}: ProduitSidebarProps) {
  return (
    <aside className="fiche-sidebar">
      <div className="sidebar-card">
        <p className="sidebar-titre">RÉSUMÉ</p>
        <p className="sidebar-produit">{produit.nom}</p>
        <div className="sidebar-ligne">
          <span>Prix le plus bas</span>
          <strong>{fcfa(prixMin)}</strong>
        </div>
        {best && (
          <div className="sidebar-best-label">
            Meilleur prix chez <strong>{best.marchand_nom ?? '—'}</strong>
          </div>
        )}
        {best?.url_achat && (
          <a
            href={`/api/click/${best.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="sidebar-cta"
          >
            Meilleur prix chez {best.marchand_nom ?? '—'}
          </a>
        )}
        {session ? (
          <AlertePrix
            produitId={String(produit.id)}
            prixMin={prixMin}
            email={session.email ?? ''}
          />
        ) : (
          <Link href="/connexion" className="alerte-trigger-login">
            Alertes prix (connexion requise)
          </Link>
        )}
        {session && (
          <SponsoringProduitBtn
            produitId={String(produit.id)}
            userId={session.userId}
            settings={settings}
          />
        )}
        {prochesCount > 0 && (
          <Link
            href={`/comparaison?ids=${idsComparaison}`}
            className="sidebar-cta"
            style={{
              background: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <ArrowLeftRight size={15} />
            <span>Comparaison détaillée côte à côte</span>
          </Link>
        )}
      </div>
    </aside>
  )
}
