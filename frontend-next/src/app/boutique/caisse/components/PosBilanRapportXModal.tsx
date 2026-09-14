'use client'

import React from 'react'
import { X, Printer } from 'lucide-react'

interface PosBilanRapportXModalProps {
  isOpen: boolean
  onClose: () => void
  caissierNom: string
  roleActif: string
  boutiqueNom?: string
  session: any
  netAPayer: number
  panierLength: number
  fcfa: (montant: any) => string
}

export default function PosBilanRapportXModal({
  isOpen,
  onClose,
  caissierNom,
  roleActif,
  boutiqueNom = 'Nopalou POS',
  session,
  netAPayer,
  panierLength,
  fcfa,
}: PosBilanRapportXModalProps) {
  if (!isOpen) return null

  const fondInitial = session?.fondDeCaisse || 0
  const totalVentes = (session?.ventes?.total ?? (panierLength > 0 ? netAPayer : 0)) || 0
  const nbVentes = session?.ventes?.nbVentes ?? 0
  const totalEspeces = session?.ventes?.especes ?? 0
  const totalWave = session?.ventes?.wave ?? 0
  const totalOM = session?.ventes?.orangeMoney ?? 0
  const totalCarte = session?.ventes?.carte ?? 0
  const totalMixte = session?.ventes?.mixte ?? 0

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}
    >
      <div
        style={{
          background: 'var(--card, #ffffff)',
          borderRadius: 'var(--r-xl, 16px)',
          maxWidth: 540,
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: 'var(--shadow-xl, 0 16px 40px rgba(26,22,18,.16))',
          border: '1px solid var(--border, #E8DDD2)'
        }}
      >
        {/* En-tête Modale */}
        <div
          style={{
            background: 'var(--navy, #1C2B4A)',
            color: '#ffffff',
            padding: '18px 20px',
            borderTopLeftRadius: 15,
            borderTopRightRadius: 15,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
              Bilan de Session Caissier (Rapport X)
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--border, #E8DDD2)' }}>
              Synthèse d&apos;activité intermédiaire sans clôture de la caisse
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
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

        {/* Corps Modale */}
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Carte Identité Session & Caissier */}
          <div
            style={{
              background: 'var(--bg, #F8F5F0)',
              border: '1px solid var(--border, #E8DDD2)',
              borderRadius: 'var(--r-lg, 12px)',
              padding: 14,
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 10
            }}
          >
            <div>
              <span style={{ fontSize: 11, color: 'var(--text2, #5A4E42)', display: 'block', fontWeight: 600 }}>Caissier Titulaire</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                {caissierNom} ({roleActif === 'superviseur' ? 'Superviseur' : 'Caissier'})
              </span>
            </div>
            <div>
              <span style={{ fontSize: 11, color: 'var(--text2, #5A4E42)', display: 'block', fontWeight: 600 }}>Boutique</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>{boutiqueNom}</span>
            </div>
            <div>
              <span style={{ fontSize: 11, color: 'var(--text2, #5A4E42)', display: 'block', fontWeight: 600 }}>Ouverture Session</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
                {session?.dateOuverture
                  ? session.dateOuverture.includes(':') && !session.dateOuverture.includes('T')
                    ? `Aujourd'hui à ${session.dateOuverture}`
                    : session.dateOuverture
                  : 'Session Active'}
              </span>
            </div>
            <div>
              <span style={{ fontSize: 11, color: 'var(--text2, #5A4E42)', display: 'block', fontWeight: 600 }}>Statut Session</span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: 'var(--price, #0A5C36)',
                  background: '#dcfce7',
                  padding: '2px 8px',
                  borderRadius: 6,
                  display: 'inline-block'
                }}
              >
                ● Active en cours
              </span>
            </div>
          </div>

          {/* Chiffres Clés Synthétiques */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: 12, textAlign: 'center' }}>
              <span style={{ fontSize: 11, color: '#1e40af', fontWeight: 700, display: 'block' }}>Fond de Caisse Initial</span>
              <span style={{ fontSize: 16, fontWeight: 900, color: '#1e3a5f' }}>{fcfa(fondInitial)}</span>
            </div>

            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 12, textAlign: 'center' }}>
              <span style={{ fontSize: 11, color: '#166534', fontWeight: 700, display: 'block' }}>Total Ventes (CA)</span>
              <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--price, #0A5C36)' }}>{fcfa(totalVentes)}</span>
            </div>

            <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12, padding: 12, textAlign: 'center' }}>
              <span style={{ fontSize: 11, color: '#9a3412', fontWeight: 700, display: 'block' }}>Nombre de Tickets</span>
              <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--accent, #C75B00)' }}>
                {nbVentes} vente{nbVentes > 1 ? 's' : ''}
              </span>
            </div>

            <div style={{ background: '#fefce8', border: '1px solid #fef08a', borderRadius: 12, padding: 12, textAlign: 'center' }}>
              <span style={{ fontSize: 11, color: '#854d0e', fontWeight: 700, display: 'block' }}>Espèces Théoriques Caisse</span>
              <span style={{ fontSize: 16, fontWeight: 900, color: '#a16207' }}>{fcfa(fondInitial + totalEspeces)}</span>
            </div>
          </div>

          {/* Ventilation Détaillée par Mode de Paiement */}
          <div style={{ border: '1px solid var(--border, #E8DDD2)', borderRadius: 12, padding: 14, background: 'var(--card, #ffffff)' }}>
            <h4
              style={{
                margin: '0 0 10px',
                fontSize: 13,
                fontWeight: 800,
                color: 'var(--pos-navy, #1C2B4A)',
                borderBottom: '1px solid var(--border, #E8DDD2)',
                paddingBottom: 6
              }}
            >
              Ventilation des Encaissements par Mode de Règlement
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', background: 'var(--bg, #F8F5F0)', borderRadius: 6 }}>
                <span style={{ fontWeight: 700, color: 'var(--text2, #5A4E42)' }}>Ventes en Espèces</span>
                <span className="fcfa-num" style={{ fontWeight: 900, color: 'var(--pos-navy, #1C2B4A)' }}>{fcfa(totalEspeces)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', background: 'var(--bg, #F8F5F0)', borderRadius: 6 }}>
                <span style={{ fontWeight: 700, color: '#0284c7' }}>Ventes Wave Mobile</span>
                <span className="fcfa-num" style={{ fontWeight: 900, color: 'var(--pos-navy, #1C2B4A)' }}>{fcfa(totalWave)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', background: 'var(--bg, #F8F5F0)', borderRadius: 6 }}>
                <span style={{ fontWeight: 700, color: '#ea580c' }}>Ventes Orange Money</span>
                <span className="fcfa-num" style={{ fontWeight: 900, color: 'var(--pos-navy, #1C2B4A)' }}>{fcfa(totalOM)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', background: 'var(--bg, #F8F5F0)', borderRadius: 6 }}>
                <span style={{ fontWeight: 700, color: '#4f46e5' }}>Ventes Carte Bancaire</span>
                <span className="fcfa-num" style={{ fontWeight: 900, color: 'var(--pos-navy, #1C2B4A)' }}>{fcfa(totalCarte)}</span>
              </div>

              {totalMixte > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', background: 'var(--bg, #F8F5F0)', borderRadius: 6 }}>
                  <span style={{ fontWeight: 700, color: '#9333ea' }}>Ventes Paiement Mixte</span>
                  <span className="fcfa-num" style={{ fontWeight: 900, color: 'var(--pos-navy, #1C2B4A)' }}>{fcfa(totalMixte)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Boutons d'Action */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button
              type="button"
              onClick={() => window.print()}
              style={{
                flex: 1,
                padding: '12px',
                background: 'var(--navy, #1C2B4A)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 'var(--r-md, 8px)',
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}
            >
              <Printer size={16} />
              <span>Imprimer Rapport X (80mm)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                background: '#f1f5f9',
                color: 'var(--text2, #5A4E42)',
                border: '1px solid var(--border, #E8DDD2)',
                borderRadius: 'var(--r-md, 8px)',
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer'
              }}
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
