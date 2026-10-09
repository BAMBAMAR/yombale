'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Calendar,
  Bell,
  Plus,
  CheckCircle2,
} from 'lucide-react'
import {
  type SurgaEvenement,
  type SurgaEvenementPriorite,
  type SurgaEvenementCategorie,
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
import SurgaAgendaForm, { type DonneesRappel } from './SurgaAgendaForm'
import SurgaAgendaCard from './SurgaAgendaCard'
import SurgaAgendaWeekStrip from './SurgaAgendaWeekStrip'
import SurgaAgendaStats from './SurgaAgendaStats'

type FiltreVue = 'aujourdhui' | 'semaine' | 'a_venir' | 'retard' | 'termines' | 'tous'

export default function SurgaAgendaView() {
  const [evenements, setEvenements] = useState<SurgaEvenement[]>([])
  const [filtre, setFiltre] = useState<FiltreVue>('aujourdhui')
  const [dateSelectionnee, setDateSelectionnee] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  )
  const [isAdding, setIsAdding] = useState<boolean>(false)
  const [enEdition, setEnEdition] = useState<SurgaEvenement | null>(null)
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
  const now = new Date()

  // Calcul des statistiques
  const stats = useMemo(() => {
    const aujourdhui = evenements.filter((e) => e.date_evenement === todayStr && !e.termine).length
    const termines = evenements.filter((e) => e.termine).length
    const enRetard = evenements.filter((e) => {
      if (e.termine) return false
      if (e.date_evenement < todayStr) return true
      if (e.date_evenement === todayStr && e.heure_evenement) {
        const [h, m] = e.heure_evenement.split(':').map(Number)
        const d = new Date()
        d.setHours(h, m, 0, 0)
        return now > d
      }
      return false
    }).length
    return { aujourdhui, termines, enRetard, total: evenements.length }
  }, [evenements, todayStr, now])

  // Filtrage des événements
  const evenementsFiltres = useMemo(() => {
    return evenements
      .filter((e) => {
        if (filtre === 'aujourdhui') return e.date_evenement === todayStr
        if (filtre === 'semaine') {
          // 7 jours à partir du lundi de la semaine
          const d = new Date(todayStr)
          const diffToMonday = (d.getDay() + 6) % 7
          const lundi = new Date(d)
          lundi.setDate(d.getDate() - diffToMonday)
          const dimanche = new Date(lundi)
          dimanche.setDate(lundi.getDate() + 6)
          const lundiIso = lundi.toISOString().slice(0, 10)
          const dimancheIso = dimanche.toISOString().slice(0, 10)
          return e.date_evenement >= lundiIso && e.date_evenement <= dimancheIso
        }
        if (filtre === 'a_venir') return e.date_evenement >= todayStr && !e.termine
        if (filtre === 'retard') {
          if (e.termine) return false
          if (e.date_evenement < todayStr) return true
          if (e.date_evenement === todayStr && e.heure_evenement) {
            const [h, m] = e.heure_evenement.split(':').map(Number)
            const d = new Date()
            d.setHours(h, m, 0, 0)
            return now > d
          }
          return false
        }
        if (filtre === 'termines') return e.termine
        return true
      })
      .sort((a, b) => {
        // En premier les non terminés, puis par date et heure
        if (Boolean(a.termine) !== Boolean(b.termine)) {
          return a.termine ? 1 : -1
        }
        const keyA = `${a.date_evenement} ${a.heure_evenement || '99:99'}`
        const keyB = `${b.date_evenement} ${b.heure_evenement || '99:99'}`
        return keyA.localeCompare(keyB)
      })
  }, [evenements, filtre, todayStr, now])

  // Crée un rappel, ou enregistre les changements de celui qui est ouvert (SRG-A2-017). Un rappel modifié est de
  // nouveau à annoncer : son heure a pu changer.
  const handleAjouter = async (data: DonneesRappel) => {
    saveLocalEvenement(enEdition ? { ...enEdition, ...data, notification_envoyee: false } : data)
    setNotification(enEdition ? 'Rappel modifié' : 'Rappel programmé avec succès')
    setIsAdding(false)
    setEnEdition(null)
    chargerDonnees()

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

  const handleReporter = async (id: string, nouvelleDate: string, nouvelleHeure?: string) => {
    const target = evenements.find((e) => e.id === id)
    if (!target) return

    saveLocalEvenement({
      ...target,
      date_evenement: nouvelleDate,
      heure_evenement: nouvelleHeure || target.heure_evenement,
      termine: false,
      notification_envoyee: false,
    })
    chargerDonnees()
    setNotification(`Rappel reporté au ${nouvelleDate}${nouvelleHeure ? ' à ' + nouvelleHeure : ''}`)
    setTimeout(() => setNotification(null), 3000)
    await synchroniserSurga()
  }

  const handleSelectionnerDateFrise = (dateStr: string) => {
    setDateSelectionnee(dateStr)
    if (dateStr === todayStr) {
      setFiltre('aujourdhui')
    } else {
      setFiltre('semaine')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Alerte si notifications non activées */}
      {notifPermission !== 'granted' && notifPermission !== 'unsupported' && (
        <div
          style={{
            backgroundColor: 'rgba(199, 91, 0, 0.08)',
            border: '1px solid var(--accent, #C75B00)',
            borderRadius: 12,
            padding: '10px 14px',
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
            style={{
              backgroundColor: 'var(--surga-accent-hover, #B45309)', // texte blanc : 5,0:1 (l'ambre du micro ne donne que 3,2:1)
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 8,
              padding: '6px 12px',
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

      {/* Bandeau de synthèse statistique */}
      <SurgaAgendaStats
        aujourdhui={stats.aujourdhui}
        enRetard={stats.enRetard}
        termines={stats.termines}
      />

      {/* Mini-Frise Hebdomadaire Visuelle */}
      <SurgaAgendaWeekStrip
        dateSelectionnee={dateSelectionnee}
        onSelectionnerDate={handleSelectionnerDateFrise}
        evenements={evenements}
      />

      {/* Filtres et Bouton d'ajout */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div
          className="surga-scroll-tabs"
          style={{
            display: 'flex',
            gap: 6,
            // minWidth 0 : sans lui la rangée garde sa largeur de contenu et passe sous le bouton « Nouveau ».
            flex: '1 1 0',
            minWidth: 0,
            // Les filtres passent à la ligne au lieu de défiler sous le bouton « Nouveau » : tous restent visibles.
            flexWrap: 'wrap',
          }}
        >
          {(
            [
              { key: 'aujourdhui' as const, label: 'Aujourd’hui' },
              { key: 'semaine' as const, label: 'Cette semaine' },
              { key: 'a_venir' as const, label: 'À venir' },
              ...(stats.enRetard > 0 ? [{ key: 'retard' as const, label: `En retard (${stats.enRetard})` }] : []),
              { key: 'termines' as const, label: 'Terminés' },
              { key: 'tous' as const, label: 'Tous' },
            ] as Array<{ key: FiltreVue; label: string }>
          ).map((tab) => {
            const estActif = filtre === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFiltre(tab.key)}
                style={{
                  padding: '7px 12px',
                  flexShrink: 0,
                  borderRadius: 20,
                  border: '1px solid',
                  borderColor: estActif
                    ? tab.key === 'retard'
                      ? '#DC2626'
                      : 'var(--navy, #1C2B4A)'
                    : 'var(--border, #E8DDD2)',
                  backgroundColor: estActif
                    ? tab.key === 'retard'
                      ? '#DC2626'
                      : 'var(--navy, #1C2B4A)'
                    : '#FFFFFF',
                  color: estActif
                    ? '#FFFFFF'
                    : tab.key === 'retard'
                    ? '#DC2626'
                    : 'var(--navy, #1C2B4A)',
                  fontSize: 12,
                  fontWeight: estActif ? 700 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={() => setIsAdding(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            backgroundColor: 'var(--navy, #1C2B4A)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 10,
            padding: '8px 12px',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            flexShrink: 0,
            boxShadow: '0 2px 6px rgba(28, 43, 74, 0.15)',
          }}
        >
          <Plus size={15} />
          <span>Nouveau</span>
        </button>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          style={{
            padding: '8px 12px',
            backgroundColor: '#DCFCE7',
            color: 'var(--price, #0A5C36)',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <CheckCircle2 size={15} />
          <span>{notification}</span>
        </div>
      )}

      {/* Formulaire d'ajout rapide */}
      {(isAdding || enEdition) && (
        <SurgaAgendaForm
          key={enEdition?.id || 'nouveau'}
          initial={enEdition ? { ...enEdition, priorite: enEdition.priorite || 'normale', categorie: enEdition.categorie || 'rdv' } : undefined}
          onClose={() => { setIsAdding(false); setEnEdition(null) }}
          onSubmit={handleAjouter}
        />
      )}

      {/* Liste des rappels */}
      {evenementsFiltres.length === 0 ? (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            padding: 32,
            textAlign: 'center',
            border: '1px dashed var(--border, #E8DDD2)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              backgroundColor: '#F8F5F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text3, #73675E)',
            }}
          >
            <Calendar size={20} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
              Aucun rappel pour cette période
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3, #73675E)', marginTop: 4 }}>
              Vous n’avez aucun rendez-vous ou événement prévu pour ce filtre.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            style={{
              marginTop: 6,
              padding: '7px 14px',
              borderRadius: 8,
              border: '1px solid var(--navy, #1C2B4A)',
              backgroundColor: 'transparent',
              color: 'var(--navy, #1C2B4A)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            + Programmer un rappel
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {evenementsFiltres.map((evt) => (
            <SurgaAgendaCard
              key={evt.id}
              evenement={evt}
              onToggle={handleToggle}
              onSupprimer={handleSupprimer}
              onReporter={handleReporter}
              onModifier={(evt) => { setIsAdding(false); setEnEdition(evt) }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
