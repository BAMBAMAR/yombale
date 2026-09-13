'use client'

import React, { useState, useEffect } from 'react'
import { X, Zap, AlertCircle } from 'lucide-react'
import { creerCommandeDirecte, getBoutiqueProduits } from './actions'
import { fcfa } from '@/lib/format'
import ModalNouvelleCommandeSuccess from './commandes/ModalNouvelleCommandeSuccess'
import NouvelleCommandeForm, { type ZoneLivraison } from './commandes/NouvelleCommandeForm'

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

  function genererMessageWhatsApp(cmd: any, payUrl: string) {
    const totalFmt = fcfa(Number(cmd.montant_total || montantTotal))
    const puFmt = fcfa(Number(cmd.prix_unitaire || prixUnitaire))
    const cleanNom = clientNom.trim()
    const salutation = cleanNom && cleanNom.toLowerCase() !== 'client whatsapp'
      ? `Bonjour ${cleanNom} !`
      : `Bonjour !`

    let msg = `${salutation}\n\n` +
      `Voici votre commande officielle Nopalou :\n` +
      `*Produit :* ${cmd.nom_produit} × ${cmd.quantite} (${puFmt})\n`

    if (montantFrais > 0) {
      msg += `*Livraison :* ${fcfa(montantFrais)}\n`
    }

    msg += `*TOTAL :* ${totalFmt}\n` +
      `*Référence :* ${cmd.reference}\n\n`

    if (methodePaiement === 'wave') {
      msg += `*Pour régler directement en 1 clic par Wave sécurisé :*\n` +
        `${payUrl}\n\n` +
        `_Dès votre validation Wave, votre commande est confirmée et votre reçu officiel vous est délivré instantanément._`
    } else {
      msg += `*Mode de paiement :* ${methodePaiement === 'cash' ? 'Espèces à la livraison' : 'Orange Money'}\n` +
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

          {createdOrder ? (
            <ModalNouvelleCommandeSuccess
              createdOrder={createdOrder}
              wavePaymentUrl={wavePaymentUrl}
              copied={copied}
              copierLien={copierLien}
              ouvrirWhatsApp={ouvrirWhatsApp}
              clientTelephone={clientTelephone}
              onClose={onClose}
            />
          ) : (
            <NouvelleCommandeForm
              produitsCatalogue={produitsCatalogue}
              nomProduit={nomProduit}
              setNomProduit={setNomProduit}
              produitId={produitId}
              handleSelectProduit={handleSelectProduit}
              prixUnitaire={prixUnitaire}
              setPrixUnitaire={setPrixUnitaire}
              quantite={quantite}
              setQuantite={setQuantite}
              zones={zones}
              zoneId={zoneId}
              handleSelectZone={handleSelectZone}
              fraisLivraison={fraisLivraison}
              setFraisLivraison={setFraisLivraison}
              clientTelephone={clientTelephone}
              setClientTelephone={setClientTelephone}
              clientNom={clientNom}
              setClientNom={setClientNom}
              clientAdresse={clientAdresse}
              setClientAdresse={setClientAdresse}
              note={note}
              setNote={setNote}
              methodePaiement={methodePaiement}
              setMethodePaiement={setMethodePaiement}
              montantFrais={montantFrais}
              montantTotal={montantTotal}
              loading={loading}
              handleSubmit={handleSubmit}
            />
          )}
        </div>
      </div>
    </div>
  )
}
