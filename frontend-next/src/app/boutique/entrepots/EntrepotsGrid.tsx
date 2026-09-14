'use client'

import React from 'react'
import { Warehouse, MapPin, Star, User, Phone, Edit } from 'lucide-react'
import type { Entrepot } from '../GestionEntrepots'

interface EntrepotsGridProps {
  loading: boolean
  entrepots: Entrepot[]
  ouvrirCreation: () => void
  ouvrirEdition: (e: Entrepot) => void
}

export default function EntrepotsGrid({
  loading,
  entrepots,
  ouvrirCreation,
  ouvrirEdition,
}: EntrepotsGridProps) {
  return (
    <div>
      <h4
        style={{
          margin: '0 0 12px',
          fontSize: 14,
          fontWeight: 800,
          color: 'var(--navy, #1C2B4A)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Warehouse size={16} style={{ color: 'var(--accent, #C75B00)' }} />
        <span>Sites Physiques &amp; Dépôts Enregistrés</span>
      </h4>

      {loading ? (
        <div style={{ color: '#64748b', fontSize: 13, padding: 16 }}>
          Chargement des entrepôts...
        </div>
      ) : entrepots.length === 0 ? (
        <div
          style={{
            background: '#ffffff',
            border: '1px dashed var(--border, #E8DDD2)',
            borderRadius: 14,
            padding: 32,
            textAlign: 'center',
          }}
        >
          <Warehouse size={36} style={{ color: '#94a3b8', margin: '0 auto 10px' }} />
          <p style={{ margin: 0, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
            Aucun dépôt physique configuré
          </p>
          <p style={{ margin: '4px 0 16px', fontSize: 13, color: '#64748b' }}>
            Créez votre premier entrepôt (ex: Boutique Principale Sandaga) pour isoler les stocks.
          </p>
          <button
            type="button"
            onClick={ouvrirCreation}
            style={{
              padding: '8px 16px',
              background: 'var(--accent, #C75B00)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            + Ajouter un dépôt
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 14,
          }}
        >
          {entrepots.map((e) => (
            <div
              key={e.id}
              style={{
                background: '#ffffff',
                border: `1.5px solid ${
                  e.est_defaut ? 'var(--accent, #C75B00)' : 'var(--border, #E8DDD2)'
                }`,
                borderRadius: 14,
                padding: 18,
                position: 'relative',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 8,
                }}
              >
                <div>
                  <h4
                    style={{
                      margin: 0,
                      fontSize: 15,
                      fontWeight: 800,
                      color: 'var(--navy, #1C2B4A)',
                    }}
                  >
                    {e.nom}
                  </h4>
                  <span
                    style={{
                      fontSize: 12,
                      color: 'var(--text2, #6B5E52)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      marginTop: 3,
                    }}
                  >
                    <MapPin size={13} style={{ color: 'var(--accent, #C75B00)' }} /> {e.ville}{' '}
                    {e.adresse ? `· ${e.adresse}` : ''}
                  </span>
                </div>
                {e.est_defaut && (
                  <span
                    style={{
                      background: 'var(--orange2, #FFF3E8)',
                      color: 'var(--accent, #C75B00)',
                      padding: '3px 8px',
                      borderRadius: 12,
                      fontSize: 10.5,
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Star size={11} /> Principal
                  </span>
                )}
              </div>

              <div
                style={{
                  borderTop: '1px solid #f1f5f9',
                  paddingTop: 10,
                  marginTop: 10,
                  fontSize: 12,
                  color: '#475569',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                {e.responsable && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <User size={13} /> {e.responsable}
                  </span>
                )}
                {e.telephone && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Phone size={13} /> {e.telephone}
                  </span>
                )}
              </div>

              <div
                style={{
                  marginTop: 12,
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 6,
                }}
              >
                <button
                  type="button"
                  onClick={() => ouvrirEdition(e)}
                  style={{
                    padding: '5px 10px',
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: 6,
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: '#334155',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Edit size={12} /> Modifier
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
