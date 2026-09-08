'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Link2, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck, 
  ExternalLink, Search, Power, Trash2, Globe, MessageCircle, 
  ShoppingBag, Sparkles, Filter
} from 'lucide-react'

interface AdminIntegrationsClientProps {
  initialStats: any
  initialAccounts: any[]
  secret: string
}

export default function AdminIntegrationsClient({
  initialStats,
  initialAccounts,
  secret,
}: AdminIntegrationsClientProps) {
  const [stats, setStats] = useState<any>(initialStats || {})
  const [accounts, setAccounts] = useState<any[]>(initialAccounts || [])
  const [loading, setLoading] = useState(false)
  const [platformFilter, setPlatformFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  // Rechargement des données
  async function reloadData() {
    try {
      setLoading(true)
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const [statsRes, accountsRes] = await Promise.all([
        fetch(`${backendUrl}/api/admin/integrations/stats`, {
          headers: { 'X-Admin-Secret': secret },
        }),
        fetch(`${backendUrl}/api/admin/integrations/accounts?limit=100`, {
          headers: { 'X-Admin-Secret': secret },
        }),
      ])

      if (statsRes.ok) setStats(await statsRes.json())
      if (accountsRes.ok) {
        const d = await accountsRes.json()
        setAccounts(d.accounts || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Bascule d'un interrupteur global (Kill-Switch)
  async function toggleFlag(key: string, currentStatus: boolean) {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const res = await fetch(`${backendUrl}/api/admin/integrations/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Secret': secret,
        },
        body: JSON.stringify({ key, actif: !currentStatus }),
      })

      if (res.ok) {
        setActionMessage(`Interrupteur ${key} mis à jour : ${!currentStatus ? 'Activé' : 'Désactivé'}`)
        setTimeout(() => setActionMessage(null), 3000)
        await reloadData()
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Déconnexion forcée d'un compte social
  async function handleDisconnectAccount(accountId: string, nomCompte: string) {
    if (!confirm(`Confirmer la déconnexion forcée du compte "${nomCompte}" ?`)) return

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const res = await fetch(`${backendUrl}/api/admin/integrations/accounts/${accountId}/disconnect`, {
        method: 'POST',
        headers: { 'X-Admin-Secret': secret },
      })

      if (res.ok) {
        setActionMessage(`Compte ${nomCompte} déconnecté par modération admin.`)
        setTimeout(() => setActionMessage(null), 3000)
        setAccounts(prev => prev.map(a => a.id === accountId ? { ...a, statut: 'deconnecte' } : a))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const filteredAccounts = accounts.filter(acc => {
    const matchPlat = platformFilter === 'all' || acc.plateforme === platformFilter
    const matchQ = !searchQuery ||
      acc.nom_compte.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.boutique_nom.toLowerCase().includes(searchQuery.toLowerCase())
    return matchPlat && matchQ
  })

  return (
    <div style={{ padding: '24px 16px', maxWidth: 1280, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 24 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff7f0', color: '#C75B00', padding: '3px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', marginBottom: 6 }}>
            <Link2 size={13} /> Pilotage Central
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: '#0f172a' }}>
            Supervision des Intégrations & Réseaux Sociaux
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13.5, color: '#64748b' }}>
            Surveillez l&apos;état des connecteurs Instagram, TikTok, Facebook, WhatsApp, Pixels et passerelles Wave/Stripe.
          </p>
        </div>

        <button
          onClick={reloadData}
          disabled={loading}
          style={{
            background: '#ffffff',
            border: '1.5px solid #cbd5e1',
            borderRadius: 10,
            padding: '9px 16px',
            fontSize: 13,
            fontWeight: 800,
            color: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          <RefreshCw size={15} className={loading ? 'spin' : ''} />
          <span>Actualiser</span>
        </button>
      </div>

      {actionMessage && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 13, fontWeight: 700 }}>
          {actionMessage}
        </div>
      )}

      {/* ── CARTES D'ÉTAT DES PLATEFORMES SOCIALES ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
        {/* Instagram */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 22 }}>📸</span>
              <span style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>Instagram</span>
            </div>
            <span style={{ fontSize: 11, background: '#fdf2f8', color: '#db2777', padding: '2px 8px', borderRadius: 12, fontWeight: 800 }}>
              Graph / oEmbed
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 12.5, color: '#64748b' }}>Comptes liés</span>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#0f172a' }}>
              {stats.plateformes?.find((p: any) => p.plateforme === 'instagram')?.total_comptes || 0}
            </span>
          </div>
          <span style={{ fontSize: 11.5, color: '#16a34a', fontWeight: 700 }}>🟢 Connecteur opérationnel</span>
        </div>

        {/* TikTok */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 22 }}>🎵</span>
              <span style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>TikTok</span>
            </div>
            <span style={{ fontSize: 11, background: '#f1f5f9', color: '#0f172a', padding: '2px 8px', borderRadius: 12, fontWeight: 800 }}>
              oEmbed Officiel
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 12.5, color: '#64748b' }}>Comptes liés</span>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#0f172a' }}>
              {stats.plateformes?.find((p: any) => p.plateforme === 'tiktok')?.total_comptes || 0}
            </span>
          </div>
          <span style={{ fontSize: 11.5, color: '#16a34a', fontWeight: 700 }}>🟢 Connecteur opérationnel</span>
        </div>

        {/* Facebook */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 22 }}>📘</span>
              <span style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>Facebook</span>
            </div>
            <span style={{ fontSize: 11, background: '#eff6ff', color: '#1d4ed8', padding: '2px 8px', borderRadius: 12, fontWeight: 800 }}>
              Graph / SDK
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 12.5, color: '#64748b' }}>Comptes liés</span>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#0f172a' }}>
              {stats.plateformes?.find((p: any) => p.plateforme === 'facebook')?.total_comptes || 0}
            </span>
          </div>
          <span style={{ fontSize: 11.5, color: '#16a34a', fontWeight: 700 }}>🟢 Connecteur opérationnel</span>
        </div>

        {/* Tracking & Pixels */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 22 }}>🎯</span>
              <span style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>Pixels & Tracking</span>
            </div>
            <span style={{ fontSize: 11, background: '#fff7f0', color: '#C75B00', padding: '2px 8px', borderRadius: 12, fontWeight: 800 }}>
              Meta / TikTok / GA4
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 12.5, color: '#64748b' }}>Boutiques équipées</span>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#C75B00' }}>
              {(stats.tracking_boutiques?.avec_meta_pixel || 0) + (stats.tracking_boutiques?.avec_tiktok_pixel || 0)}
            </span>
          </div>
          <span style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600 }}>
            Meta : {stats.tracking_boutiques?.avec_meta_pixel || 0} · TikTok : {stats.tracking_boutiques?.avec_tiktok_pixel || 0} · GA4 : {stats.tracking_boutiques?.avec_ga4 || 0}
          </span>
        </div>
      </div>

      {/* ── TABLE DES COMPTES SOCIAUX CONNECTÉS PAR LES MARCHANDS ── */}
      <div style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0f172a' }}>
              Comptes Réseaux Sociaux Liés aux Boutiques ({filteredAccounts.length})
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#64748b' }}>
              Vérifiez les comptes marchands, le volume de publications importées et modérez si nécessaire.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {/* Filtre Plateforme */}
            <select
              value={platformFilter}
              onChange={e => setPlatformFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 13,
                outline: 'none',
                background: '#fff',
              }}
            >
              <option value="all">Toutes plateformes</option>
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="facebook">Facebook</option>
            </select>

            {/* Recherche */}
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Rechercher boutique ou compte..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  padding: '8px 12px 8px 32px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>
          </div>
        </div>

        {filteredAccounts.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b', fontSize: 13.5 }}>
            Aucun compte social connecté ne correspond aux filtres.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 800 }}>
                  <th style={{ padding: '12px 18px' }}>Plateforme</th>
                  <th style={{ padding: '12px 18px' }}>Identifiant / Handle</th>
                  <th style={{ padding: '12px 18px' }}>Boutique Nopalou</th>
                  <th style={{ padding: '12px 18px' }}>Posts Liés</th>
                  <th style={{ padding: '12px 18px' }}>Statut</th>
                  <th style={{ padding: '12px 18px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map(acc => (
                  <tr key={acc.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 18px', fontWeight: 800 }}>
                      <span style={{ textTransform: 'capitalize' }}>
                        {acc.plateforme === 'instagram' && '📸 Instagram'}
                        {acc.plateforme === 'tiktok' && '🎵 TikTok'}
                        {acc.plateforme === 'facebook' && '📘 Facebook'}
                        {acc.plateforme === 'youtube' && '▶️ YouTube'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', fontWeight: 700, color: '#0f172a' }}>
                      {acc.profil_url ? (
                        <a href={acc.profil_url} target="_blank" rel="noopener noreferrer" style={{ color: '#C75B00', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <span>{acc.nom_compte}</span>
                          <ExternalLink size={12} />
                        </a>
                      ) : (
                        acc.nom_compte
                      )}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <Link href={`/boutiques/${acc.boutique_slug || acc.boutique_id}`} target="_blank" style={{ color: '#0f172a', fontWeight: 700, textDecoration: 'none' }}>
                        {acc.boutique_nom}
                      </Link>
                    </td>
                    <td style={{ padding: '14px 18px', fontWeight: 800, color: '#475569' }}>
                      {acc.nb_posts || 0} publication(s)
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      {acc.statut === 'actif' ? (
                        <span style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '2px 8px', borderRadius: 12, fontSize: 11.5, fontWeight: 800 }}>
                          🟢 Actif
                        </span>
                      ) : (
                        <span style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '2px 8px', borderRadius: 12, fontSize: 11.5, fontWeight: 800 }}>
                          ⚪ Déconnecté
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      {acc.statut === 'actif' && (
                        <button
                          onClick={() => handleDisconnectAccount(acc.id, acc.nom_compte)}
                          style={{
                            background: '#ffffff',
                            border: '1px solid #fecaca',
                            color: '#dc2626',
                            borderRadius: 6,
                            padding: '4px 10px',
                            fontSize: 11.5,
                            fontWeight: 800,
                            cursor: 'pointer',
                          }}
                        >
                          Forcer déconnexion
                        </button>
                      )}
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
