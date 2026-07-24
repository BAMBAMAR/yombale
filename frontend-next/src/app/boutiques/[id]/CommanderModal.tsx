'use client'
import { useState, useEffect } from 'react'

interface Produit { id: string; nom: string; prix: number | null }
interface Zone { id: string; nom: string; prix: number }

const inputStyle = {
  padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8,
  fontSize: 14, width: '100%', background: '#fff', boxSizing: 'border-box' as const,
}
const labelStyle = { fontSize: 13, fontWeight: 600 as const, color: '#374151', display: 'block' as const, marginBottom: 4 }

function fcfa(n: number) { return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA' }

function helperLienWhatsapp(tel: string | null | undefined, message: string): string {
  if (!tel) return '#'
  const digits = tel.replace(/\D/g, '')
  const clean = digits.length === 9 ? '221' + digits : digits
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`
}

const DEFAULT_ZONES: Zone[] = [
  { id: 'dakar-intra', nom: '📍 Dakar Intra-Muros (Plateau, Almadies, Medina, Fann...)', prix: 1500 },
  { id: 'dakar-banlieue', nom: '📍 Banlieue Dakar (Pikine, Guédiawaye, Keur Massar, Rufisque...)', prix: 2500 },
  { id: 'regions-senegal', nom: '🚚 Expédition Régions (Thiès, St-Louis, Mbour, Kaolack...)', prix: 3500 },
  { id: 'retrait-boutique', nom: '🏬 Retrait gratuit en boutique', prix: 0 },
]

export default function CommanderModal({
  boutiqueId,
  produit,
  whatsapp,
  nomBoutique,
  onClose,
  noteInitiale,
}: {
  boutiqueId: string
  produit: Produit
  whatsapp?: string | null
  nomBoutique?: string | null
  onClose: () => void
  noteInitiale?: string
}) {
  const [mode, setMode] = useState<'whatsapp' | 'formulaire'>('whatsapp')
  const [nom, setNom] = useState('')
  const [tel, setTel] = useState('')
  const [adresse, setAdresse] = useState('')
  const [quantite, setQuantite] = useState(1)
  const [note, setNote] = useState(noteInitiale ?? '')
  const [paiement, setPaiement] = useState('wave')
  const [zones, setZones] = useState<Zone[]>(DEFAULT_ZONES)
  const [zoneId, setZoneId] = useState<string>('dakar-intra')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || ''

  useEffect(() => {
    fetch(`${backendUrl}/api/comptabilite/${boutiqueId}/zones/public`)
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setZones(data)
        else setZones(DEFAULT_ZONES)
      })
      .catch(() => setZones(DEFAULT_ZONES))
  }, [boutiqueId, backendUrl])

  const zoneSelectionnee = zones.find(z => z.id === zoneId) || DEFAULT_ZONES[0]
  const fraisLivraison = zoneSelectionnee ? zoneSelectionnee.prix : 1500
  const sousTotal = produit.prix ? produit.prix * quantite : null
  const total = sousTotal !== null ? sousTotal + fraisLivraison : null

  const messageWhatsappDirect = `Bonjour ${nomBoutique ? nomBoutique : 'vendeur'} ! Je suis intéressé(e) par l'article "${produit.nom}"${produit.prix ? ` (${fcfa(produit.prix)})` : ''} vu sur Yombale. Est-il disponible ?`

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`${backendUrl}/api/comptabilite/${boutiqueId}/commandes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          produit_id: produit.id,
          quantite,
          client_nom: nom,
          client_telephone: tel,
          client_adresse: adresse || undefined,
          note: note || undefined,
          methode_paiement: paiement,
          zone_livraison_id: zoneId || undefined,
          source: 'web',
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erreur lors de la commande'); setLoading(false); return }
      setSuccess(true)
    } catch {
      setError('Impossible de joindre le serveur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 480,
        boxShadow: '0 20px 60px rgba(0,0,0,.2)', maxHeight: '90vh', overflowY: 'auto',
      }} onClick={e => e.stopPropagation()}>

        {/* En-tête */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-archivo), sans-serif', fontSize: 18, margin: 0, color: '#111827' }}>Acheter cet article</h2>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6b7280', fontWeight: 600 }}>{produit.nom} {produit.prix ? `• ${fcfa(produit.prix)}` : ''}</p>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#9ca3af', padding: 4 }}>✕</button>
        </div>

        {/* Onglets Choix du canal */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, background: '#f3f4f6', padding: 4, borderRadius: 10, marginBottom: 20 }}>
          <button
            type="button"
            onClick={() => setMode('whatsapp')}
            style={{
              padding: '10px 8px', borderRadius: 8, border: 'none',
              background: mode === 'whatsapp' ? '#fff' : 'transparent',
              color: mode === 'whatsapp' ? '#16a34a' : '#4b5563',
              fontWeight: mode === 'whatsapp' ? 700 : 500, fontSize: 13,
              cursor: 'pointer', boxShadow: mode === 'whatsapp' ? '0 1px 3px rgba(0,0,0,.1)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <span>💬</span> WhatsApp Direct
          </button>

          <button
            type="button"
            onClick={() => setMode('formulaire')}
            style={{
              padding: '10px 8px', borderRadius: 8, border: 'none',
              background: mode === 'formulaire' ? '#fff' : 'transparent',
              color: mode === 'formulaire' ? '#C75B00' : '#4b5563',
              fontWeight: mode === 'formulaire' ? 700 : 500, fontSize: 13,
              cursor: 'pointer', boxShadow: mode === 'formulaire' ? '0 1px 3px rgba(0,0,0,.1)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <span>📋</span> Avec Formulaire
          </button>
        </div>

        {/* Mode 1: WhatsApp Direct Express */}
        {mode === 'whatsapp' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📲</div>
              <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: '#15803d' }}>Discuter en 1-Clic avec le vendeur</h3>
              <p style={{ margin: 0, fontSize: 13, color: '#166534', lineHeight: 1.4 }}>
                Évitez la saisie de formulaires ! Ouvrez directement WhatsApp pour convenir du lieu de livraison et finaliser votre commande avec <strong>{nomBoutique || 'le vendeur'}</strong>.
              </p>
            </div>

            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: 12 }}>
              <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Message pré-rempli :</p>
              <p style={{ margin: 0, fontSize: 13, color: '#374151', fontStyle: 'italic', background: '#fff', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                &ldquo;{messageWhatsappDirect}&rdquo;
              </p>
            </div>

            <a
              href={helperLienWhatsapp(whatsapp || '221777202086', messageWhatsappDirect)}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                background: '#25D366', color: '#fff', border: 'none',
                borderRadius: 12, padding: '14px', fontWeight: 800, fontSize: 15, textDecoration: 'none',
                boxShadow: '0 4px 12px rgba(37,211,102,.3)', cursor: 'pointer', textAlign: 'center',
              }}
            >
              <span>💬</span> Ouvrir WhatsApp Maintenant →
            </a>
          </div>
        ) : (
          /* Mode 2: Formulaire classique */
          success ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ fontSize: 48, marginBottom: 16 }}>✅</p>
              <h2 style={{ fontFamily: 'var(--font-archivo), sans-serif', fontSize: 20, marginBottom: 8 }}>Commande envoyée !</h2>
              <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>
                La boutique a reçu votre commande et vous contactera sur le <strong>{tel}</strong> pour confirmer.
              </p>
              {total && (
                <p style={{ fontSize: 15, fontWeight: 700, color: '#C75B00', marginBottom: 24 }}>
                  Montant total : {fcfa(total)}
                </p>
              )}
              <button onClick={onClose} style={{ background: '#C75B00', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                Fermer
              </button>
            </div>
          ) : (
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 13 }}>
                  {error}
                </div>
              )}

              {/* Infos client */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>Votre nom *</label>
                  <input required value={nom} onChange={e => setNom(e.target.value)} style={inputStyle} placeholder="Prénom et nom" />
                </div>
                <div>
                  <label style={labelStyle}>Téléphone *</label>
                  <input required type="tel" value={tel} onChange={e => setTel(e.target.value)} style={inputStyle} placeholder="77 000 00 00" />
                </div>
              </div>

              {/* Quantité */}
              <div>
                <label style={labelStyle}>Quantité</label>
                <input type="number" min={1} max={99} value={quantite} onChange={e => setQuantite(Number(e.target.value))} style={{ ...inputStyle, width: 100 }} />
              </div>

              {/* Zone de livraison */}
              {zones.length > 0 ? (
                <div>
                  <label style={labelStyle}>Zone de livraison</label>
                  <select value={zoneId} onChange={e => setZoneId(e.target.value)} style={inputStyle}>
                    <option value="">— Retrait en boutique (gratuit) —</option>
                    {zones.map(z => (
                      <option key={z.id} value={z.id}>
                        {z.nom} — {z.prix > 0 ? fcfa(z.prix) : 'Gratuit'}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label style={labelStyle}>Adresse de livraison</label>
                  <input value={adresse} onChange={e => setAdresse(e.target.value)} style={inputStyle} placeholder="Quartier, rue, point de repère…" />
                </div>
              )}

              {zones.length > 0 && zoneId && (
                <div>
                  <label style={labelStyle}>Adresse précise</label>
                  <input value={adresse} onChange={e => setAdresse(e.target.value)} style={inputStyle} placeholder="Quartier, rue, point de repère…" />
                </div>
              )}

              {/* Mode de paiement */}
              <div>
                <label style={labelStyle}>Mode de paiement souhaité</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { value: 'wave', label: '💙 Wave' },
                    { value: 'orange_money', label: '🟠 Orange Money' },
                    { value: 'cash', label: '💵 Espèces' },
                    { value: 'virement', label: '🏦 Virement' },
                  ].map(m => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setPaiement(m.value)}
                      style={{
                        padding: '9px 12px', borderRadius: 8, border: '2px solid',
                        borderColor: paiement === m.value ? '#C75B00' : '#e5e7eb',
                        background: paiement === m.value ? '#fff7f0' : '#fff',
                        color: paiement === m.value ? '#C75B00' : '#374151',
                        fontWeight: paiement === m.value ? 700 : 500,
                        fontSize: 13, cursor: 'pointer', textAlign: 'left' as const,
                      }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div>
                <label style={labelStyle}>Note / précisions</label>
                <textarea value={note} onChange={e => setNote(e.target.value)} style={{ ...inputStyle, resize: 'vertical' }} rows={2} placeholder="Couleur, taille, autre demande…" />
              </div>

              {/* Récapitulatif */}
              {sousTotal !== null && (
                <div style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b7280' }}>
                    <span>{produit.nom} × {quantite}</span>
                    <span>{fcfa(sousTotal)}</span>
                  </div>
                  {fraisLivraison > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b7280' }}>
                      <span>Livraison ({zoneSelectionnee?.nom})</span>
                      <span>{fcfa(fraisLivraison)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800, color: '#C75B00', borderTop: '1px solid #e5e7eb', paddingTop: 8, marginTop: 2 }}>
                    <span>Total</span>
                    <span>{fcfa(total!)}</span>
                  </div>
                </div>
              )}

              <button type="submit" disabled={loading} style={{
                background: loading ? '#94a3b8' : '#C75B00', color: '#fff', border: 'none',
                borderRadius: 10, padding: '13px', fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 8px rgba(199,91,0,.3)',
              }}>
                {loading ? 'Envoi en cours…' : 'Envoyer ma commande →'}
              </button>
            </form>
          )
        )}
      </div>
    </div>
  )
}

