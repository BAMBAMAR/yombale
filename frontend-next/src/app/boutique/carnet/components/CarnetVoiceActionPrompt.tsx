'use client'

import React from 'react'
import { CheckCircle2, UserPlus, Edit3, Check, X, Volume2 } from 'lucide-react'
import { fcfa } from '@/lib/format'
import type { ClientCredit, VoiceActionPending } from '../types'

interface CarnetVoiceActionPromptProps {
  voiceActionPending: VoiceActionPending
  setVoiceActionPending: React.Dispatch<React.SetStateAction<VoiceActionPending | null>>
  voiceActionLoading: boolean
  isMobile: boolean
  clients: ClientCredit[]
  onValiderActionVocale: (action: VoiceActionPending) => void
  onModifierDepuisVocal: (action: VoiceActionPending) => void
  onCreerNouveauClientVocal: (nom: string) => void
}

const TYPE_CONFIG = {
  remboursement: { bg: '#f0fdf4', border: '2px solid #22c55e', iconBg: '#dcfce7', iconColor: '#16a34a', labelColor: '#166534' },
  nouveau_client: { bg: '#eff6ff', border: '2px solid #3b82f6', iconBg: '#dbeafe', iconColor: '#2563eb', labelColor: '#1d4ed8' },
  vente_credit: { bg: '#fff7ed', border: '2px solid #ea580c', iconBg: '#ffedd5', iconColor: '#ea580c', labelColor: '#9a3412' },
}

