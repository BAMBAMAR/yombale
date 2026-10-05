'use client'

import React from 'react'
import {
  Zap,
  ShieldCheck,
  Sparkles,
  BellRing,
  Headphones,
} from 'lucide-react'

export const AVANTAGES_PREMIUM = [
  {
    icon: Zap,
    titre: 'Commandes vocales illimitées',
    desc: 'Adressez autant de requêtes WhatsApp et vocales que vous le souhaitez sans aucun plafond journalier.',
  },
  {
    icon: BellRing,
    titre: 'Alertes immobilières en moins de 60s',
    desc: 'Soyez notifié avant tout le monde dès qu un logement correspondant à vos critères est publié.',
  },
  {
    icon: Headphones,
    titre: 'Radios et podcasts privés permanents',
    desc: 'Écoutez les revues de presse matinales et les flux FM du Sénégal sans coupure ni limitation.',
  },
  {
    icon: Sparkles,
    titre: 'Rappels automatiques concours nationaux',
    desc: 'Planification instantanée des rappels J-30, J-7 et J-1 pour tous les concours de la fonction publique.',
  },
  {
    icon: ShieldCheck,
    titre: 'Sauvegarde chiffrée et synchronisation',
    desc: 'Vos dépenses, calculs et mémos personnels sécurisés et consultables à tout instant.',
  },
]

export default function SurgaPremiumAvantages() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {AVANTAGES_PREMIUM.map((item, idx) => {
        const Icon = item.icon
        return (
          <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                backgroundColor: 'rgba(10, 92, 54, 0.08)',
                color: 'var(--price, #0A5C36)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: 2,
              }}
            >
              <Icon size={16} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
                {item.titre}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text2, #5A4E42)', marginTop: 2 }}>
                {item.desc}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
