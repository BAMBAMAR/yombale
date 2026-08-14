'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import ExternalImg from '@/components/ExternalImg'

interface Zone {
  id: string
  nom: string
  prix: number
}

const DEFAULT_ZONES: Zone[] = [
  { id: 'dakar-intra', nom: '📍 Dakar Intra-Muros (Plateau, Almadies, Medina, Fann...)', prix: 1500 },
  { id: 'dakar-banlieue', nom: '📍 Banlieue Dakar (Pikine, Guédiawaye, Keur Massar, Rufisque...)', prix: 2500 },
  { id: 'regions-senegal', nom: '🚚 Expédition Régions (Thiès, St-Louis, Mbour, Kaolack...)', prix: 3500 },
  { id: 'retrait-boutique', nom: '🏬 Retrait gratuit en boutique', prix: 0 },
]

function fcfa(amount: number) {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA'
}

function CheckoutExpressContent() {
  const searchParams = useSearchParams()
  const produitId = searchParams.get('produit') || searchParams.get('p') || ''
  const boutiqueId = searchParams.get('boutique') || searchParams.get('b') || ''
  const phoneParam = searchParams.get('phone') || searchParams.get('tel') || ''
  const nomParam = searchParams.get('nom') || ''
  const payParam = (searchParams.get('pay') || searchParams.get('m') || '').toLowerCase()
  const quantiteParam = parseInt(searchParams.get('q') || '1', 10)

  const [loading, setLoading] = useState<boolean>(true)
  const [produitInfo, setProduitInfo] = useState<{ id: string; nom: string; prix: number; photo?: string; boutiqueNom?: string } | null>(null)
  const [zones, setZones] = useState<Zone[]>(DEFAULT_ZONES)
  const [zoneId, setZoneId] = useState<string>('dakar-intra')
  const [quantite, setQuantite] = useState<number>(quantiteParam > 0 ? quantiteParam : 1)

  // Form states
  const [clientNom, setClientNom] = useState(nomParam)
  const [clientTel, setClientTel] = useState(phoneParam)
  const [clientAdresse, setClientAdresse] = useState('')
  const [methodePaiement, setMethodePaiement] = useState<'wave' | 'orange_money' | 'cash'>(
    payParam === 'cash' ? 'cash' : payParam === 'om' || payParam === 'orange_money' ? 'orange_money' : 'wave'
  )
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [autoRedirecting, setAutoRedirecting] = useState<boolean>(false)
  const [success, setSuccess] = useState<boolean>(false)
  const [orderRef, setOrderRef] = useState<string>('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const autoParam = searchParams.get('auto') === '1'
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || ''

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        if (produitId) {
          const res = await fetch(`${backendUrl}/api/produits/${produitId}`).catch(() => null)
          if (res && res.ok) {
            const data = await res.json()
            setProduitInfo({
              id: data.id,
              nom: data.nom || data.titre || 'Produit Nopalou',
              prix: Number(data.prix || data.prix_min) || 0,
              photo: data.images?.[0] || data.photo || null,
              boutiqueNom: data.boutique_nom || 'Boutique Partenaire',
            })
          }
        }
        if (boutiqueId) {
          const zRes = await fetch(`${backendUrl}/api/comptabilite/${boutiqueId}/zones/public`).catch(() => null)
          if (zRes && zRes.ok) {
            const zData = await zRes.json()
            if (Array.isArray(zData) && zData.length > 0) setZones(zData)
          }
        }
      } catch (err) {
        console.error('[CHECKOUT EXPRESS]', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [produitId, boutiqueId, backendUrl])

  const zoneSelectionnee = zones.find(z => z.id === zoneId) || DEFAULT_ZONES[0]
  const fraisLivraison = zoneSelectionnee ? zoneSelectionnee.prix : 1500
  const sousTotal = (produitInfo?.prix || 0) * quantite
  const totalGlobal = sousTotal + fraisLivraison

  // Auto redirection immédiate vers Wave si auto=1
  useEffect(() => {
    if (!loading && autoParam && methodePaiement === 'wave' && !submitting && !success && !autoRedirecting) {
      setAutoRedirecting(true)
      const refTemp = `CMD-${Date.now().toString(36).toUpperCase()}`
      fetch(`${backendUrl}/api/paiement/wave/initier-express`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          montant: totalGlobal > 0 ? totalGlobal : 1500,
          reference: refTemp,
          nom_produit: produitInfo?.nom || 'Commande Express Wave',
        }),
      })
        .then(res => res.json())
        .then(waveData => {
          if (waveData.wave_url) {
            window.location.href = waveData.wave_url
          } else {
            setAutoRedirecting(false)
          }
        })
        .catch(() => setAutoRedirecting(false))
    }
  }, [loading, autoParam, methodePaiement, totalGlobal, produitInfo, backendUrl, submitting, success, autoRedirecting])

  // WhatsApp direct link generator
  const messageWhatsapp = `Bonjour ! Je souhaite valider la commande suivante via WhatsApp :\n\n` +
    `🛍️ ${quantite}x ${produitInfo?.nom || 'Produit'} (${fcfa(sousTotal)})\n` +
    `🚚 Livraison (${zoneSelectionnee?.nom}): ${fcfa(fraisLivraison)}\n` +
    `💰 TOTAL: ${fcfa(totalGlobal)}\n\n` +
    `👤 Nom: ${clientNom || 'Non renseigné'}\n` +
    `📞 Téléphone: ${clientTel || 'Non renseigné'}\n` +
    `📍 Adresse: ${clientAdresse || 'À préciser'}\n` +
    `💳 Mode de paiement souhaité: ${methodePaiement === 'wave' ? 'Wave' : methodePaiement === 'orange_money' ? 'Orange Money' : 'Cash à la livraison'}`

  const lienWhatsapp = `https://wa.me/221777202086?text=${encodeURIComponent(messageWhatsapp)}`

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!clientNom.trim() || !clientTel.trim()) {
      setErrorMsg('Veuillez renseigner votre nom complet et votre numéro de téléphone.')
      return
    }
    setErrorMsg(null)
    setSubmitting(true)

    try {
      const res = await fetch(`${backendUrl}/api/comptabilite/${boutiqueId || 'general'}/commandes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          produit_id: produitId || undefined,
          nom_produit: produitInfo?.nom || 'Commande Express',
          prix_unitaire: produitInfo?.prix || 0,
          quantite,
          client_nom: clientNom.trim(),
          client_telephone: clientTel.trim(),
          client_adresse: clientAdresse.trim() || undefined,
          methode_paiement: methodePaiement,
          zone_livraison_id: zoneId || undefined,
          source: 'whatsapp_express_web',
        }),
      })

      const data = await res.json()
      const referenceToUse = data.reference || `CMD-${Date.now().toString(36).toUpperCase()}`
      setOrderRef(referenceToUse)

      if (methodePaiement === 'wave') {
        try {
          const waveRes = await fetch(`${backendUrl}/api/paiement/wave/initier-express`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              montant: totalGlobal,
              reference: referenceToUse,
              nom_produit: produitInfo?.nom || 'Commande Express',
            }),
          }).catch(() => null)

          if (waveRes && waveRes.ok) {
            const waveData = await waveRes.json()
            if (waveData.wave_url) {
              window.location.href = waveData.wave_url
              return
            }
            if (waveData.fallback_manuel) {
              setErrorMsg('💡 L\'API Wave direct étant momentanément indisponible, effectuez votre transfert au 77 720 20 86 (Wave/OM). Votre commande est bien enregistrée.')
            }
          }
        } catch (wErr) {
          console.error('[WAVE INIT ERR]', wErr)
        }
      }

      setSuccess(true)
    } catch {
      setOrderRef(`CMD-${Date.now().toString(36).toUpperCase()}`)
      setSuccess(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (autoRedirecting) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <div style={{ background: '#fff', borderRadius: 24, padding: '40px 32px', boxShadow: '0 20px 50px rgba(0,163,224,0.15)', border: '1px solid #e0f7ff', maxWidth: 460, width: '100%' }}>
          <span style={{ fontSize: 56, display: 'block', marginBottom: 16 }}>🌊</span>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0084b4', margin: '0 0 12px' }}>Redirection vers Wave…</h2>
          <p style={{ fontSize: 14, color: '#475569', margin: '0 0 24px', lineHeight: 1.5 }}>
            Nous préparons votre paiement sécurisé Wave pour <strong>{produitInfo?.nom || 'votre commande'}</strong>.
          </p>
          <div style={{ display: 'inline-block', width: 36, height: 36, border: '4px solid #e0f7ff', borderTopColor: '#00a3e0', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div style={{ maxWidth: 540, margin: '40px auto', padding: 24, fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: 32, textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: 64, display: 'block', marginBottom: 16 }}>🎉</span>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: '#166534', margin: '0 0 8px' }}>Commande Confirmée !</h2>
          <p style={{ fontSize: 15, color: '#475569', margin: '0 0 16px' }}>
            Votre commande <strong>{orderRef}</strong> a bien été transmise.
          </p>
          <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16, textAlign: 'left', margin: '20px 0', border: '1px solid #e2e8f0', fontSize: 14 }}>
            <p style={{ margin: '0 0 6px', fontWeight: 700, color: '#0f172a' }}>📦 Récapitulatif :</p>
            <p style={{ margin: '0 0 4px', color: '#334155' }}>• {quantite}x {produitInfo?.nom || 'Produit'}</p>
            <p style={{ margin: '0 0 4px', color: '#334155' }}>• Total: <strong>{fcfa(totalGlobal)}</strong></p>
            <p style={{ margin: '0 0 4px', color: '#334155' }}>• Mode de paiement: <strong>{methodePaiement.toUpperCase()}</strong></p>
            <p style={{ margin: 0, color: '#334155' }}>• Tél: {clientTel}</p>
          </div>

          <a
            href={`https://wa.me/221777202086?text=${encodeURIComponent(`Bonjour, je souhaite suivre ma commande ${orderRef}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: '#25D366', color: '#fff', padding: '14px 24px', borderRadius: 12,
              fontWeight: 800, textDecoration: 'none', fontSize: 15, width: '100%', marginBottom: 12,
            }}
          >
            <span>💬</span> Suivre ma commande sur WhatsApp
          </a>

          <Link href="/" style={{ color: '#64748b', fontSize: 14, textDecoration: 'underline' }}>
            Retour à l'accueil Nopalou
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 540, margin: '20px auto', padding: '0 16px 40px', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* En-tête marque */}
      <div style={{ textAlign: 'center', padding: '16px 0 24px' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
          <span style={{ fontSize: 26, fontWeight: 900, color: '#C75B00', letterSpacing: '-0.02em' }}>🛍️ NOPALOU</span>
        </Link>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b', fontWeight: 600 }}>
          Validation Express de Commande WhatsApp
        </p>
      </div>

      <div style={{ background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 12px 30px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
        
        {/* Détails du Produit */}
        {produitInfo ? (
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', paddingBottom: 20, borderBottom: '1px solid #f1f5f9', marginBottom: 20 }}>
            <ExternalImg src={produitInfo.photo} alt={produitInfo.nom} fallback="📦" style={{ width: 68, height: 68, borderRadius: 12, objectFit: 'cover' }} />
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#C75B00', textTransform: 'uppercase' }}>{produitInfo.boutiqueNom}</span>
              <h1 style={{ margin: '2px 0 4px', fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{produitInfo.nom}</h1>
              <span style={{ fontSize: 16, fontWeight: 900, color: '#C75B00' }}>{fcfa(produitInfo.prix)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '4px 8px' }}>
              <button type="button" onClick={() => setQuantite(Math.max(1, quantite - 1))} style={{ background: 'none', border: 'none', fontWeight: 800, fontSize: 16, cursor: 'pointer', padding: '2px 6px' }}>-</button>
              <span style={{ fontWeight: 800, fontSize: 14 }}>{quantite}</span>
              <button type="button" onClick={() => setQuantite(quantite + 1)} style={{ background: 'none', border: 'none', fontWeight: 800, fontSize: 16, cursor: 'pointer', padding: '2px 6px' }}>+</button>
            </div>
          </div>
        ) : loading ? (
          <div style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>Chargement des informations du produit...</div>
        ) : null}

        {/* Sélection Zone de Livraison */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>📍 Zone de livraison</label>
          <select
            value={zoneId}
            onChange={e => setZoneId(e.target.value)}
            style={{ width: '100%', padding: '12px 14px', border: '1px solid #cbd5e1', borderRadius: 12, fontSize: 14, background: '#fff', color: '#0f172a' }}
          >
            {zones.map(z => (
              <option key={z.id} value={z.id}>{z.nom} ({z.prix > 0 ? fcfa(z.prix) : 'Gratuit'})</option>
            ))}
          </select>
        </div>

        {/* Récapitulatif Tarifaire */}
        <div style={{ background: '#f8fafc', borderRadius: 14, padding: 16, marginBottom: 24, border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#64748b', marginBottom: 6 }}>
            <span>Sous-total ({quantite} art.)</span>
            <span>{fcfa(sousTotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#64748b', marginBottom: 10 }}>
            <span>Livraison ({zoneSelectionnee?.nom?.split('(')[0] || 'Dakar'})</span>
            <span>{fcfa(fraisLivraison)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 900, color: '#C75B00', borderTop: '1px solid #e2e8f0', paddingTop: 10 }}>
            <span>TOTAL À PAYER</span>
            <span>{fcfa(totalGlobal)}</span>
          </div>
        </div>

        {/* Choix des 2 modes de commande / paiement */}
        <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Choisissez votre mode de finalisation :
          </p>

          {/* Option 1: Paiement Direct WhatsApp */}
          <a
            href={lienWhatsapp}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              background: '#25D366', color: '#fff', padding: '14px 18px', borderRadius: 14,
              fontWeight: 800, fontSize: 15, textDecoration: 'none', boxShadow: '0 4px 12px rgba(37,211,102,0.25)',
              textAlign: 'center',
            }}
          >
            <span>💬</span> Option 1 : Paiement Direct via WhatsApp →
          </a>
        </div>

        {/* Option 2: Formulaire en ligne (Wave / OM / Cash) */}
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 20 }}>
          <p style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
            📋 Option 2 : Formulaire de commande directe (1 Clic)
          </p>

          {errorMsg && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: 12, borderRadius: 10, fontSize: 13, marginBottom: 14 }}>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>NOM & PRÉNOM *</label>
              <input
                type="text"
                required
                placeholder="Ex: Babacar Ndiaye"
                value={clientNom}
                onChange={e => setClientNom(e.target.value)}
                style={{ width: '100%', padding: '12px 14px', border: '1px solid #cbd5e1', borderRadius: 10, fontSize: 14 }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>TÉLÉPHONE *</label>
              <input
                type="tel"
                required
                placeholder="Ex: 77 123 45 67"
                value={clientTel}
                onChange={e => setClientTel(e.target.value)}
                style={{ width: '100%', padding: '12px 14px', border: '1px solid #cbd5e1', borderRadius: 10, fontSize: 14 }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>ADRESSE DE LIVRAISON</label>
              <input
                type="text"
                placeholder="Ex: Sacré-Cœur 3, Immeuble..."
                value={clientAdresse}
                onChange={e => setClientAdresse(e.target.value)}
                style={{ width: '100%', padding: '12px 14px', border: '1px solid #cbd5e1', borderRadius: 10, fontSize: 14 }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>MODE DE PAIEMENT</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setMethodePaiement('wave')}
                  style={{
                    padding: '10px 6px', borderRadius: 10, border: methodePaiement === 'wave' ? '2px solid #00A8FF' : '1px solid #cbd5e1',
                    background: methodePaiement === 'wave' ? '#f0f9ff' : '#fff', color: '#0f172a', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                  }}
                >
                  🌊 Wave
                </button>
                <button
                  type="button"
                  onClick={() => setMethodePaiement('orange_money')}
                  style={{
                    padding: '10px 6px', borderRadius: 10, border: methodePaiement === 'orange_money' ? '2px solid #ff6600' : '1px solid #cbd5e1',
                    background: methodePaiement === 'orange_money' ? '#fff7ed' : '#fff', color: '#0f172a', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                  }}
                >
                  🍊 OM
                </button>
                <button
                  type="button"
                  onClick={() => setMethodePaiement('cash')}
                  style={{
                    padding: '10px 6px', borderRadius: 10, border: methodePaiement === 'cash' ? '2px solid #16a34a' : '1px solid #cbd5e1',
                    background: methodePaiement === 'cash' ? '#f0fdf4' : '#fff', color: '#0f172a', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                  }}
                >
                  💵 Cash
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                marginTop: 10, background: '#C75B00', color: '#fff', border: 'none', borderRadius: 12,
                padding: '16px', fontWeight: 900, fontSize: 15, cursor: 'pointer', width: '100%',
                boxShadow: '0 4px 14px rgba(199,91,0,0.3)',
              }}
            >
              {submitting ? 'Validation en cours...' : '⚡ Valider et Payer la commande →'}
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}

export default function CheckoutExpressPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Chargement...</div>}>
      <CheckoutExpressContent />
    </Suspense>
  )
}
