'use client'

import React, { useState, useEffect } from 'react'
import {
  X,
  Zap,
  CheckCircle2,
  Copy,
  MessageCircle,
  Check,
  AlertCircle,
} from 'lucide-react'
import { creerCommandeDirecte, getBoutiqueProduits } from './actions'
import { fcfa } from '@/lib/format'

interface ZoneLivraison {
  id: string
  nom: string
  prix: number
}

interface ModalNouvelleCommandeWaveProps {
  boutiqueId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function ModalNouvelleCommandeWave({
  boutiqueId,
  isOpen,
  onClose,
  onSuccess,
}: ModalNouvelleCommandeWaveProps) {
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [produitsCatalogue, setProduitsCatalogue] = useState<any[]>([])
  const [zones, setZones] = useState<ZoneLivraison[]>([])

  // Formulaire
  const [nomProduit, setNomProduit] = useState('')
  const [produitId, setProduitId] = useState<string>('')
  const [prixUnitaire, setPrixUnitaire] = useState<string>('')
  const [quantite, setQuantite] = useState<number>(1)
  const [fraisLivraison, setFraisLivraison] = useState<string>('0')
  const [zoneId, setZoneId] = useState<string>('')
  const [clientNom, setClientNom] = useState('')
  const [clientTelephone, setClientTelephone] = useState('')
  const [clientAdresse, setClientAdresse] = useState('')
  const [note, setNote] = useState('')
  const [methodePaiement, setMethodePaiement] = useState<'wave' | 'cash' | 'orange_money'>('wave')

  // État de succès
  const [createdOrder, setCreatedOrder] = useState<any | null>(null)
  const [wavePaymentUrl, setWavePaymentUrl] = useState<string>('')
  const [copied, setCopied] = useState(false)

  // Charger les produits et zones de livraison de la boutique
  useEffect(() => {
    if (!isOpen || !boutiqueId) return
    setErrorMsg(null)
    setCreatedOrder(null)
    setWavePaymentUrl('')
    setCopied(false)

    getBoutiqueProduits(boutiqueId).then(prods => {
      if (Array.isArray(prods)) setProduitsCatalogue(prods)
    }).catch(() => {})

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || ''
    fetch(`${backendUrl}/api/comptabilite/${boutiqueId}/zones/public`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setZones(data)
      })
      .catch(() => {})
  }, [isOpen, boutiqueId])

  if (!isOpen) return null

  const montantProduits = (Number(prixUnitaire) || 0) * (quantite || 1)
  const montantFrais = Number(fraisLivraison) || 0
  const montantTotal = montantProduits + montantFrais

  function handleSelectProduit(prod: any) {
    if (!prod) {
      setProduitId('')
      return
    }
    setProduitId(prod.id)
    setNomProduit(prod.nom || '')
    if (prod.prix) {
      setPrixUnitaire(String(prod.prix))
    }
  }

  function handleSelectZone(zId: string) {
    setZoneId(zId)
    const z = zones.find(item => item.id === zId)
    if (z) {
      setFraisLivraison(String(z.prix))
    } else {
      setFraisLivraison('0')
    }
  }

  function formatNumeroClient(tel: string) {
    return tel.replace(/\D/g, '')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nomProduit.trim()) {
      setErrorMsg('Veuillez indiquer le nom ou la désignation de l\'article.')
      return
    }
    const pu = Number(prixUnitaire)
    if (isNaN(pu) || pu <= 0) {
      setErrorMsg('Veuillez renseigner un prix unitaire valide (en FCFA).')
      return
    }
    const cleanTel = formatNumeroClient(clientTelephone)
    if (!cleanTel || cleanTel.length < 7) {
      setErrorMsg('Veuillez renseigner un numéro de téléphone WhatsApp valide.')
      return
    }

    setErrorMsg(null)
    setLoading(true)

