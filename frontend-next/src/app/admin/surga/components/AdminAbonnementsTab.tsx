'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  CreditCard,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  TrendingUp,
  Users,
  ShieldCheck,
  Building,
} from 'lucide-react'

interface AbonnementItem {
  id: string
  user_id?: string
  phone?: string
  plan: string
  cycle: string
  montant_xof: number
  provider: string
  statut: 'actif' | 'en_attente' | 'expire' | 'resilie'
  reference_paiement: string
  client_metadata?: any
  debut: string
  fin: string
  created_at: string
  email?: string
  nom_complet?: string
}

interface StatsFinancieres {
  abonnementsActifs: number
  enAttente: number
  mrrEstimeXof: number
  volumeEncaisseXof: number
}

const NOMS_PLANS: Record<string, string> = {
  b2c_premium: 'Surga Plus (particulier)',
  b2b_visibilite_resto: 'Visibilité Resto',
  b2b_immo_pro: 'Immo Pro Partenaire',
  b2b_education_pro: 'Prépa Concours Pro',
}

export default function AdminAbonnementsTab() {
  const [abonnements, setAbonnements] = useState<AbonnementItem[]>([])
  const [stats, setStats] = useState<StatsFinancieres>({
    abonnementsActifs: 0,
    enAttente: 0,
    mrrEstimeXof: 0,
    volumeEncaisseXof: 0,
  })
  const [total, setTotal] = useState<number>(0)
  const [page, setPage] = useState<number>(1)
  const [statutFiltre, setStatutFiltre] = useState<string>('')
  const [planFiltre, setPlanFiltre] = useState<string>('')
  const [chargement, setChargement] = useState<boolean>(false)
  const [actionId, setActionId] = useState<string | null>(null)

  const chargerAbonnements = useCallback(async () => {
    setChargement(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
      })
      if (statutFiltre) params.set('statut', statutFiltre)
      if (planFiltre) params.set('plan', planFiltre)

      const res = await fetch(`/api/admin/surga/abonnements?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setAbonnements(data.abonnements || [])
        setTotal(data.total || 0)
        if (data.stats) {
          setStats(data.stats)
        }
      }
    } catch (err) {
      console.error('Erreur chargement abonnements admin:', err)
    } finally {
      setChargement(false)
    }
  }, [page, statutFiltre, planFiltre])

  useEffect(() => {
    chargerAbonnements()
  }, [chargerAbonnements])

  const modifierStatut = async (id: string, nouveauStatut: string) => {
    setActionId(id)
    try {
      const res = await fetch(`/api/admin/surga/abonnements/${id}/statut`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: nouveauStatut }),
      })
      const data = await res.json()
      if (data.success) {
        chargerAbonnements()
      }
    } catch (err) {
      console.error('Erreur modification statut:', err)
    } finally {
      setActionId(null)
    }
  }

  const badgeStatut = (statut: string) => {
    switch (statut) {
      case 'actif':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 12, backgroundColor: 'rgba(10, 92, 54, 0.1)', color: 'var(--price, #0A5C36)', fontSize: 11, fontWeight: 700 }}>
            <CheckCircle2 size={12} />
            <span>Actif</span>
          </span>
        )
      case 'en_attente':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 12, backgroundColor: 'rgba(199, 91, 0, 0.1)', color: 'var(--accent, #C75B00)', fontSize: 11, fontWeight: 700 }}>
            <Clock size={12} />
            <span>En attente</span>
          </span>
        )
      case 'expire':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 12, backgroundColor: 'rgba(115, 103, 94, 0.1)', color: 'var(--text3, #73675E)', fontSize: 11, fontWeight: 700 }}>
            <AlertCircle size={12} />
            <span>Expiré</span>
          </span>
        )
      case 'resilie':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 12, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#DC2626', fontSize: 11, fontWeight: 700 }}>
            <XCircle size={12} />
            <span>Résilié</span>
          </span>
        )
      default:
        return <span>{statut}</span>
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 4 Mini Cartes Financières */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 10, padding: '14px 16px', border: '1px solid var(--border, #E8DDD2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text3, #73675E)', fontWeight: 600 }}>MRR Estimé</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--price, #0A5C36)', marginTop: 4 }}>
              {stats.mrrEstimeXof.toLocaleString('fr-FR')} FCFA
            </div>
          </div>
          <TrendingUp size={22} color="var(--price, #0A5C36)" />
        </div>

        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 10, padding: '14px 16px', border: '1px solid var(--border, #E8DDD2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text3, #73675E)', fontWeight: 600 }}>Abonnements Actifs</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--navy, #1C2B4A)', marginTop: 4 }}>
              {stats.abonnementsActifs}
            </div>
          </div>
          <Users size={22} color="var(--navy, #1C2B4A)" />
        </div>

        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 10, padding: '14px 16px', border: '1px solid var(--border, #E8DDD2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text3, #73675E)', fontWeight: 600 }}>Paiements en Attente</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: stats.enAttente > 0 ? 'var(--accent, #C75B00)' : 'var(--navy, #1C2B4A)', marginTop: 4 }}>
              {stats.enAttente}
            </div>
          </div>
          <Clock size={22} color="var(--accent, #C75B00)" />
        </div>

        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 10, padding: '14px 16px', border: '1px solid var(--border, #E8DDD2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text3, #73675E)', fontWeight: 600 }}>Volume Total Encaissé</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--navy, #1C2B4A)', marginTop: 4 }}>
              {stats.volumeEncaisseXof.toLocaleString('fr-FR')} FCFA
            </div>
          </div>
          <CreditCard size={22} color="var(--navy, #1C2B4A)" />
        </div>
      </div>

      {/* Barre d'outils et filtres */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: '14px 18px', border: '1px solid var(--border, #E8DDD2)', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={statutFiltre}
            onChange={(e) => { setStatutFiltre(e.target.value); setPage(1) }}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border, #E8DDD2)', fontSize: 13, backgroundColor: '#FFFFFF' }}
          >
            <option value="">Tous les statuts</option>
            <option value="actif">Actif</option>
            <option value="en_attente">En attente</option>
            <option value="expire">Expiré</option>
            <option value="resilie">Résilié</option>
          </select>

          <select
            value={planFiltre}
            onChange={(e) => { setPlanFiltre(e.target.value); setPage(1) }}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border, #E8DDD2)', fontSize: 13, backgroundColor: '#FFFFFF' }}
          >
            <option value="">Toutes les formules</option>
            <option value="b2c_premium">Surga Plus (particulier)</option>
            <option value="b2b_visibilite_resto">Visibilité Resto</option>
            <option value="b2b_immo_pro">Immo Pro</option>
            <option value="b2b_education_pro">Prépa Concours</option>
          </select>
        </div>

        <button
          type="button"
          onClick={chargerAbonnements}
          style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border, #E8DDD2)', backgroundColor: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}
        >
          <RefreshCw size={14} className={chargement ? 'animate-spin' : ''} />
          <span>Actualiser</span>
        </button>
      </div>

      {/* Tableau des abonnements */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 12, border: '1px solid var(--border, #E8DDD2)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg, #F8F5F0)', borderBottom: '1px solid var(--border, #E8DDD2)', color: 'var(--navy, #1C2B4A)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 800 }}>Référence / Date</th>
                <th style={{ padding: '12px 16px', fontWeight: 800 }}>Client / Pro</th>
                <th style={{ padding: '12px 16px', fontWeight: 800 }}>Formule &amp; Cycle</th>
                <th style={{ padding: '12px 16px', fontWeight: 800 }}>Montant &amp; Provider</th>
                <th style={{ padding: '12px 16px', fontWeight: 800 }}>Statut</th>
                <th style={{ padding: '12px 16px', fontWeight: 800 }}>Échéance</th>
                <th style={{ padding: '12px 16px', fontWeight: 800, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {abonnements.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 32, textAlign: 'center', color: 'var(--text3, #73675E)' }}>
                    {chargement ? 'Chargement des abonnements...' : 'Aucun abonnement trouvé pour ces critères.'}
                  </td>
                </tr>
              ) : (
                abonnements.map((abo) => {
                  const meta = abo.client_metadata || {}
                  const nomPro = meta.nomEtablissement
                  return (
                    <tr key={abo.id} style={{ borderBottom: '1px solid var(--border, #E8DDD2)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--navy, #1C2B4A)', fontFamily: 'monospace' }}>
                          {abo.reference_paiement}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text3, #73675E)', marginTop: 2 }}>
                          {new Date(abo.created_at).toLocaleDateString('fr-FR')}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {nomPro ? (
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>{nomPro}</div>
                            <div style={{ fontSize: 11, color: 'var(--text3, #73675E)' }}>{abo.phone || 'Non renseigné'}</div>
                          </div>
                        ) : (
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>{abo.nom_complet || abo.email || 'Utilisateur'}</div>
                            <div style={{ fontSize: 11, color: 'var(--text3, #73675E)' }}>{abo.phone || abo.email || '-'}</div>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
                          {NOMS_PLANS[abo.plan] || abo.plan}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text3, #73675E)' }}>
                          {abo.cycle === 'annuel' ? 'Cycle annuel' : 'Cycle mensuel'}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 800, color: 'var(--price, #0A5C36)' }}>
                          {abo.montant_xof.toLocaleString('fr-FR')} FCFA
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text3, #73675E)', textTransform: 'capitalize' }}>
                          {abo.provider}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>{badgeStatut(abo.statut)}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontSize: 12, color: 'var(--navy, #1C2B4A)', fontWeight: 600 }}>
                          {new Date(abo.fin).toLocaleDateString('fr-FR')}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          {abo.statut !== 'actif' && (
                            <button
                              type="button"
                              disabled={actionId === abo.id}
                              onClick={() => modifierStatut(abo.id, 'actif')}
                              style={{ padding: '5px 10px', borderRadius: 6, border: 'none', backgroundColor: 'var(--price, #0A5C36)', color: '#FFFFFF', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                            >
                              Valider
                            </button>
                          )}
                          {abo.statut === 'actif' && (
                            <button
                              type="button"
                              disabled={actionId === abo.id}
                              onClick={() => modifierStatut(abo.id, 'resilie')}
                              style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #DC2626', backgroundColor: '#FFFFFF', color: '#DC2626', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                            >
                              Résilier
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pied de tableau / pagination */}
        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border, #E8DDD2)', backgroundColor: 'var(--bg, #F8F5F0)' }}>
          <div style={{ fontSize: 12, color: 'var(--text3, #73675E)' }}>
            Total : <strong>{total}</strong> souscription(s)
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border, #E8DDD2)', backgroundColor: '#FFFFFF', fontSize: 12, cursor: page <= 1 ? 'not-allowed' : 'pointer' }}
            >
              Précédent
            </button>
            <span style={{ padding: '5px 10px', fontSize: 12, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
              Page {page}
            </span>
            <button
              type="button"
              disabled={page * 20 >= total}
              onClick={() => setPage((p) => p + 1)}
              style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border, #E8DDD2)', backgroundColor: '#FFFFFF', fontSize: 12, cursor: page * 20 >= total ? 'not-allowed' : 'pointer' }}
            >
              Suivant
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
