'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Wallet,
  Plus,
  Calculator,
  Trash2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { formaterFCFA } from '@/lib/surga-calculator'
import {
  type SurgaDepense,
  type SurgaDepensesStats,
  getLocalDepenses,
  saveLocalDepense,
  deleteLocalDepense,
  calculerStatsLocales,
  synchroniserSurga,
} from '@/lib/surga-offline-sync'
import SurgaCalculatorModal from './SurgaCalculatorModal'
import SurgaDepenseForm from './SurgaDepenseForm'

export default function SurgaDepensesView() {
  const [moisSelectionne, setMoisSelectionne] = useState<string>(() =>
    new Date().toISOString().slice(0, 7)
  )
  const [depenses, setDepenses] = useState<SurgaDepense[]>([])
  const [stats, setStats] = useState<SurgaDepensesStats | null>(null)
  const [isAdding, setIsAdding] = useState<boolean>(false)
  const [isCalcOpen, setIsCalcOpen] = useState<boolean>(false)
  const [montantInjecte, setMontantInjecte] = useState<string>('')
  const [notification, setNotification] = useState<string | null>(null)

  const rafraichirDonnees = () => {
    const toutes = getLocalDepenses()
    setDepenses(toutes)
    const st = calculerStatsLocales(moisSelectionne)
    setStats(st)
  }

  useEffect(() => {
    rafraichirDonnees()
    synchroniserSurga().then((synced) => {
      if (synced) rafraichirDonnees()
    })
  }, [moisSelectionne])

  const depensesMois = useMemo(() => {
    return depenses
      .filter((d) => d.date_depense && d.date_depense.startsWith(moisSelectionne))
      .sort((a, b) => (b.date_depense + b.created_at).localeCompare(a.date_depense + a.created_at))
  }, [depenses, moisSelectionne])

  const changerMois = (direction: 'prec' | 'suiv') => {
    const [annee, m] = moisSelectionne.split('-').map(Number)
    const d = new Date(annee, m - 1 + (direction === 'prec' ? -1 : 1), 1)
    setMoisSelectionne(d.toISOString().slice(0, 7))
  }

  const libelleMois = useMemo(() => {
    try {
      const [annee, m] = moisSelectionne.split('-').map(Number)
      const d = new Date(annee, m - 1, 1)
      const nom = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
      return nom.charAt(0).toUpperCase() + nom.slice(1)
    } catch {
      return moisSelectionne
    }
  }, [moisSelectionne])

  const handleAjouter = async (data: {
    montant: number
    categorie: string
    dateDepense: string
    note?: string
  }) => {
    saveLocalDepense({
      montant_xof: data.montant,
      categorie: data.categorie,
      date_depense: data.dateDepense,
      note: data.note,
    })

    setIsAdding(false)
    setMontantInjecte('')
    rafraichirDonnees()

    setNotification('Dépense enregistrée avec succès')
    setTimeout(() => setNotification(null), 3000)

    await synchroniserSurga()
    rafraichirDonnees()
  }

  const handleSupprimer = async (id: string) => {
    if (confirm('Voulez-vous supprimer cette dépense ?')) {
      deleteLocalDepense(id)
      rafraichirDonnees()
      if (navigator.onLine) {
        try {
          await fetch(`/api/surga/depenses/${id}`, { method: 'DELETE' })
        } catch {}
      }
    }
  }

  const handleInjecterMontant = (val: number) => {
    setMontantInjecte(val.toString())
    setIsAdding(true)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Sélecteur de mois & Total Récapitulatif */}
      <div
        className="surga-card"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 14,
          padding: 16,
          border: '1px solid var(--border, #E8DDD2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <button
            type="button"
            onClick={() => changerMois('prec')}
            aria-label="Mois précédent"
            style={{
              background: 'none',
              border: '1px solid var(--border, #E8DDD2)',
              borderRadius: 8,
              padding: 6,
              cursor: 'pointer',
              color: 'var(--navy, #1C2B4A)',
              display: 'flex',
            }}
          >
            <ChevronLeft size={18} />
          </button>

          <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
            {libelleMois}
          </span>

          <button
            type="button"
            onClick={() => changerMois('suiv')}
            aria-label="Mois suivant"
            style={{
              background: 'none',
              border: '1px solid var(--border, #E8DDD2)',
              borderRadius: 8,
              padding: 6,
              cursor: 'pointer',
              color: 'var(--navy, #1C2B4A)',
              display: 'flex',
            }}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div style={{ textAlign: 'center', margin: '10px 0 16px 0' }}>
          <div style={{ fontSize: 13, color: 'var(--text2, #5A4E42)', fontWeight: 600 }}>
            Total des dépenses du mois
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: 'var(--price, #0A5C36)',
              margin: '4px 0',
            }}
          >
            {stats?.total_formate || '0 FCFA'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3, #73675E)' }}>
            {stats?.nb_depenses || 0} dépense{(stats?.nb_depenses || 0) > 1 ? 's' : ''} enregistrée{(stats?.nb_depenses || 0) > 1 ? 's' : ''}
          </div>
        </div>

        {/* Répartition par catégorie */}
        {stats && stats.par_categorie.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid var(--border, #E8DDD2)', paddingTop: 12 }}>
            {stats.par_categorie.map((c) => (
              <div key={c.categorie} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--navy, #1C2B4A)', fontWeight: 600 }}>{c.categorie}</span>
                <span style={{ color: 'var(--text1, #1A1612)' }}>
                  <strong>{c.total_formate}</strong> ({c.pourcentage}%)
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Boutons d'action */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          type="button"
          onClick={() => {
            setMontantInjecte('')
            setIsAdding(true)
          }}
          className="btn-npl"
          style={{
            flex: 1,
            backgroundColor: 'var(--price, #0A5C36)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 10,
            padding: '12px 14px',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <Plus size={16} />
          <span>Ajouter une dépense</span>
        </button>

        <button
          type="button"
          onClick={() => setIsCalcOpen(true)}
          style={{
            backgroundColor: 'rgba(28,43,74,0.08)',
            color: 'var(--navy, #1C2B4A)',
            border: '1px solid var(--border, #E8DDD2)',
            borderRadius: 10,
            padding: '12px 14px',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <Calculator size={16} />
          <span>Calculatrice</span>
        </button>
      </div>

      {/* Confirmation notification */}
      {notification && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: 'rgba(10,92,54,0.1)',
            color: 'var(--price, #0A5C36)',
            padding: '8px 12px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <CheckCircle2 size={16} />
          <span>{notification}</span>
        </div>
      )}

      {/* Formulaire sous-composant */}
      {isAdding && (
        <SurgaDepenseForm
          initialMontant={montantInjecte}
          onClose={() => {
            setIsAdding(false)
            setMontantInjecte('')
          }}
          onSubmit={handleAjouter}
        />
      )}

      {/* Liste des dépenses du mois */}
      {depensesMois.length === 0 ? (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            padding: 30,
            textAlign: 'center',
            border: '1px solid var(--border, #E8DDD2)',
          }}
        >
          <Wallet size={32} color="var(--text3, #73675E)" style={{ margin: '0 auto 10px auto' }} />
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
            Aucune dépense ce mois-ci
          </div>
          <div style={{ fontSize: 13, color: 'var(--text2, #5A4E42)', marginTop: 4 }}>
            Appuyez sur "Ajouter une dépense" pour suivre votre budget.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {depensesMois.map((d) => (
            <div key={d.id} className="surga-item-row" style={{ width: '100%' }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  backgroundColor: 'rgba(10,92,54,0.1)',
                  color: 'var(--price, #0A5C36)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Wallet size={18} />
              </div>

              <div className="surga-item-content">
                <div className="surga-item-line1" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="surga-price-tag" style={{ fontSize: 15, fontWeight: 800 }}>
                    {formaterFCFA(d.montant_xof)}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      backgroundColor: 'rgba(28,43,74,0.08)',
                      color: 'var(--navy, #1C2B4A)',
                      padding: '2px 6px',
                      borderRadius: 4,
                    }}
                  >
                    {d.categorie}
                  </span>
                </div>
                <div className="surga-item-line2">
                  <span>{d.date_depense}</span>
                  {d.note && (
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      • {d.note}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSupprimer(d.id)}
                aria-label="Supprimer la dépense"
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 8,
                  cursor: 'pointer',
                  color: 'var(--text3, #73675E)',
                  flexShrink: 0,
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modale Calculatrice */}
      <SurgaCalculatorModal
        isOpen={isCalcOpen}
        onClose={() => setIsCalcOpen(false)}
        onInjectMontant={handleInjecterMontant}
      />
    </div>
  )
}
