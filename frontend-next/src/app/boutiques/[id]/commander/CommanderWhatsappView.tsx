'use client'

import React from 'react'
import { MessageSquare, Mic, Phone, ArrowRight, Zap } from 'lucide-react'
import { Produit, fcfa, helperLienWhatsapp } from './types'

interface CommanderWhatsappViewProps {
  produit: Produit
  nomBoutique?: string | null
  whatsapp?: string | null
  sousTotalMain: number
  recordAbConversion: () => void
}

export default function CommanderWhatsappView({
  produit,
  nomBoutique,
  whatsapp,
  sousTotalMain,
  recordAbConversion,
}: CommanderWhatsappViewProps) {
  const messageWhatsappDirect = `Bonjour ${nomBoutique ? nomBoutique : 'vendeur'} ! Je suis intéressé(e) par l'article "${produit.nom}"${produit.prix ? ` (${fcfa(produit.prix)})` : ''} vu sur Nopalou. Est-il disponible ?`
  const messageWhatsappVocal = `Bonjour ${nomBoutique ? nomBoutique : 'vendeur'} ! Je souhaite commander l'article "${produit.nom}" (${fcfa(sousTotalMain)}). Je vous joins ma note vocale ci-dessous pour vous préciser ma taille / couleur / adresse exacte de livraison.`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        style={{
          background: '#f0fdf4',
          border: '1.5px solid #bbf7d0',
          borderRadius: 16,
          padding: '16px 18px',
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start',
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: '#dcfce7',
            color: '#15803d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Zap size={20} />
        </div>
        <div>
          <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 800, color: '#15803d' }}>
            Commande instantanée avec le vendeur
          </h3>
          <p style={{ margin: 0, fontSize: 13, color: '#166534', lineHeight: 1.45 }}>
            Évitez la saisie de formulaires ! Cliquez sur le bouton ci-dessous pour ouvrir WhatsApp avec votre message pré-rempli pour <strong>{nomBoutique || 'le vendeur'}</strong>.
          </p>
        </div>
      </div>

      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '14px 16px' }}>
        <p
          style={{
            margin: '0 0 8px',
            fontSize: 11,
            fontWeight: 800,
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Message prêt à envoyer :
        </p>
        <div
          style={{
            background: '#ffffff',
            padding: '12px 14px',
            borderRadius: 10,
            border: '1px solid #e2e8f0',
            fontSize: 13,
            color: '#334155',
            fontStyle: 'italic',
            lineHeight: 1.45,
          }}
        >
          &ldquo;{messageWhatsappDirect}&rdquo;
        </div>
      </div>

      {/* Bouton Primaire WhatsApp */}
      <a
        href={helperLienWhatsapp(whatsapp || '221777202086', messageWhatsappDirect)}
        onClick={recordAbConversion}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          background: '#22c55e',
          color: '#ffffff',
          border: 'none',
          borderRadius: 14,
          padding: '16px 20px',
          fontWeight: 900,
          fontSize: 15.5,
          textDecoration: 'none',
          boxShadow: '0 8px 20px -4px rgba(34, 197, 94, 0.4)',
          cursor: 'pointer',
          textAlign: 'center',
          transition: 'all 0.2s ease',
        }}
      >
        <MessageSquare size={20} />
        <span>Ouvrir WhatsApp Maintenant ({fcfa(sousTotalMain)})</span>
        <ArrowRight size={18} />
      </a>

      {/* Option Note Vocale WhatsApp Directe */}
      <div
        style={{
          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
          border: '2px dashed #22c55e',
          borderRadius: 16,
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: '#bbf7d0',
              color: '#15803d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Mic size={18} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: 13.5, fontWeight: 900, color: '#15803d' }}>
              Commander par Note Vocale (Wolof ou Français)
            </h4>
            <p style={{ margin: '2px 0 0', fontSize: 11.5, color: '#166534', lineHeight: 1.35 }}>
              Pas besoin d&apos;écrire : ouvrez WhatsApp et dictez vos consignes au vendeur.
            </p>
          </div>
        </div>

        <a
          href={helperLienWhatsapp(whatsapp || '221777202086', messageWhatsappVocal)}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            background: '#15803d',
            color: '#ffffff',
            border: 'none',
            borderRadius: 12,
            padding: '12px 16px',
            fontWeight: 800,
            fontSize: 14,
            textDecoration: 'none',
            boxShadow: '0 4px 14px rgba(21, 128, 61, 0.25)',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'all 0.2s ease',
          }}
        >
          <Mic size={16} />
          <span>Envoyer une Note Vocale WhatsApp</span>
          <ArrowRight size={16} />
        </a>
      </div>

      {/* Alternative téléphonique */}
      {whatsapp && (
        <a
          href={`tel:${whatsapp.replace(/\D/g, '')}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            background: '#ffffff',
            color: '#475569',
            border: '1.5px solid #cbd5e1',
            borderRadius: 12,
            padding: '11px 16px',
            fontWeight: 700,
            fontSize: 13.5,
            textDecoration: 'none',
            textAlign: 'center',
          }}
        >
          <Phone size={16} />
          <span>Appeler la boutique directement</span>
        </a>
      )}
    </div>
  )
}
