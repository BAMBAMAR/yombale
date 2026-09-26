'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  Home,
  Users,
  Calendar,
  AlertTriangle,
  Plus,
  TrendingUp,
  CheckCircle2,
  DollarSign,
  ArrowRight,
  Sparkles,
  Key
} from 'lucide-react'
import { DashboardRubriques } from './components/DashboardRubriques'
import { DashboardAlertesPrioritaires, CompteursAlertes } from './components/DashboardAlertesPrioritaires'
import DashboardMobileVisitesDuJour from './components/DashboardMobileVisitesDuJour'
import AgenceOnboardingGuide from './components/AgenceOnboardingGuide'
import { getImmoAuthHeaders } from '@/lib/immo-auth'

interface StatsData {
  biens: {
    actifs: number
    disponibles: number
    loues: number
    vendus: number
    annonces_publiees: number
  }
  visites: {
    aujourdhui: number
    a_venir: number
  }
  crm: {
    prospects_actifs: number
    nouveaux: number
    en_visite: number
    offre: number
  }
  locatif: {
    baux_actifs: number
    nb_impayes: number
    montant_impayes: number
    loyers_attendus_mois: number
    loyers_encaisses_mois: number
  }
}

export default function AgenceDashboardPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [stats, setStats] = useState<StatsData | null>(() => {
    if (typeof window !== 'undefined' && slug) {
      try {
        const cached = localStorage.getItem(`nopalou_offline_agence_stats_${slug}`)
        if (cached) return JSON.parse(cached)
      } catch (_) {}
    }
    return null
  })
  const [visitesAujourdhui, setVisitesAujourdhui] = useState<any[]>(() => {
    if (typeof window !== 'undefined' && slug) {
      try {
        const cached = localStorage.getItem(`nopalou_offline_agence_visites_${slug}`)
        if (cached) {
          const parsed = JSON.parse(cached)
          if (Array.isArray(parsed)) return parsed
        }
      } catch (_) {}
    }
    return []
  })
  const [compteurs, setCompteurs] = useState<CompteursAlertes>(() => {
    if (typeof window !== 'undefined' && slug) {
      try {
        const cached = localStorage.getItem(`nopalou_offline_agence_notifs_${slug}`)
        if (cached) {
          const parsed = JSON.parse(cached)
          if (parsed?.compteurs) return parsed.compteurs
        }
      } catch (_) {}
    }
    return {
      demandes_visite: 0,
      loyers_retard: 0,
      mandats_expirants: 0,
      baux_expirants: 0,
      tickets_urgents: 0,
      total_alertes: 0,
    }
  })
  const [loading, setLoading] = useState(() => {
    if (typeof window !== 'undefined' && slug) {
      const cached = localStorage.getItem(`nopalou_offline_agence_stats_${slug}`)
      if (cached) return false
    }
    return true
  })

  async function chargerDonnees() {
    // 1. Initialisation instantanée depuis le cache hors-ligne
    const cachedStatsStr = typeof window !== 'undefined' ? localStorage.getItem(`nopalou_offline_agence_stats_${slug}`) : null
    const cachedNotifsStr = typeof window !== 'undefined' ? localStorage.getItem(`nopalou_offline_agence_notifs_${slug}`) : null
    const cachedVisitesStr = typeof window !== 'undefined' ? localStorage.getItem(`nopalou_offline_agence_visites_${slug}`) : null
    let hasCache = Boolean(cachedStatsStr)

    if (cachedStatsStr) {
      try {
        const parsed = JSON.parse(cachedStatsStr)
        if (parsed) {
          setStats(parsed)
          hasCache = true
          setLoading(false)
        }
      } catch (_) {}
    }
    if (cachedNotifsStr) {
      try {
        const parsed = JSON.parse(cachedNotifsStr)
        if (parsed?.compteurs) setCompteurs(parsed.compteurs)
      } catch (_) {}
    }
    if (cachedVisitesStr) {
      try {
        const parsed = JSON.parse(cachedVisitesStr)
        if (Array.isArray(parsed)) setVisitesAujourdhui(parsed)
      } catch (_) {}
    }

    try {
      if (!hasCache) setLoading(true)
      const headers = getImmoAuthHeaders()

      const [resStats, resNotifs, resVisites] = await Promise.all([
        fetch(`/api/agences/${slug}/stats`, { headers }),
        fetch(`/api/agences/agence/${slug}/notifications`, { headers }),
        fetch(`/api/crm-immo/agence/${slug}/visites?date=aujourdhui`, { headers }),
      ])

      const [dataStats, dataNotifs, dataVisites] = await Promise.all([
        resStats.json(),
        resNotifs.json(),
        resVisites.json(),
      ])

      if (dataStats.success && dataStats.stats) {
        setStats(dataStats.stats)
        if (typeof window !== 'undefined') {
          localStorage.setItem(`nopalou_offline_agence_stats_${slug}`, JSON.stringify(dataStats.stats))
        }
      }
      if (dataNotifs.success && dataNotifs.compteurs) {
        setCompteurs(dataNotifs.compteurs)
        if (typeof window !== 'undefined') {
          localStorage.setItem(`nopalou_offline_agence_notifs_${slug}`, JSON.stringify(dataNotifs))
        }
      }
      if (dataVisites.success && Array.isArray(dataVisites.visites)) {
        setVisitesAujourdhui(dataVisites.visites)
        if (typeof window !== 'undefined') {
          localStorage.setItem(`nopalou_offline_agence_visites_${slug}`, JSON.stringify(dataVisites.visites))
        }
      }
    } catch (err) {
      console.warn('[LOAD_DASHBOARD_DATA_ERR] (mode hors-ligne actif)', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (slug) chargerDonnees()
  }, [slug])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748B' }}>
        <p>Calcul des indicateurs de l'agence...</p>
      </div>
    )
  }

  const s = stats || {
    biens: { actifs: 0, disponibles: 0, loues: 0, vendus: 0, annonces_publiees: 0 },
    visites: { aujourdhui: 0, a_venir: 0 },
    crm: { prospects_actifs: 0, nouveaux: 0, en_visite: 0, offre: 0 },
    locatif: { baux_actifs: 0, nb_impayes: 0, montant_impayes: 0, loyers_attendus_mois: 0, loyers_encaisses_mois: 0 }
  }

  return (
    <div>
      {/* ── Entête & Raccourcis Rapides ── */}
      <div className="agence-header">
        <div>
          <h1 className="agence-title">Tableau de bord Agence</h1>
          <p className="agence-subtitle">Vue d'ensemble de vos activités immobilières et gestion locative.</p>
        </div>

        {/* Boutons Desktop */}
        <div className="immo-desktop-flex" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link
            href={`/agence/${slug}/biens/nouveau`}
            className="btn-npl"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 14px',
              borderRadius: 8,
              background: 'var(--accent, #C75B00)',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: 13,
              textDecoration: 'none',
            }}
          >
            <Plus size={16} />
            Ajouter un bien
          </Link>
          <Link
            href={`/agence/${slug}/prospects`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 14px',
              borderRadius: 8,
              background: '#FFFFFF',
              border: '1px solid var(--border, #E8DDD2)',
              color: 'var(--navy, #1C2B4A)',
              fontWeight: 700,
              fontSize: 13,
              textDecoration: 'none',
            }}
          >
            <Users size={16} />
            Nouveau prospect
          </Link>
        </div>
      </div>

      {/* ── Raccourcis Tactiles Horizontaux Mobile (< 768px) ── */}
      <div className="immo-mobile-only" style={{ marginBottom: 14 }}>
        <div className="immo-chips-scroller">
          <Link
            href={`/agence/${slug}/biens/nouveau`}
            className="immo-chip"
            style={{ background: 'var(--accent, #C75B00)', color: '#FFFFFF', borderColor: 'var(--accent, #C75B00)' }}
          >
            <Plus size={14} />
            <span>Ajouter bien</span>
          </Link>
          <Link href={`/agence/${slug}/prospects`} className="immo-chip">
            <Users size={14} color="var(--navy, #1C2B4A)" />
            <span>Nouveau prospect</span>
          </Link>
          <Link href={`/agence/${slug}/visites`} className="immo-chip">
            <Calendar size={14} color="#0284C7" />
            <span>Planifier visite</span>
          </Link>
          <Link href={`/agence/${slug}/locatif`} className="immo-chip">
            <Key size={14} color="var(--price, #0A5C36)" />
            <span>Encaisser loyer</span>
          </Link>
        </div>
      </div>

      {/* ── Bannière Alertes Prioritaires (Modulaire) ── */}
      <DashboardAlertesPrioritaires slug={slug} compteurs={compteurs} />

      {/* ── Visites du Jour (Mobile-First) ── */}
      <div className="immo-mobile-only" style={{ flexDirection: 'column' }}>
        <DashboardMobileVisitesDuJour
          slug={slug}
          visites={visitesAujourdhui}
          nbAujourdhui={s.visites.aujourdhui}
        />
      </div>

      {/* ── Guide Onboarding Nouvel Espace Agence ── */}
      <AgenceOnboardingGuide slug={slug} totalBiens={s.biens.actifs} />

      {/* ── KPI Grid (Priorité 1) ── */}
      <div className="kpi-grid">
        {/* Card 1 : Biens Actifs */}
        <Link href={`/agence/${slug}/biens`} className="kpi-card" style={{ textDecoration: 'none' }}>
          <div className="kpi-card-header">
            <span className="kpi-card-title">Portefeuille Biens</span>
            <div className="kpi-card-icon">
              <Home size={18} />
            </div>
          </div>
          <div className="kpi-card-value">{s.biens.actifs}</div>
          <div className="kpi-card-sub">
            {s.biens.disponibles} disponible{s.biens.disponibles > 1 ? 's' : ''} • {s.biens.loues} loué{s.biens.loues > 1 ? 's' : ''}
          </div>
        </Link>

        {/* Card 2 : Annonces Publiques */}
        <Link href={`/agence/${slug}/biens`} className="kpi-card" style={{ textDecoration: 'none' }}>
          <div className="kpi-card-header">
            <span className="kpi-card-title">Annonces En Ligne</span>
            <div className="kpi-card-icon" style={{ color: 'var(--accent, #C75B00)' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="kpi-card-value">{s.biens.annonces_publiees}</div>
          <div
            className="kpi-card-sub"
            style={{
              color: s.biens.annonces_publiees === 0 ? 'var(--accent, #C75B00)' : '#64748B',
              fontWeight: s.biens.annonces_publiees === 0 ? 700 : 500,
            }}
          >
            {s.biens.annonces_publiees === 0 ? 'Diffuser un bien →' : 'Diffusées sur Nopalou Immo'}
          </div>
        </Link>

        {/* Card 3 : Visites */}
        <Link href={`/agence/${slug}/visites`} className="kpi-card" style={{ textDecoration: 'none' }}>
          <div className="kpi-card-header">
            <span className="kpi-card-title">Visites à venir</span>
            <div className="kpi-card-icon" style={{ color: '#0284C7' }}>
              <Calendar size={18} />
            </div>
          </div>
          <div className="kpi-card-value">{s.visites.a_venir}</div>
          <div className="kpi-card-sub">
            {s.visites.aujourdhui > 0
              ? `${s.visites.aujourdhui} programmée${s.visites.aujourdhui > 1 ? 's' : ''} aujourd'hui`
              : "Aucune visite aujourd'hui"}
          </div>
        </Link>

        {/* Card 4 : Impayés */}
        <Link
          href={`/agence/${slug}/locatif`}
          className="kpi-card"
          style={{
            textDecoration: 'none',
            borderColor: s.locatif.nb_impayes > 0 ? '#FCA5A5' : 'var(--border, #E8DDD2)',
          }}
        >
          <div className="kpi-card-header">
            <span className="kpi-card-title">Suivi des Loyers</span>
            <div className="kpi-card-icon" style={{ color: s.locatif.nb_impayes > 0 ? '#DC2626' : '#166534' }}>
              {s.locatif.nb_impayes > 0 ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
            </div>
          </div>
          <div className="kpi-card-value" style={{ color: s.locatif.nb_impayes > 0 ? '#DC2626' : 'var(--navy, #1C2B4A)' }}>
            {s.locatif.nb_impayes > 0 ? `${s.locatif.nb_impayes} impayé${s.locatif.nb_impayes > 1 ? 's' : ''}` : 'À jour'}
          </div>
          <div className="kpi-card-sub">
            {s.locatif.nb_impayes > 0
              ? `${Number(s.locatif.montant_impayes).toLocaleString('fr-FR')} FCFA en attente`
              : `${s.locatif.baux_actifs} ${s.locatif.baux_actifs > 1 ? 'baux actifs' : 'bail actif'} sous gestion`}
          </div>
        </Link>
      </div>

      {/* ── Section 2 Colonnes : CRM & Gestion Locative ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 16 }}>
        {/* Pipeline CRM Prospects */}
        <div className="agence-card">
          <div className="agence-card-header">
            <div className="agence-card-title">
              <Users size={18} />
              Pipeline CRM Prospects
            </div>
            <Link
              href={`/agence/${slug}/prospects`}
              style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--accent, #C75B00)', textDecoration: 'none' }}
            >
              Gérer CRM →
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, textAlign: 'center' }}>
            <div style={{ padding: '10px 4px', background: '#FEF3C7', borderRadius: 8 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: '#92400E' }}>Nouveaux</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#92400E' }}>{s.crm.nouveaux}</div>
            </div>
            <div style={{ padding: '10px 4px', background: '#E0F2FE', borderRadius: 8 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: '#0369A1' }}>En Visite</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#0369A1' }}>{s.crm.en_visite}</div>
            </div>
            <div style={{ padding: '10px 4px', background: '#EDE9FE', borderRadius: 8 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: '#5B21B6' }}>Offres</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#5B21B6' }}>{s.crm.offre}</div>
            </div>
            <div style={{ padding: '10px 4px', background: '#DCFCE7', borderRadius: 8 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: '#166534' }}>Actifs</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#166534' }}>{s.crm.prospects_actifs}</div>
            </div>
          </div>
        </div>

        {/* Encaissement des Loyers du Mois */}
        <div className="agence-card">
          <div className="agence-card-header">
            <div className="agence-card-title">
              <DollarSign size={18} />
              Loyers du Mois en Cours
            </div>
            <Link
              href={`/agence/${slug}/locatif`}
              style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--accent, #C75B00)', textDecoration: 'none' }}
            >
              Gérer les baux →
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#64748B' }}>Loyers attendus :</span>
              <span style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                {Number(s.locatif.loyers_attendus_mois).toLocaleString('fr-FR')} FCFA
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#64748B' }}>Loyers encaissés :</span>
              <span style={{ fontWeight: 800, color: '#166534' }}>
                {Number(s.locatif.loyers_encaisses_mois).toLocaleString('fr-FR')} FCFA
              </span>
            </div>
            <div
              style={{
                width: '100%',
                height: 8,
                background: '#E2E8F0',
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  background: '#16a34a',
                  width: `${
                    s.locatif.loyers_attendus_mois > 0
                      ? Math.min(100, Math.round((s.locatif.loyers_encaisses_mois / s.locatif.loyers_attendus_mois) * 100))
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Espaces & Outils Thématiques de l'Agence ── */}
      <DashboardRubriques slug={slug} />
    </div>
  )
}
