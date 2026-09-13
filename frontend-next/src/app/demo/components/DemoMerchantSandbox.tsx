'use client'

import React, { useState } from 'react'
import {
  Monitor,
  Barcode,
  BookOpen,
  TrendingUp,
  Users,
  Camera,
  Smartphone,
  MessageCircle,
  Banknote,
  QrCode
} from 'lucide-react'
import { PosCartItem, StickerProduct, RelanceClient, DemoExplanation } from './types'

interface DemoMerchantSandboxProps {
  posCart: PosCartItem[]
  totalPosCart: number
  onSimulateScanItem: () => void
  onOpenCloudScanner: () => void
  onOpenSticker: (prod: StickerProduct) => void
  onOpenRelance: (client: RelanceClient) => void
  onSelectExplanation: (exp: DemoExplanation) => void
}

type MerchantTab = 'pos' | 'catalogue' | 'credit' | 'analytics' | 'equipe'

export default function DemoMerchantSandbox({
  posCart,
  totalPosCart,
  onSimulateScanItem,
  onOpenCloudScanner,
  onOpenSticker,
  onOpenRelance,
  onSelectExplanation
}: DemoMerchantSandboxProps) {
  const [merchantTab, setMerchantTab] = useState<MerchantTab>('pos')

  const subTabs: { id: MerchantTab; label: string; icon: React.ComponentType<any> }[] = [
    { id: 'pos', label: 'Caisse POS Tactile', icon: Monitor },
    { id: 'catalogue', label: 'Produits & EAN-13', icon: Barcode },
    { id: 'credit', label: 'Carnet Dettes Client', icon: BookOpen },
    { id: 'analytics', label: 'Analytics & Ventes', icon: TrendingUp },
    { id: 'equipe', label: 'Équipe & PIN', icon: Users },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Merchant Sub-tabs */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          flexWrap: 'wrap',
          background: '#020617',
          padding: 6,
          borderRadius: 10,
          border: '1px solid #1E293B'
        }}
      >
        {subTabs.map(t => {
          const Icon = t.icon
          const isSelected = merchantTab === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setMerchantTab(t.id)}
              style={{
                background: isSelected ? 'var(--accent)' : 'transparent',
                color: '#FFF',
                border: 'none',
                padding: '8px 12px',
                borderRadius: 6,
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Icon size={14} />
              <span>{t.label}</span>
            </button>
          )
        })}
      </div>

      {/* TAB 1: POS CAISSE */}
      {merchantTab === 'pos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div
            style={{
              background: '#1E293B',
              padding: 12,
              borderRadius: 8,
              fontSize: 12,
              color: '#E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 8
            }}
          >
            <span>
              <strong>Mode Caisse POS :</strong> Encaissez vos ventes en magasin avec 3 modes de scan.
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={onSimulateScanItem}
                style={{
                  background: '#059669',
                  color: '#FFF',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5
                }}
              >
                <Camera size={13} />
                <span>Scanner Caméra</span>
              </button>
              <button
                type="button"
                onClick={onOpenCloudScanner}
                style={{
                  background: '#0284C7',
                  color: '#FFF',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5
                }}
              >
                <Smartphone size={13} />
                <span>Douchette Smartphone</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
            {/* Cart items */}
            <div
              style={{
                background: '#020617',
                padding: 14,
                borderRadius: 10,
                border: '1px solid #1E293B',
                display: 'flex',
                flexDirection: 'column',
                gap: 10
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 800, color: '#FFF' }}>Panier Caisse Actuel</div>
              {posCart.map(it => (
                <div
                  key={it.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#0F172A',
                    padding: 8,
                    borderRadius: 6,
                    fontSize: 12
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: '#FFF' }}>{it.name}</div>
                    <div style={{ fontSize: 10, color: '#94A3B8' }}>EAN: {it.ean} | x{it.qty}</div>
                  </div>
                  <div style={{ fontWeight: 800, color: '#10B981' }}>{(it.price * it.qty).toLocaleString()} FCFA</div>
                </div>
              ))}
            </div>

            {/* Total & Checkout */}
            <div
              style={{
                background: '#020617',
                padding: 14,
                borderRadius: 10,
                border: '1px solid #1E293B',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ fontSize: 11, color: '#94A3B8' }}>TOTAL À ENCAISSER :</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#10B981' }}>{totalPosCart.toLocaleString()} FCFA</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <button
                  type="button"
                  onClick={() =>
                    onSelectExplanation({
                      title: 'Encaissement Cash / Espèces',
                      desc: 'Enregistre la vente en caisse, calcule la monnaie à rendre et met à jour le stock.',
                      backend: 'Insère la transaction dans la table comptabilite_transactions et incrémente le fond de caisse Z.',
                      benefit: 'Rapport de clôture de caisse 100% exact à la fin de la journée.'
                    })
                  }
                  style={{
                    background: '#10B981',
                    color: '#020617',
                    border: 'none',
                    padding: 8,
                    borderRadius: 6,
                    fontWeight: 800,
                    fontSize: 11,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4
                  }}
                >
                  <Banknote size={13} />
                  <span>Cash Espèces</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onSelectExplanation({
                      title: 'Encaissement Wave / Orange Money',
                      desc: 'Paiement sans contact Wave ou Orange Money directement sur le QR code du magasin.',
                      backend: 'Lien direct ou Webhook API Wave/OM avec réconciliation automatique.',
                      benefit: 'Encaissement rapide sans risque d\'erreur de monnaie.'
                    })
                  }
                  style={{
                    background: '#0284C7',
                    color: '#FFF',
                    border: 'none',
                    padding: 8,
                    borderRadius: 6,
                    fontWeight: 800,
                    fontSize: 11,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4
                  }}
                >
                  <QrCode size={13} />
                  <span>Wave / OM</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CATALOGUE & EAN-13 */}
      {merchantTab === 'catalogue' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#1E293B', padding: 12, borderRadius: 8, fontSize: 12, color: '#E2E8F0' }}>
            <strong>Gestion EAN-13 :</strong> Saisissez le code fabricant ou cliquez sur Générer EAN pour créer un code GS1 Modulo 10 scannable.
          </div>

          {[
            { nom: 'Sac de Riz Parfumé 50kg', prix: 22500, stock: 45, ean: '2008492019482' },
            { nom: 'Huile Dinor 5L', prix: 7500, stock: 120, ean: '2004928104829' },
            { nom: 'Sucre Cristallisé 1kg', prix: 650, stock: 200, ean: '2007849102941' },
          ].map((p, idx) => (
            <div
              key={idx}
              style={{
                background: '#020617',
                padding: 12,
                borderRadius: 8,
                border: '1px solid #1E293B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 10
              }}
            >
              <div>
                <div style={{ fontWeight: 800, color: '#FFF', fontSize: 13 }}>{p.nom}</div>
                <div style={{ fontSize: 11, color: '#94A3B8' }}>
                  {p.prix.toLocaleString()} FCFA | Stock: {p.stock} | EAN: <code>{p.ean}</code>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => onOpenSticker(p)}
                  style={{
                    background: 'var(--accent)',
                    color: '#FFF',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Sticker 50x30mm
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: CARNET DE CREDIT CLIENT */}
      {merchantTab === 'credit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#1E293B', padding: 12, borderRadius: 8, fontSize: 12, color: '#E2E8F0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOpen size={16} color="var(--accent)" />
            <div>
              <strong>Carnet de Crédits &amp; Dettes Clients :</strong> Fini le cahier papier ! Enregistrez les créances et relancez en 1 clic sur WhatsApp.
            </div>
          </div>

          {[
            { nom: 'Mamadou Diallo', tel: '77 123 45 67', solde: 37500, echeance: '15 Août 2026', quartier: 'Medina Rue 11' },
            { nom: 'Awa Ndiaye', tel: '78 987 65 43', solde: 14500, echeance: '05 Août 2026', quartier: 'HLM 5' },
          ].map((c, idx) => (
            <div
              key={idx}
              style={{
                background: '#020617',
                padding: 14,
                borderRadius: 10,
                border: '1px solid #1E293B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 10
              }}
            >
              <div>
                <div style={{ fontWeight: 800, color: '#FFF', fontSize: 13 }}>{c.nom} ({c.quartier})</div>
                <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                  Tél: {c.tel} | Échéance: {c.echeance}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 900, color: '#EF4444', fontSize: 14 }}>+ {c.solde.toLocaleString()} FCFA</div>
                  <span style={{ fontSize: 10, background: '#7F1D1D', color: '#FCA5A5', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>Dette</span>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenRelance(c)}
                  style={{
                    background: '#25D366',
                    color: '#FFF',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: 8,
                    fontSize: 11.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    minHeight: 36
                  }}
                >
                  <MessageCircle size={13} />
                  <span>WA Relance</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: ANALYTICS */}
      {merchantTab === 'analytics' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
          <div style={{ background: '#020617', padding: 14, borderRadius: 8, border: '1px solid #1E293B' }}>
            <div style={{ fontSize: 11, color: '#94A3B8' }}>CA Du Jour :</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#10B981', marginTop: 4 }}>145 000 FCFA</div>
          </div>
          <div style={{ background: '#020617', padding: 14, borderRadius: 8, border: '1px solid #1E293B' }}>
            <div style={{ fontSize: 11, color: '#94A3B8' }}>Ventes Caisse :</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#38BDF8', marginTop: 4 }}>18 Transactions</div>
          </div>
          <div style={{ background: '#020617', padding: 14, borderRadius: 8, border: '1px solid #1E293B' }}>
            <div style={{ fontSize: 11, color: '#94A3B8' }}>Bénéfice Estimé :</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#F59E0B', marginTop: 4 }}>24 500 FCFA</div>
          </div>
        </div>
      )}

      {/* TAB 5: EQUIPE */}
      {merchantTab === 'equipe' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
          <div style={{ background: '#020617', padding: 10, borderRadius: 6, display: 'flex', justifyContent: 'space-between', color: '#FFF' }}>
            <span>Bamba Diallo (Propriétaire)</span>
            <span style={{ color: '#F59E0B', fontWeight: 700 }}>Intouchable</span>
          </div>
          <div style={{ background: '#020617', padding: 10, borderRadius: 6, display: 'flex', justifyContent: 'space-between', color: '#FFF' }}>
            <span>Modou Cissé (Caissier Matin)</span>
            <span style={{ color: '#10B981', fontWeight: 700 }}>PIN: ****</span>
          </div>
        </div>
      )}
    </div>
  )
}
