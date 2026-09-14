'use client'

import React, { useState } from 'react'
import { Send, Copy, Check, Bike, Truck, Phone, MapPin, X, AlertCircle, MessageCircle, Globe, ShieldCheck } from 'lucide-react'
import { fcfa } from '@/lib/format'
import { TRANSPORTEURS_SENEGAL, TransporteurSenegal } from '@/lib/logistique-senegal'

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
  const [transporteurId, setTransporteurId] = useState<string>('tiak_tiak')
  const [telLivreur, setTelLivreur] = useState('')
  const [nomLivreur, setNomLivreur] = useState('')
  const [copiedLivreur, setCopiedLivreur] = useState(false)
  const [copiedClient, setCopiedClient] = useState(false)
  const [ongletMessage, setOngletMessage] = useState<'livreur' | 'client'>('livreur')

  if (!isOpen || !commande) return null

  const transporteurActif = TRANSPORTEURS_SENEGAL.find((t) => t.id === transporteurId) || TRANSPORTEURS_SENEGAL[0]

  const dejaPaye = commande.methode_paiement && ['wave', 'orange_money', 'cb', 'virement'].includes(commande.methode_paiement.toLowerCase())
  const montantAEncaisser = dejaPaye ? 0 : commande.montant_total

  const cleanTelClient = commande.client_telephone ? commande.client_telephone.replace(/\s+/g, '') : ''
  const telClientLien = cleanTelClient.startsWith('+') ? cleanTelClient : `+221${cleanTelClient.replace(/^00221|^221/, '')}`

  // Message 1 : Fiche de course pour le livreur / transporteur
  const messageCourseLivreur = `*BORDEREAU D'EXPÉDITION — ${transporteurActif.nom.toUpperCase()}*
━━━━━━━━━━━━━━━━━━━━━
*Colis :* ${commande.nom_produit} (Qté : ${commande.quantite})
*Réf Commande :* #${commande.reference}
*Délai estimé :* ${transporteurActif.delaiMoyen}

*1. POINT DE RAMASSAGE (BOUTIQUE) :*
• *Boutique :* ${boutique.nom}
• *Adresse :* ${boutique.adresse || 'Point de retrait boutique'}, ${boutique.ville || 'Dakar'}
• *Tél Commerçant :* ${boutique.telephone || 'Non renseigné'}

*2. POINT DE LIVRAISON (CLIENT) :*
• *Destinataire :* ${commande.client_nom}
• *Téléphone :* ${commande.client_telephone} (${telClientLien})
• *Adresse :* ${commande.client_adresse || 'Adresse à préciser par téléphone'}
• *Itinéraire GPS :* https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((commande.client_adresse || 'Dakar') + ', Sénégal')}
${commande.note ? `• *Note spéciale :* ${commande.note}\n` : ''}
*3. INSTRUCTION D'ENCAISSEMENT :*
${dejaPaye 
  ? `*COMMANDE DÉJÀ RÉGLÉE EN LIGNE*\n*NE RIEN ENCAISSER AU CLIENT* (seulement vos frais de livraison convenus).` 
  : `*MONTANT MARCHANDISE À RÉCUPÉRER :* *${fcfa(montantAEncaisser)}*\n(À reverser intégralement à la boutique par Wave/OM ou en espèces).`
}
━━━━━━━━━━━━━━━━━━━━━
_Expédié via Nopalou — Système d'Exploitation Commercial_`

  // Message 2 : Notification expédition au Client
  const messageClientNotification = `Bonjour ${commande.client_nom} ! 👋

Bonne nouvelle : Votre commande *#${commande.reference}* chez *${boutique.nom}* vient d'être expédiée ! 🚀

📦 *Article(s) :* ${commande.nom_produit} (x${commande.quantite})
🚚 *Transporteur :* ${transporteurActif.nom}
⏱️ *Délai estimé :* ${transporteurActif.delaiMoyen}
📍 *Adresse de livraison :* ${commande.client_adresse || 'Selon entente'}
${nomLivreur.trim() ? `🛵 *Livreur :* ${nomLivreur.trim()}${telLivreur.trim() ? ` (${telLivreur.trim()})` : ''}\n` : ''}
💳 *Règlement :* ${dejaPaye ? 'Déjà payé en ligne ✓' : `À régler à la réception : *${fcfa(montantAEncaisser)}*`}

Merci de votre confiance et à très bientôt chez *${boutique.nom}* !
_Suivi propulsé par Nopalou_`

  const handleCopier = async (type: 'livreur' | 'client') => {
    try {
      const texte = type === 'livreur' ? messageCourseLivreur : messageClientNotification
      await navigator.clipboard.writeText(texte)
      if (type === 'livreur') {
        setCopiedLivreur(true)
        setTimeout(() => setCopiedLivreur(false), 2500)
      } else {
        setCopiedClient(true)
        setTimeout(() => setCopiedClient(false), 2500)
      }
    } catch (err) {
      console.error('Erreur copie presse-papier', err)
    }
  }

  const handleEnvoyerLivreurWhatsApp = () => {
    let cleanLivreur = telLivreur.replace(/\D/g, '')
    if (cleanLivreur.length === 9 && ['77', '78', '76', '75', '70', '33'].some((p) => cleanLivreur.startsWith(p))) {
      cleanLivreur = `221${cleanLivreur}`
    }
    const url = cleanLivreur 
      ? `https://wa.me/${cleanLivreur}?text=${encodeURIComponent(messageCourseLivreur)}`
      : `https://wa.me/?text=${encodeURIComponent(messageCourseLivreur)}`
    
    window.open(url, '_blank')
    if (onMarquerExpediee && commande.statut !== 'expediee' && commande.statut !== 'livree') {
      onMarquerExpediee(commande.id)
    }
  }

  const handleNotifierClientWhatsApp = () => {
    let cleanDest = cleanTelClient.replace(/\D/g, '')
    if (cleanDest.length === 9 && ['77', '78', '76', '75', '70', '33'].some((p) => cleanDest.startsWith(p))) {
      cleanDest = `221${cleanDest}`
    }
    const url = cleanDest 
      ? `https://wa.me/${cleanDest}?text=${encodeURIComponent(messageClientNotification)}`
      : `https://wa.me/?text=${encodeURIComponent(messageClientNotification)}`
    
    window.open(url, '_blank')
    if (onMarquerExpediee && commande.statut !== 'expediee' && commande.statut !== 'livree') {
      onMarquerExpediee(commande.id)
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
        borderRadius: 20,
        width: '100%',
        maxWidth: 580,
        maxHeight: '92vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
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
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: '#FFEDD5', color: 'var(--accent, #C75B00)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {transporteurActif.type === 'moto_urbain' ? <Bike size={22} /> : <Truck size={22} />}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 850, color: 'var(--navy, #1C2B4A)' }}>
                Expédition & Dispatch Logistique
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B' }}>
                Commande #{commande.reference} • Client : <strong>{commande.client_nom}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 4 }}
            aria-label="Fermer"
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
                  ✓ Commande payée en ligne via {commande.methode_paiement?.toUpperCase()}. Le transporteur ne doit rien encaisser au client.
                </span>
              ) : (
                <span style={{ color: '#991B1B', fontWeight: 700 }}>
                  Paiement à la livraison : Le transporteur doit impérativement encaisser <strong>{fcfa(montantAEncaisser)}</strong> en espèces.
                </span>
              )}
            </div>
          </div>

          {/* Choix du Transporteur */}
          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 750, color: 'var(--navy, #1C2B4A)', marginBottom: 6 }}>
              Choisir le transporteur / service de livraison :
            </label>
            <select
              value={transporteurId}
              onChange={(e) => setTransporteurId(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1.5px solid #CBD5E1',
                fontSize: 13.5,
                fontWeight: 700,
                color: '#0F172A',
                background: '#FFFFFF',
                outline: 'none',
              }}
            >
              {TRANSPORTEURS_SENEGAL.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nom} ({t.delaiMoyen} — {t.zonesCouvertes})
                </option>
              ))}
            </select>
          </div>

          {/* Coordonnées du coursier */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                Nom du coursier (optionnel) :
              </label>
              <input
                type="text"
                placeholder="Ex: Modou Diop"
                value={nomLivreur}
                onChange={(e) => setNomLivreur(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid #CBD5E1',
                  fontSize: 13,
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                WhatsApp coursier (optionnel) :
              </label>
              <input
                type="tel"
                placeholder="Ex: 77 123 45 67"
                value={telLivreur}
                onChange={(e) => setTelLivreur(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid #CBD5E1',
                  fontSize: 13,
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Onglets Aperçu : Fiche Livreur vs Message Client */}
          <div>
            <div style={{ display: 'flex', background: '#F1F5F9', padding: 3, borderRadius: 10, gap: 4, marginBottom: 8 }}>
              <button
                type="button"
                onClick={() => setOngletMessage('livreur')}
                style={{
                  flex: 1, padding: '7px 10px', borderRadius: 8, border: 'none',
                  background: ongletMessage === 'livreur' ? '#FFFFFF' : 'transparent',
                  color: ongletMessage === 'livreur' ? '#0F172A' : '#64748B',
                  fontWeight: 800, fontSize: 12, cursor: 'pointer',
                  boxShadow: ongletMessage === 'livreur' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                Fiche de course (Transporteur)
              </button>
              <button
                type="button"
                onClick={() => setOngletMessage('client')}
                style={{
                  flex: 1, padding: '7px 10px', borderRadius: 8, border: 'none',
                  background: ongletMessage === 'client' ? '#FFFFFF' : 'transparent',
                  color: ongletMessage === 'client' ? '#0F172A' : '#64748B',
                  fontWeight: 800, fontSize: 12, cursor: 'pointer',
                  boxShadow: ongletMessage === 'client' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                Notification Expédition (Client)
              </button>
            </div>

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
              {ongletMessage === 'livreur' ? messageCourseLivreur : messageClientNotification}
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
          borderBottomLeftRadius: 20,
          borderBottomRightRadius: 20,
        }}>
          <button
            type="button"
            onClick={() => handleCopier(ongletMessage)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 14px',
              borderRadius: 10,
              border: '1.5px solid #CBD5E1',
              background: '#FFFFFF',
              color: 'var(--navy, #1C2B4A)',
              fontSize: 12.5,
              fontWeight: 750,
              cursor: 'pointer',
            }}
          >
            {(ongletMessage === 'livreur' ? copiedLivreur : copiedClient) ? (
              <Check size={16} color="#16A34A" />
            ) : (
              <Copy size={16} />
            )}
            <span>{(ongletMessage === 'livreur' ? copiedLivreur : copiedClient) ? 'Copié !' : 'Copier texte'}</span>
          </button>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={handleNotifierClientWhatsApp}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid #CBD5E1',
                background: '#EFF6FF',
                color: '#1D4ED8',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
              }}
              title="Prévenir le client par WhatsApp que son colis est en route"
            >
              <MessageCircle size={16} />
              <span>Aviser le Client</span>
            </button>

            <button
              type="button"
              onClick={handleEnvoyerLivreurWhatsApp}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 16px',
                borderRadius: 10,
                border: 'none',
                background: '#25D366',
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(37,211,102,0.25)',
              }}
            >
              <Send size={16} />
              <span>Transmettre au Transporteur</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
