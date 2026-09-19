'use client'

import React from 'react'
import {
  Package,
  Truck,
  Building2,
  Users,
  Sparkles,
  FileText,
  Receipt,
  Tag,
  Camera,
  Check,
  type LucideIcon,
} from 'lucide-react'
import { inputStyle, labelStyle, CAT_DEPENSES } from '../utils'
import { useTranslation } from '@/i18n/context'

interface ComptaSaisieExpressDepenseFormProps {
  montantDepense: string
  setMontantDepense: (v: string) => void
  catDepense: string
  setCatDepense: (v: string) => void
  descDepense: string
  setDescDepense: (v: string) => void
  ocrDetections: string[]
  onDemarrerScannerNom: () => void
  onValiderDepenseRapide: (e: React.FormEvent) => void
  loading: boolean
}

const MONTANTS_RAPIDES = [500, 1000, 2000, 5000, 10000, 25000]

const CATEGORIES_CONFIG: Record<
  string,
  { label: string; icon: LucideIcon }
> = {
  transport: { label: 'Transport / Tiak-Tiak', icon: Truck },
  stock: { label: 'Stock / Marchandise', icon: Package },
  loyer: { label: 'Loyer & Factures', icon: Building2 },
  salaires: { label: 'Salaires & Avances', icon: Users },
  marketing: { label: 'Marketing & Pub', icon: Sparkles },
  fournitures: { label: 'Fournitures & Sacs', icon: FileText },
  taxes: { label: 'Taxes & Droits', icon: Receipt },
  autre: { label: 'Autre Dépense', icon: Tag },
}

const SUGGESTIONS_MOTIFS: Record<string, string[]> = {
  transport: ['Course Tiak-Tiak', 'Taxi livraison', 'Car rapide / Essence'],
  loyer: ['Woyofal Électricité', 'Facture Senelec', 'Facture Sen’Eau', 'Loyer local'],
  stock: ['Achat stock Sandaga', 'Frais douane / Colis', 'Réassort grossiste'],
  fournitures: ['Sacs emballage', 'Rouleaux papier thermique', 'Scotch & cartons'],
  autre: ['Déjeuner boutique', 'Crédit téléphonique', 'Entretien & ménage'],
}

