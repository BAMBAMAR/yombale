'use client'

import React from 'react'

interface KalpeModalObjectifProps {
  showNewObjectifModal: boolean
  setShowNewObjectifModal: (v: boolean) => void
  nouvelObjTitre: string
  setNouvelObjTitre: (v: string) => void
  nouvelObjCible: string
  setNouvelObjCible: (v: string) => void
  handleCreerObjectif: (e: React.FormEvent) => void
}

export function KalpeModalObjectif({ showNewObjectifModal, setShowNewObjectifModal, nouvelObjTitre, setNouvelObjTitre, nouvelObjCible, setNouvelObjCible, handleCreerObjectif }: KalpeModalObjectifProps) {
  return (
    <>
      {showNewObjectifModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(10, 20, 35, 0.6)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setShowNewObjectifModal(false)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '24px',
              width: '100%',
              maxWidth: '420px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1C2B4A', margin: '0 0 12px 0' }}>
              Nouvel Objectif d'Épargne
            </h3>
            <form onSubmit={handleCreerObjectif} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#1C2B4A', display: 'block', marginBottom: '4px' }}>
                  Nom du projet / de la cagnotte *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Tabaski, Achat Scooter, Réserve urgence"
                  value={nouvelObjTitre}
                  onChange={(e) => setNouvelObjTitre(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1.5px solid #E8DDD2',
                    borderRadius: '8px',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#1C2B4A', display: 'block', marginBottom: '4px' }}>
                  Montant visé (FCFA) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="Ex: 250000"
                  value={nouvelObjCible}
                  onChange={(e) => setNouvelObjCible(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1.5px solid #E8DDD2',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 800,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowNewObjectifModal(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #E8DDD2',
                    background: '#F8F5F0',
                    fontSize: '13px',
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
                    padding: '10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#C75B00',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Créer l'objectif
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
