import { cookies } from 'next/headers'
import Link from 'next/link'
import ComptesTableClient from './ComptesTableClient'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
const COOKIE  = 'nopalou_admin'

interface Utilisateur {
  id: string
  nom: string
  email: string
  telephone: string | null
  email_verifie: boolean
  suspendu: boolean
  supprime_le: string | null
  created_at: string
}

function dateF(d: string) {
  return new Date(d).toLocaleDateString('fr-FR')
}

const PILLS_STATUT = [
  { value: '', label: 'Tous' },
  { value: 'verifie', label: 'Vérifiés' },
  { value: 'non_verifie', label: 'Non vérifiés' },
  { value: 'suspendu', label: 'Suspendus' },
  { value: 'en_grace', label: 'En suppression' },
]

const PILLS_TYPE = [
  { value: '', label: 'Tous' },
  { value: 'apporteur', label: 'Apporteurs' },
  { value: 'boutique', label: 'Avec boutique' },
]

export default async function AdminComptesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; statut?: string; type?: string; tri?: string; page?: string }>
}) {
  const jar    = await cookies()
  const secret = jar.get(COOKIE)?.value ?? ''
  if (!secret) return null

  const sp = await searchParams
  const q = sp.q ?? ''
  const statut = sp.statut ?? ''
  const type = sp.type ?? ''
  const tri = sp.tri ?? 'recent'
  const page = sp.page ?? '1'

  let utilisateurs: Utilisateur[] = []
  let total = 0

  try {
    const params = new URLSearchParams({ q, statut, type, tri, page })
    const res = await fetch(`${BACKEND}/api/admin/utilisateurs?${params}`, {
      headers: { 'X-Admin-Secret': secret },
      cache: 'no-store',
    })
    if (res.ok) {
      const data = await res.json()
      utilisateurs = data.utilisateurs ?? []
      total = data.total ?? 0
    }
  } catch {}

  function buildHref(overrides: Record<string, string>) {
    const params = new URLSearchParams({ q, statut, type, tri, ...overrides })
    return `/admin/comptes?${params}`
  }

  const badge = (u: Utilisateur) => (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {u.email_verifie
        ? <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a' }}>✓ vérifié</span>
        : <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>non vérifié</span>}
      {u.suspendu && <span style={{ fontSize: 11, fontWeight: 700, color: '#dc2626' }}>🚫 suspendu</span>}
      {u.supprime_le && <span style={{ fontSize: 11, fontWeight: 700, color: '#d97706' }}>⏳ en suppression</span>}
    </div>
  )

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Comptes utilisateurs</h1>

      <form method="GET" style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <input type="hidden" name="statut" value={statut} />
        <input type="hidden" name="type" value={type} />
        <input type="hidden" name="tri" value={tri} />
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Rechercher nom, email, téléphone…"
          style={{ padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, width: 320 }}
        />
        <button type="submit" style={{ padding: '9px 16px', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
          Rechercher
        </button>
      </form>

      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {PILLS_STATUT.map(p => (
            <Link
              key={p.value}
              href={buildHref({ statut: p.value, page: '1' })}
              style={{
                fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 16,
                textDecoration: 'none',
                background: statut === p.value ? '#1d4ed8' : '#f1f5f9',
                color: statut === p.value ? '#fff' : '#374151',
              }}
            >
              {p.label}
            </Link>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {PILLS_TYPE.map(p => (
            <Link
              key={p.value}
              href={buildHref({ type: p.value, page: '1' })}
              style={{
                fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 16,
                textDecoration: 'none',
                background: type === p.value ? '#16a34a' : '#f1f5f9',
                color: type === p.value ? '#fff' : '#374151',
              }}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      <p style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>{total} compte(s)</p>

      <ComptesTableClient utilisateurs={utilisateurs} />

      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        {parseInt(page) > 1 && (
          <Link href={buildHref({ page: String(parseInt(page) - 1) })} style={{ fontSize: 13, fontWeight: 600, color: '#1d4ed8' }}>← Précédent</Link>
        )}
        {utilisateurs.length === 30 && (
          <Link href={buildHref({ page: String(parseInt(page) + 1) })} style={{ fontSize: 13, fontWeight: 600, color: '#1d4ed8' }}>Suivant →</Link>
        )}
      </div>
    </div>
  )
}

