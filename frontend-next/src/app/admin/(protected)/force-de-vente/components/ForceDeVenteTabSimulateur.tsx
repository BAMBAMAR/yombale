import React, { useState } from 'react'
import { DollarSign } from 'lucide-react'
import { fcfa } from '@/lib/format'

interface ForceDeVenteTabSimulateurProps {
  prixDecouverte: number
  prixPro: number
  prixBusiness: number
  tauxApporteur: number
}

export default function ForceDeVenteTabSimulateur({
  prixDecouverte,
  prixPro,
  prixBusiness,
  tauxApporteur,
}: ForceDeVenteTabSimulateurProps) {
  const [nbTafTaf, setNbTafTaf] = useState(10)
  const [nbPro, setNbPro] = useState(25)
  const [nbBusiness, setNbBusiness] = useState(5)

  // Calculs Rémunération Simulateur
  const caMensuel = nbTafTaf * prixDecouverte + nbPro * prixPro + nbBusiness * prixBusiness
  const comMensuelle = caMensuel * (tauxApporteur / 100)
  const totalBoutiques = nbTafTaf + nbPro + nbBusiness
  const primePalier = totalBoutiques >= 50 ? 100000 : totalBoutiques >= 30 ? 50000 : totalBoutiques >= 15 ? 20000 : 0
  const gainTotalMois = comMensuelle + primePalier

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ background: '#fff', border: '1px solid var(--border, #E2E8F0)', borderRadius: 16, padding: '28px' }}>
        <h2
          style={{
            fontSize: 20,
            fontWeight: 900,
            color: 'var(--navy, #1C2B4A)',
            margin: '0 0 6px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <DollarSign size={22} color="#16A34A" /> Simulateur de Rémunération &amp; Commissions Récurrentes ({tauxApporteur}%)
        </h2>
        <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 24px' }}>
          Calculez en temps réel les gains récurrents mensuels d&apos;un commercial ou apporteur selon le nombre de
          boutiques recrutées.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 28 }}>
          <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 14, padding: '18px' }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy, #1C2B4A)', display: 'block', marginBottom: 4 }}>
              Boutiques Taf Taf ({fcfa(prixDecouverte)}/m)
            </span>
            <span style={{ fontSize: 12, color: '#64748B', display: 'block', marginBottom: 12 }}>
              Commission : {fcfa(Math.round((prixDecouverte * tauxApporteur) / 100))} / boutique / mois
            </span>
            <input
              type="number"
              min="0"
              value={nbTafTaf}
              onChange={e => setNbTafTaf(Math.max(0, parseInt(e.target.value, 10) || 0))}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 16, fontWeight: 800 }}
            />
          </div>

          <div style={{ background: '#FFF7ED', border: '2px solid var(--accent, #C75B00)', borderRadius: 14, padding: '18px' }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--accent, #C75B00)', display: 'block', marginBottom: 4 }}>
              Boutiques Pro ({fcfa(prixPro)}/m)
            </span>
            <span style={{ fontSize: 12, color: '#9A3412', display: 'block', marginBottom: 12 }}>
              Commission : {fcfa(Math.round((prixPro * tauxApporteur) / 100))} / boutique / mois
            </span>
            <input
              type="number"
              min="0"
              value={nbPro}
              onChange={e => setNbPro(Math.max(0, parseInt(e.target.value, 10) || 0))}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1.5px solid var(--accent, #C75B00)', fontSize: 16, fontWeight: 800 }}
            />
          </div>

          <div style={{ background: '#F8FAFC', border: '1px solid #1E293B', borderRadius: 14, padding: '18px' }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#1E293B', display: 'block', marginBottom: 4 }}>
              Boutiques Business ({fcfa(prixBusiness)}/m)
            </span>
            <span style={{ fontSize: 12, color: '#64748B', display: 'block', marginBottom: 12 }}>
              Commission : {fcfa(Math.round((prixBusiness * tauxApporteur) / 100))} / boutique / mois
            </span>
            <input
              type="number"
              min="0"
              value={nbBusiness}
              onChange={e => setNbBusiness(Math.max(0, parseInt(e.target.value, 10) || 0))}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 16, fontWeight: 800 }}
            />
          </div>
        </div>

        {/* Résumé des Gains */}
        <div
          style={{
            background: 'linear-gradient(135deg, var(--navy, #1C2B4A) 0%, #0F172A 100%)',
            borderRadius: 16,
            padding: '24px 32px',
            color: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <span style={{ fontSize: 14, color: '#94A3B8', display: 'block', marginBottom: 4 }}>
              Total Boutiques Actives : <strong>{totalBoutiques}</strong> · CA Mensuel Généré : {fcfa(caMensuel)}
            </span>
            <span style={{ fontSize: 13, color: '#38BDF8', fontWeight: 700 }}>
              Commissions récurrentes ({tauxApporteur}%) : {fcfa(comMensuelle)}{' '}
              {primePalier > 0 ? `+ Prime palier : ${fcfa(primePalier)}` : ''}
            </span>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 13, color: '#FFEDD5', fontWeight: 800, display: 'block' }}>REVENU MENSUEL ESTIMÉ</span>
            <span style={{ fontSize: 32, fontWeight: 900, color: '#4ADE80' }}>{fcfa(gainTotalMois)}</span>
            <span style={{ fontSize: 12, color: '#94A3B8', display: 'block' }}>versés chaque mois par Wave</span>
          </div>
        </div>
      </div>
    </div>
  )
}
