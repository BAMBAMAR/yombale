'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Users,
  Search,
  ShieldCheck,
  Crown,
  Sparkles,
  RefreshCw,
  Phone,
  Mail,
  Calendar,
  Zap,
  CheckCircle2,
  XCircle,
  X,
  AlertCircle,
} from 'lucide-react'

export interface UtilisateurSurga {
  id: string
  nom_complet?: string
  telephone?: string
  email?: string
  statut?: string
  created_at: string
  plan_actif?: string | null
  echeance_plan?: string | null
  quota_vocal_utilise?: number
  quartier_prefere?: string
  equipe_sport?: string
}

export default function AdminComptesTab() {
  const [utilisateurs, setUtilisateurs] = useState<UtilisateurSurga[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [recherche, setRecherche] = useState('')
  const [filtreStatut, setFiltreStatut] = useState('')
  const [chargement, setChargement] = useState(true)
  const [message, setMessage] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null)

  // Modale attribution VIP
  const [modalVipOuverte, setModalVipOuverte] = useState(false)
  const [userVipCible, setUserVipCible] = useState<UtilisateurSurga | null>(null)
  const [moisVip, setMoisVip] = useState(1)
  const [planVip, setPlanVip] = useState('b2c_premium')
  const [actionEnCours, setActionEnCours] = useState(false)

  const chargerUtilisateurs = useCallback(async () => {
    setChargement(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
      })
      if (recherche.trim()) params.set('q', recherche.trim())
      if (filtreStatut) params.set('statut', filtreStatut)

      const res = await fetch(`/api/admin/surga/utilisateurs?${params.toString()}`)
      const data = await res.json()
      if (data.success && Array.isArray(data.utilisateurs)) {
        setUtilisateurs(data.utilisateurs)
        setTotal(data.total || 0)
      }
    } catch {
      setMessage({ type: 'erreur', texte: 'Impossible de charger la liste des utilisateurs.' })
    } finally {
      setChargement(false)
    }
  }, [page, recherche, filtreStatut])

  useEffect(() => {
    chargerUtilisateurs()
  }, [chargerUtilisateurs])

  const ouvrirAttributionVip = (u: UtilisateurSurga) => {
    setUserVipCible(u)
    setMoisVip(1)
    setPlanVip('b2c_premium')
    setModalVipOuverte(true)
  }

  const executerActionVip = async (action: 'accorder' | 'revoquer') => {
    if (!userVipCible) return
    setActionEnCours(true)
    try {
      const res = await fetch(`/api/admin/surga/utilisateurs/${userVipCible.id}/premium`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          mois: Number(moisVip),
          plan: planVip,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'succes', texte: data.message || 'Mise à jour effectuée avec succès.' })
        setModalVipOuverte(false)
        chargerUtilisateurs()
      } else {
        setMessage({ type: 'erreur', texte: data.error || 'Erreur lors de l opération.' })
      }
    } catch {
      setMessage({ type: 'erreur', texte: 'Erreur réseau lors de la mise à jour.' })
    } finally {
      setActionEnCours(false)
      setTimeout(() => setMessage(null), 3500)
    }
  }

  const resetQuotaVocal = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/surga/utilisateurs/${userId}/reset-quota`, {
        method: 'POST',
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'succes', texte: 'Quota vocal journalier réinitialisé à zéro.' })
        chargerUtilisateurs()
      }
    } catch {
      setMessage({ type: 'erreur', texte: 'Erreur lors de la réinitialisation.' })
    } finally {
      setTimeout(() => setMessage(null), 3000)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {message && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: 8,
            backgroundColor: message.type === 'succes' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: message.type === 'succes' ? '#10B981' : '#EF4444',
            border: `1px solid ${message.type === 'succes' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
            fontSize: 13,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {message.type === 'succes' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          <span>{message.texte}</span>
        </div>
      )}

      {/* Barre d'outils et de recherche */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: '16px 20px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flex: 1 }}>
          <div style={{ position: 'relative', minWidth: 260 }}>
            <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Rechercher par nom, téléphone (+221), email..."
              value={recherche}
              onChange={(e) => { setRecherche(e.target.value); setPage(1) }}
              style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 13 }}
            />
          </div>

          <select
            value={filtreStatut}
            onChange={(e) => { setFiltreStatut(e.target.value); setPage(1) }}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 13, backgroundColor: '#FFFFFF' }}
          >
            <option value="">Tous les utilisateurs</option>
            <option value="premium">Abonnés Premium uniquement</option>
            <option value="freemium">Utilisateurs Freemium</option>
          </select>
        </div>

        <button
          type="button"
          onClick={chargerUtilisateurs}
          style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', color: '#0F172A', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <RefreshCw size={14} className={chargement ? 'animate-spin' : ''} />
          <span>Actualiser</span>
        </button>
      </div>

      {/* Tableau des utilisateurs */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#0F172A' }}>
                <th style={{ padding: '12px 16px', fontWeight: 800 }}>Utilisateur</th>
                <th style={{ padding: '12px 16px', fontWeight: 800 }}>Coordonnées</th>
                <th style={{ padding: '12px 16px', fontWeight: 800 }}>Formule &amp; Échéance</th>
                <th style={{ padding: '12px 16px', fontWeight: 800 }}>Consommation Vocale</th>
                <th style={{ padding: '12px 16px', fontWeight: 800 }}>Préférences</th>
                <th style={{ padding: '12px 16px', fontWeight: 800, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {utilisateurs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 36, textAlign: 'center', color: '#64748B' }}>
                    {chargement ? 'Chargement des comptes utilisateurs...' : 'Aucun utilisateur trouvé pour ces critères.'}
                  </td>
                </tr>
              ) : (
                utilisateurs.map((u) => {
                  const estPremium = !!u.plan_actif
                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 800, color: '#0F172A' }}>
                          {u.nom_complet || 'Utilisateur Surga'}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                          Inscrit le {new Date(u.created_at).toLocaleDateString('fr-FR')}
                        </div>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#0F172A' }}>
                          <Phone size={12} color="#06B6D4" />
                          <span>{u.telephone || 'Non renseigné'}</span>
                        </div>
                        {u.email && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748B', marginTop: 2 }}>
                            <Mail size={11} />
                            <span>{u.email}</span>
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        {estPremium ? (
                          <div>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 12, backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10B981', fontSize: 11, fontWeight: 800 }}>
                              <Crown size={12} />
                              <span style={{ textTransform: 'capitalize' }}>{u.plan_actif}</span>
                            </span>
                            {u.echeance_plan && (
                              <div style={{ fontSize: 11, color: '#64748B', marginTop: 3 }}>
                                Jusqu au {new Date(u.echeance_plan).toLocaleDateString('fr-FR')}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: 12, backgroundColor: '#F1F5F9', color: '#64748B', fontSize: 11, fontWeight: 700 }}>
                            Freemium (Standard)
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 800, color: (u.quota_vocal_utilise || 0) >= 2 ? '#EF4444' : '#0F172A' }}>
                            {u.quota_vocal_utilise || 0}
                          </span>
                          <span style={{ fontSize: 11, color: '#64748B' }}>/ 2 req. aujourd hui</span>
                        </div>
                        {(u.quota_vocal_utilise || 0) > 0 && (
                          <button
                            type="button"
                            onClick={() => resetQuotaVocal(u.id)}
                            style={{ background: 'none', border: 'none', color: '#06B6D4', fontSize: 11, fontWeight: 700, cursor: 'pointer', padding: 0, marginTop: 2 }}
                          >
                            Réinitialiser le quota
                          </button>
                        )}
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontSize: 12, color: '#334155' }}>
                          {u.quartier_prefere || 'Dakar'}
                        </div>
                        {u.equipe_sport && (
                          <div style={{ fontSize: 11, color: '#64748B' }}>
                            Équipe : {u.equipe_sport}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => ouvrirAttributionVip(u)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 6,
                            border: '1px solid #CBD5E1',
                            backgroundColor: estPremium ? '#F8FAFC' : 'rgba(245, 158, 11, 0.1)',
                            color: estPremium ? '#0F172A' : '#D97706',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {estPremium ? 'Gérer Premium' : '+ Accorder VIP'}
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pied de tableau / total */}
        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
          <div style={{ fontSize: 12, color: '#64748B' }}>
            Total : <strong>{total}</strong> compte(s) utilisateur(s)
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', fontSize: 12, cursor: page <= 1 ? 'not-allowed' : 'pointer' }}
            >
              Précédent
            </button>
            <span style={{ padding: '5px 10px', fontSize: 12, fontWeight: 700, color: '#0F172A' }}>
              Page {page}
            </span>
            <button
              type="button"
              disabled={page * 20 >= total}
              onClick={() => setPage((p) => p + 1)}
              style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', fontSize: 12, cursor: page * 20 >= total ? 'not-allowed' : 'pointer' }}
            >
              Suivant
            </button>
          </div>
        </div>
      </div>

      {/* Modal d'attribution VIP */}
      {modalVipOuverte && userVipCible && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(3px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: 14, width: '100%', maxWidth: 460, padding: 24, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, borderBottom: '1px solid #E2E8F0', paddingBottom: 12 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
                Gestion Statut VIP : {userVipCible.nom_complet || userVipCible.telephone}
              </div>
              <button type="button" onClick={() => setModalVipOuverte(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 4 }}>Formule à attribuer</label>
                <select value={planVip} onChange={(e) => setPlanVip(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, backgroundColor: '#FFFFFF' }}>
                  <option value="b2c_premium">Surga Premium Particulier (Vocal illimité, audio continu)</option>
                  <option value="b2b_visibilite_resto">Espace Pro Visibilité Resto</option>
                  <option value="b2b_immo_pro">Espace Pro Partenaire Immo</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 4 }}>Durée accordée</label>
                <select value={moisVip} onChange={(e) => setMoisVip(Number(e.target.value))} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, backgroundColor: '#FFFFFF' }}>
                  <option value={1}>1 Mois offert</option>
                  <option value={3}>3 Mois offerts</option>
                  <option value={6}>6 Mois offerts</option>
                  <option value={12}>1 An VIP (Annuel)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 12, borderTop: '1px solid #E2E8F0', paddingTop: 14 }}>
                {userVipCible.plan_actif ? (
                  <button type="button" disabled={actionEnCours} onClick={() => executerActionVip('revoquer')} style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #EF4444', backgroundColor: '#FFFFFF', color: '#EF4444', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    Révoquer Premium
                  </button>
                ) : <span />}

                <button type="button" disabled={actionEnCours} onClick={() => executerActionVip('accorder')} style={{ padding: '8px 20px', borderRadius: 6, border: 'none', backgroundColor: '#F59E0B', color: '#0B132B', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
                  {actionEnCours ? 'Traitement...' : 'Confirmer le statut VIP'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
