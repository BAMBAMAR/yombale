'use client'
import { deleteAnnonce } from '@/app/actions/annonces'

interface Annonce {
  id: string
  titre: string
  categorie_slug: string
  prix: number | null
  ville: string | null
  actif: boolean
  payee: boolean
  rejete: boolean
  photos: string[]
  created_at: string
}

function statutBadge(a: Annonce) {
  if (a.rejete)                  return { label: 'Rejetée',        color: 'var(--red)',    bg: '#fef2f2' }
  if (a.actif)                   return { label: 'Publiée',        color: 'var(--green)',  bg: 'var(--green2)' }
  if (a.payee && !a.actif)       return { label: 'En modération',  color: 'var(--blue2)',  bg: 'var(--blue3)' }
  return                                { label: 'En attente',     color: 'var(--orange)', bg: 'var(--orange2)' }
}

function fcfa(n: number | null) {
  if (!n) return '—'
  return new Intl.NumberFormat('fr-SN', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(n)
}

function AnnonceCard({ annonce }: { annonce: Annonce }) {
  const badge = statutBadge(annonce)

  async function handleDelete() {
    if (!confirm('Supprimer cette annonce définitivement ?')) return
    await deleteAnnonce(annonce.id)
  }

  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '16px',
      boxShadow: 'var(--shadow)',
      display: 'flex',
      gap: '16px',
      alignItems: 'flex-start',
    }}>
      {annonce.photos?.[0] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={annonce.photos[0]}
          alt={annonce.titre}
          style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }}
        />
      ) : (
        <div style={{ width: '72px', height: '72px', borderRadius: '8px', background: 'var(--bg)', flexShrink: 0 }} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
          <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '14px', margin: 0 }}>
            {annonce.titre}
          </p>
          <span style={{
            fontSize: '11px', fontWeight: 700, padding: '2px 8px',
            borderRadius: '20px', whiteSpace: 'nowrap', flexShrink: 0,
            color: badge.color, background: badge.bg,
          }}>
            {badge.label}
          </span>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text3)', margin: '4px 0' }}>
          {annonce.categorie_slug} · {annonce.ville ?? 'Dakar'} · {fcfa(annonce.prix)}
        </p>
        <p style={{ fontSize: '12px', color: 'var(--text3)', margin: '4px 0 8px' }}>
          {new Date(annonce.created_at).toLocaleDateString('fr-FR')}
        </p>
        <button
          onClick={handleDelete}
          style={{
            fontSize: '13px', color: 'var(--red)', background: 'none',
            border: '1px solid #fecaca', borderRadius: '6px',
            padding: '4px 12px', cursor: 'pointer',
          }}
        >
          Supprimer
        </button>
      </div>
    </div>
  )
}

export default function AnnoncesClient({ annonces }: { annonces: Annonce[] }) {
  return (
    <div style={{ maxWidth: '700px', margin: '40px auto', padding: '0 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: '22px', margin: 0 }}>
          Mes annonces
        </h1>
        <a
          href="/annonces.html"
          style={{
            padding: '9px 18px', background: 'var(--blue2)', color: '#fff',
            borderRadius: '8px', fontSize: '13px', fontWeight: 700, textDecoration: 'none',
          }}
        >
          + Déposer une annonce
        </a>
      </div>

      {annonces.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text3)' }}>
          <p style={{ fontSize: '32px', marginBottom: '12px' }}>📋</p>
          <p style={{ fontSize: '15px' }}>Vous n&apos;avez pas encore d&apos;annonces.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {annonces.map((a) => <AnnonceCard key={a.id} annonce={a} />)}
        </div>
      )}
    </div>
  )
}
