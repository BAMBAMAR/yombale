'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Calendar,
  Clock,
  Bell,
  Plus,
  Trash2,
  CheckCircle2,
  Repeat,
  AlertCircle,
  Check,
} from 'lucide-react'
import {
  type SurgaEvenement,
  getLocalAgenda,
  saveLocalEvenement,
  toggleLocalEvenement,
  deleteLocalEvenement,
  synchroniserSurga,
} from '@/lib/surga-offline-sync'
import {
  demanderPermissionNotification,
  demarrerSurveillanceRappels,
} from '@/lib/surga-reminders'
import SurgaAgendaForm from './SurgaAgendaForm'

type FiltreVue = 'aujourdhui' | 'a_venir' | 'tous'

export default function SurgaAgendaView() {
  const [evenements, setEvenements] = useState<SurgaEvenement[]>([])
  const [filtre, setFiltre] = useState<FiltreVue>('aujourdhui')
  const [isAdding, setIsAdding] = useState<boolean>(false)
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>('default')
  const [notification, setNotification] = useState<string | null>(null)

  const chargerDonnees = () => {
    const list = getLocalAgenda()
    setEvenements(list)
  }

  useEffect(() => {
    chargerDonnees()
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifPermission(Notification.permission)
    } else {
      setNotifPermission('unsupported')
    }

    const arreterSurveillance = demarrerSurveillanceRappels()

    synchroniserSurga().then((synced) => {
      if (synced) chargerDonnees()
    })

    return () => {
      arreterSurveillance()
    }
  }, [])

  const handleActiverNotifications = async () => {
    const accorde = await demanderPermissionNotification()
    if (accorde) {
      setNotifPermission('granted')
      setNotification('Notifications de rappel activées')
      setTimeout(() => setNotification(null), 3000)
    }
  }

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const evenementsFiltres = useMemo(() => {
    return evenements
      .filter((e) => {
        if (filtre === 'aujourdhui') return e.date_evenement === todayStr
        if (filtre === 'a_venir') return e.date_evenement >= todayStr && !e.termine
        return true
      })
      .sort((a, b) => {
        const keyA = `${a.date_evenement} ${a.heure_evenement || '99:99'}`
        const keyB = `${b.date_evenement} ${b.heure_evenement || '99:99'}`
        return keyA.localeCompare(keyB)
      })
  }, [evenements, filtre, todayStr])

  const handleAjouter = async (data: {
    titre: string
    description?: string
    date_evenement: string
    heure_evenement?: string
    est_rappel: boolean
    repetition: 'AUCUNE' | 'QUOTIDIEN' | 'HEBDOMADAIRE' | 'MENSUEL'
  }) => {
    saveLocalEvenement(data)
    setIsAdding(false)
    chargerDonnees()

    setNotification('Rappel programmé avec succès')
    setTimeout(() => setNotification(null), 3000)

    await synchroniserSurga()
    chargerDonnees()
  }

  const handleToggle = async (id: string) => {
    toggleLocalEvenement(id)
    chargerDonnees()
    if (navigator.onLine) {
      try {
        await fetch(`/api/surga/agenda/${id}/toggle`, { method: 'PATCH' })
      } catch {}
    }
  }

  const handleSupprimer = async (id: string) => {
    if (confirm('Voulez-vous supprimer ce rappel ?')) {
      deleteLocalEvenement(id)
      chargerDonnees()
      if (navigator.onLine) {
        try {
          await fetch(`/api/surga/agenda/${id}`, { method: 'DELETE' })
        } catch {}
      }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Alerte si notifications non activées */}
      {notifPermission !== 'granted' && notifPermission !== 'unsupported' && (
        <div
          style={{
            backgroundColor: 'rgba(199, 91, 0, 0.08)',
            border: '1px solid var(--accent, #C75B00)',
            borderRadius: 12,
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bell size={18} color="var(--accent, #C75B00)" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: 'var(--navy, #1C2B4A)', fontWeight: 600 }}>
              Activez les alertes pour être notifié à l’heure de vos rappels.
            </span>
          </div>
          <button
            type="button"
            onClick={handleActiverNotifications}
            className="btn-npl"
            style={{
              backgroundColor: 'var(--accent, #C75B00)',
              color: '#FFFFFF',
              border: 'none',
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            Activer
          </button>
        </div>
      )}

      {/* Barre d'onglets de filtre & bouton d'ajout */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', backgroundColor: '#FFFFFF', borderRadius: 8, padding: 3, border: '1px solid var(--border, #E8DDD2)' }}>
          {(['aujourdhui', 'a_venir', 'tous'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFiltre(tab)}
              style={{
                border: 'none',
                backgroundColor: filtre === tab ? 'var(--navy, #1C2B4A)' : 'transparent',
                color: filtre === tab ? '#FFFFFF' : 'var(--text2, #5A4E42)',
                padding: '6px 10px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: filtre === tab ? 700 : 500,
                cursor: 'pointer',
              }}
            >
              {tab === 'aujourdhui' ? "Aujourd'hui" : tab === 'a_venir' ? 'À venir' : 'Tous'}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="btn-npl"
          style={{
            backgroundColor: 'var(--navy, #1C2B4A)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Plus size={16} />
          <span>Nouveau</span>
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
        <SurgaAgendaForm
          onClose={() => setIsAdding(false)}
          onSubmit={handleAjouter}
        />
      )}

      {/* Liste des rappels */}
      {evenementsFiltres.length === 0 ? (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            padding: 30,
            textAlign: 'center',
            border: '1px solid var(--border, #E8DDD2)',
          }}
        >
          <Calendar size={32} color="var(--text3, #73675E)" style={{ margin: '0 auto 10px auto' }} />
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
            Aucun rappel prévu
          </div>
          <div style={{ fontSize: 13, color: 'var(--text2, #5A4E42)', marginTop: 4 }}>
            Appuyez sur "Nouveau" pour planifier un rendez-vous ou une tâche.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {evenementsFiltres.map((item) => (
            <div
              key={item.id}
              className="surga-item-row"
              style={{
                width: '100%',
                opacity: item.termine ? 0.65 : 1,
                borderLeft: item.est_rappel ? '3px solid var(--accent, #C75B00)' : '3px solid var(--navy, #1C2B4A)',
              }}
            >
              {/* Bouton checkbox rond pour marquer comme terminé */}
              <button
                type="button"
                onClick={() => handleToggle(item.id)}
                aria-label={item.termine ? 'Marquer comme non terminé' : 'Marquer comme terminé'}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  border: item.termine ? 'none' : '2px solid var(--border, #E8DDD2)',
                  backgroundColor: item.termine ? 'var(--price, #0A5C36)' : '#FFFFFF',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                {item.termine && <Check size={16} strokeWidth={3} />}
              </button>

              <div className="surga-item-content">
                <div
                  className="surga-item-line1"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    textDecoration: item.termine ? 'line-through' : 'none',
                    fontWeight: 700,
                  }}
                >
                  <span>{item.titre}</span>
                  {item.heure_evenement && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        backgroundColor: 'rgba(28,43,74,0.08)',
                        color: 'var(--navy, #1C2B4A)',
                        padding: '2px 6px',
                        borderRadius: 4,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                      }}
                    >
                      <Clock size={10} />
                      <span>{item.heure_evenement}</span>
                    </span>
                  )}
                </div>

                <div className="surga-item-line2">
                  <span>{item.date_evenement === todayStr ? "Aujourd'hui" : item.date_evenement}</span>
                  {item.repetition && item.repetition !== 'AUCUNE' && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: 'var(--accent, #C75B00)' }}>
                      • <Repeat size={10} />
                      <span>{item.repetition === 'QUOTIDIEN' ? 'Quotidien' : 'Hebdo'}</span>
                    </span>
                  )}
                  {item.description && (
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      • {item.description}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSupprimer(item.id)}
                aria-label="Supprimer le rappel"
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
    </div>
  )
}
