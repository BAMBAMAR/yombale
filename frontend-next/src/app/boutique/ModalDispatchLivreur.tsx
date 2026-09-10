'use client'
import React, { useState } from 'react'
import { Send, Copy, Check, Bike, Phone, MapPin, X, AlertCircle } from 'lucide-react'
import { fcfa } from '@/lib/format'

export interface CommandeDispatch {
  id: string
  reference: string
  nom_produit: string
  quantite: number
  montant_total: number
  frais_livraison: number
  client_nom: string
  client_telephone: string
  client_adresse: string | null
  note: string | null
  methode_paiement: string | null
  statut: string
}

interface ModalDispatchLivreurProps {
  isOpen: boolean
  onClose: () => void
  commande: CommandeDispatch | null
  boutique: {
    nom: string
    adresse?: string | null
    telephone?: string | null
    ville?: string | null
  }
  onMarquerExpediee?: (commandeId: string) => void
}

export default function ModalDispatchLivreur({
  isOpen,
  onClose,
  commande,
  boutique,
  onMarquerExpediee,
}: ModalDispatchLivreurProps) {
  const [telLivreur, setTelLivreur] = useState('')
  const [copied, setCopied] = useState(false)
  const [statutMisAJour, setStatutMisAJour] = useState(false)

  if (!isOpen || !commande) return null

  const dejaPaye = commande.methode_paiement && ['wave', 'orange_money', 'cb', 'virement'].includes(commande.methode_paiement.toLowerCase())
  const montantAEncaisser = dejaPaye ? 0 : commande.montant_total

  const cleanTelClient = commande.client_telephone ? commande.client_telephone.replace(/\s+/g, '') : ''
  const telClientLien = cleanTelClient.startsWith('+') ? cleanTelClient : `+221${cleanTelClient.replace(/^00221|^221/, '')}`

  const messageCourse = `🛵 *COURSE TIAK-TIAK — NOPALOU EXPRESS*
━━━━━━━━━━━━━━━━━━━━━
📦 *Colis :* ${commande.nom_produit} (Qté : ${commande.quantite})
🔖 *Réf Commande :* #${commande.reference}

📍 *1. POINT DE RAMASSAGE (BOUTIQUE) :*
• *Boutique :* ${boutique.nom}
• *Adresse :* ${boutique.adresse || 'Point de retrait boutique'}, ${boutique.ville || 'Dakar'}
• *Tél Commerçant :* ${boutique.telephone || 'Non renseigné'}

🏁 *2. POINT DE LIVRAISON (CLIENT) :*
• *Destinataire :* ${commande.client_nom}
• *Téléphone :* ${commande.client_telephone} (${telClientLien})
• *Adresse :* ${commande.client_adresse || 'Adresse à préciser par téléphone'}
${commande.note ? `• *Précision :* ${commande.note}\n` : ''}
💰 *3. ENCAISSEMENT CLIENT :*
${dejaPaye 
  ? `✅ *COMMANDE DÉJÀ RÉGLÉE EN LIGNE*\n➡️ *NE RIEN ENCAISSER AU CLIENT* (seulement vos frais de course convenus).` 
  : `💵 *MONTANT MARCHANDISE À RÉCUPÉRER :* *${fcfa(montantAEncaisser)}*\n(À reverser intégralement à la boutique à votre retour ou par Wave).`
}
━━━━━━━━━━━━━━━━━━━━━
_Généré via Nopalou — Système d'Exploitation Commercial_`

  const handleCopier = async () => {
    try {
      await navigator.clipboard.writeText(messageCourse)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch (err) {
      console.error('Erreur copie presse-papier', err)
    }
  }

  const handleEnvoyerWhatsApp = () => {
    let cleanLivreur = telLivreur.replace(/\D/g, '')
    if (cleanLivreur.length === 9 && ['77', '78', '76', '75', '70'].some(p => cleanLivreur.startsWith(p))) {
      cleanLivreur = `221${cleanLivreur}`
    }
    const url = cleanLivreur 
      ? `https://wa.me/${cleanLivreur}?text=${encodeURIComponent(messageCourse)}`
      : `https://wa.me/?text=${encodeURIComponent(messageCourse)}`
    
    window.open(url, '_blank')
    if (onMarquerExpediee && commande.statut !== 'expediee' && commande.statut !== 'livree') {
      onMarquerExpediee(commande.id)
      setStatutMisAJour(true)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(15, 23, 42, 0.7)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: 18,
        width: '100%',
        maxWidth: 540,
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* En-tête Modal */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #FFF7ED 0%, #FFFFFF 100%)',
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: '#FFEDD5', color: 'var(--accent, #C75B00)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Bike size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 850, color: 'var(--navy, #1C2B4A)' }}>
                Dispatch Livreur Moto (Tiak-Tiak)
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B' }}>
                Fiche de course prête pour WhatsApp · Commande #{commande.reference}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Corps */}
        <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Alerte Encaissement */}
          <div style={{
            padding: '12px 14px',
            borderRadius: 12,
            background: dejaPaye ? '#F0FDF4' : '#FEF2F2',
            border: `1.5px solid ${dejaPaye ? '#BBF7D0' : '#FECACA'}`,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <AlertCircle size={20} color={dejaPaye ? '#16A34A' : '#DC2626'} style={{ flexShrink: 0 }} />
            <div style={{ fontSize: 13, lineHeight: 1.4 }}>
              {dejaPaye ? (
                <span style={{ color: '#166534', fontWeight: 700 }}>
                  ✓ Commande déjà payée en ligne via {commande.methode_paiement?.toUpperCase()}. Le livreur ne doit rien encaisser au client.
                </span>
              ) : (
                <span style={{ color: '#991B1B', fontWeight: 700 }}>
                  ⚠️ Paiement à la livraison : Le livreur doit impérativement encaisser <strong>{fcfa(montantAEncaisser)}</strong> en espèces.
                </span>
              )}
            </div>
          </div>

          {/* Numéro du livreur (Optionnel) */}
          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 750, color: 'var(--navy, #1C2B4A)', marginBottom: 6 }}>
              Numéro WhatsApp du livreur moto (optionnel) :
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="tel"
                placeholder="Ex: 77 123 45 67 (Laisser vide pour choisir dans WhatsApp)"
                value={telLivreur}
                onChange={e => setTelLivreur(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1.5px solid #CBD5E1',
                  fontSize: 13.5,
                  outline: 'none',
                }}
              />
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 11.5, color: '#64748B' }}>
              💡 Si vide, WhatsApp s'ouvrira pour vous laisser sélectionner n'importe quel livreur de vos contacts.
            </p>
          </div>

          {/* Aperçu de la fiche */}
          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 750, color: 'var(--navy, #1C2B4A)', marginBottom: 6 }}>
              Aperçu du message formaté :
            </label>
            <pre style={{
              margin: 0,
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 12,
              padding: 14,
              fontSize: 12,
              color: '#334155',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: 'monospace',
              maxHeight: 180,
              overflowY: 'auto',
            }}>
              {messageCourse}
            </pre>
          </div>
        </div>

        {/* Pied de page Actions */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
          background: '#F8FAFC',
          borderBottomLeftRadius: 18,
          borderBottomRightRadius: 18,
        }}>
          <button
            type="button"
            onClick={handleCopier}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 16px',
              borderRadius: 10,
              border: '1.5px solid #CBD5E1',
              background: '#FFFFFF',
              color: 'var(--navy, #1C2B4A)',
              fontSize: 13,
              fontWeight: 750,
              cursor: 'pointer',
            }}
          >
            {copied ? <Check size={16} color="#16A34A" /> : <Copy size={16} />}
            <span>{copied ? 'Copié !' : 'Copier texte'}</span>
          </button>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={handleEnvoyerWhatsApp}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                borderRadius: 10,
                border: 'none',
                background: '#25D366',
                color: '#FFFFFF',
                fontSize: 13.5,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(37,211,102,0.25)',
              }}
            >
              <Send size={16} />
              <span>Envoyer sur WhatsApp 🛵</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
