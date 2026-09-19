'use client'

import React, { useState } from 'react'
import {
  Wallet,
  Users,
  TrendingUp,
  TrendingDown,
  Target,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Settings as SettingsIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/context/ToastContext'

interface Props {
  initialStats: any
  initialUtilisateurs: any[]
}

export default function AdminSamaXaalisClient({ initialStats, initialUtilisateurs }: Props) {
  const { toast } = useToast()
  const [stats, setStats] = useState(initialStats)
  const [utilisateurs, setUtilisateurs] = useState<any[]>(initialUtilisateurs)
  const [search, setSearch] = useState('')
  const [statutFilter, setStatutFilter] = useState('all')
  const [loading, setLoading] = useState(false)

  const recharger = async (q = search, st = statutFilter) => {
    setLoading(true)
    try {
      const qs = new URLSearchParams()
      if (q) qs.set('q', q)
      if (st && st !== 'all') qs.set('statut', st)
      qs.set('limit', '50')

      const res = await fetch(`/api/admin/kalpe/utilisateurs?${qs.toString()}`)
      if (res.ok) {
        const d = await res.json()
        setUtilisateurs(d.utilisateurs || [])
      }
    } catch {
      toast.error('Erreur lors du filtrage')
    } finally {
      setLoading(false)
    }
  }

  const handleChangerStatut = async (userId: string, nouveauStatut: 'actif' | 'suspendu') => {
    try {
      const res = await fetch(`/api/admin/kalpe/utilisateurs/${userId}/statut`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: nouveauStatut }),
      })
      if (res.ok) {
        toast.success(`Statut mis à jour : ${nouveauStatut}`)
        setUtilisateurs((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, kalpe_statut: nouveauStatut } : u))
        )
      } else {
        toast.error('Erreur lors du changement de statut')
      }
    } catch {
      toast.error('Erreur réseau')
    }
  }

  const comptes = stats?.comptes || {}
  const ops = stats?.operations || {}
  const dettes = stats?.dettes || {}
  const epargne = stats?.epargne || {}

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: '#1C2B4A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFA86A',
            }}
          >
            <Wallet size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#1C2B4A', margin: 0 }}>
              Sama Xaalis — Supervision & Finances
            </h1>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '2px 0 0' }}>
              Gestion d'argent personnelle & activité, carnet de dettes et épargne de tous les utilisateurs
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link
            href="/admin/tarifs"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#F1F5F9',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: 700,
              color: '#1C2B4A',
              textDecoration: 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <SettingsIcon size={14} />
            Fixer le tarif de l'abonnement
          </Link>
          <button
            onClick={() => recharger()}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: 700,
              color: '#1C2B4A',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Actualiser
          </button>
        </div>
      </div>

      {/* 4 Cartes de métriques */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        {/* Total Comptes */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>COMPTES ACTIVÉS</span>
            <Users size={16} color="#3B82F6" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#1C2B4A' }}>
            {(comptes.total_comptes || 0).toLocaleString('fr-FR')}
          </div>
          <div style={{ fontSize: '12px', color: '#10B981', marginTop: '4px', fontWeight: 600 }}>
            {(comptes.comptes_actifs || 0).toLocaleString('fr-FR')} actifs · {(comptes.comptes_essai || 0)} en essai
          </div>
        </div>

        {/* Volume Entrées / Sorties */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>FLUX OPÉRATIONS</span>
            <TrendingUp size={16} color="#10B981" />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#0A5C36' }}>
            +{(Number(ops.volume_entrees_total || 0)).toLocaleString('fr-FR')} F
          </div>
          <div style={{ fontSize: '12px', color: '#C75B00', marginTop: '4px', fontWeight: 600 }}>
            Sorties : {(Number(ops.volume_sorties_total || 0)).toLocaleString('fr-FR')} F ({ops.nb_operations_total || 0} ops)
          </div>
        </div>

        {/* Créances & Dettes */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>ENCOURS CRÉANCES</span>
            <AlertTriangle size={16} color="#F59E0B" />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#1C2B4A' }}>
            {(Number(dettes.encours_creances_a_recevoir || 0)).toLocaleString('fr-FR')} F
          </div>
          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px', fontWeight: 600 }}>
            {dettes.nb_creances_actives || 0} créances en cours · Recouvré : {(Number(dettes.montant_recouvre_total || 0)).toLocaleString('fr-FR')} F
          </div>
        </div>

        {/* Épargne */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>ÉPARGNE MOBILISÉE</span>
            <Target size={16} color="#6366F1" />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#6366F1' }}>
            {(Number(epargne.volume_actuel_epargne || 0)).toLocaleString('fr-FR')} F
          </div>
          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px', fontWeight: 600 }}>
            Sur {(Number(epargne.volume_cible_epargne || 0)).toLocaleString('fr-FR')} F visés ({epargne.nb_objectifs_total || 0} projets)
          </div>
        </div>
      </div>

      {/* Barre de Recherche & Filtres */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          padding: '14px 18px',
          marginBottom: '16px',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '220px' }}>
          <Search size={16} color="#94A3B8" />
          <input
            type="text"
            placeholder="Rechercher par nom, téléphone, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') recharger(e.currentTarget.value, statutFilter)
            }}
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              fontSize: '13px',
              color: '#1C2B4A',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={15} color="#94A3B8" />
          <select
            value={statutFilter}
            onChange={(e) => {
              setStatutFilter(e.target.value)
              recharger(search, e.target.value)
            }}
            style={{
              border: '1px solid #E2E8F0',
              borderRadius: '6px',
              padding: '6px 10px',
              fontSize: '12px',
              color: '#1C2B4A',
              fontWeight: 600,
            }}
          >
            <option value="all">Tous les statuts</option>
            <option value="actif">Actif</option>
            <option value="expire">Expiré</option>
            <option value="suspendu">Suspendu</option>
          </select>
        </div>
      </div>

      {/* Tableau des utilisateurs */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontWeight: 700 }}>
              <th style={{ padding: '12px 16px' }}>Utilisateur</th>
              <th style={{ padding: '12px 16px' }}>Statut Sama Xaalis</th>
              <th style={{ padding: '12px 16px' }}>Opérations</th>
              <th style={{ padding: '12px 16px' }}>Entrées / Sorties</th>
              <th style={{ padding: '12px 16px' }}>Créances</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {utilisateurs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: '#94A3B8' }}>
                  Aucun compte trouvé avec ces critères
                </td>
              </tr>
            ) : (
              utilisateurs.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 700, color: '#1C2B4A' }}>{u.nom}</div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>
                      {u.telephone || u.email || 'Aucun contact'} {u.ville ? `· ${u.ville}` : ''}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background:
                          u.kalpe_statut === 'actif'
                            ? '#DCFCE7'
                            : u.kalpe_statut === 'suspendu'
                            ? '#FEE2E2'
                            : '#F1F5F9',
                        color:
                          u.kalpe_statut === 'actif'
                            ? '#16A34A'
                            : u.kalpe_statut === 'suspendu'
                            ? '#DC2626'
                            : '#64748B',
                      }}
                    >
                      {u.kalpe_statut || 'inactif'} {u.is_trial ? '(essai)' : ''}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                    {u.nb_operations || 0} ops
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ color: '#0A5C36', fontWeight: 700 }}>
                      +{(Number(u.total_entrees || 0)).toLocaleString('fr-FR')} F
                    </div>
                    <div style={{ color: '#C75B00', fontSize: '11px', fontWeight: 600 }}>
                      -{(Number(u.total_sorties || 0)).toLocaleString('fr-FR')} F
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, color: '#1C2B4A' }}>
                      {u.nb_dettes_actives || 0} créances
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>
                      {(Number(u.encours_dettes || 0)).toLocaleString('fr-FR')} F
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    {u.kalpe_statut === 'actif' ? (
                      <button
                        onClick={() => handleChangerStatut(u.id, 'suspendu')}
                        style={{
                          background: '#FEF2F2',
                          border: '1px solid #FECACA',
                          color: '#DC2626',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Suspendre
                      </button>
                    ) : (
                      <button
                        onClick={() => handleChangerStatut(u.id, 'actif')}
                        style={{
                          background: '#DCFCE7',
                          border: '1px solid #BBF7D0',
                          color: '#16A34A',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Activer
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
