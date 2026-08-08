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

  const [crossSell, setCrossSell] = useState<Produit[]>([]);
  const [selectedAddons, setSelectedAddons] = useState<Record<string, number>>({});

  const [codePromo, setCodePromo] = useState('');
  const [promoApplique, setPromoApplique] = useState<{ code: string; reduction: number } | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExp, setCardExp] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('123');

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || ''

  useEffect(() => {
    fetch(`${backendUrl}/api/comptabilite/${boutiqueId}/zones/public`)
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setZones(data)
        else setZones(DEFAULT_ZONES)
      })
      .catch(() => setZones(DEFAULT_ZONES))

    // Chargement du pré-remplissage automatique des coordonnées (Zero-Effort Acheteur)
    try {
      const savedNom = localStorage.getItem('nopalou_client_nom')
      const savedTel = localStorage.getItem('nopalou_client_tel')
      const savedAdresse = localStorage.getItem('nopalou_client_adresse')
      if (savedNom) setNom(savedNom)
      if (savedTel) setTel(savedTel)
      if (savedAdresse) setAdresse(savedAdresse)
    } catch {}

    // Chargement des suggestions Cross-Sell
    fetch(`${backendUrl}/api/boutiques/${boutiqueId}/produits/${produit.id}/cross-sell`)
      .then(r => r.ok ? r.json() : { produits: [] })
      .then(data => {
        if (Array.isArray(data.produits)) setCrossSell(data.produits)
      })
      .catch(() => {})
  }, [boutiqueId, produit.id, backendUrl])

  const zoneSelectionnee = zones.find(z => z.id === zoneId) || DEFAULT_ZONES[0]
  const fraisLivraison = zoneSelectionnee ? zoneSelectionnee.prix : 1500
  const sousTotalMain = produit.prix ? produit.prix * quantite : 0
  const sousTotalAddons = Object.entries(selectedAddons).reduce((acc, [pId, qte]) => {
    const item = crossSell.find(c => c.id === pId)
    return acc + (item && item.prix ? item.prix * qte : 0)
  }, 0)
  const sousTotal = sousTotalMain + sousTotalAddons
  const totalSansReduction = sousTotal + fraisLivraison
  const total = Math.max(0, totalSansReduction - (promoApplique ? promoApplique.reduction : 0))

  const messageWhatsappDirect = `Bonjour ${nomBoutique ? nomBoutique : 'vendeur'} ! Je suis intéressé(e) par l'article "${produit.nom}"${produit.prix ? ` (${fcfa(produit.prix)})` : ''} vu sur Nopalou. Est-il disponible ?`

  function toggleAddon(pId: string) {
    setSelectedAddons(prev => {
      const next = { ...prev }
      if (next[pId]) delete next[pId]
      else next[pId] = 1
      return next
    })
  }

  async function appliquerCodePromo() {
    if (!codePromo.trim()) {
      setPromoError('⚠️ Veuillez saisir un code promo')
      setPromoApplique(null)
      return
    }
    setPromoLoading(true)
    setPromoError(null)
    try {
      const res = await fetch(`${backendUrl}/api/boutiques/promotions/valider`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boutique_id: boutiqueId,
          code: codePromo,
          total_panier: sousTotal
        })
      })
      const data = await res.json()
      if (!res.ok || !data.valide) {
        setPromoError(data.error || 'Code promo invalide')
        setPromoApplique(null)
      } else {
        setPromoApplique({ code: data.code, reduction: data.montant_reduction })
      }
    } catch {
      setPromoError('Impossible de vérifier le code promo')
    } finally {
      setPromoLoading(false)
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const articlesPayload = [
      { produit_id: produit.id, nom_produit: produit.nom, quantite, prix_unitaire: produit.prix || 0 }
    ]

    Object.entries(selectedAddons).forEach(([pId, qte]) => {
      const addon = crossSell.find(c => c.id === pId)
      if (addon) {
        articlesPayload.push({
          produit_id: addon.id,
          nom_produit: addon.nom,
          quantite: qte,
          prix_unitaire: addon.prix || 0
        })
      }
    })

    try {
      if (paiement === 'carte_bancaire') {
        const stripeRes = await fetch(`${backendUrl}/api/boutiques/paiements/stripe/simuler`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            boutique_id: boutiqueId,
            montant: total,
            devise: 'XOF',
            card_number: cardNumber,
            exp_month: 12,
            exp_year: 2028,
            cvc: cardCvc
          })
        })
        const stripeData = await stripeRes.json()
        if (!stripeRes.ok || !stripeData.success) {
          setError(stripeData.error || 'Erreur lors du traitement de votre carte bancaire')
          setLoading(false)
          return
        }
      }

      const res = await fetch(`${backendUrl}/api/boutiques/commandes/express`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boutique_id: boutiqueId,
          client_nom: nom,
          client_telephone: tel,
          client_adresse: adresse || undefined,
          note: note || undefined,
          methode_paiement: paiement,
          frais_livraison: fraisLivraison,
          articles: articlesPayload,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erreur lors de la commande'); setLoading(false); return }
      
      // Sauvegarde Zero-Effort des coordonnées client
      try {
        if (nom) localStorage.setItem('nopalou_client_nom', nom)
        if (tel) localStorage.setItem('nopalou_client_tel', tel)
        if (adresse) localStorage.setItem('nopalou_client_adresse', adresse)
      } catch {}

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
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }} onClick={e => e.stopPropagation()}>

        {/* En-tête */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#111827' }}>Acheter cet article</h2>
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
                    { value: 'carte_bancaire', label: '💳 Carte Bancaire (Visa/Mastercard)' },
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

                {paiement === 'carte_bancaire' && (
                  <div style={{ marginTop: 10, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                      🔒 Paiement Sécurisé Carte Bancaire (Mode Simulation Stripe)
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Numéro de carte</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={e => setCardNumber(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, fontFamily: 'monospace' }}
                        placeholder="4242 4242 4242 4242"
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Expiration (MM/AA)</label>
                        <input
                          type="text"
                          value={cardExp}
                          onChange={e => setCardExp(e.target.value)}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, fontFamily: 'monospace' }}
                          placeholder="12/28"
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>CVC</label>
                        <input
                          type="text"
                          value={cardCvc}
                          onChange={e => setCardCvc(e.target.value)}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, fontFamily: 'monospace' }}
                          placeholder="123"
                        />
                      </div>
                    </div>
                    <p style={{ margin: 0, fontSize: 11, color: '#16a34a', fontWeight: 600 }}>
                      Carte de test pré-remplie (4242...). Pour simuler une carte déclinée, utilisez un numéro se terminant par 0002.
                    </p>
                  </div>
                )}
              </div>

              {/* Note */}
              <div>
                <label style={labelStyle}>Note / précisions</label>
                <textarea value={note} onChange={e => setNote(e.target.value)} style={{ ...inputStyle, resize: 'vertical' }} rows={2} placeholder="Couleur, taille, autre demande…" />
              </div>

              {/* Cross-sell / Articles complémentaires */}
              {crossSell.length > 0 && (
                <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: 10, padding: 12 }}>
                  <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 800, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    🔥 Ajouter un article complémentaire (1-Clic) :
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {crossSell.map(c => {
                      const isSelected = !!selectedAddons[c.id]
                      return (
                        <div
                          key={c.id}
                          onClick={() => toggleAddon(c.id)}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '8px 12px', borderRadius: 8, border: '1px solid',
                            borderColor: isSelected ? '#C75B00' : '#fcd34d',
                            background: isSelected ? '#fff7ed' : '#ffffff',
                            cursor: 'pointer', transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 16 }}>{isSelected ? '✅' : '➕'}</span>
                            <span style={{ fontSize: 13, fontWeight: isSelected ? 700 : 500, color: '#1f2937' }}>{c.nom}</span>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#C75B00' }}>
                            +{c.prix ? fcfa(c.prix) : '0 FCFA'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Code Promo */}
              <div>
                <label style={labelStyle}>Code Promo (optionnel)</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={codePromo}
                    onChange={e => setCodePromo(e.target.value.toUpperCase())}
                    style={{ ...inputStyle, textTransform: 'uppercase', flex: 1 }}
                    placeholder="Ex: SOLDE20"
                  />
                  <button
                    type="button"
                    onClick={appliquerCodePromo}
                    disabled={promoLoading}
                    style={{
                      padding: '8px 16px', borderRadius: 8, background: '#1C2B4A', color: '#fff',
                      border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap'
                    }}
                  >
                    {promoLoading ? '...' : 'Appliquer'}
                  </button>
                </div>
                {promoError && (
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#dc2626', fontWeight: 600 }}>{promoError}</p>
                )}
                {promoApplique && (
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#16a34a', fontWeight: 700 }}>
                    ✅ Code &ldquo;{promoApplique.code}&rdquo; appliqué (-{fcfa(promoApplique.reduction)})
                  </p>
                )}
              </div>

              {/* Récapitulatif */}
              {sousTotal !== null && (
                <div style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b7280' }}>
                    <span>{produit.nom} × {quantite}</span>
                    <span>{fcfa(sousTotalMain)}</span>
                  </div>
                  {Object.entries(selectedAddons).map(([pId, qte]) => {
                    const addon = crossSell.find(c => c.id === pId)
                    if (!addon) return null
                    return (
                      <div key={pId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#b45309', fontWeight: 600 }}>
                        <span>+ {addon.nom} × {qte}</span>
                        <span>{fcfa((addon.prix || 0) * qte)}</span>
                      </div>
                    )
                  })}
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

