'use client'

import React, { useState, useEffect } from 'react'
import { RotateCcw, X } from 'lucide-react'
import RetourSuccesAvoir from './commandes/RetourSuccesAvoir'
import RetourFormulaire from './commandes/RetourFormulaire'

interface CommandeRetour {
  id: string
  reference: string
  nom_produit: string
  quantite: number
  montant_total: number
  client_nom: string
  client_telephone: string
}

interface ModalRetourCommandeProps {
  isOpen: boolean
  onClose: () => void
  commande: CommandeRetour | null
  boutiqueId: string
  onSuccess: () => void
}

export default function ModalRetourCommande({
  isOpen,
  onClose,
  commande,
  boutiqueId,
  onSuccess,
}: ModalRetourCommandeProps) {
  const [motif, setMotif] = useState<'defectueux' | 'erreur_taille' | 'retractation' | 'autre'>('erreur_taille')
  const [reintegrerStock, setReintegrerStock] = useState(true)
  const [montantAvoir, setMontantAvoir] = useState<number>(commande ? commande.montant_total : 0)
  const [loading, setLoading] = useState(false)
  const [codeGenere, setCodeGenere] = useState<string | null>(null)
  const [copie, setCopie] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  // Synchroniser le montant initial à l'ouverture
  useEffect(() => {
    if (commande) {
      setMontantAvoir(commande.montant_total)
      setCodeGenere(null)
      setErreur(null)
      setCopie(false)
    }
  }, [commande])

  if (!isOpen || !commande) return null

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || ''

  async function handleCreerAvoir(e: React.FormEvent) {
    e.preventDefault()
    if (!commande) return

    setLoading(true)
    setErreur(null)

    try {
      const codeUnique = `AVOIR-${commande.reference.replace(/[^A-Za-z0-9]/g, '').slice(-4).toUpperCase() || 'RET'}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

      const res = await fetch(`${backendUrl}/api/boutiques/${boutiqueId}/bons-achat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          valeur: montantAvoir,
          code: codeUnique,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Erreur lors de la génération du bon d\'avoir.')
      }

      const bon = await res.json()
      setCodeGenere(bon.code || codeUnique)
      onSuccess()
    } catch (err: any) {
      setErreur(err.message || 'Impossible d\'émettre le bon d\'avoir.')
    } finally {
      setLoading(false)
    }
  }

  function copierCode() {
    if (!codeGenere) return
    navigator.clipboard.writeText(codeGenere)
    setCopie(true)
    setTimeout(() => setCopie(false), 2000)
  }

  function envoyerWhatsAppAvoir() {
    if (!codeGenere || !commande) return
    const cleanTel = commande.client_telephone.replace(/\D/g, '')
    const telAvecIndicatif = cleanTel.length === 9 && ['70', '75', '76', '77', '78'].some(p => cleanTel.startsWith(p))
      ? `221${cleanTel}`
      : cleanTel

    const msg = `Bonjour ${commande.client_nom},\n\n` +
      `Nous avons bien enregistré le retour concernant votre commande *#${commande.reference}* (${commande.nom_produit}).\n\n` +
      `Votre *Bon d'Avoir Nopalou* a été émis avec succès :\n` +
      `• Montant crédité : *${montantAvoir.toLocaleString('fr-FR')} FCFA*\n` +
      `• Code d'avoir déductible : *${codeGenere}*\n\n` +
      `Vous pouvez déduire ce code lors de votre prochain achat dans notre boutique ou en caisse.\n` +
      `Merci pour votre confiance !`

    window.open(`https://wa.me/${telAvecIndicatif}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1050,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 16,
          width: '100%',
          maxWidth: 480,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header Modal */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#f8fafc',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: '#fff7ed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#C75B00',
              }}
            >
              <RotateCcw size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#1e293b' }}>
                Retour & Bon d'Avoir
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                Commande #{commande.reference} · {commande.client_nom}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Corps */}
        <div style={{ padding: 20 }}>
          {codeGenere ? (
            <RetourSuccesAvoir
              commande={commande}
              montantAvoir={montantAvoir}
              codeGenere={codeGenere}
              copie={copie}
              copierCode={copierCode}
              envoyerWhatsAppAvoir={envoyerWhatsAppAvoir}
              motif={motif}
              onClose={onClose}
            />
          ) : (
            <RetourFormulaire
              commande={commande}
              motif={motif}
              setMotif={setMotif}
              montantAvoir={montantAvoir}
              setMontantAvoir={setMontantAvoir}
              reintegrerStock={reintegrerStock}
              setReintegrerStock={setReintegrerStock}
              loading={loading}
              erreur={erreur}
              handleCreerAvoir={handleCreerAvoir}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  )
}
