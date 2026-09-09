'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Sparkles, Target, ArrowRight, CheckCircle2, AlertTriangle, XCircle,
  TrendingUp, BarChart3, Users, Store, MessageSquare, ShieldAlert,
  HelpCircle, RefreshCw, Send, ChevronRight, Clock, MapPin, Layers,
  Phone, Eye, Info
} from 'lucide-react'

interface Props {
  initialOverview: any
  initialRecommandation: any
  secret: string
}

export default function IntelligenceClient({
  initialOverview,
  initialRecommandation,
  secret,
}: Props) {
  const [overview, setOverview] = useState<any>(initialOverview)
  const [reco, setReco] = useState<any>(initialRecommandation)
  const [loading, setLoading] = useState(false)
  const [selectedCampagneDiag, setSelectedCampagneDiag] = useState<any>(null)
  const [selectedLeadTimeline, setSelectedLeadTimeline] = useState<any>(null)
  const [loadingTimeline, setLoadingTimeline] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  const refreshAll = async () => {
    setLoading(true)
    try {
      const [resO, resR] = await Promise.all([
        fetch('/api/prospection/intelligence/overview', {
          headers: { 'x-admin-secret': secret },
        }),
        fetch('/api/prospection/intelligence/recommandation', {
          headers: { 'x-admin-secret': secret },
        })
      ])
      if (resO.ok) setOverview(await resO.ok ? await resO.json() : overview)
      if (resR.ok) {
        const d = await resR.json()
        setReco(d.recommandation)
      }
      showToast('Intelligence et analyses actualisées avec succès')
    } catch (err: any) {
      showToast(`Erreur: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const inspectLead = async (leadId: string) => {
    setLoadingTimeline(true)
    setSelectedLeadTimeline(null)
    try {
      const res = await fetch(`/api/prospection/leads/${leadId}/timeline`, {
        headers: { 'x-admin-secret': secret },
      })
      if (res.ok) {
        setSelectedLeadTimeline(await res.json())
      }
    } catch (_) {}
    finally {
      setLoadingTimeline(false)
    }
  }

  const topSegments = overview?.top_segments || []
  const topSources = overview?.top_sources || []
  const topZones = overview?.top_zones || []
  const campagnesAnalysees = overview?.campagnes_analysees || []

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1400, margin: '0 auto', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {toast && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          zIndex: 9999,
          background: '#1E293B',
          color: '#FFF',
          padding: '12px 20px',
          borderRadius: 8,
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          fontSize: 14,
          fontWeight: 600,
        }}>
          {toast}
        </div>
      )}

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)',
              color: '#FFF',
              padding: '6px 12px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}>
              <Sparkles size={14} /> SALES INTELLIGENCE NOPALOU
            </span>
            <span style={{ fontSize: 13, color: '#64748B' }}>Moteur d'Apprentissage & Conversion</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', marginTop: 6, marginBottom: 4 }}>
            🧠 Intelligence Prospection & Mémoire des Campagnes
          </h1>
          <p style={{ color: '#475569', fontSize: 14, margin: 0 }}>
            Exploitation de l'historique réel des campagnes sénégalaises pour maximiser l'intérêt et la création de boutiques actives.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={refreshAll}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: '#FFF',
              border: '1px solid #CBD5E1',
              padding: '10px 16px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              color: '#334155',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Actualiser les analyses
          </button>

          <Link
            href="/admin/prospection"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: '#16A34A',
              color: '#FFF',
              padding: '10px 16px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none'
            }}
          >
            <Target size={15} /> CRM & Campagnes <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* ── SECTION 1 : RECOMMANDATION CONTEXTUELLE DE LA PROCHAINE CAMPAGNE ── */}
      {reco && (
        <div style={{
          background: 'linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 100%)',
          border: '1px solid #D8B4FE',
          borderRadius: 14,
          padding: 24,
          marginBottom: 32,
          boxShadow: '0 4px 20px rgba(124, 58, 237, 0.06)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ background: '#7C3AED', color: '#FFF', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                  RECOMMANDATION OFFICIELLE NOPALOU
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#6B21A8' }}>
                  Niveau de confiance : <strong>{reco.niveau_confiance}</strong>
                </span>
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#581C87', margin: 0 }}>
                🎯 Cible Recommandée : {reco.segment_recommande} ({reco.zone})
              </h2>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 12, color: '#7E22CE', fontWeight: 600 }}>Taille de lot optimale</span>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#581C87' }}>{reco.taille_lot_recommandee} prospects</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginTop: 20 }}>
            <div style={{ background: '#FFF', padding: 14, borderRadius: 10, border: '1px solid #E9D5FF' }}>
              <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#9333EA', fontWeight: 700, marginBottom: 4 }}>Canal & Créneau</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B' }}>{reco.canal_recommande.toUpperCase()} • {reco.creneau_horaire_recommande}</div>
            </div>

            <div style={{ background: '#FFF', padding: 14, borderRadius: 10, border: '1px solid #E9D5FF' }}>
              <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#9333EA', fontWeight: 700, marginBottom: 4 }}>Template Message Recommandé</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B' }}>{reco.template_titre}</div>
            </div>

            <div style={{ background: '#FFF', padding: 14, borderRadius: 10, border: '1px solid #E9D5FF' }}>
              <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#9333EA', fontWeight: 700, marginBottom: 4 }}>Variante Dynamique</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B' }}>{reco.variante_recommandee}</div>
            </div>
          </div>

          <div style={{ marginTop: 16, background: '#FFF', padding: 16, borderRadius: 10, border: '1px solid #E9D5FF' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6B21A8', marginBottom: 8 }}>
              💡 Pourquoi cette recommandation ? (Données probantes) :
            </div>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#4B5563' }}>
              {reco.justification_donnees?.map((just: string, idx: number) => (
                <li key={idx} style={{ marginBottom: 4 }}>{just}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ── SECTION 2 : ENTONNOIR GLOBAL DE VENTE (FUNNEL DE TRANSFORMATION) ── */}
      <div style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: 0 }}>
            📊 Entonnoir Global de Transformation (Funnel de Vente)
          </h3>
          <span style={{ fontSize: 12, color: '#64748B' }}>Suivi d'étapes de la collecte jusqu'au client payant</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, textAlign: 'center' }}>
          <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 8, border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>1. Leads Collectés</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>885</div>
            <div style={{ fontSize: 11, color: '#16A34A', fontWeight: 600, marginTop: 2 }}>100%</div>
          </div>

          <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 8, border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>2. Qualifiés Commerces</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>785</div>
            <div style={{ fontSize: 11, color: '#2563EB', fontWeight: 600, marginTop: 2 }}>88.7%</div>
          </div>

          <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 8, border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>3. Contactables WhatsApp</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>785</div>
            <div style={{ fontSize: 11, color: '#16A34A', fontWeight: 600, marginTop: 2 }}>100% mobiles</div>
          </div>

          <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 8, border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>4. Messages Envoyés</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>279</div>
            <div style={{ fontSize: 11, color: '#D97706', fontWeight: 600, marginTop: 2 }}>35.5% contactés</div>
          </div>

          <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 8, border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>5. Réponses Positives</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>12</div>
            <div style={{ fontSize: 11, color: '#7C3AED', fontWeight: 600, marginTop: 2 }}>4.3% taux réponse</div>
          </div>

          <div style={{ background: '#ECFDF5', padding: 14, borderRadius: 8, border: '1px solid #A7F3D0' }}>
            <div style={{ fontSize: 11, color: '#047857', fontWeight: 700 }}>6. Boutiques Créées</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#065F46', marginTop: 4 }}>8</div>
            <div style={{ fontSize: 11, color: '#059669', fontWeight: 700, marginTop: 2 }}>2.9% conversion</div>
          </div>

          <div style={{ background: '#FEF3C7', padding: 14, borderRadius: 8, border: '1px solid #FDE68A' }}>
            <div style={{ fontSize: 11, color: '#B45309', fontWeight: 700 }}>7. Boutiques Actives</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#92400E', marginTop: 4 }}>8</div>
            <div style={{ fontSize: 11, color: '#D97706', fontWeight: 700, marginTop: 2 }}>100% activation</div>
          </div>
        </div>
      </div>

      {/* ── SECTION 3 : COMPARAISON DES CAMPAGNES & DIAGNOSTIC DE PERFORMANCE ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24, marginBottom: 32 }}>
        <div style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: 0 }}>
              🧩 Comparateur & Diagnostics de Campagnes Antérieures
            </h3>
            <span style={{ fontSize: 12, color: '#64748B' }}>Cliquez sur une campagne pour voir son diagnostic précis</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px', color: '#64748B', fontWeight: 600 }}>Campagne</th>
                  <th style={{ padding: '10px 12px', color: '#64748B', fontWeight: 600 }}>Date</th>
                  <th style={{ padding: '10px 12px', color: '#64748B', fontWeight: 600, textAlign: 'center' }}>Canal</th>
                  <th style={{ padding: '10px 12px', color: '#64748B', fontWeight: 600, textAlign: 'right' }}>Leads</th>
                  <th style={{ padding: '10px 12px', color: '#64748B', fontWeight: 600, textAlign: 'right' }}>Délivrés</th>
                  <th style={{ padding: '10px 12px', color: '#64748B', fontWeight: 600, textAlign: 'right' }}>Boutiques</th>
                  <th style={{ padding: '10px 12px', color: '#64748B', fontWeight: 600, textAlign: 'right' }}>Conversion</th>
                  <th style={{ padding: '10px 12px', color: '#64748B', fontWeight: 600, textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {campagnesAnalysees.map((cmp: any, idx: number) => {
                  const txConv = cmp.funnel?.taux_conversion || 0
                  return (
                    <tr
                      key={cmp.campagne_id || idx}
                      onClick={() => setSelectedCampagneDiag(cmp)}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        cursor: 'pointer',
                        background: selectedCampagneDiag?.campagne_id === cmp.campagne_id ? '#F5F3FF' : 'transparent',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0F172A' }}>
                        {cmp.titre || 'Campagne sans nom'}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#64748B', fontSize: 12 }}>
                        {new Date(cmp.date).toLocaleDateString('fr-FR')} {new Date(cmp.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <span style={{
                          background: cmp.canal === 'whatsapp' ? '#DCFCE7' : '#F3E8FF',
                          color: cmp.canal === 'whatsapp' ? '#15803D' : '#7E22CE',
                          padding: '2px 8px',
                          borderRadius: 12,
                          fontSize: 11,
                          fontWeight: 700
                        }}>
                          {cmp.canal}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>
                        {cmp.funnel?.leads_collectes || 0}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#16A34A', fontWeight: 600 }}>
                        {cmp.funnel?.messages_delivres || 0}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: cmp.funnel?.boutiques_creees > 0 ? '#059669' : '#94A3B8' }}>
                        {cmp.funnel?.boutiques_creees || 0}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        <span style={{
                          color: txConv >= 3 ? '#16A34A' : (txConv > 0 ? '#D97706' : '#EF4444'),
                          fontWeight: 700
                        }}>
                          {txConv}%
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <button
                          style={{
                            background: '#F1F5F9',
                            border: 'none',
                            color: '#475569',
                            padding: '4px 8px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Diagnostic
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Modal Diagnostic Campagne Sélectionnée */}
          {selectedCampagneDiag && (
            <div style={{ marginTop: 20, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={18} color="#D97706" />
                  <strong style={{ fontSize: 14, color: '#0F172A' }}>Diagnostic Détaillé : {selectedCampagneDiag.titre}</strong>
                </div>
                <button
                  onClick={() => setSelectedCampagneDiag(null)}
                  style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', fontWeight: 700 }}
                >
                  Fermer
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
                <div style={{ background: '#FFF', padding: 10, borderRadius: 6, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 11, color: '#64748B' }}>Point de Rupture</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#DC2626' }}>{selectedCampagneDiag.point_de_rupture_principal}</div>
                </div>
                <div style={{ background: '#FFF', padding: 10, borderRadius: 6, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 11, color: '#64748B' }}>Délivrabilité</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#16A34A' }}>{selectedCampagneDiag.funnel?.taux_delivrabilite}%</div>
                </div>
                <div style={{ background: '#FFF', padding: 10, borderRadius: 6, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 11, color: '#64748B' }}>Taux de Réponse</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#7C3AED' }}>{selectedCampagneDiag.funnel?.taux_reponse}%</div>
                </div>
                <div style={{ background: '#FFF', padding: 10, borderRadius: 6, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 11, color: '#64748B' }}>Indice de Confiance</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#2563EB' }}>{selectedCampagneDiag.indice_confiance}</div>
                </div>
              </div>

              {selectedCampagneDiag.causes_echec?.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#991B1B', marginBottom: 6 }}>Facteurs ayant pénalisé la campagne :</div>
                  {selectedCampagneDiag.causes_echec.map((c: any, i: number) => (
                    <div key={i} style={{ fontSize: 12, color: '#7F1D1D', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>•</span> <strong>{c.facteur}</strong> : {c.detail} ({c.impact})
                    </div>
                  ))}
                </div>
              )}

              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#166534', marginBottom: 6 }}>Actions correctives recommandées :</div>
                {selectedCampagneDiag.recommandations?.map((r: string, i: number) => (
                  <div key={i} style={{ fontSize: 12, color: '#14532D', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle2 size={13} color="#16A34A" /> {r}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── SECTION 4 : TOP SEGMENTS & TOP SOURCES (SCORES EMPIRIQUES) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24, marginBottom: 32 }}>
        {/* Top Segments */}
        <div style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 12 }}>
            🏆 Segments Métiers & Performance Réelle
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E2E8F0', color: '#64748B', textAlign: 'left' }}>
                  <th style={{ padding: '8px 6px' }}>Segment</th>
                  <th style={{ padding: '8px 6px', textAlign: 'right' }}>Leads</th>
                  <th style={{ padding: '8px 6px', textAlign: 'right' }}>Contactés</th>
                  <th style={{ padding: '8px 6px', textAlign: 'right' }}>Boutiques</th>
                  <th style={{ padding: '8px 6px', textAlign: 'right' }}>Conv. %</th>
                  <th style={{ padding: '8px 6px' }}>Confiance</th>
                </tr>
              </thead>
              <tbody>
                {topSegments.slice(0, 8).map((seg: any, idx: number) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '8px 6px', fontWeight: 600, textTransform: 'capitalize' }}>{seg.categorie}</td>
                    <td style={{ padding: '8px 6px', textAlign: 'right' }}>{seg.total_leads}</td>
                    <td style={{ padding: '8px 6px', textAlign: 'right' }}>{seg.contactes}</td>
                    <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 700, color: '#059669' }}>{seg.convertis}</td>
                    <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 700 }}>{seg.taux_conversion}%</td>
                    <td style={{ padding: '8px 6px', fontSize: 11, color: '#64748B' }}>{seg.indice_confiance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Sources */}
        <div style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 12 }}>
            🔎 Performance par Source de Collecte
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E2E8F0', color: '#64748B', textAlign: 'left' }}>
                  <th style={{ padding: '8px 6px' }}>Source</th>
                  <th style={{ padding: '8px 6px', textAlign: 'right' }}>Leads</th>
                  <th style={{ padding: '8px 6px', textAlign: 'right' }}>Boutiques</th>
                  <th style={{ padding: '8px 6px', textAlign: 'center' }}>Fiabilité</th>
                  <th style={{ padding: '8px 6px' }}>Qualité</th>
                </tr>
              </thead>
              <tbody>
                {topSources.slice(0, 8).map((src: any, idx: number) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '8px 6px', fontWeight: 600, maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {src.source}
                    </td>
                    <td style={{ padding: '8px 6px', textAlign: 'right' }}>{src.total_leads}</td>
                    <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 700, color: '#059669' }}>{src.convertis}</td>
                    <td style={{ padding: '8px 6px', textAlign: 'center', color: '#D97706', fontSize: 12 }}>{src.etoiles}</td>
                    <td style={{ padding: '8px 6px', fontSize: 11, color: '#64748B' }}>{src.qualite_label}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── SECTION 5 : PROSPECTS PRIORITAIRES & INSPECTION DE LA TIMELINE ── */}
      <div style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: 0 }}>
              🔥 File des Prospects Prioritaires (Priorité 1)
            </h3>
            <span style={{ fontSize: 12, color: '#64748B' }}>Ordonnés selon l'algorithme Lead Learning Score et Next Best Action</span>
          </div>
          <span style={{ background: '#EFF6FF', color: '#1D4ED8', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>
            {reco?.prospects_prioritaires?.length || 0} prospects prêts
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', textAlign: 'left' }}>
                <th style={{ padding: '10px 8px' }}>Boutique / Enseigne</th>
                <th style={{ padding: '10px 8px' }}>Catégorie</th>
                <th style={{ padding: '10px 8px' }}>Localisation</th>
                <th style={{ padding: '10px 8px' }}>Téléphone</th>
                <th style={{ padding: '10px 8px', textAlign: 'center' }}>Priority Score</th>
                <th style={{ padding: '10px 8px' }}>Next Best Action</th>
                <th style={{ padding: '10px 8px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {reco?.prospects_prioritaires?.slice(0, 15).map((l: any) => (
                <tr key={l.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '10px 8px', fontWeight: 600, color: '#0F172A' }}>{l.nom_boutique}</td>
                  <td style={{ padding: '10px 8px', textTransform: 'capitalize' }}>{l.categorie}</td>
                  <td style={{ padding: '10px 8px', color: '#64748B' }}>{l.quartier || l.ville || 'Dakar'}</td>
                  <td style={{ padding: '10px 8px', fontFamily: 'monospace' }}>+{l.telephone}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                    <span style={{
                      background: l.priority_score >= 80 ? '#FEF2F2' : '#FFFBEB',
                      color: l.priority_score >= 80 ? '#DC2626' : '#D97706',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: 10,
                      fontSize: 12
                    }}>
                      {l.priority_score}/100
                    </span>
                  </td>
                  <td style={{ padding: '10px 8px' }}>
                    <span style={{
                      background: '#F0FDF4',
                      color: '#15803D',
                      padding: '2px 8px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600
                    }}>
                      {l.next_best_action || 'Contacter'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                    <button
                      onClick={() => inspectLead(l.id)}
                      style={{
                        background: '#EEF2FF',
                        border: '1px solid #C7D2FE',
                        color: '#4338CA',
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Voir Timeline
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal / Tiroir Timeline Lead */}
        {selectedLeadTimeline && (
          <div style={{ marginTop: 24, background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 10, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h4 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  🧭 Timeline Commerciale 360° : {selectedLeadTimeline.lead?.nom_boutique}
                </h4>
                <span style={{ fontSize: 12, color: '#64748B' }}>
                  +{selectedLeadTimeline.lead?.telephone} • {selectedLeadTimeline.lead?.categorie} • {selectedLeadTimeline.lead?.quartier}
                </span>
              </div>
              <button
                onClick={() => setSelectedLeadTimeline(null)}
                style={{ background: '#E2E8F0', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}
              >
                Fermer
              </button>
            </div>

            {/* Explications du score */}
            {selectedLeadTimeline.scoring_explications?.length > 0 && (
              <div style={{ background: '#FFF', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0', marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                  Explication transparente du score ({selectedLeadTimeline.lead?.priority_score}/100) :
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selectedLeadTimeline.scoring_explications.map((exp: string, idx: number) => (
                    <span key={idx} style={{
                      background: exp.startsWith('+') ? '#F0FDF4' : (exp.startsWith('-') ? '#FEF2F2' : '#F1F5F9'),
                      color: exp.startsWith('+') ? '#166534' : (exp.startsWith('-') ? '#991B1B' : '#334155'),
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 4
                    }}>
                      {exp}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Événements de la timeline */}
            <div style={{ borderLeft: '2px solid #CBD5E1', paddingLeft: 16, marginLeft: 8 }}>
              {selectedLeadTimeline.timeline?.map((ev: any, idx: number) => (
                <div key={ev.id || idx} style={{ marginBottom: 14, position: 'relative' }}>
                  <div style={{
                    position: 'absolute',
                    left: -22,
                    top: 2,
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: ev.type_evenement === 'boutique_creee' ? '#16A34A' : (ev.type_evenement === 'optout' ? '#DC2626' : '#2563EB')
                  }} />
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>
                    {new Date(ev.created_at).toLocaleDateString('fr-FR')} à {new Date(ev.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} • [{ev.type_evenement}]
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', marginTop: 2 }}>
                    {ev.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
