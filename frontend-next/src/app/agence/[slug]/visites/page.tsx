'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  Calendar,
  Plus,
  Clock,
  MapPin,
  User,
  Phone,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MessageCircle
} from 'lucide-react'
import SectionDemandesVisite from './components/SectionDemandesVisite'
import ModalConfirmerVisite from './components/ModalConfirmerVisite'
import { ModalProgrammerVisite, OptionItem } from './components/ModalProgrammerVisite'
import { getImmoAuthHeaders } from '@/lib/immo-auth'

interface Visite {
  id: string
  date_visite: string
  duree_min: number
  lieu_rdv?: string
  statut: string
  resultat?: string
  bien_titre: string
  bien_quartier?: string
  bien_ville: string
  contact_nom: string
  contact_prenom?: string
  contact_tel?: string
  agent_nom?: string
}

export default function VisitesPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [visites, setVisites] = useState<Visite[]>([])
  const [loading, setLoading] = useState(true)
  const [filterDate, setFilterDate] = useState('tous')
  const [showModal, setShowModal] = useState(false)
  const [ongletActif, setOngletActif] = useState<'agenda' | 'demandes'>('agenda')
  const [visiteAConfirmer, setVisiteAConfirmer] = useState<any | null>(null)

  // Options pour le formulaire
  const [biensOptions, setBiensOptions] = useState<OptionItem[]>([])
  const [contactsOptions, setContactsOptions] = useState<OptionItem[]>([])

  async function chargerVisites() {
    try {
      setLoading(true)
      let url = `/api/crm-immo/agence/${slug}/visites`
      if (filterDate !== 'tous') url += `?date=${filterDate}`
      const res = await fetch(url, { headers: getImmoAuthHeaders() })
      const data = await res.json()
      if (data.success) {
        setVisites(data.visites || [])
      }
    } catch (err) {
      console.error('[LOAD_VISITES_ERR]', err)
    } finally {
      setLoading(false)
    }
  }

  async function chargerOptions() {
    try {
      const [resBiens, resContacts] = await Promise.all([
        fetch(`/api/biens/agence/${slug}?statut=actif`, { headers: getImmoAuthHeaders() }),
        fetch(`/api/crm-immo/agence/${slug}/contacts`, { headers: getImmoAuthHeaders() }),
      ])
      const dataBiens = await resBiens.json()
      const dataContacts = await resContacts.json()
      if (dataBiens.success) setBiensOptions(dataBiens.biens || [])
      if (dataContacts.success) setContactsOptions(dataContacts.contacts || [])
    } catch (err) {
      console.error('[LOAD_OPTIONS_ERR]', err)
    }
  }

  useEffect(() => {
    if (slug) {
      chargerVisites()
      chargerOptions()
    }
  }, [slug, filterDate])



  async function updateStatut(visiteId: string, statut: string) {
    try {
      await fetch(`/api/crm-immo/agence/${slug}/visites/${visiteId}`, {
        method: 'PUT',
        headers: getImmoAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ statut }),
      })
      chargerVisites()
    } catch (err) {
      console.error('[UPDATE_VISITE_ERR]', err)
    }
  }

  return (
    <div>
      {/* ── En-tête ── */}
      <div className="agence-header">
        <div>
          <h1 className="agence-title">Agenda des Visites</h1>
          <p className="agence-subtitle">Planifiez et suivez les visites des biens avec vos prospects.</p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="btn-npl"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 8,
            background: 'var(--accent, #C75B00)',
            color: '#FFFFFF',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <Plus size={18} />
          Programmer une visite
        </button>
      </div>

      {/* ── Onglets Principaux ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => setOngletActif('agenda')}
          style={{
            padding: '9px 16px',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 13.5,
            cursor: 'pointer',
            border: '1px solid var(--border, #E8DDD2)',
            background: ongletActif === 'agenda' ? 'var(--navy, #1C2B4A)' : '#FFFFFF',
            color: ongletActif === 'agenda' ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Calendar size={15} />
          <span>Agenda des Visites ({visites.filter(v => v.statut !== 'demande').length})</span>
        </button>

        <button
          type="button"
          onClick={() => setOngletActif('demandes')}
          style={{
            padding: '9px 16px',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 13.5,
            cursor: 'pointer',
            border: '1px solid var(--border, #E8DDD2)',
            background: ongletActif === 'demandes' ? 'var(--accent, #C75B00)' : '#FFFFFF',
            color: ongletActif === 'demandes' ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Clock size={15} />
          <span>Demandes reçues en attente</span>
          {visites.filter(v => v.statut === 'demande').length > 0 && (
            <span
              style={{
                background: ongletActif === 'demandes' ? '#FFFFFF' : 'var(--accent, #C75B00)',
                color: ongletActif === 'demandes' ? 'var(--accent, #C75B00)' : '#FFFFFF',
                fontSize: 11,
                fontWeight: 900,
                padding: '2px 7px',
                borderRadius: 10,
              }}
            >
              {visites.filter(v => v.statut === 'demande').length}
            </span>
          )}
        </button>
      </div>

      {ongletActif === 'demandes' ? (
        <SectionDemandesVisite
          demandes={visites.filter(v => v.statut === 'demande') as any}
          onConfirmer={v => setVisiteAConfirmer(v)}
          onDecliner={id => updateStatut(id, 'annulee')}
        />
      ) : (
        <>
          {/* ── Filtres ── */}
          <div className="agence-card" style={{ padding: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => setFilterDate('tous')}
          style={{
            padding: '6px 14px',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            border: '1px solid var(--border, #E8DDD2)',
            background: filterDate === 'tous' ? 'var(--navy, #1C2B4A)' : '#FFFFFF',
            color: filterDate === 'tous' ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
          }}
        >
          Toutes
        </button>
        <button
          type="button"
          onClick={() => setFilterDate('aujourdhui')}
          style={{
            padding: '6px 14px',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            border: '1px solid var(--border, #E8DDD2)',
            background: filterDate === 'aujourdhui' ? 'var(--navy, #1C2B4A)' : '#FFFFFF',
            color: filterDate === 'aujourdhui' ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
          }}
        >
          Aujourd'hui
        </button>
        <button
          type="button"
          onClick={() => setFilterDate('a_venir')}
          style={{
            padding: '6px 14px',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            border: '1px solid var(--border, #E8DDD2)',
            background: filterDate === 'a_venir' ? 'var(--navy, #1C2B4A)' : '#FFFFFF',
            color: filterDate === 'a_venir' ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
          }}
        >
          À venir
        </button>
      </div>

      {/* ── Liste des Visites ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B' }}>
          <p>Chargement des visites...</p>
        </div>
      ) : visites.length === 0 ? (
        <div className="agence-card" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
          <Calendar size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <p style={{ fontWeight: 700, color: 'var(--navy, #1C2B4A)', fontSize: 16 }}>Aucune visite trouvée</p>
          <p style={{ fontSize: 13.5 }}>Programmez votre premier rendez-vous de visite avec un prospect.</p>
        </div>
      ) : (
        <div className="agence-table-wrapper">
          <table className="agence-table">
            <thead>
              <tr>
                <th>Date & Heure</th>
                <th>Bien Immobilier</th>
                <th>Prospect</th>
                <th>Statut</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {visites.map(v => {
                const d = new Date(v.date_visite)
                const dateFormatee = d.toLocaleDateString('fr-FR', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })
                return (
                  <tr key={v.id}>
                    <td>
                      <div style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Clock size={14} color="#64748B" />
                        {dateFormatee}
                      </div>
                      <div style={{ fontSize: 11.5, color: '#64748B' }}>Durée : {v.duree_min} min</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>{v.bien_titre}</div>
                      <div style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={12} />
                        {v.bien_quartier ? `${v.bien_quartier}, ${v.bien_ville}` : v.bien_ville}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700 }}>
                        {v.contact_nom} {v.contact_prenom || ''}
                      </div>
                      {v.contact_tel && (
                        <div style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Phone size={11} />
                          {v.contact_tel}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge ${v.statut}`}>
                        {v.statut === 'confirmee' ? 'Confirmée' : v.statut === 'realisee' ? 'Réalisée' : v.statut}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6 }}>
                        {v.contact_tel && (
                          <a
                            href={`https://wa.me/${(v.contact_tel || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Bonjour ${v.contact_nom}, nous vous confirmons votre rendez-vous de visite pour le bien "${v.bien_titre}".`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              padding: '5px 8px',
                              borderRadius: 6,
                              background: 'rgba(22, 163, 74, 0.08)',
                              color: '#166534',
                              border: '1px solid rgba(22, 163, 74, 0.25)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              textDecoration: 'none',
                            }}
                            title="Écrire sur WhatsApp"
                          >
                            <MessageCircle size={13} />
                          </a>
                        )}

                        {v.statut !== 'realisee' && (
                          <button
                            type="button"
                            onClick={() => updateStatut(v.id, 'realisee')}
                            style={{
                              padding: '5px 10px',
                              borderRadius: 6,
                              background: '#DCFCE7',
                              color: '#166534',
                              border: 'none',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            Réalisée
                          </button>
                        )}
                        {v.statut !== 'annulee' && (
                          <button
                            type="button"
                            onClick={() => updateStatut(v.id, 'annulee')}
                            style={{
                              padding: '5px 10px',
                              borderRadius: 6,
                              background: '#FEE2E2',
                              color: '#991B1B',
                              border: 'none',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            Annuler
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      </>
      )}

      {/* ── Modale Confirmation de Visite ── */}
      {visiteAConfirmer && (
        <ModalConfirmerVisite
          slug={slug}
          visite={visiteAConfirmer}
          onClose={() => setVisiteAConfirmer(null)}
          onSuccess={() => {
            setVisiteAConfirmer(null)
            chargerVisites()
          }}
        />
      )}

      {/* ── Modale Programmation Visite (Modulaire) ── */}
      <ModalProgrammerVisite
        slug={slug}
        isOpen={showModal}
        biensOptions={biensOptions}
        contactsOptions={contactsOptions}
        onClose={() => setShowModal(false)}
        onSuccess={() => chargerVisites()}
      />
    </div>
  )
}
