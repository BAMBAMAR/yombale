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

// Colonnes de surga_trafic_signalements : type_signalement et commentaire. L'écran lisait type_incident et
// description, absents de la table : la page plantait dès qu'un signalement existait.
export interface AdminSignalementItem {
  id: string
  axe_id?: string | null
  nom_axe?: string | null
  type_signalement?: string | null
  commentaire?: string | null
  statut: 'en_attente' | 'valide' | 'rejete'
  utilisateur_nom?: string | null
  utilisateur_tel?: string | null
  created_at: string
}

const LIBELLES_TYPE: Record<string, string> = {
  accident: 'Accident',
  bouchon: 'Bouchon',
  dense: 'Trafic dense',
  travaux: 'Travaux',
  panne: 'Panne',
  fluide: 'Fluide',
}

export function libelleType(type?: string | null): string {
  if (!type) return 'Non précisé'
  return LIBELLES_TYPE[type] || type.charAt(0).toUpperCase() + type.slice(1)
}

export function dateSignalement(iso?: string | null): string {
  const d = iso ? new Date(iso) : null
  if (!d || Number.isNaN(d.getTime())) return 'Date inconnue'
  return d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Dakar' })
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
      const data = await res.json().catch(() => null)
      if (res.ok && data?.success && Array.isArray(data.signalements)) {
        setSignalements(data.signalements)
      } else {
        // Une réponse en échec n'est pas une liste vide : on le dit, la liste précédente n'est pas présentée comme à jour.
        setSignalements([])
        setMessage({ type: 'erreur', texte: 'Les signalements n’ont pas pu être chargés.' })
      }
    } catch {
      setSignalements([])
      setMessage({ type: 'erreur', texte: 'Les signalements n’ont pas pu être chargés.' })
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
                        <span>{s.nom_axe || s.axe_id || 'Axe non précisé'}</span>
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
                          whiteSpace: 'nowrap',
                          backgroundColor:
                            s.type_signalement === 'accident'
                              ? 'rgba(239, 68, 68, 0.1)'
                              : s.type_signalement === 'bouchon' || s.type_signalement === 'dense'
                              ? 'rgba(199, 91, 0, 0.1)'
                              : 'rgba(28, 43, 74, 0.08)',
                          color:
                            s.type_signalement === 'accident'
                              ? '#DC2626'
                              : s.type_signalement === 'bouchon' || s.type_signalement === 'dense'
                              ? 'var(--accent, #C75B00)'
                              : 'var(--navy, #1C2B4A)',
                        }}
                      >
                        {libelleType(s.type_signalement)}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text2, #5A4E42)', maxWidth: 300, overflowWrap: 'anywhere' }}>
                      {s.commentaire || '—'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text3, #73675E)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={12} />
                        <span style={{ whiteSpace: 'nowrap' }}>{dateSignalement(s.created_at)}</span>
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
