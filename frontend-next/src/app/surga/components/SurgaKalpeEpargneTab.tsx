'use client'

import React, { useState } from 'react'
import { PiggyBank, Plus, Trash2, CheckCircle2, Target } from 'lucide-react'
import {
  type KalpeObjectifLocal,
  verserKalpeObjectif,
  deleteKalpeObjectif,
  saveKalpeOperation,
} from '@/lib/surga-kalpe'

interface SurgaKalpeEpargneTabProps {
  objectifs: KalpeObjectifLocal[]
  onOpenAjout: () => void
  onRefresh: () => void
}

export default function SurgaKalpeEpargneTab({
  objectifs,
  onOpenAjout,
  onRefresh,
}: SurgaKalpeEpargneTabProps) {
  const [objectifEnVersement, setObjectifEnVersement] = useState<KalpeObjectifLocal | null>(null)
  const [montantVersement, setMontantVersement] = useState('')

  const totalEpargneActuel = objectifs.reduce((acc, curr) => acc + curr.montant_actuel, 0)
  const totalCible = objectifs.reduce((acc, curr) => acc + curr.montant_cible, 0)
  const pourcentageGlobal = totalCible > 0 ? Math.round((totalEpargneActuel / totalCible) * 100) : 0

  const handleValiderVersement = (e: React.FormEvent) => {
    e.preventDefault()
    if (!objectifEnVersement) return
    const montantNum = parseFloat(montantVersement.replace(/\s+/g, ''))
    if (isNaN(montantNum) || montantNum <= 0) {
      alert('Montant invalide')
      return
    }

    verserKalpeObjectif(objectifEnVersement.id, montantNum)
    saveKalpeOperation({
      direction: 'sortie',
      type: 'versement_epargne',
      montant: montantNum,
      categorie: 'Épargne & Cagnottes',
      libelle: `Versement vers « ${objectifEnVersement.titre} »`,
      mode_paiement: 'wave',
      date_operation: new Date().toISOString().slice(0, 10),
    })

    setObjectifEnVersement(null)
    setMontantVersement('')
    onRefresh()
  }

  const handleSupprimer = (id: string) => {
    if (confirm('Voulez-vous supprimer cet objectif ?')) {
      deleteKalpeObjectif(id)
      onRefresh()
    }
  }

  return (
    <div>
      {/* Carte Résumé Global Épargne */}
      <div
        style={{
          padding: '14px 16px',
          borderRadius: 12,
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border, #E8DDD2)',
          marginBottom: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <PiggyBank size={18} color="#2563EB" />
            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
              Épargne Globale Cumulée
            </span>
          </div>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#2563EB' }}>
            {pourcentageGlobal}% de l’objectif
          </span>
        </div>

        <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--navy, #1C2B4A)', marginBottom: 4 }}>
          {totalEpargneActuel.toLocaleString('fr-FR')} FCFA
        </div>
        <div style={{ fontSize: 12, color: 'var(--text3, #73675E)', marginBottom: 10 }}>
          sur une cible totale de {totalCible.toLocaleString('fr-FR')} FCFA
        </div>

        <div style={{ width: '100%', height: 6, borderRadius: 3, backgroundColor: 'var(--bg, #F8F5F0)', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${Math.min(100, pourcentageGlobal)}%`,
              backgroundColor: '#2563EB',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Bouton d'ajout */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button
          type="button"
          onClick={onOpenAjout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '6px 12px',
            borderRadius: 6,
            border: 'none',
            backgroundColor: '#2563EB',
            color: '#FFFFFF',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <Plus size={14} />
          <span>Nouvel Objectif</span>
        </button>
      </div>

      {/* Liste des objectifs */}
      {objectifs.length === 0 ? (
        <div
          style={{
            padding: '32px 16px',
            textAlign: 'center',
            borderRadius: 12,
            backgroundColor: 'var(--bg, #F8F5F0)',
            border: '1px dashed var(--border, #E8DDD2)',
          }}
        >
          <Target size={24} color="var(--text3, #73675E)" style={{ margin: '0 auto 8px auto' }} />
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2, #5A4E42)' }}>
            Aucun objectif d’épargne pour le moment
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3, #73675E)', marginTop: 2 }}>
            Créez une tirelire pour Tabaski, un fonds d’urgence ou un investissement.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {objectifs.map((obj) => {
            const isAtteint = obj.montant_actuel >= obj.montant_cible
            const pct = Math.min(100, Math.round((obj.montant_actuel / obj.montant_cible) * 100)) || 0

            return (
              <div
                key={obj.id}
                style={{
                  padding: '12px 14px',
                  borderRadius: 10,
                  backgroundColor: '#FFFFFF',
                  border: isAtteint ? '1px solid var(--price, #0A5C36)' : '1px solid var(--border, #E8DDD2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {isAtteint ? (
                      <CheckCircle2 size={16} color="var(--price, #0A5C36)" />
                    ) : (
                      <Target size={16} color="#2563EB" />
                    )}
                    <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text1, #1A1612)' }}>
                      {obj.titre}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: isAtteint ? 'var(--price, #0A5C36)' : '#2563EB',
                      backgroundColor: isAtteint ? 'rgba(10,92,54,0.1)' : 'rgba(37,99,235,0.08)',
                      padding: '2px 6px',
                      borderRadius: 4,
                    }}
                  >
                    {pct}%
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
                    {obj.montant_actuel.toLocaleString('fr-FR')} FCFA
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text3, #73675E)' }}>
                    Objectif: {obj.montant_cible.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>

                {/* Barre de progression */}
                <div style={{ width: '100%', height: 6, borderRadius: 3, backgroundColor: 'var(--bg, #F8F5F0)', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${pct}%`,
                      backgroundColor: isAtteint ? 'var(--price, #0A5C36)' : '#2563EB',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                  <button
                    type="button"
                    onClick={() => setObjectifEnVersement(obj)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 6,
                      border: 'none',
                      backgroundColor: '#2563EB',
                      color: '#FFFFFF',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    + Versement
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSupprimer(obj.id)}
                    aria-label="Supprimer cet objectif"
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 4,
                      cursor: 'pointer',
                      color: 'var(--text3, #73675E)',
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Versement Rapide */}
      {objectifEnVersement && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.55)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 400,
              backgroundColor: '#FFFFFF',
              borderRadius: 14,
              padding: 20,
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            }}
          >
            <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: '0 0 10px 0' }}>
              Versement : {objectifEnVersement.titre}
            </h4>
            <p style={{ fontSize: 13, color: 'var(--text2, #5A4E42)', margin: '0 0 14px 0' }}>
              Actuel : {objectifEnVersement.montant_actuel.toLocaleString('fr-FR')} / {objectifEnVersement.montant_cible.toLocaleString('fr-FR')} FCFA
            </p>

            <form onSubmit={handleValiderVersement} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                type="number"
                required
                value={montantVersement}
                onChange={(e) => setMontantVersement(e.target.value)}
                placeholder="Montant à épargner (FCFA)"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border, #E8DDD2)',
                  fontSize: 16,
                  fontWeight: 800,
                  outline: 'none',
                }}
              />

              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setObjectifEnVersement(null)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: 6,
                    border: '1px solid var(--border, #E8DDD2)',
                    background: 'transparent',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: 6,
                    border: 'none',
                    background: '#2563EB',
                    color: '#FFFFFF',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Ajouter à l’épargne
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
