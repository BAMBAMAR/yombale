import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'

// AUD-140 : le badge n'existe que si le serveur l'a attribué (critères réels ou décision de l'admin).
// Une boutique non vérifiée n'affiche rien : l'absence de badge n'est pas une accusation.
export type StatutVerification = 'non_verifie' | 'verifie' | 'certifie'

interface BadgeVerificationProps {
  statut?: StatutVerification | null
  slug?: string | null
  /** true : pastille compacte (cartes de liste) */
  compact?: boolean
}

export default function BadgeVerification({ statut, slug, compact = false }: BadgeVerificationProps) {
  if (statut !== 'verifie' && statut !== 'certifie') return null
  const libelle = statut === 'certifie' ? 'Vendeur certifié Nopalou' : 'Vendeur vérifié'
  const contenu = (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        background: 'var(--bg, #F8F5F0)',
        border: '1px solid var(--border, #E8DDD2)',
        color: 'var(--price, #0A5C36)',
        padding: compact ? '2px 8px' : '4px 12px',
        borderRadius: 20,
        fontSize: compact ? 10.5 : 12,
        fontWeight: 800,
        whiteSpace: 'nowrap',
      }}
      title="Statut attribué par Nopalou : abonnement payant actif, commandes livrées et aucun signalement ouvert"
    >
      <ShieldCheck size={compact ? 12 : 14} />
      {libelle}
    </span>
  )
  if (!slug) return contenu
  return (
    <Link href={`/verifier/${encodeURIComponent(slug)}`} prefetch={false} style={{ textDecoration: 'none' }}>
      {contenu}
    </Link>
  )
}
