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
      <div className="bg-white border border-[#E8DDD2] rounded-xl p-4 mb-5 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#F8F5F0] flex items-center justify-center text-[#1C2B4A]">
            <Activity size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#1C2B4A]">Audit Qualité des Données CRM</h4>
            <p className="text-xs text-[#64748B]">Auditer l&apos;exhaustivité des numéros, noms commerciaux et contacts immobiliers</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRefreshAudit}
          className="btn-npl inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg bg-[#1C2B4A] text-white hover:bg-[#253961] transition-colors"
        >
          <RefreshCw size={14} />
          Lancer l&apos;audit
        </button>
      </div>
    )
  }

  const scoreSante = auditData?.score_sante || 0
  const scoreColor = scoreSante >= 80 ? '#0A5C36' : scoreSante >= 65 ? '#C75B00' : '#DC2626'
  const scoreBg = scoreSante >= 80 ? '#DCFCE7' : scoreSante >= 65 ? '#FFF7ED' : '#FEF2F2'
  const scoreLabel = scoreSante >= 80 ? 'Excellente' : scoreSante >= 65 ? 'Correcte' : 'À assainir'

  return (
    <div className="bg-white border border-[#E8DDD2] rounded-xl p-5 mb-6 shadow-xs">
      {/* En-tête de l'audit */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8DDD2]">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg"
            style={{ backgroundColor: scoreBg, color: scoreColor }}
          >
            {isLoading ? <RefreshCw size={20} className="animate-spin" /> : `${scoreSante}%`}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#1C2B4A]">Santé Globale des Données CRM</h3>
              <span
                className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: scoreBg, color: scoreColor }}
              >
                {scoreLabel}
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              {auditData?.total_leads || 0} prospects analysés &bull; Scoring prédictif Nopalou &bull; Normalisation SN-221
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onRefreshAudit}
            disabled={isLoading || isAssainissant}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#E8DDD2] bg-[#F8F5F0] text-[#1C2B4A] hover:bg-[#EAE4DC] transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            Actualiser
          </button>
          <button
            type="button"
            onClick={onFilterImmo}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#E8DDD2] bg-white text-[#1C2B4A] hover:border-[#1C2B4A] transition-colors"
          >
            <Filter size={13} />
            Voir leads Immo ({auditData?.immo?.total || 0})
          </button>
          <button
            type="button"
            onClick={onAssainirImmo}
            disabled={isAssainissant || isLoading}
            className="btn-npl inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#C75B00] text-white hover:bg-[#A84D00] transition-colors shadow-xs disabled:opacity-50"
          >
            <Sparkles size={13} className={isAssainissant ? 'animate-spin' : ''} />
            {isAssainissant ? 'Assainissement en cours...' : 'Assainir & Sourcer Immo'}
          </button>
        </div>
      </div>

      {/* Grille 4 piliers de qualité */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-4 border-b border-[#E8DDD2]">
        <div className="p-3 bg-[#F8F5F0] rounded-lg">
          <div className="flex items-center justify-between text-xs text-[#64748B] mb-1">
            <span className="flex items-center gap-1 font-medium">
              <Smartphone size={13} className="text-[#1C2B4A]" /> Mobiles WhatsApp
            </span>
            <span className="font-bold text-[#1C2B4A]">{auditData?.pct_mobiles_valides}%</span>
          </div>
          <p className="text-base font-bold text-[#1C2B4A]">{auditData?.mobiles_valides || 0}</p>
          <p className="text-[10px] text-[#64748B]">100% joignables Orange, Free, Expresso</p>
        </div>

        <div className="p-3 bg-[#F8F5F0] rounded-lg">
          <div className="flex items-center justify-between text-xs text-[#64748B] mb-1">
            <span className="flex items-center gap-1 font-medium">
              <Store size={13} className="text-[#1C2B4A]" /> Noms Authentiques
            </span>
            <span className="font-bold text-[#1C2B4A]">{auditData?.pct_noms_authentiques}%</span>
          </div>
          <p className="text-base font-bold text-[#1C2B4A]">{auditData?.noms_authentiques || 0}</p>
          <p className="text-[10px] text-[#64748B]">
            {auditData?.noms_generiques ? `${auditData.noms_generiques} noms génériques identifiés` : 'Zéro pollution générique'}
          </p>
        </div>

        <div className="p-3 bg-[#F8F5F0] rounded-lg">
          <div className="flex items-center justify-between text-xs text-[#64748B] mb-1">
            <span className="flex items-center gap-1 font-medium">
              <MapPin size={13} className="text-[#1C2B4A]" /> Quartiers Précis
            </span>
            <span className="font-bold text-[#1C2B4A]">{auditData?.pct_quartiers_precis}%</span>
          </div>
          <p className="text-base font-bold text-[#1C2B4A]">{auditData?.quartiers_precis || 0}</p>
          <p className="text-[10px] text-[#64748B]">Localisation ciblée Almadies, Mamelles...</p>
        </div>

        <div className="p-3 bg-[#F8F5F0] rounded-lg">
          <div className="flex items-center justify-between text-xs text-[#64748B] mb-1">
            <span className="flex items-center gap-1 font-medium">
              <ShieldCheck size={13} className="text-[#0A5C36]" /> Haut Nopalou Fit
            </span>
            <span className="font-bold text-[#0A5C36]">Score 70+</span>
          </div>
          <p className="text-base font-bold text-[#0A5C36]">{auditData?.haut_fit || 0}</p>
          <p className="text-[10px] text-[#64748B]">Priorité conversion immédiate</p>
        </div>
      </div>

      {/* Focus Secteur Immobilier & Agences */}
      <div className="pt-4">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-[#1C2B4A]" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1C2B4A]">
              Pôle Prospection Immobilière & Agences ({auditData?.immo?.total || 0} contacts)
            </h4>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#64748B]">
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 size={13} className="text-[#0A5C36]" />
              {auditData?.immo?.agences_nopalou_reelles || 0} agence(s) client(s) réconciliée(s)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
          <div className="p-2.5 rounded-lg border border-[#E8DDD2] bg-white">
            <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-[#1C2B4A] mb-0.5">
              <Building2 size={12} /> Agences
            </div>
            <p className="text-sm font-bold text-[#1C2B4A]">{auditData?.immo?.agences || 0}</p>
            <p className="text-[10px] text-[#64748B]">Vitrines & Mandats</p>
          </div>

          <div className="p-2.5 rounded-lg border border-[#E8DDD2] bg-white">
            <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-[#0A5C36] mb-0.5">
              <Key size={12} /> Gestionnaires
            </div>
            <p className="text-sm font-bold text-[#0A5C36]">{auditData?.immo?.gestionnaires || 0}</p>
            <p className="text-[10px] text-[#64748B]">Gestion locative OHADA</p>
          </div>

          <div className="p-2.5 rounded-lg border border-[#E8DDD2] bg-white">
            <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-[#C75B00] mb-0.5">
              <Briefcase size={12} /> Courtiers
            </div>
            <p className="text-sm font-bold text-[#C75B00]">{auditData?.immo?.courtiers || 0}</p>
            <p className="text-[10px] text-[#64748B]">Mandats partagés</p>
          </div>

          <div className="p-2.5 rounded-lg border border-[#E8DDD2] bg-white">
            <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-[#7C3AED] mb-0.5">
              <HardHat size={12} /> Promoteurs
            </div>
            <p className="text-sm font-bold text-[#7C3AED]">{auditData?.immo?.promoteurs || 0}</p>
            <p className="text-[10px] text-[#64748B]">VEFA & Neuf</p>
          </div>

          <div className="p-2.5 rounded-lg border border-[#E8DDD2] bg-white col-span-2 sm:col-span-1">
            <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-[#64748B] mb-0.5">
              <Store size={12} /> Agents
            </div>
            <p className="text-sm font-bold text-[#64748B]">{auditData?.immo?.agents || 0}</p>
            <p className="text-[10px] text-[#64748B]">Indépendants</p>
          </div>
        </div>

        {/* Message de succès après assainissement */}
        {lastResult && (
          <div className="mt-3 p-3 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-between text-xs text-[#0A5C36]">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} />
              <span>
                Assainissement terminé avec succès : <strong>{lastResult.nomsAssainis}</strong> noms corrigés,{' '}
                <strong>+{lastResult.leadsImmoImportes}</strong> nouveaux leads immo importés,{' '}
                <strong>{lastResult.agencesReconciliees}</strong> agences réconciliées.
                Score de santé : <strong>{lastResult.scoreSanteApres}%</strong> (contre {lastResult.scoreSanteAvant}%).
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
