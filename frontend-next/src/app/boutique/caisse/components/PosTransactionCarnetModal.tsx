'use client'

import React from 'react'
import { X, Check } from 'lucide-react'
import PosCarnetCataloguePicker, { type ProduitItem } from './PosCarnetCataloguePicker'

interface PosTransactionCarnetModalProps {
  isOpen: boolean
  onClose: () => void
  client: { id: string; nom: string; solde: number } | null
  typeTrans: 'vente_credit' | 'remboursement' | 'depot_avance'
  modeSaisie: 'catalogue' | 'manuel'
  setModeSaisie: (mode: 'catalogue' | 'manuel') => void
  panierCarnet: Record<string, number>
  setPanierCarnet: React.Dispatch<React.SetStateAction<Record<string, number>>>
  produits: ProduitItem[]
  rechercheProd: string
  setRechercheProd: (q: string) => void
  montantTrans: string
  setMontantTrans: (m: string) => void
  modePaiementTrans: string
  setModePaiementTrans: (m: string) => void
  produitsTrans: string
  setProduitsTrans: (p: string) => void
  dateEcheanceTrans: string
  setDateEcheanceTrans: (d: string) => void
  relanceAutoWa: boolean
  setRelanceAutoWa: (r: boolean) => void
  noteTrans: string
  setNoteTrans: (n: string) => void
  submitting: boolean
  onSubmit: (() => Promise<void>) | (() => void)
  fcfa: (montant: any) => string
}

