'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Navigation,
  CheckCircle2,
  XCircle,
  Trash2,
  Clock,
  AlertTriangle,
  RefreshCw,
  MapPin,
} from 'lucide-react'

export interface AdminSignalementItem {
  id: string
  axe_id?: string
  nom_axe?: string
  localisation?: string
  type_incident: string
  description?: string
  statut: 'en_attente' | 'valide' | 'rejete'
  utilisateur_nom?: string
  utilisateur_tel?: string
  created_at: string
}

export default function AdminTraficTab() {
  const [signalements, setSignalements] = useState<AdminSignalementItem[]>([])
  const [chargement, setChargement] = useState<boolean>(true)
  const [filtreStatut, setFiltreStatut] = useState<string>('en_attente')
  const [message, setMessage] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null)

  const chargerSignalements = useCallback(async () => {
    setChargement(true)
    try {
      const res = await fetch(`/api/admin/surga/signalements?statut=${filtreStatut}`)
      const data = await res.json()
      if (data.success && Array.isArray(data.signalements)) {
        setSignalements(data.signalements)
      }
    } catch {
      setMessage({ type: 'erreur', texte: 'Impossible de charger les signalements' })
    } finally {
      setChargement(false)
    }
  }, [filtreStatut])

  useEffect(() => {
    chargerSignalements()
  }, [chargerSignalements])

  const handleChangerStatut = async (id: string, statut: 'valide' | 'rejete') => {
    try {
      const res = await fetch(`/api/admin/surga/signalements/${id}/statut`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut }),
      })
      const data = await res.json()
      if (data.success) {
        chargerSignalements()
        setMessage({
          type: 'succes',
          texte: statut === 'valide' ? 'Signalement validé et diffusé aux conducteurs' : 'Signalement rejeté',
        })
      }
    } catch {}
  }

  const handleSupprimer = async (id: string) => {
    if (!window.confirm('Supprimer définitivement ce signalement ?')) return
    try {
      const res = await fetch(`/api/admin/surga/signalements/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        chargerSignalements()
        setMessage({ type: 'succes', texte: 'Signalement supprimé' })
      }
    } catch {}
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Barre d'en-tête et filtres */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          backgroundColor: '#FFFFFF',
          padding: '14px 16px',
          borderRadius: 12,
          border: '1px solid var(--border, #E8DDD2)',
        }}
      >
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
            Modération des Signalements Trafic en Temps Réel
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text3, #73675E)', margin: '2px 0 0 0' }}>
            Validation des alertes bouchons, accidents et ralentissements rapportés par les citoyens
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => setFiltreStatut('en_attente')}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: filtreStatut === 'en_attente' ? 'var(--navy, #1C2B4A)' : 'var(--bg, #F8F5F0)',
              color: filtreStatut === 'en_attente' ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            En attente
          </button>
          <button
            type="button"
            onClick={() => setFiltreStatut('valide')}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: filtreStatut === 'valide' ? 'var(--price, #0A5C36)' : 'var(--bg, #F8F5F0)',
              color: filtreStatut === 'valide' ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Validés
          </button>
          <button
            type="button"
            onClick={() => setFiltreStatut('rejete')}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: filtreStatut === 'rejete' ? '#DC2626' : 'var(--bg, #F8F5F0)',
              color: filtreStatut === 'rejete' ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Rejetés
          </button>
        </div>
      </div>

      {/* Message notification */}
      {message && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            fontSize: 13,
            backgroundColor: message.type === 'succes' ? 'rgba(10, 92, 54, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: message.type === 'succes' ? 'var(--price, #0A5C36)' : '#DC2626',
            border: `1px solid ${message.type === 'succes' ? 'rgba(10, 92, 54, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
          }}
        >
          {message.texte}
        </div>
      )}

      {/* Liste des signalements */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
          border: '1px solid var(--border, #E8DDD2)',
          overflow: 'hidden',
        }}
      >
        {chargement ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3, #73675E)' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px auto', display: 'block' }} />
            Chargement des signalements...
          </div>
        ) : signalements.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3, #73675E)', fontSize: 13 }}>
            Aucun signalement dans cet état.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg, #F8F5F0)', borderBottom: '1px solid var(--border, #E8DDD2)' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>Axe / Localisation</th>
                  <th style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>Incident</th>
                  <th style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>Description</th>
                  <th style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>Date / Heure</th>
                  <th style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--navy, #1C2B4A)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {signalements.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--border, #E8DDD2)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
                        <MapPin size={13} color="var(--accent, #C75B00)" />
                        <span>{s.nom_axe || s.localisation || 'Dakar'}</span>
                      </div>
                      {s.utilisateur_tel && (
                        <div style={{ fontSize: 11, color: 'var(--text3, #73675E)' }}>
                          Par : {s.utilisateur_nom || s.utilisateur_tel}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: 6,
                          backgroundColor:
                            s.type_incident === 'accident'
                              ? 'rgba(239, 68, 68, 0.1)'
                              : s.type_incident === 'bouchon'
                              ? 'rgba(199, 91, 0, 0.1)'
                              : 'rgba(28, 43, 74, 0.08)',
                          color:
                            s.type_incident === 'accident'
                              ? '#DC2626'
                              : s.type_incident === 'bouchon'
                              ? 'var(--accent, #C75B00)'
                              : 'var(--navy, #1C2B4A)',
                        }}
                      >
                        {s.type_incident.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text2, #5A4E42)', maxWidth: 300 }}>
                      {s.description || '—'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text3, #73675E)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={12} />
                        <span>{new Date(s.created_at).toLocaleTimeString('fr-SN', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                        {s.statut !== 'valide' && (
                          <button
                            type="button"
                            onClick={() => handleChangerStatut(s.id, 'valide')}
                            style={{
                              backgroundColor: 'rgba(10, 92, 54, 0.1)',
                              border: '1px solid rgba(10, 92, 54, 0.2)',
                              color: 'var(--price, #0A5C36)',
                              borderRadius: 6,
                              padding: '4px 8px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          >
                            <CheckCircle2 size={12} />
                            <span>Valider</span>
                          </button>
                        )}
                        {s.statut !== 'rejete' && (
                          <button
                            type="button"
                            onClick={() => handleChangerStatut(s.id, 'rejete')}
                            style={{
                              backgroundColor: 'rgba(239, 68, 68, 0.08)',
                              border: '1px solid rgba(239, 68, 68, 0.2)',
                              color: '#DC2626',
                              borderRadius: 6,
                              padding: '4px 8px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          >
                            <XCircle size={12} />
                            <span>Rejeter</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleSupprimer(s.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text3, #73675E)',
                            padding: 4,
                            cursor: 'pointer',
                          }}
                          title="Supprimer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