    try {
      const result = await creerCommandeDirecte(boutiqueId, {
        nom_produit: nomProduit.trim(),
        prix_unitaire: pu,
        quantite: Math.max(1, quantite),
        produit_id: produitId || undefined,
        client_nom: clientNom.trim() || 'Client WhatsApp',
        client_telephone: cleanTel,
        client_adresse: clientAdresse.trim() || undefined,
        frais_livraison: montantFrais,
        zone_livraison_id: zoneId || undefined,
        note: note.trim() || undefined,
        methode_paiement: methodePaiement,
        source: 'whatsapp_direct',
      })

      if (!result.success || !result.commande) {
        setErrorMsg(result.error || 'Erreur lors de la création de la commande.')
        setLoading(false)
        return
      }

      const cmd = result.commande
      setCreatedOrder(cmd)

      // Construction du lien de paiement
      const SITE = typeof window !== 'undefined' ? window.location.origin : 'https://nopalou.com'
      let finalPayUrl = result.wave_url
      if (!finalPayUrl) {
        finalPayUrl = `${SITE}/checkout-express?produit=${cmd.produit_id || ''}&boutique=${boutiqueId}&phone=${encodeURIComponent(cleanTel)}&pay=wave&ref=${cmd.reference}&auto=1`
      }
      setWavePaymentUrl(finalPayUrl)
      setLoading(false)

      // Déclencher le rafraîchissement des commandes en arrière-plan
      onSuccess()

      // Ouvrir automatiquement WhatsApp vers le client
      ouvrirWhatsApp(cmd, finalPayUrl, cleanTel)
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erreur réseau inattendue.')
      setLoading(false)
    }
  }

  function genererMessageWhatsApp(cmd: any, payUrl: string) {
    const totalFmt = fcfa(Number(cmd.montant_total || montantTotal))
    const puFmt = fcfa(Number(cmd.prix_unitaire || prixUnitaire))
    const nomClientAffiche = clientNom.trim() || 'cher client'

    let msg = `Bonjour ${nomClientAffiche} ! 👋\n\n` +
      `Voici votre commande officielle Nopalou :\n` +
      `📦 *${cmd.nom_produit}* × ${cmd.quantite} (${puFmt})\n`

    if (montantFrais > 0) {
      msg += `🚚 Livraison : ${fcfa(montantFrais)}\n`
    }

    msg += `💰 *TOTAL : ${totalFmt}*\n` +
      `🔖 Référence : *${cmd.reference}*\n\n`

    if (methodePaiement === 'wave') {
      msg += `💳 *Pour régler directement en 1 clic par Wave sécurisé :*\n👉 ${payUrl}\n\n` +
        `_Dès votre validation Wave, votre commande est confirmée et votre reçu officiel vous est délivré instantanément._`
    } else {
      msg += `💳 Mode convenu : ${methodePaiement === 'cash' ? '💵 Espèces à la livraison' : '🍊 Orange Money'}\n` +
        `Merci pour votre confiance !`
    }

    return msg
  }

  function ouvrirWhatsApp(cmd: any, payUrl: string, tel: string) {
    let cleanTel = formatNumeroClient(tel)
    if (cleanTel.length === 9 && (cleanTel.startsWith('77') || cleanTel.startsWith('78') || cleanTel.startsWith('76') || cleanTel.startsWith('75') || cleanTel.startsWith('70'))) {
      cleanTel = `221${cleanTel}`
    }
    const msg = genererMessageWhatsApp(cmd, payUrl)
    const waUrl = `https://wa.me/${cleanTel}?text=${encodeURIComponent(msg)}`
    window.open(waUrl, '_blank')
  }

  function copierLien() {
    if (!wavePaymentUrl) return
    navigator.clipboard.writeText(wavePaymentUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 20,
          width: '100%',
          maxWidth: 580,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #fff7ed 0%, #ffffff 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #C75B00, #ea580c)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 10px rgba(199, 91, 0, 0.25)',
              }}
            >
              <Zap size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                Nouvelle commande & Lien Wave
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                Concluez votre vente WhatsApp et envoyez le paiement sécurisé
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: 8,
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748b',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Corps du modal */}
        <div style={{ padding: '20px 22px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {errorMsg && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                borderRadius: 10,
                padding: '10px 14px',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Écran de Succès */}
          {createdOrder ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', textAlign: 'center', padding: '12px 0' }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: '#dcfce7',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle2 size={36} />
              </div>

              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#0f172a' }}>
                  Commande enregistrée avec succès !
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
                  Réf: <strong style={{ color: '#C75B00' }}>{createdOrder.reference}</strong> · Montant : <strong style={{ color: '#0f172a' }}>{fcfa(Number(createdOrder.montant_total))}</strong>
                </p>
              </div>

              {/* Boîte du lien Wave */}
              <div
                style={{
                  width: '100%',
                  background: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: 12,
                  padding: '14px',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 11.5, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  🌊 Lien de paiement Wave direct
                </span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="text"
                    readOnly
                    value={wavePaymentUrl}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#0284c7',
                      fontSize: 12.5,
                      fontWeight: 700,
                    }}
                  />
                  <button
                    type="button"
                    onClick={copierLien}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: 'none',
                      background: copied ? '#16a34a' : '#0f172a',
                      color: '#ffffff',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      transition: 'background 0.15s',
                    }}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copié !' : 'Copier'}
                  </button>
                </div>
              </div>

              {/* Bouton WhatsApp */}
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => ouvrirWhatsApp(createdOrder, wavePaymentUrl, clientTelephone)}
                  style={{
                    width: '100%',
                    padding: '13px',
                    borderRadius: 12,
                    border: 'none',
                    background: '#25D366',
                    color: '#ffffff',
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: '0 4px 14px rgba(37, 211, 102, 0.35)',
                  }}
                >
                  <MessageCircle size={18} />
                  Ouvrir WhatsApp et envoyer le message au client
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: 10,
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Fermer
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Choix ou saisie de l'article */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>
                    📦 Article ou Publication convenue *
                  </label>
                  {produitsCatalogue.length > 0 && (
                    <span style={{ fontSize: 11, color: '#64748b' }}>
                      ou choisir du catalogue :
                    </span>
                  )}
                </div>

                {produitsCatalogue.length > 0 && (
                  <select
                    value={produitId}
                    onChange={e => {
                      const sel = produitsCatalogue.find(p => p.id === e.target.value)
                      handleSelectProduit(sel)
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      background: '#f8fafc',
                      color: '#0f172a',
                      fontSize: 12.5,
                      marginBottom: 6,
                    }}
                  >
                    <option value="">-- Saisie libre ou sélectionner un produit --</option>
                    {produitsCatalogue.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nom} ({fcfa(Number(p.prix || 0))})
                      </option>
                    ))}
                  </select>
                )}

                <input
                  type="text"
                  required
                  placeholder="Ex: Robe en soie verte (Vidéo TikTok #3)..."
                  value={nomProduit}
                  onChange={e => setNomProduit(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#0f172a',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Prix unitaire et Quantité */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                    💰 Prix unitaire convenu (FCFA) *
                  </label>
                  <input
                    type="number"
                    required
                    min="100"
                    step="50"
                    placeholder="Ex: 15000"
                    value={prixUnitaire}
                    onChange={e => setPrixUnitaire(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      fontSize: 14,
                      fontWeight: 800,
                      color: '#C75B00',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                    Quantité
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={quantite}
                    onChange={e => setQuantite(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#0f172a',
                      textAlign: 'center',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Livraison */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                  🚚 Livraison (optionnel)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: zones.length > 0 ? '1.5fr 1fr' : '1fr', gap: 10 }}>
                  {zones.length > 0 && (
                    <select
                      value={zoneId}
                      onChange={e => handleSelectZone(e.target.value)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 8,
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        fontSize: 12.5,
                        color: '#0f172a',
                      }}
                    >
                      <option value="">-- Choisir une zone --</option>
                      {zones.map(z => (
                        <option key={z.id} value={z.id}>
                          {z.nom} ({fcfa(z.prix)})
                        </option>
                      ))}
                    </select>
                  )}
                  <input
                    type="number"
                    min="0"
                    step="100"
                    placeholder="Frais de livraison (FCFA)"
                    value={fraisLivraison}
                    onChange={e => setFraisLivraison(e.target.value)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#0f172a',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Téléphone WhatsApp et Nom du Client */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                    📞 Numéro WhatsApp du Client *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Ex: 77 123 45 67"
                    value={clientTelephone}
                    onChange={e => setClientTelephone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1.5px solid #25D366',
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#0f172a',
                      background: '#f0fdf4',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                    👤 Nom du Client
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Fatou"
                    value={clientNom}
                    onChange={e => setClientNom(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      fontSize: 13,
                      color: '#0f172a',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Adresse et Note */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 }}>
                    📍 Adresse / Quartier
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Almadies, près de la pharmacie"
                    value={clientAdresse}
                    onChange={e => setClientAdresse(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      fontSize: 12,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 }}>
                    📝 Note (taille, couleur...)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Taille XL, Rouge bordeaux"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      fontSize: 12,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Mode de règlement */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                  💳 Mode de règlement
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {[
                    { id: 'wave', label: '🌊 Wave (Lien direct)' },
                    { id: 'cash', label: '💵 Paiement livraison' },
                    { id: 'orange_money', label: '🍊 Orange Money' },
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMethodePaiement(m.id as any)}
                      style={{
                        padding: '8px 6px',
                        borderRadius: 8,
                        border: methodePaiement === m.id ? '2px solid #0284c7' : '1px solid #cbd5e1',
                        background: methodePaiement === m.id ? '#f0f9ff' : '#ffffff',
                        color: methodePaiement === m.id ? '#0284c7' : '#475569',
                        fontSize: 11.5,
                        fontWeight: methodePaiement === m.id ? 800 : 600,
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Récapitulatif Total */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #fff7ed, #ffedd5)',
                  border: '1px solid #fed7aa',
                  borderRadius: 12,
                  padding: '12px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <span style={{ fontSize: 11.5, color: '#9a3412', fontWeight: 700, display: 'block' }}>
                    TOTAL DE LA COMMANDE
                  </span>
                  <span style={{ fontSize: 11, color: '#c2410c' }}>
                    {quantite} article(s) {montantFrais > 0 ? `+ ${fcfa(montantFrais)} livr.` : ''}
                  </span>
                </div>
                <span style={{ fontSize: 20, fontWeight: 900, color: '#C75B00' }}>
                  {fcfa(montantTotal)}
                </span>
              </div>

              {/* Bouton de Soumission */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: 12,
                  border: 'none',
                  background: loading ? '#94a3b8' : '#25D366',
                  color: '#ffffff',
                  fontSize: 14.5,
                  fontWeight: 800,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: loading ? 'none' : '0 4px 14px rgba(37, 211, 102, 0.35)',
                  transition: 'background 0.15s ease',
                }}
              >
                <MessageCircle size={18} />
                {loading ? 'Génération de la commande et du lien...' : '🚀 Créer la commande & Envoyer sur WhatsApp'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