export function ComptaSaisieExpressDepenseForm({
  montantDepense,
  setMontantDepense,
  catDepense,
  setCatDepense,
  descDepense,
  setDescDepense,
  ocrDetections,
  onDemarrerScannerNom,
  onValiderDepenseRapide,
  loading,
}: ComptaSaisieExpressDepenseFormProps) {
  const { t } = useTranslation()

  const currentSuggestions = SUGGESTIONS_MOTIFS[catDepense] || SUGGESTIONS_MOTIFS.autre

  const montantNum = Number(montantDepense) || 0

  return (
    <form
      onSubmit={onValiderDepenseRapide}
      style={{
        background: '#ffffff',
        border: '1px solid var(--border, #E8DDD2)',
        borderRadius: 16,
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        boxShadow: '0 4px 16px rgba(28, 43, 74, 0.04)',
      }}
    >

      {/* ── SECTION 1 : MONTANT & PUCES RAPIDES ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <label style={{ ...labelStyle, margin: 0, fontSize: 12, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
            {t('shop.expenseAmountLabel') || 'Montant de la Dépense (FCFA)'} *
          </label>
          {montantNum > 0 && (
            <span style={{ fontSize: 12, fontWeight: 800, color: '#B91C1C' }}>
              - {montantNum.toLocaleString('fr-FR')} FCFA
            </span>
          )}
        </div>

        <div style={{ position: 'relative' }}>
          <input
            id="express-depense-montant"
            type="number"
            required
            min="1"
            placeholder="Ex: 5000"
            value={montantDepense}
            onChange={(e) => setMontantDepense(e.target.value)}
            style={{
              ...inputStyle,
              borderRadius: 14,
              padding: '14px 16px',
              fontSize: 22,
              fontWeight: 900,
              color: 'var(--navy, #1C2B4A)',
              border: '1.5px solid var(--border, #E8DDD2)',
              background: '#ffffff',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
            }}
          />
        </div>

        {/* Puces de montants en 1 tap */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
          {MONTANTS_RAPIDES.map((m) => {
            const isSelected = montantDepense === String(m)
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMontantDepense(String(m))}
                style={{
                  padding: '6px 12px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: isSelected ? 900 : 700,
                  border: isSelected ? '1.5px solid var(--accent, #C75B00)' : '1px solid var(--border, #E8DDD2)',
                  background: isSelected ? 'var(--accent, #C75B00)' : '#ffffff',
                  color: isSelected ? '#ffffff' : 'var(--navy, #1C2B4A)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {m.toLocaleString('fr-FR')} F
              </button>
            )
          })}
        </div>
      </div>

      {/* ── SECTION 2 : CATÉGORIES TACTILES (CAT_DEPENSES) ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ ...labelStyle, margin: 0, fontSize: 12, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
          {t('shop.productCategory') || 'Catégorie de la dépense'} *
        </label>

        <div
          style={{
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            paddingBottom: 4,
            scrollbarWidth: 'none',
          }}
        >
          {CAT_DEPENSES.map((catKey) => {
            const cfg = CATEGORIES_CONFIG[catKey] || { label: catKey, icon: Tag }
            const IconComp = cfg.icon
            const isSelected = catDepense === catKey

            return (
              <button
                key={catKey}
                type="button"
                onClick={() => setCatDepense(catKey)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 10,
                  border: isSelected ? '1.5px solid var(--accent, #C75B00)' : '1px solid var(--border, #E8DDD2)',
                  background: isSelected ? '#FFF7ED' : 'var(--bg, #F8F5F0)',
                  color: isSelected ? 'var(--accent, #C75B00)' : 'var(--navy, #1C2B4A)',
                  fontWeight: isSelected ? 800 : 600,
                  fontSize: 12,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 2px 6px rgba(199, 91, 0, 0.15)' : 'none',
                }}
              >
                <IconComp size={13} strokeWidth={2.4} />
                <span>{cfg.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── SECTION 3 : MOTIF & SCANNER OCR TICKET ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ ...labelStyle, margin: 0, fontSize: 12, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
            {t('shop.expenseReasonLabel') || 'Motif ou description'}
          </label>
          <button
            type="button"
            onClick={onDemarrerScannerNom}
            style={{
              background: '#FFF3E8',
              color: 'var(--accent, #C75B00)',
              border: '1px solid #FED7AA',
              borderRadius: 8,
              padding: '4px 10px',
              fontSize: 11.5,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              transition: 'all 0.15s ease',
            }}
          >
            <Camera size={13} strokeWidth={2.4} />
            <span>{t('shop.scanReceiptOcrBtn') || 'Scanner Ticket OCR'}</span>
          </button>
        </div>

        <input
          type="text"
          placeholder="Ex: Facture, sacs, transport..."
          value={descDepense}
          onChange={(e) => setDescDepense(e.target.value)}
          style={{
            ...inputStyle,
            borderRadius: 12,
            padding: '11px 14px',
            fontSize: 13.5,
            border: '1.5px solid var(--border, #E8DDD2)',
          }}
        />

        {/* Puces de détection OCR si existantes */}
        {ocrDetections.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 2 }}>
            <span style={{ fontSize: 11, color: 'var(--accent, #C75B00)', fontWeight: 700, alignSelf: 'center' }}>
              Détecté :
            </span>
            {ocrDetections.map((txt: string, idx: number) => (
              <button
                key={idx}
                type="button"
                onClick={() => setDescDepense(txt)}
                style={{
                  background: '#FFF3E8',
                  color: 'var(--accent, #C75B00)',
                  border: '1px solid #FED7AA',
                  borderRadius: 6,
                  padding: '2px 8px',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {txt}
              </button>
            ))}
          </div>
        )}

        {/* Suggestions rapides adaptées à la catégorie sélectionnée */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 2 }}>
          {currentSuggestions.map((sug) => (
            <button
              key={sug}
              type="button"
              onClick={() => setDescDepense(sug)}
              style={{
                fontSize: 11,
                padding: '3px 9px',
                borderRadius: 14,
                border: '1px solid var(--border, #E8DDD2)',
                background: descDepense === sug ? 'var(--navy, #1C2B4A)' : 'var(--bg, #F8F5F0)',
                color: descDepense === sug ? '#ffffff' : 'var(--text2, #5A4E42)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {sug}
            </button>
          ))}
        </div>
      </div>

      {/* ── SECTION 4 : BOUTON DE VALIDATION GÉANT ── */}
      <button
        type="submit"
        disabled={loading || montantNum <= 0}
        style={{
          background: montantNum > 0 ? 'linear-gradient(135deg, var(--accent, #C75B00) 0%, #B91C1C 100%)' : 'var(--border, #E8DDD2)',
          color: montantNum > 0 ? '#ffffff' : 'var(--text3, #8C7E74)',
          border: 'none',
          borderRadius: 14,
          padding: '15px 20px',
          fontWeight: 900,
          fontSize: 15,
          cursor: montantNum > 0 ? 'pointer' : 'not-allowed',
          boxShadow: montantNum > 0 ? '0 6px 20px rgba(199, 91, 0, 0.25)' : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          transition: 'all 0.2s ease',
          marginTop: 4,
        }}
      >
        <Check size={18} strokeWidth={2.8} />
        <span>
          {loading
            ? (t('common.loading') || 'Enregistrement en cours...')
            : montantNum > 0
            ? `Valider la Dépense (${montantNum.toLocaleString('fr-FR')} FCFA)`
            : (t('shop.validateExpenseBtn') || 'Valider la Dépense')}
        </span>
      </button>
    </form>
  )
}
