'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  FileSignature,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  User,
  Percent,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  FileText,
  Sparkles
} from 'lucide-react'
import { ModalCreerMandat } from './components/ModalCreerMandat'
import { getImmoAuthHeaders, getImmoAuthToken } from '@/lib/immo-auth'

interface MandatItem {
  id: string
  bien_id: string
  proprietaire_id: string
  type_mandat: string
  type_operation: string
  date_debut: string
  date_fin?: string
  duree_mois: number
  taux_commission?: number
  montant_commission_fixe?: number
  conditions?: string
  statut: string
  expire_bientot?: boolean
  jours_restants?: number | null
  bien_titre: string
  bien_quartier?: string
  bien_ville?: string
  bien_images?: string[]
  proprietaire_nom: string
  proprietaire_telephone?: string
  agent_nom?: string
  agent_prenom?: string
}

export default function AgenceMandatsPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [mandats, setMandats] = useState<MandatItem[]>([])
  const [stats, setStats] = useState<any>({})
  const [biens, setBiens] = useState<any[]>([])
  const [proprietaires, setProprietaires] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const [filterStatut, setFilterStatut] = useState('actif')
  const [filterType, setFilterType] = useState('tous')
  const [searchTerm, setSearchTerm] = useState('')

  const token = getImmoAuthToken()

  async function chargerDonnees() {
    try {
      setLoading(true)
      const headers = getImmoAuthHeaders()

      const [resMandats, resStats, resBiens, resProps] = await Promise.all([
        fetch(`/api/mandats-immo/agence/${slug}?statut=${filterStatut}&type_mandat=${filterType}&search=${encodeURIComponent(searchTerm)}`, { headers }),
        fetch(`/api/mandats-immo/agence/${slug}/stats`, { headers }),
        fetch(`/api/biens/agence/${slug}?statut=actif`, { headers }),
        fetch(`/api/crm-immo/agence/${slug}/proprietaires`, { headers }),
      ])

      const [dM, dS, dB, dP] = await Promise.all([
        resMandats.json(),
        resStats.json(),
        resBiens.json(),
        resProps.json(),
      ])

      if (dM.success) setMandats(dM.mandats || [])
      if (dS.success) setStats(dS.stats || {})
      if (dB.success) setBiens(dB.biens || [])
      if (dP.success) setProprietaires(dP.proprietaires || [])
    } catch (err) {
      console.error('[LOAD_MANDATS_ERR]', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (slug) chargerDonnees()
  }, [slug, filterStatut, filterType])

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 40 }}>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileSignature size={24} color="var(--accent, #C75B00)" />
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: 'var(--navy, #1C2B4A)' }}>
              Mandats de Gestion & Vente
            </h1>
          </div>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0 0' }}>
            Gestion légale des mandats, exclusivités, honoraires et alertes d&apos;expiration
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--accent, #C75B00)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '9px 16px',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <Plus size={16} />
          <span>Nouveau Mandat</span>
        </button>
      </div>

      {/* Grille KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div style={{ background: '#fff', padding: '14px 16px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>Mandats Actifs</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
            {stats.total_actifs || 0}
          </div>
        </div>

        <div style={{ background: '#fff', padding: '14px 16px', borderRadius: 10, border: '1px solid #bbf7d0', backgroundClip: 'padding-box' }}>
          <div style={{ fontSize: 12, color: '#15803d', fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Sparkles size={14} color="#15803d" />
            <span>Mandats Exclusifs</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#15803d' }}>
            {stats.total_exclusifs || 0}
          </div>
        </div>

        <div style={{ background: '#fff', padding: '14px 16px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>Vente / Location</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#334155', marginTop: 4 }}>
            {stats.total_vente || 0} vente · {stats.total_location || 0} loc.
          </div>
        </div>

        <div style={{ background: stats.expirant_30j > 0 ? '#fffbeb' : '#fff', padding: '14px 16px', borderRadius: 10, border: stats.expirant_30j > 0 ? '1px solid #fde68a' : '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 12, color: stats.expirant_30j > 0 ? '#b45309' : '#64748b', fontWeight: 600, marginBottom: 4 }}>
            Expirant sous 30j
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: stats.expirant_30j > 0 ? '#b45309' : '#334155' }}>
            {stats.expirant_30j || 0}
          </div>
        </div>
      </div>

      {/* Barre de filtres */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Rechercher par bien, propriétaire..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && chargerDonnees()}
            style={{ width: '100%', padding: '8px 10px 8px 32px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
          />
        </div>

        <select
          value={filterStatut}
          onChange={e => setFilterStatut(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, background: '#fff' }}
        >
          <option value="actif">Statut : Actifs</option>
          <option value="expire">Statut : Expirés</option>
          <option value="resilie">Statut : Résiliés</option>
          <option value="tous">Statut : Tous</option>
        </select>

        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, background: '#fff' }}
        >
          <option value="tous">Type : Tous</option>
          <option value="simple">Mandats Simples</option>
          <option value="exclusif">Mandats Exclusifs</option>
          <option value="co_exclusif">Co-exclusifs</option>
        </select>

        <button
          type="button"
          onClick={chargerDonnees}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
          title="Actualiser"
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
        </button>
      </div>

      {/* Tableau des mandats */}
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
            Chargement des mandats…
          </div>
        ) : mandats.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <FileSignature size={40} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#334155', margin: 0 }}>Aucun mandat trouvé</h3>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: '4px 0 16px' }}>
              Enregistrez vos mandats de vente et de gestion pour formaliser vos relations bailleurs.
            </p>
            <button
              type="button"
              onClick={() => setShowModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'var(--accent, #C75B00)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '8px 14px',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Plus size={14} />
              <span>Créer le premier mandat</span>
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Bien & Opération</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Propriétaire Mandant</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Type & Validité</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Honoraires</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Statut</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {mandats.map(m => (
                  <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <Link
                        href={`/agence/${slug}/biens/${m.bien_id}`}
                        style={{ fontWeight: 700, color: 'var(--navy, #1C2B4A)', textDecoration: 'none', display: 'block' }}
                      >
                        {m.bien_titre}
                      </Link>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: 4,
                          background: m.type_operation === 'vente' ? '#fef3c7' : '#e0f2fe',
                          color: m.type_operation === 'vente' ? '#92400e' : '#0369a1',
                          textTransform: 'uppercase',
                        }}>
                          {m.type_operation}
                        </span>
                        <span style={{ fontSize: 11.5, color: '#64748b' }}>
                          {m.bien_quartier ? `${m.bien_quartier}, ` : ''}{m.bien_ville}
                        </span>
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{m.proprietaire_nom}</div>
                      {m.proprietaire_telephone && (
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                          {m.proprietaire_telephone}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{
                          fontWeight: 750,
                          fontSize: 12,
                          color: m.type_mandat === 'exclusif' ? '#15803d' : '#334155',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}>
                          {m.type_mandat === 'exclusif' && <Sparkles size={13} color="#15803d" />}
                          <span>{m.type_mandat === 'exclusif' ? 'Exclusif' : m.type_mandat === 'co_exclusif' ? 'Co-exclusif' : 'Simple'}</span>
                        </span>
                      </div>
                      <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 3 }}>
                        Du {new Date(m.date_debut).toLocaleDateString('fr-FR')} au {m.date_fin ? new Date(m.date_fin).toLocaleDateString('fr-FR') : 'Indéterminée'}
                      </div>
                      {m.expire_bientot && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4, color: '#b45309', fontSize: 11, fontWeight: 700 }}>
                          <AlertTriangle size={12} />
                          <span>Expire dans {m.jours_restants}j</span>
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      {m.taux_commission ? (
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{m.taux_commission}%</div>
                      ) : m.montant_commission_fixe ? (
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{Number(m.montant_commission_fixe).toLocaleString('fr-FR')} F</div>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>Non défini</span>
                      )}
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        display: 'inline-block',
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 6,
                        background: m.statut === 'actif' ? '#f0fdf4' : m.statut === 'expire' ? '#fef2f2' : '#f1f5f9',
                        color: m.statut === 'actif' ? '#166534' : m.statut === 'expire' ? '#dc2626' : '#475569',
                      }}>
                        {m.statut === 'actif' ? 'En vigueur' : m.statut === 'expire' ? 'Expiré' : m.statut}
                      </span>
                    </td>

                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                        <a
                          href={`/api/agences/agence/${slug}/documents/mandat/${m.id}.pdf${token ? `?token=${encodeURIComponent(token)}` : ''}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Télécharger le Mandat officiel PDF"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '5px 9px',
                            borderRadius: 6,
                            background: '#F1F5F9',
                            border: '1px solid #CBD5E1',
                            color: 'var(--navy, #1C2B4A)',
                            fontSize: 11.5,
                            fontWeight: 700,
                            textDecoration: 'none',
                          }}
                        >
                          <FileText size={12} />
                          <span>Mandat PDF</span>
                        </a>

                        <Link
                          href={`/agence/${slug}/biens/${m.bien_id}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 12,
                            fontWeight: 700,
                            color: 'var(--accent, #C75B00)',
                            textDecoration: 'none',
                          }}
                        >
                          <span>Fiche bien</span>
                          <ArrowRight size={13} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <ModalCreerMandat
          slug={slug}
          biens={biens}
          proprietaires={proprietaires}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false)
            chargerDonnees()
          }}
        />
      )}
    </div>
  )
}
