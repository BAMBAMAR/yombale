import React from 'react'
import Link from 'next/link'
import { MessageCircle, UploadCloud, Play } from 'lucide-react'
import { FeatureTab } from './types'

interface StageMockupsProps {
  activeFeature: FeatureTab
}

export default function StageMockups({ activeFeature }: StageMockupsProps) {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        borderRadius: 16,
        padding: '20px',
        color: '#ffffff',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}
    >
      {activeFeature === 'pos' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 10, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }}></span>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#A7F3D0' }}>CAISSE HORS-LIGNE ACTIVE</span>
            </div>
            <span style={{ fontSize: 10.5, color: '#94A3B8' }}>PIN : <strong>Caissier #2</strong></span>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 12, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
              <span>1× Smartphone Samsung Galaxy A15</span>
              <strong>115 000 F</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
              <span>1× Écouteurs Bluetooth Pro</span>
              <strong>15 000 F</strong>
            </div>
            <div style={{ borderTop: '1px dashed rgba(255,255,255,0.2)', paddingTop: 8, marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 900 }}>
              <span style={{ color: '#FED7AA' }}>Total à Encaisser :</span>
              <span style={{ color: '#FED7AA' }}>130 000 FCFA</span>
            </div>
          </div>

          <div style={{ background: '#15803D', borderRadius: 8, padding: '9px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, fontWeight: 800, marginBottom: 10 }}>
            <span>Espèces : 150 000 F</span>
            <span>Monnaie à rendre : <strong>20 000 F</strong></span>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <Link
              href="/boutique/caisse"
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: 8,
                background: 'var(--accent, #C75B00)',
                color: '#fff',
                fontSize: 11.5,
                fontWeight: 800,
                textAlign: 'center',
                textDecoration: 'none'
              }}
            >
              Ouvrir la Caisse
            </Link>
            <Link
              href="/demo?role=marchand"
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: 8,
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                fontSize: 11.5,
                fontWeight: 800,
                textAlign: 'center',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}
            >
              <Play size={12} fill="#fff" />
              <span>Démo plein écran</span>
            </Link>
          </div>
        </div>
      )}

      {activeFeature === 'boutique' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 10, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#A7F3D0' }}>
              <span>nopalou.com/b/dakar-tech</span>
            </div>
            <span style={{ fontSize: 10, background: '#16A34A', color: '#fff', padding: '2px 6px', borderRadius: 6, fontWeight: 900 }}>
              0% COMMISSION
            </span>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 12, marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: '#FED7AA', fontWeight: 800, textTransform: 'uppercase', marginBottom: 2 }}>
              Article en Vitrine
            </div>
            <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 4 }}>Montre Connectée Sport Series 9</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#A7F3D0', marginBottom: 10 }}>28 000 FCFA</div>

            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ flex: 1, background: '#1D4ED8', color: '#fff', padding: '6px', borderRadius: 6, textAlign: 'center', fontSize: 11, fontWeight: 800 }}>
                Payer par Wave (0%)
              </div>
              <div style={{ flex: 1, background: '#EA580C', color: '#fff', padding: '6px', borderRadius: 6, textAlign: 'center', fontSize: 11, fontWeight: 800 }}>
                Orange Money (0%)
              </div>
            </div>
          </div>

          <div style={{ fontSize: 11.5, color: '#94A3B8', lineHeight: 1.4, textAlign: 'center' }}>
            Vos clients commandent directement sur votre boutique ou sur WhatsApp sans intermédiaire.
          </div>
        </div>
      )}

      {activeFeature === 'whatsapp' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 10, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#86EFAC' }}>
              <MessageCircle size={14} />
              <span>WhatsApp Assistant Nopalou</span>
            </div>
            <span style={{ fontSize: 10, color: '#94A3B8' }}>Aujourd&apos;hui 19:42</span>
          </div>

          <div style={{ background: '#064E3B', borderRadius: 10, padding: 12, marginBottom: 10, fontSize: 11.5, lineHeight: 1.45, borderLeft: '3px solid #22C55E' }}>
            <div style={{ fontWeight: 800, color: '#A7F3D0', marginBottom: 4 }}>NOUVELLE COMMANDE REÇUE :</div>
            <div>Client : Aminata Fall (+221 77 123 45 67)</div>
            <div>Article : Robe Wax Moderne (Taille L)</div>
            <div style={{ fontWeight: 800, color: '#FED7AA' }}>Total : 18 500 FCFA • Livr. Point E</div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 12, fontSize: 11.5, lineHeight: 1.45, borderLeft: '3px solid #3B82F6' }}>
            <div style={{ fontWeight: 800, color: '#93C5FD', marginBottom: 4 }}>RELANCE DETTE 1-CLIC :</div>
            <div>&laquo; Bonjour Ousmane, solde restant de 25 000 F. Cliquez ici pour régler par Wave : wave.me/pay/dakar-tech &raquo;</div>
          </div>
        </div>
      )}

      {activeFeature === 'migration' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 10, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#93C5FD' }}>
              <UploadCloud size={14} />
              <span>MOTEUR D&apos;IMPORT UNIFIÉ</span>
            </div>
            <span style={{ fontSize: 10, color: '#86EFAC', fontWeight: 800 }}>DÉTECTION AUTOMATIQUE</span>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1.5px dashed rgba(255,255,255,0.2)', borderRadius: 10, padding: 14, textAlign: 'center', marginBottom: 12 }}>
            <UploadCloud size={22} color="#93C5FD" style={{ margin: '0 auto 4px' }} />
            <div style={{ fontSize: 12, fontWeight: 800 }}>products_export.csv (Shopify)</div>
            <div style={{ fontSize: 10.5, color: '#94A3B8', marginTop: 2 }}>142 produits &bull; 380 photos &bull; Tailles S, M, L, XL</div>
            <div style={{ marginTop: 6, fontSize: 10.5, color: '#86EFAC', fontWeight: 900 }}>
              Prêt à être importé en 1 clic
            </div>
          </div>

          <div style={{ fontSize: 11.5, color: '#94A3B8', lineHeight: 1.4, textAlign: 'center' }}>
            Économisez 18 000 FCFA/mois de frais Shopify et encaissez sans carte bancaire internationale.
          </div>
        </div>
      )}
    </div>
  )
}
