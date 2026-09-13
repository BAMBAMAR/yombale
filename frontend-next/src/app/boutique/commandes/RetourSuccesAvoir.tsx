'use client'

import React from 'react'
import { PackageCheck, Copy, Check, Send, Printer } from 'lucide-react'
import { printBonAvoirPDF } from '@/lib/export'
import { useTranslation } from '@/i18n/context'

interface CommandeRetour {
  id: string
  reference: string
  nom_produit: string
  quantite: number
  montant_total: number
  client_nom: string
  client_telephone: string
}

interface RetourSuccesAvoirProps {
  commande: CommandeRetour
  montantAvoir: number
  codeGenere: string
  copie: boolean
  copierCode: () => void
  envoyerWhatsAppAvoir: () => void
  motif: string
  onClose: () => void
}

export default function RetourSuccesAvoir({
  commande,
  montantAvoir,
  codeGenere,
  copie,
  copierCode,
  envoyerWhatsAppAvoir,
  motif,
  onClose,
}: RetourSuccesAvoirProps) {
  const { formatPrice } = useTranslation()

  return (
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
            printBonAvoirPDF({
              boutiqueNom: 'NOPALOU BOUTIQUE',
              referenceCommande: commande.reference,
              codeAvoir: codeGenere,
              clientNom: commande.client_nom,
              clientTel: commande.client_telephone,
              montant: montantAvoir,
              dateValidite: new Date(Date.now() + 90 * 24 * 3600 * 1000).toLocaleDateString('fr-FR'),
              motif:
                motif === 'defectueux'
                  ? 'Article défectueux'
                  : motif === 'erreur_taille'
                  ? 'Erreur de taille'
                  : motif === 'retractation'
                  ? 'Rétractation client'
                  : 'Autre motif',
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
  )
}
