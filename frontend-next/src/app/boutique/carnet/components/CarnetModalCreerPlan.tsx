'use client'

import React, { useState, useMemo } from 'react'
import { X, Calendar, Layers, Check, AlertCircle, Sparkles } from 'lucide-react'
import { fcfa, fmtDate } from '@/lib/format'
import { calculerEcheancier, validerReglesEchelonnement, CONFIG_DEFAUT_ECHELONNEMENT } from '@/lib/creditCalculator'

interface CarnetModalCreerPlanProps {
  isOpen: boolean
  onClose: () => void
  boutiqueId: string
  clientId: string
  clientNom: string
  onPlanCreated: () => void
}

export default function CarnetModalCreerPlan({
  isOpen,
  onClose,
  boutiqueId,
  clientId,
  clientNom,
  onPlanCreated,
}: CarnetModalCreerPlanProps) {
  const [montantTotal, setMontantTotal] = useState<string>('50000')
  const [apport, setApport] = useState<string>('15000')
  const [nbEcheances, setNbEcheances] = useState<number>(3)
  const [frequence, setFrequence] = useState<'mensuel' | 'bimensuel' | 'hebdomadaire'>('mensuel')
  const [notes, setNotes] = useState<string>('')
  const [dateDebut, setDateDebut] = useState<string>(() => new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const numTotal = Number(montantTotal) || 0
  const numApport = Number(apport) || 0

  // Calcul dynamique de l'échéancier prévisionnel
  const simulation = useMemo(() => {
    if (numTotal <= 0) return null
    try {
      return calculerEcheancier({
        montantTotal: numTotal,
        apport: numApport,
        nbEcheances,
        frequence,
        dateDebut: dateDebut || new Date(),
        config: CONFIG_DEFAUT_ECHELONNEMENT,
      })
    } catch {
      return null
    }
  }, [numTotal, numApport, nbEcheances, frequence, dateDebut])

  if (!isOpen) return null

  const handleCreerPlan = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (numTotal <= 0) {
      setErrorMsg('Veuillez saisir un montant total de vente valide (> 0).')
      return
    }

    if (numApport >= numTotal) {
      setErrorMsg("L'apport ne peut pas être supérieur ou égal au montant total de la vente.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/boutiques/${boutiqueId}/credits-clients/${clientId}/creer-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          montant_total: numTotal,
          apport_initial: numApport,
          nb_echeances: nbEcheances,
          frequence,
          date_debut: dateDebut,
          notes: notes.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Erreur lors de la création du plan de crédit.')
      } else {
        onPlanCreated()
        onClose()
      }
    } catch {
      setErrorMsg('Erreur de connexion au serveur.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 20,
          width: '100%',
          maxWidth: 540,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #1C2B4A 0%, #2A3F6D 100%)',
            color: '#ffffff',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Layers size={20} color="#fed7aa" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Nouveau Plan Échelonné</h3>
              <p style={{ margin: 0, fontSize: 12, opacity: 0.85 }}>Client : {clientNom}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#ffffff',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleCreerPlan} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {errorMsg && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Montant Total & Apport */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                Montant total de la vente
              </label>
              <input
                type="number"
                min="1000"
                step="500"
                value={montantTotal}
                onChange={(e) => setMontantTotal(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid #cbd5e1',
                  fontSize: 14,
                  fontWeight: 800,
                  color: '#0f172a',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                Apport initial (Acompte)
              </label>
              <input
                type="number"
                min="0"
                step="500"
                value={apport}
                onChange={(e) => setApport(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid #cbd5e1',
                  fontSize: 14,
                  fontWeight: 800,
                  color: '#0f172a',
                }}
              />
            </div>
          </div>

          {/* Nombre d'échéances */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
              Nombre d&apos;échéances
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {[2, 3, 4, 6].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNbEcheances(n)}
                  style={{
                    padding: '8px 0',
                    borderRadius: 10,
                    border: nbEcheances === n ? '2px solid var(--accent, #C75B00)' : '1px solid #e2e8f0',
                    background: nbEcheances === n ? '#fff7ed' : '#ffffff',
                    color: nbEcheances === n ? 'var(--accent, #C75B00)' : '#475569',
                    fontWeight: 800,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  {n} fois ({n}x)
                </button>
              ))}
            </div>
          </div>

          {/* Fréquence & Date de départ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                Fréquence
              </label>
              <select
                value={frequence}
                onChange={(e) => setFrequence(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid #cbd5e1',
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#0f172a',
                }}
              >
                <option value="mensuel">Mensuel (Tous les mois)</option>
                <option value="bimensuel">Bimensuel (Tous les 15 jours)</option>
                <option value="hebdomadaire">Hebdomadaire (Chaque semaine)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                Date de début
              </label>
              <input
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid #cbd5e1',
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#0f172a',
                }}
              />
            </div>
          </div>

          {/* Aperçu du Calendrier Échéancier */}
          {simulation && (
            <div
              style={{
                background: '#f8fafc',
                borderRadius: 14,
                border: '1px solid #e2e8f0',
                padding: '12px 14px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Sparkles size={14} color="var(--accent, #C75B00)" />
                  Échéancier calculé (Montant financé : {fcfa(simulation.montant_finance)})
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {simulation.echeances.map((ech) => (
                  <div
                    key={ech.numero_echeance}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: '#ffffff',
                      borderRadius: 8,
                      padding: '6px 10px',
                      border: '1px solid #f1f5f9',
                      fontSize: 12,
                    }}
                  >
                    <span style={{ fontWeight: 700, color: '#475569' }}>
                      Échéance #{ech.numero_echeance} ({fmtDate(ech.date_echeance)})
                    </span>
                    <span style={{ fontWeight: 800, color: 'var(--price, #0A5C36)' }}>
                      {fcfa(ech.montant_prevu)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
              Notes / Description (Optionnel)
            </label>
            <input
              type="text"
              placeholder="Ex: Achat réfrigérateur + mixeur"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid #cbd5e1',
                fontSize: 13,
                color: '#0f172a',
              }}
            />
          </div>

          {/* Submit */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: 12,
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#475569',
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || numTotal <= 0}
              style={{
                flex: 2,
                padding: '12px',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, var(--accent, #C75B00) 0%, #a04900 100%)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: 13,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                boxShadow: '0 4px 12px rgba(199, 91, 0, 0.25)',
              }}
            >
              <Check size={16} />
              <span>{loading ? 'Création en cours...' : 'Valider & Créer le Plan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
