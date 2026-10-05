'use client'

import React, { useState } from 'react'
import { Users, CheckCircle2, Clock, Trash2, Check, Phone } from 'lucide-react'
import {
  type KalpeDetteLocal,
  rembourserKalpeDette,
  deleteKalpeDette,
  saveKalpeOperation,
} from '@/lib/surga-kalpe'

interface SurgaKalpeDettesTabProps {
  dettes: KalpeDetteLocal[]
  onRefresh: () => void
}

export default function SurgaKalpeDettesTab({
  dettes,
  onRefresh,
}: SurgaKalpeDettesTabProps) {
  const [filtreDirection, setFiltreDirection] = useState<'all' | 'a_recevoir' | 'a_payer'>('all')
  const [detteEnRemboursement, setDetteEnRemboursement] = useState<KalpeDetteLocal | null>(null)
  const [montantRemboursement, setMontantRemboursement] = useState('')

  const dettesFiltrees = dettes.filter((d) => {
    if (filtreDirection === 'a_recevoir' && d.direction !== 'a_recevoir') return false
    if (filtreDirection === 'a_payer' && d.direction !== 'a_payer') return false
    return true
  })

  const totalARecevoir = dettes
    .filter((d) => d.direction === 'a_recevoir' && d.statut !== 'solde')
    .reduce((acc, curr) => acc + curr.montant_restant, 0)

  const totalAPayer = dettes
    .filter((d) => d.direction === 'a_payer' && d.statut !== 'solde')
    .reduce((acc, curr) => acc + curr.montant_restant, 0)

  const handleValiderRemboursement = (e: React.FormEvent) => {
    e.preventDefault()
    if (!detteEnRemboursement) return
    const montantNum = parseFloat(montantRemboursement.replace(/\s+/g, ''))
    if (isNaN(montantNum) || montantNum <= 0) {
      alert('Montant invalide')
      return
    }

    rembourserKalpeDette(detteEnRemboursement.id, montantNum)

    // Optionnel : Enregistrer l'opération d'entrée ou de sortie correspondante
    if (detteEnRemboursement.direction === 'a_recevoir') {
      saveKalpeOperation({
        direction: 'entree',
        type: 'remboursement_recu',
        montant: montantNum,
        categorie: 'Remboursement dette',
        libelle: `Remboursement reçu de ${detteEnRemboursement.tiers_nom}`,
        mode_paiement: 'wave',
        date_operation: new Date().toISOString().slice(0, 10),
      })
    } else {
      saveKalpeOperation({
        direction: 'sortie',
        type: 'depense',
        montant: montantNum,
        categorie: 'Remboursement dette',
        libelle: `Remboursement payé à ${detteEnRemboursement.tiers_nom}`,
        mode_paiement: 'wave',
        date_operation: new Date().toISOString().slice(0, 10),
      })
    }

    setDetteEnRemboursement(null)
    setMontantRemboursement('')
    onRefresh()
  }

  const handleSupprimer = (id: string) => {
    if (confirm('Voulez-vous supprimer cette fiche de dette ?')) {
      deleteKalpeDette(id)
      onRefresh()
    }
  }

  return (
    <div>
      {/* Synthèse À recevoir vs À payer */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        <div
          style={{
            padding: '10px 12px',
            borderRadius: 8,
            backgroundColor: 'rgba(10,92,54,0.06)',
            border: '1px solid rgba(10,92,54,0.2)',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--price, #0A5C36)', textTransform: 'uppercase' }}>
            À recevoir (Créances)
          </div>
          <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--price, #0A5C36)', marginTop: 2 }}>
            {totalARecevoir.toLocaleString('fr-FR')} FCFA
          </div>
        </div>

        <div
          style={{
            padding: '10px 12px',
            borderRadius: 8,
            backgroundColor: 'rgba(199,91,0,0.06)',
            border: '1px solid rgba(199,91,0,0.2)',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent, #C75B00)', textTransform: 'uppercase' }}>
            À payer (Dettes)
          </div>
          <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--accent, #C75B00)', marginTop: 2 }}>
            {totalAPayer.toLocaleString('fr-FR')} FCFA
          </div>
        </div>
      </div>

      {/* Filtres de sélection */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {[
          { id: 'all', label: 'Toutes' },
          { id: 'a_recevoir', label: 'À recevoir' },
          { id: 'a_payer', label: 'À payer' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFiltreDirection(tab.id as any)}
            style={{
              flex: 1,
              padding: '6px 8px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: filtreDirection === tab.id ? 'var(--navy, #1C2B4A)' : 'var(--bg, #F8F5F0)',
              color: filtreDirection === tab.id ? '#FFFFFF' : 'var(--text2, #5A4E42)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Liste des dettes & créances */}
      {dettesFiltrees.length === 0 ? (
        <div
          style={{
            padding: '32px 16px',
            textAlign: 'center',
            borderRadius: 12,
            backgroundColor: 'var(--bg, #F8F5F0)',
            border: '1px dashed var(--border, #E8DDD2)',
          }}
        >
          <Users size={24} color="var(--text3, #73675E)" style={{ margin: '0 auto 8px auto' }} />
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2, #5A4E42)' }}>
            Aucune dette ni créance enregistrée
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {dettesFiltrees.map((dette) => {
            const isRecevoir = dette.direction === 'a_recevoir'
            const isSolde = dette.statut === 'solde'
            const pct = Math.round((dette.montant_paye / dette.montant_initial) * 100) || 0

            return (
              <div
                key={dette.id}
                style={{
                  padding: '12px',
                  borderRadius: 10,
                  backgroundColor: '#FFFFFF',
                  border: '1px solid var(--border, #E8DDD2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: 4,
                          backgroundColor: isRecevoir ? 'rgba(10,92,54,0.1)' : 'rgba(199,91,0,0.1)',
                          color: isRecevoir ? 'var(--price, #0A5C36)' : 'var(--accent, #C75B00)',
                          textTransform: 'uppercase',
                        }}
                      >
                        {isRecevoir ? 'À recevoir' : 'À payer'}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1, #1A1612)' }}>
                        {dette.tiers_nom}
                      </span>
                    </div>

                    {dette.tiers_telephone && (
                      <div style={{ fontSize: 11, color: 'var(--text3, #73675E)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <Phone size={10} />
                        <span>{dette.tiers_telephone}</span>
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
                      {dette.montant_restant.toLocaleString('fr-FR')} F
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3, #73675E)' }}>
                      sur {dette.montant_initial.toLocaleString('fr-FR')} F
                    </div>
                  </div>
                </div>

                {/* Barre de progression */}
                <div style={{ width: '100%', height: 5, borderRadius: 3, backgroundColor: 'var(--bg, #F8F5F0)', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${pct}%`,
                      backgroundColor: isSolde ? 'var(--price, #0A5C36)' : isRecevoir ? 'var(--price, #0A5C36)' : 'var(--accent, #C75B00)',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3, #73675E)' }}>
                  <span>{pct}% réglé</span>
                  {dette.date_echeance && <span>Échéance : {dette.date_echeance}</span>}
                </div>

                {/* Actions sur la dette */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                  {!isSolde && (
                    <button
                      type="button"
                      onClick={() => {
                        setDetteEnRemboursement(dette)
                        setMontantRemboursement(String(dette.montant_restant))
                      }}
                      style={{
                        padding: '5px 10px',
                        borderRadius: 6,
                        border: 'none',
                        backgroundColor: 'var(--navy, #1C2B4A)',
                        color: '#FFFFFF',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Rembourser
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleSupprimer(dette.id)}
                    aria-label="Supprimer la dette"
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

      {/* Modal de Remboursement */}
      {detteEnRemboursement && (
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
              Remboursement : {detteEnRemboursement.tiers_nom}
            </h4>
            <p style={{ fontSize: 13, color: 'var(--text2, #5A4E42)', margin: '0 0 14px 0' }}>
              Montant restant dû : <strong>{detteEnRemboursement.montant_restant.toLocaleString('fr-FR')} FCFA</strong>
            </p>

            <form onSubmit={handleValiderRemboursement} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                type="number"
                required
                value={montantRemboursement}
                onChange={(e) => setMontantRemboursement(e.target.value)}
                placeholder="Montant du règlement"
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
                  onClick={() => setDetteEnRemboursement(null)}
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
                    background: 'var(--price, #0A5C36)',
                    color: '#FFFFFF',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Valider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
