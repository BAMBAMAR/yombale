'use client'

import React, { useState } from 'react'
import { RotateCcw, PackageCheck, AlertCircle, Copy, Check, Send, X, Printer } from 'lucide-react'
import { useTranslation } from '@/i18n/context'
import { printBonAvoirPDF } from '@/lib/export'

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
  const { formatPrice } = useTranslation()
  const [motif, setMotif] = useState<'defectueux' | 'erreur_taille' | 'retractation' | 'autre'>('erreur_taille')
  const [reintegrerStock, setReintegrerStock] = useState(true)
  const [montantAvoir, setMontantAvoir] = useState<number>(commande ? commande.montant_total : 0)
  const [loading, setLoading] = useState(false)
  const [codeGenere, setCodeGenere] = useState<string | null>(null)
  const [copie, setCopie] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  // Synchroniser le montant initial à l'ouverture
  React.useEffect(() => {
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
      `• Montant crédité : *${formatPrice(montantAvoir)}*\n` +
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
            /* Écran de Succès : Avoir Généré */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'center' }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: '#f0fdf4',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                }}
              >
                <PackageCheck size={28} />
              </div>

              <div>
                <h4 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 800, color: '#166534' }}>
                  Bon d'Avoir Créé avec Succès !
                </h4>
                <p style={{ margin: 0, fontSize: 13, color: '#475569' }}>
                  Un avoir de <strong>{formatPrice(montantAvoir)}</strong> a été activé pour {commande.client_nom}.
                </p>
              </div>

              {/* Code Box */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '2px dashed #cbd5e1',
                  borderRadius: 12,
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div style={{ textAlign: 'left' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Code du bon d'avoir
                  </span>
                  <p style={{ margin: 0, fontSize: 18, fontWeight: 900, letterSpacing: 1.5, color: '#0f172a' }}>
                    {codeGenere}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={copierCode}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: copie ? '#16a34a' : '#334155',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {copie ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copie ? 'Copié' : 'Copier'}</span>
                </button>
              </div>

              {/* Actions Finales */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={envoyerWhatsAppAvoir}
                  style={{
                    padding: '12px 18px',
                    borderRadius: 10,
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
                    boxShadow: '0 2px 8px rgba(37, 211, 102, 0.25)',
                  }}
                >
                  <Send size={16} />
                  <span>Envoyer l'Avoir au Client sur WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!commande) return
                    printBonAvoirPDF({
                      boutiqueNom: 'NOPALOU BOUTIQUE',
                      referenceCommande: commande.reference,
                      codeAvoir: codeGenere,
                      clientNom: commande.client_nom,
                      clientTel: commande.client_telephone,
                      montant: montantAvoir,
                      dateValidite: new Date(Date.now() + 90 * 24 * 3600 * 1000).toLocaleDateString('fr-FR'),
                      motif: motif === 'defectueux' ? 'Article défectueux' : motif === 'erreur_taille' ? 'Erreur de taille' : motif === 'retractation' ? 'Rétractation client' : 'Autre motif',
                    })
                  }}
                  style={{
                    padding: '11px 18px',
                    borderRadius: 10,
                    border: '1.5px solid #1C2B4A',
                    background: '#ffffff',
                    color: '#1C2B4A',
                    fontSize: 13.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <Printer size={16} />
                  <span>Imprimer le Reçu d'Avoir (Ticket 80mm)</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '10px 16px',
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
            /* Formulaire de Déclaration de Retour */
            <form onSubmit={handleCreerAvoir} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {erreur && (
                <div
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: 8,
                    padding: '10px 12px',
                    fontSize: 12.5,
                    color: '#dc2626',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{erreur}</span>
                </div>
              )}

              {/* Résumé Article */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  padding: '12px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Article retourné :</span>
                  <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: '#1e293b' }}>
                    {commande.quantite}× {commande.nom_produit}
                  </p>
                </div>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#C75B00' }}>
                  {formatPrice(commande.montant_total)}
                </span>
              </div>

              {/* Motif du Retour */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: '#334155' }}>
                  Motif du retour :
                </label>
                <select
                  value={motif}
                  onChange={(e) => setMotif(e.target.value as any)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: 13,
                    color: '#1e293b',
                    background: '#ffffff',
                    outline: 'none',
                  }}
                >
                  <option value="erreur_taille">Erreur de taille / pointure / modèle</option>
                  <option value="defectueux">Article défectueux ou abîmé</option>
                  <option value="retractation">Changement d'avis / Rétractation client</option>
                  <option value="autre">Autre motif commercial</option>
                </select>
              </div>

              {/* Montant du Bon d'Avoir */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: '#334155' }}>
                    Montant de l'avoir (FCFA) :
                  </label>
                  <span style={{ fontSize: 11, color: '#64748b' }}>
                    Max: {formatPrice(commande.montant_total)}
                  </span>
                </div>
                <input
                  type="number"
                  min={1}
                  max={commande.montant_total}
                  value={montantAvoir}
                  onChange={(e) => setMontantAvoir(Math.max(0, Number(e.target.value)))}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#1e293b',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Option Réintégration de Stock */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  cursor: 'pointer',
                  padding: '8px 10px',
                  borderRadius: 8,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}
              >
                <input
                  type="checkbox"
                  checked={reintegrerStock}
                  onChange={(e) => setReintegrerStock(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: '#C75B00', cursor: 'pointer' }}
                />
                <span style={{ fontSize: 12.5, color: '#334155', fontWeight: 600 }}>
                  Remettre automatiquement l'article en stock marchand (+{commande.quantite})
                </span>
              </label>

              {/* Bouton de Soumission */}
              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    borderRadius: 10,
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#64748b',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading || montantAvoir <= 0}
                  style={{
                    flex: 2,
                    padding: '10px 16px',
                    borderRadius: 10,
                    border: 'none',
                    background: 'linear-gradient(135deg, #C75B00, #9A4300)',
                    color: '#ffffff',
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: loading || montantAvoir <= 0 ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 6px rgba(199, 91, 0, 0.25)',
                  }}
                >
                  {loading ? 'Création en cours...' : 'Valider le Retour & Créer l\'Avoir'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
