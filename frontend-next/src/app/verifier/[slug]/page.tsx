import type { Metadata } from 'next'
import Link from 'next/link'
import { ShieldCheck, ShieldAlert, Info } from 'lucide-react'
import { apiFetch } from '@/lib/api'

// AUD-140/141 : page publique « vérifier ce vendeur ». Le statut vient du serveur ; elle sert aussi à rappeler
// les seuls canaux officiels de Nopalou pour repérer une usurpation.
export const metadata: Metadata = {
  title: 'Vérifier un vendeur',
  robots: { index: false, follow: false },
}

interface Verification {
  success: boolean
  nom: string
  slug: string
  statut: 'non_verifie' | 'verifie' | 'certifie'
  depuis: string | null
}

export default async function VerifierVendeurPage({ params }: { params: { slug: string } }) {
  let v: Verification | null = null
  try {
    v = await apiFetch<Verification>(`/boutiques/${encodeURIComponent(params.slug)}/verification`)
  } catch {
    v = null
  }

  const verifie = v?.statut === 'verifie' || v?.statut === 'certifie'

  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: '32px 16px', width: '100%', boxSizing: 'border-box' }}>
      <h1 style={{ fontSize: 22, color: 'var(--navy, #1C2B4A)', margin: '0 0 16px' }}>Vérifier un vendeur</h1>

      {!v ? (
        <div style={{ padding: 16, borderRadius: 12, border: '1px solid var(--border, #E8DDD2)', background: '#fff' }}>
          <p style={{ margin: 0, display: 'flex', gap: 8, alignItems: 'center' }}>
            <ShieldAlert size={18} /> Aucune boutique Nopalou ne correspond à cette adresse. Méfiez-vous.
          </p>
        </div>
      ) : (
        <div style={{ padding: 16, borderRadius: 12, border: '1px solid var(--border, #E8DDD2)', background: '#fff' }}>
          <p style={{ margin: '0 0 6px', fontWeight: 800, fontSize: 16 }}>{v.nom}</p>
          <p style={{ margin: 0, display: 'flex', gap: 8, alignItems: 'center', color: verifie ? 'var(--price, #0A5C36)' : 'var(--navy, #1C2B4A)', fontWeight: 700 }}>
            {verifie ? <ShieldCheck size={18} /> : <Info size={18} />}
            {v.statut === 'certifie'
              ? 'Vendeur certifié par Nopalou'
              : v.statut === 'verifie'
                ? 'Vendeur vérifié par Nopalou'
                : 'Vendeur non vérifié : aucun badge attribué pour le moment'}
          </p>
          {verifie && v.depuis && (
            <p style={{ margin: '8px 0 0', fontSize: 13, color: '#64748b' }}>
              Badge attribué le {new Date(v.depuis).toLocaleDateString('fr-FR')}.
            </p>
          )}
          <p style={{ margin: '12px 0 0', fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
            Le badge est attribué quand le vendeur a un abonnement payant actif depuis au moins 30 jours, a livré au moins 20 commandes
            à des clients et n&apos;a aucun signalement ouvert. Il peut être retiré à tout moment.
          </p>
        </div>
      )}

      <section style={{ marginTop: 24, padding: 16, borderRadius: 12, background: 'var(--bg, #F8F5F0)', border: '1px solid var(--border, #E8DDD2)' }}>
        <h2 style={{ fontSize: 15, margin: '0 0 8px', color: 'var(--navy, #1C2B4A)' }}>Canaux officiels de Nopalou</h2>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.7 }}>
          <li>Site : nopalou.com</li>
          <li>WhatsApp : +221 70 871 79 42</li>
        </ul>
        <p style={{ margin: '10px 0 0', fontSize: 12.5, color: '#64748b', lineHeight: 1.5 }}>
          Nopalou ne vous demandera jamais votre mot de passe ni un code reçu par WhatsApp ou SMS. Un vendeur ne peut pas porter le nom
          « Nopalou » : si une boutique se présente comme le support ou le service client de Nopalou, signalez-la.
        </p>
        <p style={{ margin: '10px 0 0' }}>
          <Link href="/aide" style={{ color: 'var(--accent, #C75B00)', fontWeight: 700, fontSize: 13 }}>Signaler un vendeur</Link>
        </p>
      </section>
    </main>
  )
}
