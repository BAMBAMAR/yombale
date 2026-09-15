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
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Clock,
  DollarSign,
  Share2,
  ExternalLink,
  UserCheck,
  Key,
  Wrench,
  Wallet,
  ShieldAlert,
  Settings
} from 'lucide-react'

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

  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  async function chargerStats() {
    try {
      setLoading(true)
      const res = await fetch(`/api/agences/${slug}/stats`)
      const data = await res.json()
      if (data.success) {
        setStats(data.stats)
      }
    } catch (err) {
      console.error('[LOAD_STATS_ERR]', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (slug) chargerStats()
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

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
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

      {/* ── KPI Grid (Priorité 1) ── */}
      <div className="kpi-grid">
        {/* Card 1 : Biens Actifs */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-title">Portefeuille Biens</span>
            <div className="kpi-card-icon">
              <Home size={18} />
            </div>
          </div>
          <div className="kpi-card-value">{s.biens.actifs}</div>
          <div className="kpi-card-sub">
            {s.biens.disponibles} disponibles • {s.biens.loues} loués
          </div>
        </div>

        {/* Card 2 : Annonces Publiques */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-title">Annonces En Ligne</span>
            <div className="kpi-card-icon" style={{ color: 'var(--accent, #C75B00)' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="kpi-card-value">{s.biens.annonces_publiees}</div>
          <div className="kpi-card-sub">Diffusées sur Nopalou Immo</div>
        </div>

        {/* Card 3 : Visites */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-title">Visites à venir</span>
            <div className="kpi-card-icon">
              <Calendar size={18} />
            </div>
          </div>
          <div className="kpi-card-value">{s.visites.a_venir}</div>
          <div className="kpi-card-sub">
            {s.visites.aujourdhui > 0 ? `${s.visites.aujourdhui} programmée(s) aujourd'hui` : "Aucune visite aujourd'hui"}
          </div>
        </div>

        {/* Card 4 : Impayés */}
        <div className="kpi-card" style={{ borderColor: s.locatif.nb_impayes > 0 ? '#FCA5A5' : 'var(--border, #E8DDD2)' }}>
          <div className="kpi-card-header">
            <span className="kpi-card-title">Suivi des Loyers</span>
            <div className="kpi-card-icon" style={{ color: s.locatif.nb_impayes > 0 ? '#DC2626' : '#166534' }}>
              {s.locatif.nb_impayes > 0 ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
            </div>
          </div>
          <div className="kpi-card-value" style={{ color: s.locatif.nb_impayes > 0 ? '#DC2626' : 'var(--navy, #1C2B4A)' }}>
            {s.locatif.nb_impayes > 0 ? `${s.locatif.nb_impayes} impayé(s)` : 'À jour'}
          </div>
          <div className="kpi-card-sub">
            {s.locatif.nb_impayes > 0
              ? `${Number(s.locatif.montant_impayes).toLocaleString('fr-FR')} FCFA en attente`
              : `${s.locatif.baux_actifs} baux actifs sous gestion`}
          </div>
        </div>
      </div>

      {/* ── Section 2 Colonnes : CRM & Gestion Locative ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
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
              Voir Kanban →
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, textAlign: 'center' }}>
            <div style={{ padding: '12px 8px', background: '#FEF3C7', borderRadius: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#92400E' }}>Nouveaux</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#92400E' }}>{s.crm.nouveaux}</div>
            </div>
            <div style={{ padding: '12px 8px', background: '#E0F2FE', borderRadius: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#0369A1' }}>En Visite</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#0369A1' }}>{s.crm.en_visite}</div>
            </div>
            <div style={{ padding: '12px 8px', background: '#EDE9FE', borderRadius: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#5B21B6' }}>Offres</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#5B21B6' }}>{s.crm.offre}</div>
            </div>
            <div style={{ padding: '12px 8px', background: '#DCFCE7', borderRadius: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#166534' }}>Total Actifs</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#166534' }}>{s.crm.prospects_actifs}</div>
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
              <span style={{ color: '#64748B' }}>Loyers attendus :</span>
              <span style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                {Number(s.locatif.loyers_attendus_mois).toLocaleString('fr-FR')} FCFA
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
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

      {/* ── Accès Rapide aux Espaces & Outils de l'Agence ── */}
      <div className="agence-card" style={{ marginTop: 24 }}>
        <div className="agence-card-header">
          <div className="agence-card-title">
            <TrendingUp size={18} />
            Espaces & Outils de Gestion de l'Agence
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
          {[
            {
              href: `/agence/${slug}/social`,
              title: 'Marketing & Réseaux Sociaux',
              desc: 'Générateur de posts WhatsApp, Facebook, Instagram',
              icon: Share2,
              color: '#16a34a',
            },
            {
              href: `/agence/${slug}/vitrine`,
              title: 'Vitrine Publique Agence',
              desc: 'Page publique avec catalogue de biens & contact WhatsApp',
              icon: ExternalLink,
              color: 'var(--accent, #C75B00)',
            },
            {
              href: `/agence/${slug}/locataires`,
              title: 'Gestion des Locataires',
              desc: 'Répertoire des locataires, baux et contact direct',
              icon: UserCheck,
              color: '#0369A1',
            },
            {
              href: `/agence/${slug}/locatif`,
              title: 'Loyers & Quittances',
              desc: 'Encaissements Wave/OM/Cash et quittances numérotées',
              icon: Key,
              color: '#166534',
            },
            {
              href: `/agence/${slug}/maintenance`,
              title: 'Maintenance & Travaux',
              desc: 'Gestion des incidents, artisans et coûts travaux',
              icon: Wrench,
              color: '#D97706',
            },
            {
              href: `/agence/${slug}/compta`,
              title: 'Comptabilité & Commissions',
              desc: 'Honoraires agence, reversements nets bailleurs',
              icon: Wallet,
              color: 'var(--navy, #1C2B4A)',
            },
            {
              href: `/agence/${slug}/fiscalite`,
              title: 'Fiscalité & Légal',
              desc: 'NINEA, RCCM, TVA 18%, timbre fiscal & CGV',
              icon: ShieldAlert,
              color: '#7C3AED',
            },
            {
              href: `/agence/${slug}/parametres`,
              title: 'Paramètres & Statut',
              desc: 'Activer/pause/vacances et configuration de l’agence',
              icon: Settings,
              color: '#475569',
            },
          ].map(m => {
            const Icon = m.icon
            return (
              <Link
                key={m.href}
                href={m.href}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: 14,
                  borderRadius: 10,
                  border: '1px solid var(--border, #E8DDD2)',
                  background: '#FFFFFF',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                }}
                className="kpi-card"
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: 'rgba(28, 43, 74, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: m.color,
                    flexShrink: 0,
                  }}
                >
                  <Icon size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 750, color: 'var(--navy, #1C2B4A)', fontSize: 13.5 }}>
                    {m.title}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2, lineHeight: 1.4 }}>
                    {m.desc}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
