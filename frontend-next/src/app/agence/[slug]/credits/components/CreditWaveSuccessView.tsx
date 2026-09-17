'use client'

import React, { useState } from 'react'
import { Check, Copy, MessageCircle, CheckCircle2 } from 'lucide-react'

interface CreatedData {
  credit: any
  reference: string
  wave_url: string
  montant_immediat: number
}

interface CreditWaveSuccessViewProps {
  createdData: CreatedData
  beneficiaireNom: string
  beneficiaireTel: string
  totalNum: number
  mensualiteEstimee: number
  nbEcheances: number
  titreBien: string
  typeCredit: string
  onClose: () => void
}

export default function CreditWaveSuccessView({
  createdData,
  beneficiaireNom,
  beneficiaireTel,
  totalNum,
  mensualiteEstimee,
  nbEcheances,
  titreBien,
  typeCredit,
  onClose,
}: CreditWaveSuccessViewProps) {
  const [copied, setCopied] = useState(false)

  function formatNumeroClient(tel: string) {
    let clean = tel.replace(/\D/g, '')
    if (clean.length === 9 && ['77', '78', '76', '75', '70'].some((p) => clean.startsWith(p))) {
      clean = `221${clean}`
    }
    return clean
  }

  function genererMessageWhatsApp() {
    const nomClient = beneficiaireNom.trim() || 'Cher client'
    const totalFmt = totalNum.toLocaleString('fr-FR')
    const apportFmt = createdData.montant_immediat.toLocaleString('fr-FR')
    const mensualiteFmt = mensualiteEstimee.toLocaleString('fr-FR')

    let typeLibelle = 'caution locative étalée'
    if (typeCredit === 'acompte_reservation') typeLibelle = 'réservation de bien'
    if (typeCredit === 'terrain_parcelles') typeLibelle = 'financement de terrain par tranches'
    if (typeCredit === 'vefa') typeLibelle = 'programme neuf VEFA'

    return (
      `Bonjour ${nomClient} !\n\n` +
      `Voici votre proposition officielle de financement (${typeLibelle}) pour *"${titreBien}"* :\n` +
      `• *Montant global :* ${totalFmt} FCFA\n` +
      `• *Acompte / Apport initial à régler :* ${apportFmt} FCFA\n` +
      `• *Échelonnement :* ${nbEcheances} mensualités de ${mensualiteFmt} FCFA\n` +
      `• *Référence dossier :* ${createdData.reference}\n\n` +
      `👉 *Pour valider immédiatement votre accord et régler votre acompte par Wave sécurisé en 1 clic :*\n` +
      `${createdData.wave_url}\n\n` +
      `_Dès votre validation Wave, votre reçu certifié est émis instantanément et votre dossier est validé._\n\n` +
      `Restant à votre disposition,\nL'agence immobilière`
    )
  }

  function ouvrirWhatsApp() {
    const tel = formatNumeroClient(beneficiaireTel)
    const msg = genererMessageWhatsApp()
    const waUrl = tel
      ? `https://wa.me/${tel}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`
    window.open(waUrl, '_blank')
  }

  function handleCopierLien() {
    if (!createdData.wave_url) return
    navigator.clipboard.writeText(createdData.wave_url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        style={{
          padding: '14px 16px',
          background: '#DCFCE7',
          borderRadius: 10,
          border: '1px solid #BBF7D0',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <CheckCircle2 size={22} color="#166534" />
        <div>
          <div style={{ fontWeight: 800, color: '#166534', fontSize: 14 }}>
            Plan de financement #{createdData.reference} créé !
          </div>
          <div style={{ fontSize: 12.5, color: '#14532D' }}>
            Lien Wave actif : {createdData.montant_immediat.toLocaleString('fr-FR')} FCFA à régler immédiatement.
          </div>
        </div>
      </div>

      {/* Bloc WhatsApp 1-Clic */}
      <div
        style={{
          padding: 16,
          background: '#FAF8F5',
          borderRadius: 10,
          border: '1px solid var(--border, #E8DDD2)',
        }}
      >
        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginBottom: 8 }}>
          Lien de paiement Wave sécurisé :
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="text"
            readOnly
            value={createdData.wave_url}
            style={{
              flex: 1,
              padding: '9px 12px',
              borderRadius: 8,
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              fontSize: 12.5,
              color: 'var(--navy, #1C2B4A)',
              fontFamily: 'monospace',
            }}
          />
          <button
            type="button"
            onClick={handleCopierLien}
            style={{
              padding: '9px 14px',
              borderRadius: 8,
              background: copied ? '#DCFCE7' : '#FFFFFF',
              color: copied ? '#166534' : 'var(--navy, #1C2B4A)',
              border: '1px solid var(--border, #E8DDD2)',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              whiteSpace: 'nowrap',
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'Copié !' : 'Copier'}</span>
          </button>
        </div>
      </div>

      {/* Aperçu du Message WhatsApp prêt à l'emploi */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 6 }}>
          Aperçu du message transmis à {beneficiaireNom} :
        </div>
        <div
          style={{
            padding: 12,
            background: '#F8FAFC',
            borderRadius: 8,
            border: '1px solid #E2E8F0',
            fontSize: 12,
            color: '#334155',
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
            maxHeight: 140,
            overflowY: 'auto',
          }}
        >
          {genererMessageWhatsApp()}
        </div>
      </div>

      {/* Boutons Finaux */}
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button
          type="button"
          onClick={ouvrirWhatsApp}
          style={{
            flex: 2,
            padding: '12px 18px',
            borderRadius: 10,
            background: '#25D366',
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: 14,
            border: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: '0 4px 12px rgba(37, 211, 102, 0.25)',
          }}
        >
          <MessageCircle size={18} />
          <span>Envoyer sur WhatsApp & Conclure</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: 10,
            background: '#FFFFFF',
            border: '1px solid var(--border, #E8DDD2)',
            color: 'var(--navy, #1C2B4A)',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Fermer
        </button>
      </div>
    </div>
  )
}
