'use client'

import React from 'react'
import {
  ShieldCheck,
  Activity,
  Building2,
  Sparkles,
  RefreshCw,
  MapPin,
  Smartphone,
  Store,
  Key,
  Briefcase,
  HardHat,
  Filter,
  CheckCircle2
} from 'lucide-react'
import type { AuditQualiteData, AssainirImmoResult } from './types'

interface ProspectionAuditCardProps {
  auditData: AuditQualiteData | null
  isLoading: boolean
  isAssainissant: boolean
  lastResult: AssainirImmoResult | null
  onRefreshAudit: () => void
  onAssainirImmo: () => void
  onFilterImmo: () => void
}

export function ProspectionAuditCard({
  auditData,
  isLoading,
  isAssainissant,
  lastResult,
  onRefreshAudit,
  onAssainirImmo,
  onFilterImmo,
}: ProspectionAuditCardProps) {
  if (!auditData && !isLoading) {
    return (
      <div style={{
        background: '#ffffff',
        borderRadius: 16,
        border: '1.5px solid var(--border, #E8DDD2)',
        padding: '16px 20px',
        marginBottom: 20,
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 10,
            background: 'var(--bg, #F8F5F0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--navy, #1C2B4A)'
          }}>
            <Activity size={20} />
          </div>
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
              Audit Qualité des Données CRM
            </h4>
            <p style={{ fontSize: 12, color: '#64748B', margin: '3px 0 0' }}>
              Auditer l&apos;exhaustivité des numéros, noms commerciaux et contacts immobiliers
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRefreshAudit}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 12.5,
            fontWeight: 700,
            padding: '8px 16px',
            borderRadius: 10,
            border: 'none',
            background: 'var(--navy, #1C2B4A)',
            color: '#ffffff',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(28,43,74,0.2)'
          }}
        >
          <RefreshCw size={14} />
          <span>Lancer l&apos;audit</span>
        </button>
      </div>
    )
  }

  const scoreSante = auditData?.score_sante || 0
  const scoreColor = scoreSante >= 80 ? '#0A5C36' : scoreSante >= 65 ? '#C75B00' : '#DC2626'
  const scoreBg = scoreSante >= 80 ? '#DCFCE7' : scoreSante >= 65 ? '#FFF7ED' : '#FEF2F2'
  const scoreLabel = scoreSante >= 80 ? 'Excellente' : scoreSante >= 65 ? 'Correcte' : 'À assainir'

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: 16,
      border: '1.5px solid var(--border, #E8DDD2)',
      padding: '20px 24px',
      marginBottom: 24,
      boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* En-tête de l'audit */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
        paddingBottom: 16,
        borderBottom: '1.5px solid var(--border, #E8DDD2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900,
            fontSize: 18,
            backgroundColor: scoreBg,
            color: scoreColor,
            flexShrink: 0
          }}>
            {isLoading ? <RefreshCw size={22} className="animate-spin" /> : `${scoreSante}%`}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: 16, fontWeight: 850, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
                Santé Globale des Données CRM
              </h3>
              <span style={{
                fontSize: 11,
                fontWeight: 800,
                padding: '2px 10px',
                borderRadius: 20,
                backgroundColor: scoreBg,
                color: scoreColor
              }}>
                {scoreLabel}
              </span>
            </div>
            <p style={{ fontSize: 12.5, color: '#64748B', margin: '4px 0 0' }}>
              {auditData?.total_leads || 0} prospects analysés &bull; Scoring prédictif Nopalou &bull; Normalisation SN-221
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onRefreshAudit}
            disabled={isLoading || isAssainissant}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              fontSize: 12.5,
              fontWeight: 700,
              borderRadius: 10,
              border: '1.5px solid var(--border, #E8DDD2)',
              background: 'var(--bg, #F8F5F0)',
              color: 'var(--navy, #1C2B4A)',
              cursor: isLoading || isAssainissant ? 'not-allowed' : 'pointer',
              opacity: isLoading || isAssainissant ? 0.6 : 1,
              transition: 'all 0.15s ease'
            }}
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            <span>Actualiser</span>
          </button>
          <button
            type="button"
            onClick={onFilterImmo}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              fontSize: 12.5,
              fontWeight: 700,
              borderRadius: 10,
              border: '1.5px solid var(--border, #E8DDD2)',
              background: '#ffffff',
              color: 'var(--navy, #1C2B4A)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Filter size={13} />
            <span>Voir leads Immo ({auditData?.immo?.total || 0})</span>
          </button>
          <button
            type="button"
            onClick={onAssainirImmo}
            disabled={isAssainissant || isLoading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              fontSize: 12.5,
              fontWeight: 800,
              borderRadius: 10,
              border: 'none',
              background: 'var(--accent, #C75B00)',
              color: '#ffffff',
              boxShadow: '0 2px 8px rgba(199,91,0,0.25)',
              cursor: isAssainissant || isLoading ? 'not-allowed' : 'pointer',
              opacity: isAssainissant || isLoading ? 0.6 : 1,
              transition: 'all 0.15s ease'
            }}
          >
            <Sparkles size={13} className={isAssainissant ? 'animate-spin' : ''} />
            <span>{isAssainissant ? 'Assainissement en cours...' : 'Assainir & Sourcer Immo'}</span>
          </button>
        </div>
      </div>

      {/* Grille 4 piliers de qualité */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 12,
        padding: '16px 0',
        borderBottom: '1.5px solid var(--border, #E8DDD2)'
      }}>
        <div style={{ background: 'var(--bg, #F8F5F0)', borderRadius: 12, padding: '14px 16px', border: '1px solid #EAE4DC' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#64748B' }}>
              <Smartphone size={14} color="var(--navy, #1C2B4A)" /> Mobiles WhatsApp
            </span>
            <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
              {auditData?.pct_mobiles_valides ?? 0}%
            </span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--navy, #1C2B4A)', margin: '4px 0 2px' }}>
            {auditData?.mobiles_valides ?? 0}
          </div>
          <div style={{ fontSize: 11, color: '#64748B' }}>
            100% joignables Orange, Free, Expresso
          </div>
        </div>

        <div style={{ background: 'var(--bg, #F8F5F0)', borderRadius: 12, padding: '14px 16px', border: '1px solid #EAE4DC' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#64748B' }}>
              <Store size={14} color="var(--navy, #1C2B4A)" /> Noms Authentiques
            </span>
            <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
              {auditData?.pct_noms_authentiques ?? 0}%
            </span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--navy, #1C2B4A)', margin: '4px 0 2px' }}>
            {auditData?.noms_authentiques ?? 0}
          </div>
          <div style={{ fontSize: 11, color: '#64748B' }}>
            {auditData?.noms_generiques ? `${auditData.noms_generiques} noms génériques identifiés` : 'Zéro pollution générique'}
          </div>
        </div>

        <div style={{ background: 'var(--bg, #F8F5F0)', borderRadius: 12, padding: '14px 16px', border: '1px solid #EAE4DC' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#64748B' }}>
              <MapPin size={14} color="var(--navy, #1C2B4A)" /> Quartiers Précis
            </span>
            <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
              {auditData?.pct_quartiers_precis ?? 0}%
            </span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--navy, #1C2B4A)', margin: '4px 0 2px' }}>
            {auditData?.quartiers_precis ?? 0}
          </div>
          <div style={{ fontSize: 11, color: '#64748B' }}>
            Localisation ciblée Almadies, Mamelles...
          </div>
        </div>

        <div style={{ background: 'var(--bg, #F8F5F0)', borderRadius: 12, padding: '14px 16px', border: '1px solid #EAE4DC' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#64748B' }}>
              <ShieldCheck size={14} color="var(--price, #0A5C36)" /> Haut Nopalou Fit
            </span>
            <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--price, #0A5C36)' }}>
              Score 70+
            </span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--price, #0A5C36)', margin: '4px 0 2px' }}>
            {auditData?.haut_fit ?? 0}
          </div>
          <div style={{ fontSize: 11, color: '#64748B' }}>
            Priorité conversion immédiate
          </div>
        </div>
      </div>

      {/* Focus Secteur Immobilier & Agences */}
      <div style={{ paddingTop: 16 }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Building2 size={16} color="var(--navy, #1C2B4A)" />
            <h4 style={{
              fontSize: 12,
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--navy, #1C2B4A)',
              margin: 0
            }}>
              Pôle Prospection Immobilière &amp; Agences ({auditData?.immo?.total || 0} contacts)
            </h4>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--price, #0A5C36)', fontWeight: 700 }}>
            <CheckCircle2 size={14} />
            <span>{auditData?.immo?.agences_nopalou_reelles || 0} agence(s) cliente(s) réconciliée(s)</span>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 10,
          textAlign: 'center'
        }}>
          <div style={{ background: '#ffffff', borderRadius: 10, border: '1.5px solid var(--border, #E8DDD2)', padding: '12px 10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 11.5, fontWeight: 750, color: 'var(--navy, #1C2B4A)', marginBottom: 3 }}>
              <Building2 size={13} /> Agences
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
              {auditData?.immo?.agences || 0}
            </div>
            <div style={{ fontSize: 10.5, color: '#64748B' }}>Vitrines &amp; Mandats</div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: 10, border: '1.5px solid var(--border, #E8DDD2)', padding: '12px 10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 11.5, fontWeight: 750, color: 'var(--price, #0A5C36)', marginBottom: 3 }}>
              <Key size={13} /> Gestionnaires
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--price, #0A5C36)' }}>
              {auditData?.immo?.gestionnaires || 0}
            </div>
            <div style={{ fontSize: 10.5, color: '#64748B' }}>Gestion locative OHADA</div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: 10, border: '1.5px solid var(--border, #E8DDD2)', padding: '12px 10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 11.5, fontWeight: 750, color: 'var(--accent, #C75B00)', marginBottom: 3 }}>
              <Briefcase size={13} /> Courtiers
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--accent, #C75B00)' }}>
              {auditData?.immo?.courtiers || 0}
            </div>
            <div style={{ fontSize: 10.5, color: '#64748B' }}>Mandats partagés</div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: 10, border: '1.5px solid var(--border, #E8DDD2)', padding: '12px 10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 11.5, fontWeight: 750, color: '#7C3AED', marginBottom: 3 }}>
              <HardHat size={13} /> Promoteurs
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#7C3AED' }}>
              {auditData?.immo?.promoteurs || 0}
            </div>
            <div style={{ fontSize: 10.5, color: '#64748B' }}>VEFA &amp; Neuf</div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: 10, border: '1.5px solid var(--border, #E8DDD2)', padding: '12px 10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 11.5, fontWeight: 750, color: '#64748B', marginBottom: 3 }}>
              <Store size={13} /> Agents
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#64748B' }}>
              {auditData?.immo?.agents || 0}
            </div>
            <div style={{ fontSize: 10.5, color: '#64748B' }}>Indépendants</div>
          </div>
        </div>

        {/* Message de succès après assainissement */}
        {lastResult && (
          <div style={{
            marginTop: 14,
            padding: '12px 16px',
            borderRadius: 10,
            background: '#F0FDF4',
            border: '1.5px solid #BBF7D0',
            color: 'var(--price, #0A5C36)',
            fontSize: 12.5,
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>
              Assainissement terminé avec succès : <strong>{lastResult.nomsAssainis}</strong> noms corrigés,{' '}
              <strong>+{lastResult.leadsImmoImportes}</strong> nouveaux leads immo importés,{' '}
              <strong>{lastResult.agencesReconciliees}</strong> agences réconciliées.
              Score de santé : <strong>{lastResult.scoreSanteApres}%</strong> (contre {lastResult.scoreSanteAvant}%).
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
