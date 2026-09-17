'use client'

import React from 'react'
import type { Boutique, ManageTab } from '../../types'
import { ShoppingCart, PlusCircle, BookOpen, BarChart3 } from 'lucide-react'

interface BoutiqueDashboardEssentielViewProps {
  boutique: Boutique
  loading: boolean
  produitsCount: number | null
  dettesTotal: number | null
  caMois: number | null
  margeBruteMois?: number | null
  tauxMargeMois?: number | null
  nbEnAttente: number
  formatNumber: (n: number) => string
  formatPrice: (n: number) => string
  onNavigate: (tab: ManageTab, subTab?: string) => void
}

export default function BoutiqueDashboardEssentielView({
  boutique,
  loading,
  produitsCount,
  dettesTotal,
  caMois,
  margeBruteMois,
  tauxMargeMois,
  nbEnAttente,
  formatNumber,
  formatPrice,
  onNavigate,
}: BoutiqueDashboardEssentielViewProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
      {/* CARTE 1 : OUVRIR LA CAISSE POS TACTILE */}
      <div
        style={{
          background: 'linear-gradient(145deg, #FFF7ED 0%, #FFFFFF 100%)',
          border: '2px solid #FED7AA',
          borderRadius: 18,
          padding: 22,
          boxShadow: '0 4px 14px rgba(199,91,0,0.08)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 12,
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: '#FFEDD5',
                color: 'var(--accent, #C75B00)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShoppingCart size={28} />
            </div>
            <span
              style={{
                background: '#DCFCE7',
                color: '#166534',
                padding: '4px 10px',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              100% Hors-Ligne
            </span>
          </div>
          <h3 style={{ margin: '0 0 6px', fontSize: 19, fontWeight: 850, color: 'var(--navy, #1C2B4A)' }}>
            1. Caisse POS Tactile
          </h3>
          <p style={{ margin: 0, fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>
            Encaissez vos clients en boutique par <strong>Espèces, Wave direct</strong> ou{' '}
            <strong>Orange Money</strong> (0% commission). Ventes rapides et tickets de caisse.
          </p>
        </div>
        <a
          href={`/boutique/caisse?b=${boutique.id}`}
          onClick={() =>
            typeof window !== 'undefined' && localStorage.setItem('nopalou_pos_active_boutique_id', boutique.id)
          }
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            background: 'var(--accent, #C75B00)',
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: 15,
            padding: '14px 20px',
            borderRadius: 12,
            textDecoration: 'none',
            boxShadow: '0 4px 14px rgba(199,91,0,0.25)',
          }}
        >
          <span>Ouvrir la Caisse</span>
          <span style={{ fontSize: 18 }}>→</span>
        </a>
      </div>

      {/* CARTE 2 : AJOUTER UN PRODUIT AU CATALOGUE */}
      <div
        style={{
          background: 'linear-gradient(145deg, #F0FDF4 0%, #FFFFFF 100%)',
          border: '2px solid #BBF7D0',
          borderRadius: 18,
          padding: 22,
          boxShadow: '0 4px 14px rgba(22,163,74,0.08)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 12,
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: '#DCFCE7',
                color: '#16A34A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PlusCircle size={28} />
            </div>
            <span
              style={{
                background: '#DCFCE7',
                color: '#166534',
                padding: '4px 10px',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              Catalogue
            </span>
          </div>
          <h3 style={{ margin: '0 0 6px', fontSize: 19, fontWeight: 850, color: 'var(--navy, #1C2B4A)' }}>
            2. Mes Produits & Stock
          </h3>
          <p style={{ margin: 0, fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>
            Ajoutez un produit avec photo, prix et code-barres en moins de 30 secondes. Suivez vos stocks en temps
            réel.
          </p>
          <p style={{ margin: '8px 0 0', fontSize: 13, fontWeight: 750, color: 'var(--navy, #1C2B4A)' }}>
            {loading ? '...' : `${formatNumber(produitsCount ?? 0)} article(s) enregistré(s)`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('produits')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            background: '#16A34A',
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: 15,
            padding: '14px 20px',
            borderRadius: 12,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(22,163,74,0.25)',
          }}
        >
          <span>Gérer les Produits</span>
          <span style={{ fontSize: 18 }}>→</span>
        </button>
      </div>

      {/* CARTE 3 : CARNET DE DETTES CLIENTS */}
      <div
        style={{
          background: 'linear-gradient(145deg, #FEF2F2 0%, #FFFFFF 100%)',
          border: '2px solid #FECACA',
          borderRadius: 18,
          padding: 22,
          boxShadow: '0 4px 14px rgba(220,38,38,0.08)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 12,
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: '#FEE2E2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BookOpen size={28} />
            </div>
            <span
              style={{
                background: dettesTotal && dettesTotal > 0 ? '#FEE2E2' : '#F1F5F9',
                color: dettesTotal && dettesTotal > 0 ? '#991B1B' : '#475569',
                padding: '4px 10px',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              {dettesTotal && dettesTotal > 0 ? 'Crédits Actifs' : 'Zéro dette'}
            </span>
          </div>
          <h3 style={{ margin: '0 0 6px', fontSize: 19, fontWeight: 850, color: 'var(--navy, #1C2B4A)' }}>
            3. Carnet de Dettes & Crédits
          </h3>
          <p style={{ margin: 0, fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>
            Enregistrez les crédits accordés à vos clients de confiance et envoyez un{' '}
            <strong>rappel WhatsApp courtois</strong> avec lien de règlement Wave en 1 clic.
          </p>
          <p
            style={{
              margin: '8px 0 0',
              fontSize: 14,
              fontWeight: 850,
              color: dettesTotal && dettesTotal > 0 ? '#DC2626' : '#16A34A',
            }}
          >
            {loading
              ? '...'
              : dettesTotal && dettesTotal > 0
              ? `Total à recouvrer : ${formatPrice(dettesTotal)}`
              : 'Aucun crédit client en attente'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('carnet')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            background: '#DC2626',
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: 15,
            padding: '14px 20px',
            borderRadius: 12,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(220,38,38,0.25)',
          }}
        >
          <span>Consulter le Carnet</span>
          <span style={{ fontSize: 18 }}>→</span>
        </button>
      </div>

      {/* CARTE 4 : MES VENTES & CHIFFRE D'AFFAIRES */}
      <div
        style={{
          background: 'linear-gradient(145deg, #EFF6FF 0%, #FFFFFF 100%)',
          border: '2px solid #BFDBFE',
          borderRadius: 18,
          padding: 22,
          boxShadow: '0 4px 14px rgba(37,99,235,0.08)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 12,
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: '#DBEAFE',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BarChart3 size={28} />
            </div>
            <span
              style={{
                background: '#EFF6FF',
                color: '#1E40AF',
                padding: '4px 10px',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              ● Ce mois
            </span>
          </div>
          <h3 style={{ margin: '0 0 6px', fontSize: 19, fontWeight: 850, color: 'var(--navy, #1C2B4A)' }}>
            4. Mes Ventes du Jour & du Mois
          </h3>
          <p style={{ margin: 0, fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>
            Consultez le total de vos encaissements (Espèces, Wave, Orange Money) et traitez les commandes reçues via
            votre vitrine web ou WhatsApp.
          </p>
          <div style={{ margin: '8px 0 0', display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
              {loading ? '...' : caMois !== null ? `${formatPrice(caMois)}` : '0 FCFA'}
            </span>
            {nbEnAttente > 0 && (
              <span style={{ fontSize: 12, fontWeight: 750, color: '#DC2626' }}>
                ({nbEnAttente} commande(s) à préparer)
              </span>
            )}
          </div>
          {margeBruteMois !== undefined && margeBruteMois !== null && margeBruteMois > 0 && (
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--price, #0A5C36)', marginTop: 4 }}>
              Marge brute estimée : {formatPrice(margeBruteMois)}
              {tauxMargeMois ? ` (${tauxMargeMois}%)` : ''}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={() => onNavigate('compta')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              background: '#2563EB',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: 14.5,
              padding: '14px 16px',
              borderRadius: 12,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
            }}
          >
            <span>Bilan & Ventes</span>
            <span style={{ fontSize: 18 }}>→</span>
          </button>
          {nbEnAttente > 0 && (
            <button
              type="button"
              onClick={() => onNavigate('commandes')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#FEF2F2',
                color: '#DC2626',
                border: '1.5px solid #FECACA',
                fontWeight: 800,
                fontSize: 13,
                padding: '14px 16px',
                borderRadius: 12,
                cursor: 'pointer',
              }}
            >
              Commandes ({nbEnAttente})
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