export default function CarnetVoiceActionPrompt({
  voiceActionPending,
  setVoiceActionPending,
  voiceActionLoading,
  isMobile,
  clients,
  onValiderActionVocale,
  onModifierDepuisVocal,
  onCreerNouveauClientVocal,
}: CarnetVoiceActionPromptProps) {
  const cfg = TYPE_CONFIG[voiceActionPending.type] || TYPE_CONFIG.vente_credit

  const soldeActuel = voiceActionPending.client ? Number(voiceActionPending.client.solde) || 0 : 0
  const diff = voiceActionPending.type === 'vente_credit' ? voiceActionPending.montant || 0 : -(voiceActionPending.montant || 0)
  const futur = soldeActuel + diff

  return (
    <div
      style={{
        background: cfg.bg,
        border: cfg.border,
        borderRadius: 16,
        padding: isMobile ? '14px 16px' : '16px 20px',
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
        width: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: cfg.iconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: cfg.iconColor,
            }}
          >
            {voiceActionPending.type === 'remboursement' ? (
              <CheckCircle2 size={20} />
            ) : voiceActionPending.type === 'nouveau_client' ? (
              <UserPlus size={20} />
            ) : (
              <Edit3 size={20} />
            )}
          </div>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.5, color: cfg.labelColor }}>
              Action Vocale Détectée
            </div>
            <h4 style={{ margin: '2px 0 0', fontSize: isMobile ? 15 : 17, fontWeight: 900, color: '#0f172a' }}>
              {voiceActionPending.type === 'remboursement'
                ? `Remboursement de ${fcfa(voiceActionPending.montant)}`
                : voiceActionPending.type === 'nouveau_client'
                ? `Nouveau client : « ${voiceActionPending.nomClientPropose || 'Client'} »`
                : `Vente à crédit de ${fcfa(voiceActionPending.montant)}`}
            </h4>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setVoiceActionPending(null)}
          style={{
            background: 'rgba(0,0,0,0.06)',
            border: 'none',
            borderRadius: '50%',
            width: 28,
            height: 28,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#475569',
          }}
          title="Fermer"
        >
          <X size={14} />
        </button>
      </div>

      {/* Transcription brute */}
      {voiceActionPending.transcriptRaw && (
        <div
          style={{
            fontSize: 12,
            color: '#475569',
            background: 'rgba(255,255,255,0.7)',
            padding: '6px 12px',
            borderRadius: 8,
            border: '1px dashed rgba(0,0,0,0.12)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Volume2 size={13} color="#64748b" />
          <span>
            Texte entendu : <strong>« {voiceActionPending.transcriptRaw} »</strong>
          </span>
        </div>
      )}

      {/* Bascule Dette vs Remboursement */}
      {voiceActionPending.type !== 'nouveau_client' && (
        <div style={{ display: 'flex', gap: 6, background: '#ffffff', padding: 4, borderRadius: 10, border: '1px solid rgba(0,0,0,0.08)', width: 'fit-content' }}>
          <button
            type="button"
            onClick={() => setVoiceActionPending((prev) => prev ? { ...prev, type: 'vente_credit', description: 'Achat à crédit' } : null)}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: 'none',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              background: voiceActionPending.type === 'vente_credit' ? '#ea580c' : 'transparent',
              color: voiceActionPending.type === 'vente_credit' ? '#ffffff' : '#64748b',
            }}
          >
            Donner à crédit (Dette)
          </button>
          <button
            type="button"
            onClick={() => setVoiceActionPending((prev) => prev ? { ...prev, type: 'remboursement', description: 'Remboursement' } : null)}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: 'none',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              background: voiceActionPending.type === 'remboursement' ? '#16a34a' : 'transparent',
              color: voiceActionPending.type === 'remboursement' ? '#ffffff' : '#64748b',
            }}
          >
            Encaisser versement
          </button>
        </div>
      )}

      {/* Détails éditables */}
      {voiceActionPending.type !== 'nouveau_client' && (
        <div
          style={{
            background: '#ffffff',
            borderRadius: 10,
            padding: '12px 14px',
            border: '1px solid rgba(0,0,0,0.08)',
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1.4fr 1.1fr 1.5fr',
            gap: 12,
            alignItems: 'center',
            fontSize: 13,
          }}
        >
          <div>
            <span style={{ color: '#64748b', fontSize: 11, display: 'block', fontWeight: 700, marginBottom: 3 }}>Client :</span>
            {clients.length > 0 ? (
              <select
                value={voiceActionPending.client?.id || ''}
                onChange={(e) => {
                  const cl = clients.find((c) => c.id === e.target.value)
                  setVoiceActionPending((prev) => prev ? { ...prev, client: cl, nomClientPropose: cl?.nom } : null)
                }}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 800, color: '#0f172a', background: '#fff' }}
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.nom} ({c.telephone})</option>
                ))}
              </select>
            ) : (
              <strong style={{ color: '#0f172a' }}>{voiceActionPending.nomClientPropose || 'Client'}</strong>
            )}
          </div>

          <div>
            <span style={{ color: '#64748b', fontSize: 11, display: 'block', fontWeight: 700, marginBottom: 3 }}>Montant (FCFA) :</span>
            <input
              type="number"
              min="0"
              value={voiceActionPending.montant || ''}
              onChange={(e) => {
                const val = Number(e.target.value) || 0
                setVoiceActionPending((prev) => (prev ? { ...prev, montant: val } : null))
              }}
              style={{ padding: '5px 8px', borderRadius: 8, border: '1.5px solid #0284c7', fontSize: 14, fontWeight: 900, color: '#0f172a', width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <span style={{ color: '#64748b', fontSize: 11, display: 'block', fontWeight: 700, marginBottom: 3 }}>Nouveau solde :</span>
            <strong style={{ color: voiceActionPending.type === 'remboursement' ? '#16a34a' : '#dc2626', fontSize: 13.5 }}>
              {futur > 0 ? `Doit ${fcfa(futur)}` : futur < 0 ? `Avance ${fcfa(Math.abs(futur))}` : 'À jour (0 FCFA)'}
            </strong>
            {voiceActionPending.client && (
              <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>
                (Actuel : {soldeActuel > 0 ? `Doit ${fcfa(soldeActuel)}` : soldeActuel < 0 ? `Avance ${fcfa(Math.abs(soldeActuel))}` : '0 F'})
              </span>
            )}
          </div>
        </div>
      )}

      {voiceActionPending.type === 'nouveau_client' && (
        <div style={{ background: '#ffffff', borderRadius: 10, padding: '12px 14px', border: '1px solid rgba(0,0,0,0.08)', fontSize: 13, color: '#334155', lineHeight: 1.5 }}>
          Ce client n&apos;est pas encore enregistré. En cliquant sur le bouton ci-dessous, sa fiche sera pré-remplie avec le nom <strong>« {voiceActionPending.nomClientPropose} »</strong> et sa dette initiale de <strong>{fcfa(voiceActionPending.montant)}</strong>.
        </div>
      )}

      {/* Boutons d'action */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {voiceActionPending.type === 'nouveau_client' ? (
          <button
            type="button"
            onClick={() => {
              const nom = voiceActionPending.nomClientPropose || ''
              setVoiceActionPending(null)
              onCreerNouveauClientVocal(nom)
            }}
            style={{ background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 13.5, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 8px rgba(37,99,235,0.25)' }}
          >
            <UserPlus size={16} />
            <span>Créer la fiche de « {voiceActionPending.nomClientPropose || 'Client'} »</span>
          </button>
        ) : (
          <>
            <button
              type="button"
              disabled={voiceActionLoading || !voiceActionPending.client || !voiceActionPending.montant}
              onClick={() => onValiderActionVocale(voiceActionPending)}
              style={{
                background: voiceActionPending.type === 'remboursement' ? '#16a34a' : '#ea580c',
                color: '#ffffff',
                border: 'none',
                borderRadius: 10,
                padding: '11px 22px',
                fontSize: 13.5,
                fontWeight: 800,
                cursor: voiceActionLoading || !voiceActionPending.client || !voiceActionPending.montant ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                opacity: voiceActionLoading || !voiceActionPending.client || !voiceActionPending.montant ? 0.6 : 1,
              }}
            >
              <Check size={16} />
              <span>
                {voiceActionLoading
                  ? 'Validation en cours…'
                  : voiceActionPending.type === 'remboursement'
                  ? `Valider le versement de ${fcfa(voiceActionPending.montant)}`
                  : `Enregistrer la dette de ${fcfa(voiceActionPending.montant)}`}
              </span>
            </button>

            <button
              type="button"
              disabled={voiceActionLoading}
              onClick={() => onModifierDepuisVocal(voiceActionPending)}
              style={{ background: '#ffffff', color: '#334155', border: '1.5px solid #cbd5e1', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Edit3 size={15} />
              <span>Articles catalogue / Détails</span>
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => setVoiceActionPending(null)}
          style={{ background: 'transparent', color: '#64748b', border: 'none', padding: '10px 12px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
        >
          Annuler
        </button>
      </div>
    </div>
  )
}
