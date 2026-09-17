'use client'

import React from 'react'
import Link from 'next/link'
import {
  QrCode,
  Smartphone,
  Laptop,
  CheckCircle2,
  ArrowRight,
  Sparkles
} from 'lucide-react'

export function PosDouchetteBanner() {
  return (
    <section style={{ maxWidth: 1100, margin: '0 auto 80px', padding: '0 20px', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{
        background: 'linear-gradient(135deg, #1C2B4A 0%, #0d1728 100%)',
        borderRadius: 24,
        padding: '36px 28px',
        color: '#ffffff',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 20px 40px rgba(28,43,74,0.2)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
        gap: 32,
        alignItems: 'center'
      }}>
        {/* Colonne Gauche : Explication */}
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(16,185,129,0.18)', color: '#86efac',
            padding: '4px 14px', borderRadius: 20, fontSize: 11.5, fontWeight: 800,
            marginBottom: 16, border: '1px solid rgba(16,185,129,0.35)'
          }}>
            <Sparkles size={13} color="#86efac" />
            <span>EXCLUSIVITÉ NOPALOU POS · ZÉRO INVESTISSEMENT</span>
          </div>

          <h3 style={{
            fontSize: 'clamp(22px, 3.5vw, 32px)',
            fontWeight: 900,
            margin: '0 0 14px',
            lineHeight: 1.25,
            letterSpacing: '-0.02em'
          }}>
            Votre smartphone devient une <span style={{ color: '#10b981' }}>douchette sans fil</span> en 3 secondes.
          </h3>

          <p style={{ fontSize: 14.5, color: '#cbd5e1', lineHeight: 1.6, margin: '0 0 22px' }}>
            Vous utilisez un ordinateur ou une tablette en caisse ? Ne dépensez pas 40 000 FCFA dans un lecteur de codes-barres encombrant. Scannez simplement le QR code à l&apos;écran avec votre téléphone portable : vos articles scannés apparaissent instantanément sur votre écran principal.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#f1f5f9' }}>
              <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0 }} />
              <span>Compatible avec tous les téléphones Android et iPhone</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#f1f5f9' }}>
              <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0 }} />
              <span>Aucune application lourde à installer (Technologie PWA Web)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#10b981' }}>
              <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0 }} />
              <span>Transmission ultra-rapide &lt; 100ms via WebSocket sécurisé</span>
            </div>
          </div>

          <Link
            href="/demo?role=marchand&tab=pos"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'linear-gradient(135deg, #FF6600 0%, #C75B00 100%)',
              color: '#ffffff', padding: '12px 26px', borderRadius: 24,
              fontSize: 14.5, fontWeight: 800, textDecoration: 'none',
              boxShadow: '0 6px 20px rgba(199,91,0,0.4)'
            }}
          >
            <span>Tester l&apos;appairage douchette en démo</span>
            <ArrowRight size={15} />
          </Link>
        </div>

        {/* Colonne Droite : Schéma Visuel 3 Étapes */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 20, padding: '24px 20px',
          border: '1px solid rgba(255,255,255,0.12)'
        }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#fed7aa', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Comment fonctionne l&apos;appairage QR Code :
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Laptop size={18} color="#a7f3d0" />
              </div>
              <div>
                <strong style={{ fontSize: 13.5, color: '#ffffff' }}>1. Sur votre Caisse Principale</strong>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94a3b8', lineHeight: 1.4 }}>
                  Cliquez sur le bouton « Douchette Mobile » en caisse pour afficher votre QR code unique.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <QrCode size={18} color="#fed7aa" />
              </div>
              <div>
                <strong style={{ fontSize: 13.5, color: '#ffffff' }}>2. Flashez avec votre Smartphone</strong>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94a3b8', lineHeight: 1.4 }}>
                  Ouvrez l&apos;appareil photo de votre smartphone et scannez le code : la liaison est instantanée.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Smartphone size={18} color="#60a5fa" />
              </div>
              <div>
                <strong style={{ fontSize: 13.5, color: '#ffffff' }}>3. Scannez et Encaissez</strong>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94a3b8', lineHeight: 1.4 }}>
                  Visez le code-barres d&apos;un article : bip ! Il s&apos;ajoute au panier de la caisse avec son prix.
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  )
}
