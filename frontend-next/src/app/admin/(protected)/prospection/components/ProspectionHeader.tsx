import { Zap, Sparkles, UserPlus, Users, Send, MessageSquare, CheckCircle2, Ban, Building2, Clock } from 'lucide-react'
import type { StatsLeads } from './types'

interface Props {
  stats: StatsLeads
  isCleaningLeads: boolean
  isAutoSourcing: boolean
  isReconciling?: boolean
  onNettoyerLeads: () => void
  onAutoSource: () => void
  onReconcilierAgences?: () => void
  onOpenAddModal: () => void
}

export default function ProspectionHeader({
  stats,
  isCleaningLeads,
  isAutoSourcing,
  isReconciling = false,
  onNettoyerLeads,
  onAutoSource,
  onReconcilierAgences,
  onOpenAddModal,
}: Props) {
  const boutiquesCount = stats.boutiques_converties !== undefined ? stats.boutiques_converties : stats.convertis
  const agencesCount = stats.agences_converties || 0

  const kpis = [
    { label: 'Total Collectés', val: stats.total, color: '#1C2B4A', bg: '#F8FAFC', icon: Users, pct: null },
    { label: 'Qualifiés (≥70)', val: stats.qualifies, color: '#7C3AED', bg: '#F5F3FF', icon: Sparkles, pct: stats.total ? Math.round(stats.qualifies / stats.total * 100) : 0 },
    { label: 'Nouveaux', val: stats.nouveaux, color: '#2563EB', bg: '#EFF6FF', icon: UserPlus, pct: stats.total ? Math.round(stats.nouveaux / stats.total * 100) : 0 },
    { label: 'Contactés', val: stats.contactes, color: '#C75B00', bg: '#FFF7ED', icon: Send, pct: stats.total ? Math.round(stats.contactes / stats.total * 100) : 0 },
    { label: 'En Discussion', val: stats.en_discussion, color: '#D97706', bg: '#FFFBEB', icon: MessageSquare, pct: stats.total ? Math.round(stats.en_discussion / stats.total * 100) : 0 },
    { label: 'Boutiques Créées', val: boutiquesCount, color: '#16A34A', bg: '#F0FDF4', icon: CheckCircle2, pct: stats.contactes ? Math.round(boutiquesCount / stats.contactes * 100) : 0 },
    { label: 'Agences Immo', val: agencesCount, color: '#0284C7', bg: '#F0F9FF', icon: Building2, pct: null },
    { label: 'Sans Réponse', val: stats.sans_reponse || 0, color: '#64748B', bg: '#F8FAFC', icon: Clock, pct: stats.contactes ? Math.round((stats.sans_reponse || 0) / stats.contactes * 100) : 0 },
    { label: 'Invalides / Hors cible', val: stats.invalides + (stats.desinscrits || 0), color: '#94A3B8', bg: '#F1F5F9', icon: Ban, pct: stats.total ? Math.round((stats.invalides + (stats.desinscrits || 0)) / stats.total * 100) : 0 },
  ]

  return (
    <>
      {/* Header Principal */}
      <div style={{
        background: 'linear-gradient(135deg, #1C2B4A 0%, #0F172A 100%)',
        borderRadius: 20, padding: '32px 36px', color: '#fff', marginBottom: 28,
        border: '2px solid rgba(22,163,74,0.3)', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: -30, top: -30, width: 220, height: 220, borderRadius: '50%', background: 'rgba(22,163,74,0.15)' }} />

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(22,163,74,0.2)', padding: '6px 14px', borderRadius: 20, marginBottom: 12 }}>
          <Zap size={16} color="#4ADE80" />
          <span style={{ fontSize: 13, fontWeight: 800, color: '#DCFCE7', letterSpacing: '0.05em' }}>
            AUTOMATISATION &amp; PROSPECTION COMMERCIALE SÉNÉGAL
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 30, fontWeight: 900, margin: '0 0 8px' }}>
              CRM Leads &amp; Moteur de Prospection Automatisée
            </h1>
            <p style={{ fontSize: 15, color: '#CBD5E1', maxWidth: 840, lineHeight: 1.5, margin: 0 }}>
              Collectez des contacts qualifiés de commerçants et agences à Dakar, normalisez les numéros (+221 Orange / Free / Expresso), dispatchez des messages WhatsApp personnalisés par persona.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {onReconcilierAgences && (
              <button
                onClick={onReconcilierAgences}
                disabled={isReconciling}
                style={{
                  background: '#0284C7', color: '#fff', border: 'none', padding: '12px 18px',
                  borderRadius: 12, fontWeight: 800, fontSize: 14, cursor: isReconciling ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 14px rgba(2,132,199,0.3)',
                }}
                title="Rapprocher automatiquement les agences et boutiques clientes existantes"
              >
                <Building2 size={18} />
                <span>{isReconciling ? 'Rapprochement...' : 'Rapprocher Agences & Boutiques'}</span>
              </button>
            )}

            <button
              onClick={onNettoyerLeads}
              disabled={isCleaningLeads}
              style={{
                background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)', color: '#fff', border: 'none', padding: '12px 18px',
                borderRadius: 12, fontWeight: 800, fontSize: 14, cursor: isCleaningLeads ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 14px rgba(124,58,237,0.35)',
              }}
            >
              <Sparkles size={18} />
              <span>{isCleaningLeads ? 'Nettoyage en cours...' : 'Nettoyer & Enrichir Base'}</span>
            </button>

            <button
              onClick={onAutoSource}
              disabled={isAutoSourcing}
              style={{
                background: '#16A34A', color: '#fff', border: 'none', padding: '12px 18px',
                borderRadius: 12, fontWeight: 800, fontSize: 14, cursor: isAutoSourcing ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 14px rgba(22,163,74,0.3)',
              }}
            >
              <Sparkles size={18} />
              <span>{isAutoSourcing ? 'Auto-Sourcing...' : 'Auto-Sourcing'}</span>
            </button>

            <button
              onClick={onOpenAddModal}
              style={{
                background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)',
                padding: '12px 18px', borderRadius: 12, fontWeight: 800, fontSize: 14, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <UserPlus size={18} />
              <span>Nouveau Lead</span>
            </button>
          </div>
        </div>
      </div>

      {/* Funnel Prospection Nopalou */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
        {/* Ligne 1 : Funnel 7 étapes */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          {kpis.map((kpi, idx) => {
            const Icon = kpi.icon
            return (
              <div key={idx} style={{
                background: '#fff', border: `1.5px solid ${kpi.color}22`, borderRadius: 14,
                padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 2 }}>
                    {kpi.label}
                  </span>
                  <span style={{ fontSize: 26, fontWeight: 900, color: kpi.color }}>
                    {kpi.val}
                  </span>
                  {kpi.pct !== null && (
                    <span style={{ fontSize: 11, color: '#94A3B8', display: 'block' }}>
                      {kpi.pct}% du total
                    </span>
                  )}
                </div>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={20} color={kpi.color} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Ligne 2 : Qualité & Fit Score */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <div style={{ background: 'linear-gradient(135deg, #1C2B4A, #2D4A8A)', borderRadius: 14, padding: '16px 20px', color: '#fff' }}>
            <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.8, marginBottom: 4 }}>Score Qualité Moyen</div>
            <div style={{ fontSize: 30, fontWeight: 900 }}>{stats.avg_score}<span style={{ fontSize: 16, opacity: 0.7 }}>/100</span></div>
            <div style={{ marginTop: 8, background: 'rgba(255,255,255,0.15)', borderRadius: 6, height: 6 }}>
              <div style={{ width: `${stats.avg_score}%`, background: '#60A5FA', borderRadius: 6, height: 6, transition: 'width 0.6s' }} />
            </div>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #059669, #16A34A)', borderRadius: 14, padding: '16px 20px', color: '#fff' }}>
            <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.8, marginBottom: 4 }}>Nopalou Fit Score Moyen</div>
            <div style={{ fontSize: 30, fontWeight: 900 }}>{stats.avg_fit_score}<span style={{ fontSize: 16, opacity: 0.7 }}>/100</span></div>
            <div style={{ marginTop: 8, background: 'rgba(255,255,255,0.15)', borderRadius: 6, height: 6 }}>
              <div style={{ width: `${stats.avg_fit_score}%`, background: '#6EE7B7', borderRadius: 6, height: 6, transition: 'width 0.6s' }} />
            </div>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #7C3AED, #9333EA)', borderRadius: 14, padding: '16px 20px', color: '#fff' }}>
            <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.8, marginBottom: 4 }}>Leads Haut Fit (≥70%)</div>
            <div style={{ fontSize: 30, fontWeight: 900 }}>{stats.haut_fit}</div>
            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
              Taux de conversion estimé : {stats.haut_fit && stats.total ? Math.round(stats.haut_fit / stats.total * 100) : 0}% de la base
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