export default function PosTransactionCarnetModal({
  isOpen,
  onClose,
  client,
  typeTrans,
  modeSaisie,
  setModeSaisie,
  panierCarnet,
  setPanierCarnet,
  produits,
  rechercheProd,
  setRechercheProd,
  montantTrans,
  setMontantTrans,
  modePaiementTrans,
  setModePaiementTrans,
  produitsTrans,
  setProduitsTrans,
  dateEcheanceTrans,
  setDateEcheanceTrans,
  relanceAutoWa,
  setRelanceAutoWa,
  noteTrans,
  setNoteTrans,
  submitting,
  onSubmit,
  fcfa
}: PosTransactionCarnetModalProps) {
  if (!isOpen || !client) return null

  const totalPanierCatalogue = Object.entries(panierCarnet).reduce((sum, [pId, qte]) => {
    const p = produits.find(item => item.id === pId)
    const prix = p ? Number(p.prix || 0) : 0
    return sum + (prix * qte)
  }, 0)

  const totalCourant = (typeTrans === 'vente_credit' && modeSaisie === 'catalogue')
    ? totalPanierCatalogue
    : (Number(montantTrans) || 0)

  const prodsFiltres = produits.filter(p => {
    if (!rechercheProd.trim()) return true
    const q = rechercheProd.toLowerCase()
    return p.nom.toLowerCase().includes(q) || (p.code_barre && p.code_barre.includes(q))
  })

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.75)',
        zIndex: 1050,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
      }}
    >
      <div
        style={{
          background: 'var(--card, #ffffff)',
          borderRadius: 'var(--r-xl, 16px)',
          padding: 24,
          width: '100%',
          maxWidth: 640,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid var(--border, #E8DDD2)',
          boxShadow: 'var(--shadow-xl, 0 16px 40px rgba(26,22,18,.16))',
          fontFamily: 'var(--font-inter), system-ui, -apple-system, sans-serif'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
            borderBottom: '1px solid var(--border, #E8DDD2)',
            paddingBottom: 12
          }}
        >
          <h3 style={{ margin: 0, fontSize: 18, color: 'var(--navy, #1C2B4A)', fontWeight: 900 }}>
            {typeTrans === 'vente_credit' ? 'Nouvelle Vente à Crédit' : 'Encaisser un Remboursement'}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              color: 'var(--text2, #5A4E42)',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div
          style={{
            background: 'var(--bg, #F8F5F0)',
            borderRadius: 'var(--r-lg, 12px)',
            padding: '10px 14px',
            marginBottom: 14,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            border: '1px solid var(--border, #E8DDD2)'
          }}
        >
          <div>
            <span style={{ fontSize: 11, color: 'var(--text2, #5A4E42)', fontWeight: 700 }}>Client sélectionné</span>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>{client.nom}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 11, color: 'var(--text2, #5A4E42)', fontWeight: 700 }}>Solde actuel</span>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 900,
                color: client.solde > 0 ? '#dc2626' : 'var(--price, #0A5C36)'
              }}
            >
              {client.solde > 0 ? fcfa(client.solde) : `${fcfa(Math.abs(client.solde))} (Avance)`}
            </p>
          </div>
        </div>

        {typeTrans === 'vente_credit' && (
          <div style={{ display: 'flex', background: '#f1f5f9', padding: 4, borderRadius: 'var(--r-lg, 12px)', marginBottom: 16, gap: 4 }}>
            <button
              onClick={() => setModeSaisie('catalogue')}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 'var(--r-md, 8px)',
                border: 'none',
                background: modeSaisie === 'catalogue' ? '#ffffff' : 'transparent',
                color: modeSaisie === 'catalogue' ? 'var(--navy, #1C2B4A)' : 'var(--text2, #5A4E42)',
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
                boxShadow: modeSaisie === 'catalogue' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              Choisir du Catalogue
            </button>
            <button
              onClick={() => setModeSaisie('manuel')}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 'var(--r-md, 8px)',
                border: 'none',
                background: modeSaisie === 'manuel' ? '#ffffff' : 'transparent',
                color: modeSaisie === 'manuel' ? 'var(--navy, #1C2B4A)' : 'var(--text2, #5A4E42)',
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
                boxShadow: modeSaisie === 'manuel' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              Saisie Libre / Hors-Catalogue
            </button>
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14, paddingRight: 4 }}>
          {typeTrans === 'vente_credit' && modeSaisie === 'catalogue' && (
            <PosCarnetCataloguePicker
              rechercheProd={rechercheProd}
              setRechercheProd={setRechercheProd}
              prodsFiltres={prodsFiltres}
              panierCarnet={panierCarnet}
              setPanierCarnet={setPanierCarnet}
              fcfa={fcfa}
            />
          )}

          {(typeTrans === 'remboursement' || modeSaisie === 'manuel') && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--text2, #5A4E42)', display: 'block', marginBottom: 4 }}>
                Montant (FCFA) *
              </label>
              <input
                type="number"
                placeholder="Ex: 5000"
                value={montantTrans}
                onChange={e => setMontantTrans(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--r-md, 8px)',
                  border: '1px solid var(--border, #E8DDD2)',
                  fontSize: 16,
                  fontWeight: 900,
                  boxSizing: 'border-box'
                }}
              />
            </div>
          )}

          {typeTrans === 'remboursement' && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--text2, #5A4E42)', display: 'block', marginBottom: 4 }}>
                Mode de Paiement Reçu
              </label>
              <select
                value={modePaiementTrans}
                onChange={e => setModePaiementTrans(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--r-md, 8px)',
                  border: '1px solid var(--border, #E8DDD2)',
                  fontSize: 15,
                  boxSizing: 'border-box'
                }}
              >
                <option value="especes">Espèces Cash</option>
                <option value="wave">Wave Senegal</option>
                <option value="orange_money">Orange Money</option>
              </select>
            </div>
          )}

          {typeTrans === 'vente_credit' && (
            <>
              {modeSaisie === 'manuel' && (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--text2, #5A4E42)', display: 'block', marginBottom: 4 }}>
                    Description / Articles informels
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 2x Sac de riz, 1 Carton d'huile..."
                    value={produitsTrans}
                    onChange={e => setProduitsTrans(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--r-md, 8px)',
                      border: '1px solid var(--border, #E8DDD2)',
                      fontSize: 14,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              )}
              <div>
                <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--text2, #5A4E42)', display: 'block', marginBottom: 4 }}>
                  Date d&apos;échéance / Promesse de règlement
                </label>
                <input
                  type="date"
                  value={dateEcheanceTrans}
                  onChange={e => setDateEcheanceTrans(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--r-md, 8px)',
                    border: '1px solid var(--border, #E8DDD2)',
                    fontSize: 14,
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--navy, #1C2B4A)',
                  cursor: 'pointer',
                  background: 'var(--bg, #F8F5F0)',
                  padding: 10,
                  borderRadius: 'var(--r-md, 8px)',
                  border: '1px solid var(--border, #E8DDD2)'
                }}
              >
                <input
                  type="checkbox"
                  checked={relanceAutoWa}
                  onChange={e => setRelanceAutoWa(e.target.checked)}
                />
                <span>Activer la relance automatique WhatsApp à la date d&apos;échéance</span>
              </label>
            </>
          )}

          <div>
            <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--text2, #5A4E42)', display: 'block', marginBottom: 4 }}>
              Note / Justification (Optionnelle)
            </label>
            <input
              type="text"
              placeholder="Ex: Remboursement partiel par sa sœur, avance, etc."
              value={noteTrans}
              onChange={e => setNoteTrans(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--r-md, 8px)',
                border: '1px solid var(--border, #E8DDD2)',
                fontSize: 13,
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* Pied de modale : Total et validation */}
        <div
          style={{
            marginTop: 16,
            paddingTop: 14,
            borderTop: '1px solid var(--border, #E8DDD2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12
          }}
        >
          <div>
            <span style={{ fontSize: 11, color: 'var(--text2, #5A4E42)', fontWeight: 800, textTransform: 'uppercase' }}>
              TOTAL TRANSACTION
            </span>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: typeTrans === 'vente_credit' ? '#ef4444' : 'var(--price, #0A5C36)' }}>
              {fcfa(totalCourant)}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 16px',
                background: '#e2e8f0',
                color: 'var(--text2, #5A4E42)',
                border: 'none',
                borderRadius: 'var(--r-md, 8px)',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Annuler
            </button>
            <button
              disabled={submitting}
              onClick={onSubmit}
              style={{
                padding: '10px 20px',
                background: typeTrans === 'remboursement' ? 'var(--price, #0A5C36)' : '#ef4444',
                color: '#ffffff',
                border: 'none',
                borderRadius: 'var(--r-md, 8px)',
                fontWeight: 900,
                cursor: submitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Check size={16} />
              <span>{submitting ? 'Enregistrement...' : typeTrans === 'remboursement' ? 'Encaisser' : 'Valider la Dette'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
