'use client'

import React from 'react'
import { Crown, FileText, HelpCircle } from 'lucide-react'
import { etatDroit, libelleAbonnement, useSurgaOffre } from '@/lib/surga-offre'

// Bandeau « vos droits » des écrans Emploi (CV, lettres, simulations).
// Le texte se construit sur la limite réelle réglée dans la console et sur l'usage du compte : aucun chiffre n'est écrit ici.

interface Props {
  produit: 'cv' | 'lettres' | 'simulations'
  estPremium: boolean
  limite: number | null | undefined
  utilises: number | null | undefined
  onOpenPremium: () => void
}

export default function SurgaBandeauDroit({ produit, estPremium, limite, utilises, onOpenPremium }: Props) {
  const { offre } = useSurgaOffre()
  // Pour un visiteur non connecté, le serveur ne donne pas de limite : on retombe sur le réglage public.
  const limiteReglee = limite ?? (offre?.gratuit ? { cv: offre.gratuit.cv, lettres: offre.gratuit.lettres_par_mois, simulations: offre.gratuit.simulations_par_semaine }[produit] : null)
  const etat = etatDroit(produit, { estPremium, limite: limiteReglee, utilises }, offre)
  const Icone = produit === 'simulations' ? HelpCircle : FileText

  return (
    <div
      className="surga-card"
      style={{
        padding: 14,
        backgroundColor: estPremium ? 'rgba(10, 92, 54, 0.05)' : 'var(--bg, #F8F5F0)',
        border: estPremium ? '1.5px solid var(--price, #0A5C36)' : '1px solid var(--border, #E8DDD2)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: '1 1 180px' }}>
          {estPremium ? <Crown size={18} color="var(--price, #0A5C36)" /> : <Icone size={18} color="var(--navy, #1C2B4A)" />}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>{etat.titre}</div>
            {etat.detail && <div style={{ fontSize: 12, color: 'var(--text2, #5A4E42)' }}>{etat.detail}</div>}
          </div>
        </div>
        {!estPremium && offre && offre.ventes_ouvertes && (
          <button type="button" onClick={onOpenPremium} className="surga-btn-secondary" style={{ fontSize: 12, padding: '5px 10px', fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap', width: 'auto' }}>
            {libelleAbonnement(offre)}
          </button>
        )}
      </div>
    </div>
  )
}
