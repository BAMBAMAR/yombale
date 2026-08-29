'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Activity, Server, Database, ShieldAlert, AlertTriangle, Download, RefreshCw,
  CheckCircle2, XCircle, HardDrive, Cpu, Radio, FileSpreadsheet, Megaphone, Lock
} from 'lucide-react'

interface SystemData {
  status: string
  timestamp: string
  server: {
    uptimeSeconds: number
    nodeVersion: string
    platform: string
    arch: string
    env: string
    memoryMB: {
      rss: number
      heapUsed: number
      heapTotal: number
      external: number
    }
  }
  services: {
    database: {
      status: string
      latencyMs: number
      poolTotal?: number
      poolIdle?: number
      poolWaiting?: number
    }
    wave: { configured: boolean; mode: string }
    cloudinary: { configured: boolean }
    sentry: { configured: boolean }
    whatsapp: { configured: boolean }
    email: { configured: boolean }
  }
  counts: {
    utilisateurs: number
    boutiques: number
    produits_marchands: number
    produits_scrapes: number
    commandes: number
    ventes_pos: number
    abonnements_actifs: number
    audit_logs: number
  }
  maintenance: {
    active: boolean
    message: string
  }
  banner: {
    active: boolean
    text: string
    level: string
  }
}

export default function AdminSystemClient({
  initialData,
  secret,
}: {
  initialData: SystemData | null
  secret: string
}) {
  const [data, setData] = useState<SystemData | null>(initialData)
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // Maintenance Form
  const [maintActive, setMaintActive] = useState(data?.maintenance?.active ?? false)
  const [maintMsg, setMaintMsg] = useState(data?.maintenance?.message || 'Plateforme en maintenance programmée.')
  const [savingMaint, setSavingMaint] = useState(false)

  // Banner Form
  const [bannerActive, setBannerActive] = useState(data?.banner?.active ?? false)
  const [bannerText, setBannerText] = useState(data?.banner?.text || '')
  const [bannerLevel, setBannerLevel] = useState(data?.banner?.level || 'info')
  const [savingBanner, setSavingBanner] = useState(false)

  const showToast = (type: 'ok' | 'err', text: string) => {
    setNotification({ type, text })
    setTimeout(() => setNotification(null), 4000)
  }

  const refreshHealth = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await fetch('/api/admin/system/health', {
        headers: { 'X-Admin-Secret': secret },
        cache: 'no-store',
      })
      if (res.ok) {
        const d = await res.json()
        setData(d)
        setMaintActive(d.maintenance?.active ?? false)
        setMaintMsg(d.maintenance?.message || '')
        setBannerActive(d.banner?.active ?? false)
        setBannerText(d.banner?.text || '')
        setBannerLevel(d.banner?.level || 'info')
        if (!silent) showToast('ok', 'Santé système actualisée avec succès !')
      }
    } catch (err: any) {
      if (!silent) showToast('err', err.message || 'Erreur réseau')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [secret])

  useEffect(() => {
    refreshHealth(true)
    const interval = setInterval(() => refreshHealth(true), 30000)
    return () => clearInterval(interval)
  }, [refreshHealth])

  const handleSaveMaintenance = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingMaint(true)
    try {
      const res = await fetch('/api/admin/system/maintenance', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Secret': secret,
        },
        body: JSON.stringify({ active: maintActive, message: maintMsg }),
      })
      if (res.ok) {
        showToast('ok', `Mode maintenance ${maintActive ? 'ACTIVÉ' : 'DÉSACTIVÉ'} avec succès !`)
      } else {
        showToast('err', 'Erreur lors de la mise à jour du mode maintenance.')
      }
    } catch (err: any) {
      showToast('err', err.message || 'Erreur réseau')
    } finally {
      setSavingMaint(false)
    }
  }

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingBanner(true)
    try {
      const res = await fetch('/api/admin/system/banner', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Secret': secret,
        },
        body: JSON.stringify({ active: bannerActive, text: bannerText, level: bannerLevel }),
      })
      if (res.ok) {
        showToast('ok', `Bannière système ${bannerActive ? 'PUBLIÉE' : 'MASQUÉE'} !`)
      } else {
        showToast('err', 'Erreur de mise à jour de la bannière.')
      }
    } catch (err: any) {
      showToast('err', err.message || 'Erreur réseau')
    } finally {
      setSavingBanner(false)
    }
  }

  const triggerExport = (type: string) => {
    const url = `/api/admin/export/${type}?secret=${encodeURIComponent(secret)}`
    // Téléchargement via fenêtre/lien avec header d'autorisation via cookie ou direct
    window.open(`/api/admin/export/${type}`, '_blank')
  }

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / 86400)
    const h = Math.floor((seconds % 86400) / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (d > 0) return `${d}j ${h}h ${m}min`
    if (h > 0) return `${h}h ${m}min`
    return `${m}min`
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 60 }}>
      {/* Toast Notification */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9999,
            padding: '12px 20px',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 14,
            color: '#fff',
            backgroundColor: notification.type === 'ok' ? '#16a34a' : '#dc2626',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {notification.type === 'ok' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          {notification.text}
        </div>
      )}

      {/* En-tête Page */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <h1 className="admin-page-titre" style={{ margin: 0 }}>
            🏥 Santé Système & Outils Avancés
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
            Supervision technique, latence base de données, mode maintenance, bannières d'annonces et exports de données.
          </p>
        </div>

        <button
          onClick={refreshHealth}
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: 8,
            padding: '8px 14px',
            fontSize: 13,
            fontWeight: 600,
            color: '#334155',
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Diagnostic Live
        </button>
      </div>

      {/* 📊 BLOC SANTÉ SERVEUR & SERVICES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 28 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 18, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>PostgreSQL</span>
            <Database size={18} color="#0284c7" />
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: data?.services?.database?.status === 'ok' ? '#16a34a' : '#dc2626' }}>
            {data?.services?.database?.status === 'ok' ? '🟢 Opérationnelle' : '🔴 Dégradée'}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
            Latence : <strong>{data?.services?.database?.latencyMs ?? 0} ms</strong>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: 18, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Mémoire Node.js</span>
            <Cpu size={18} color="#9333ea" />
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1e293b' }}>
            {data?.server?.memoryMB?.heapUsed || 0} MB
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
            Heap Total : {data?.server?.memoryMB?.heapTotal || 0} MB | RSS: {data?.server?.memoryMB?.rss || 0} MB
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: 18, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Uptime Serveur</span>
            <Activity size={18} color="#16a34a" />
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1e293b' }}>
            {formatUptime(data?.server?.uptimeSeconds || 0)}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
            Node {data?.server?.nodeVersion} ({data?.server?.env})
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: 18, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Intégrations Clés</span>
            <Radio size={18} color="#ea580c" />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
            <span style={{ background: data?.services?.wave?.configured ? '#dcfce7' : '#fee2e2', color: data?.services?.wave?.configured ? '#15803d' : '#b91c1c', padding: '2px 6px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
              Wave: {data?.services?.wave?.configured ? 'OK' : 'Manquant'}
            </span>
            <span style={{ background: data?.services?.whatsapp?.configured ? '#dcfce7' : '#fee2e2', color: data?.services?.whatsapp?.configured ? '#15803d' : '#b91c1c', padding: '2px 6px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
              WhatsApp: {data?.services?.whatsapp?.configured ? 'OK' : 'Manquant'}
            </span>
            <span style={{ background: data?.services?.cloudinary?.configured ? '#dcfce7' : '#fee2e2', color: data?.services?.cloudinary?.configured ? '#15803d' : '#b91c1c', padding: '2px 6px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
              Images: {data?.services?.cloudinary?.configured ? 'OK' : 'Local'}
            </span>
          </div>
        </div>
      </div>

      {/* 📥 BLOC EXPORTS CSV / EXCEL */}
      <div style={{ background: '#fff', borderRadius: 14, padding: 22, border: '1px solid #e2e8f0', marginBottom: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileSpreadsheet size={18} color="#16a34a" /> Centre d'Exportation Données (CSV / Excel)
        </h2>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>
          Téléchargez instantanément les flux de données au format CSV standard UTF-8 encodé pour Excel, Google Sheets et vos analyses comptables.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <button
            onClick={() => triggerExport('utilisateurs')}
            style={{
              padding: '12px 14px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              fontSize: 13,
              fontWeight: 700,
              color: '#1e293b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>👥 Utilisateurs ({data?.counts?.utilisateurs || 0})</span>
            <Download size={15} />
          </button>

          <button
            onClick={() => triggerExport('boutiques')}
            style={{
              padding: '12px 14px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              fontSize: 13,
              fontWeight: 700,
              color: '#1e293b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>🏪 Boutiques ({data?.counts?.boutiques || 0})</span>
            <Download size={15} />
          </button>

          <button
            onClick={() => triggerExport('ventes')}
            style={{
              padding: '12px 14px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              fontSize: 13,
              fontWeight: 700,
              color: '#1e293b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>🧾 Ventes POS ({data?.counts?.ventes_pos || 0})</span>
            <Download size={15} />
          </button>

          <button
            onClick={() => triggerExport('commandes')}
            style={{
              padding: '12px 14px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              fontSize: 13,
              fontWeight: 700,
              color: '#1e293b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>🛍️ Commandes ({data?.counts?.commandes || 0})</span>
            <Download size={15} />
          </button>

          <button
            onClick={() => triggerExport('abonnements')}
            style={{
              padding: '12px 14px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              fontSize: 13,
              fontWeight: 700,
              color: '#1e293b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>💎 Abonnements ({data?.counts?.abonnements_actifs || 0})</span>
            <Download size={15} />
          </button>

          <button
            onClick={() => triggerExport('leads')}
            style={{
              padding: '12px 14px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              fontSize: 13,
              fontWeight: 700,
              color: '#1e293b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>🎯 Leads Prospection</span>
            <Download size={15} />
          </button>
        </div>
      </div>

      {/* 🛠️ BLOCS MAINTENANCE & BANNIÈRE SYSTÈME */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {/* Mode Maintenance */}
        <div style={{ background: '#fff', borderRadius: 14, padding: 22, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <h2 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Lock size={18} color="#dc2626" /> Mode Maintenance
          </h2>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>
            Verrouille temporairement l'accès public au site tout en conservant l'accès pour les administrateurs.
          </p>

          <form onSubmit={handleSaveMaintenance}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <input
                type="checkbox"
                id="maintCheck"
                checked={maintActive}
                onChange={e => setMaintActive(e.target.checked)}
                style={{ width: 18, height: 18, cursor: 'pointer' }}
              />
              <label htmlFor="maintCheck" style={{ fontSize: 14, fontWeight: 700, color: maintActive ? '#dc2626' : '#334155', cursor: 'pointer' }}>
                {maintActive ? '🔴 Mode Maintenance ACTIF' : '⚪ Mode Maintenance DÉSACTIVÉ'}
              </label>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                Message affiché aux visiteurs
              </label>
              <textarea
                rows={3}
                value={maintMsg}
                onChange={e => setMaintMsg(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, resize: 'none' }}
              />
            </div>

            <button
              type="submit"
              disabled={savingMaint}
              style={{
                padding: '10px 18px',
                borderRadius: 8,
                border: 'none',
                background: maintActive ? '#dc2626' : '#1e293b',
                color: '#fff',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              {savingMaint ? 'Enregistrement...' : 'Sauvegarder la Maintenance'}
            </button>
          </form>
        </div>

        {/* Bannière d'Annonce Système */}
        <div style={{ background: '#fff', borderRadius: 14, padding: 22, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <h2 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Megaphone size={18} color="#0284c7" /> Bannière d'Alerte & Annonce
          </h2>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>
            Affiche un bandeau d'information permanent en haut de toutes les pages pour les utilisateurs et marchands.
          </p>

          <form onSubmit={handleSaveBanner}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <input
                type="checkbox"
                id="bannerCheck"
                checked={bannerActive}
                onChange={e => setBannerActive(e.target.checked)}
                style={{ width: 18, height: 18, cursor: 'pointer' }}
              />
              <label htmlFor="bannerCheck" style={{ fontSize: 14, fontWeight: 700, color: bannerActive ? '#0284c7' : '#334155', cursor: 'pointer' }}>
                {bannerActive ? '🔵 Bannière Active & Visible' : '⚪ Bannière Masquée'}
              </label>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                Texte du bandeau
              </label>
              <input
                type="text"
                placeholder="Ex: 🎉 Offre spéciale Tabaski : 1er mois offert sur tous les forfaits !"
                value={bannerText}
                onChange={e => setBannerText(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                Niveau visuel
              </label>
              <select
                value={bannerLevel}
                onChange={e => setBannerLevel(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}
              >
                <option value="info">ℹ️ Information (Bleu)</option>
                <option value="success">🎉 Succès / Promotion (Vert)</option>
                <option value="warning">⚠️ Avertissement (Orange)</option>
                <option value="critical">🚨 Urgent / Alerte (Rouge)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={savingBanner}
              style={{
                padding: '10px 18px',
                borderRadius: 8,
                border: 'none',
                background: '#0284c7',
                color: '#fff',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              {savingBanner ? 'Enregistrement...' : 'Mettre à jour la Bannière'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
