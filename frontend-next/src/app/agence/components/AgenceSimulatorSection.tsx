'use client'

import React, { useState } from 'react'
import { TrendingUp, Clock, ShieldCheck, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'

export function AgenceSimulatorSection() {
  const [lots, setLots] = useState<number>(40)

  // Formules de calcul réalistes
  const heuresGagnees = Math.round(lots * 0.6) // env. 36 min gagnées par lot/mois
  const loyersSecurises = Math.round(lots * 95) // 95% de recouvrement à J+5
  const coutGestion = lots <= 3 ? 0 : lots <= 25 ? 15000 : 35000

  return (
    <section style={{ maxWidth: 1060, margin: '0 auto 70px', padding: '0 16px' }}>
      <div style={{
        background: 'linear-gradient(135deg, #1C2B4A 0%, #0d1728 100%)',
        borderRadius: 24,
        padding: '36px 28px',
        color: '#FFFFFF',
        boxShadow: '0 12px 36px rgba(28, 43, 74, 0.25)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Glow de fond */}
        <div style={{
          position: 'absolute', top: '-30%', right: '-15%', width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.18) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <span style={{
              fontSize: 11, fontWeight: 900, background: 'rgba(16, 185, 129, 0.2)', color: '#86EFAC',
              padding: '3px 12px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.06em'
            }}>
              Simulateur d&apos;Impact Métier
            </span>
            <h3 style={{ fontSize: 'clamp(22px, 3.5vw, 32px)', fontWeight: 900, margin: '10px 0 6px' }}>
              Mesurez le Gain Immédiat pour Votre Cabinet
            </h3>
            <p style={{ fontSize: 14, color: '#94A3B8', margin: 0 }}>
              Sélectionnez le nombre de biens sous gestion locative :
            </p>
          </div>

          {/* Sélecteur de lots rapide */}
          <div style={{
            display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 32
          }}>
            {[10, 25, 50, 100, 200].map(val => (
              <button
                key={val}
                type="button"
                onClick={() => setLots(val)}
                style={{
                  background: lots === val ? 'linear-gradient(135deg, #FF6600 0%, #C75B00 100%)' : 'rgba(255,255,255,0.08)',
                  color: '#FFFFFF',
                  border: lots === val ? 'none' : '1px solid rgba(255,255,255,0.18)',
                  padding: '10px 22px',
                  borderRadius: 30,
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: lots === val ? '0 4px 14px rgba(199,91,0,0.4)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {val} lots
              </button>
            ))}
          </div>

          {/* Résultats de rentabilité */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
            gap: 16,
            marginBottom: 32
          }}>
            {/* KPI 1 : Heures gagnées */}
            <div style={{
              background: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: '22px 18px',
              border: '1px solid rgba(255,255,255,0.12)', textAlign: 'center'
            }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(2, 132, 199, 0.2)', color: '#38BDF8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Clock size={20} />
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#38BDF8', lineHeight: 1 }}>
                +{heuresGagnees} h
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', marginTop: 6 }}>
                Gagnées chaque mois
              </div>
              <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 4 }}>
                Fini les quittances manuscrites et le classement manuel
              </div>
            </div>

            {/* KPI 2 : Taux de recouvrement */}
            <div style={{
              background: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: '22px 18px',
              border: '1px solid rgba(255,255,255,0.12)', textAlign: 'center'
            }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', color: '#86EFAC', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <TrendingUp size={20} />
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#86EFAC', lineHeight: 1 }}>
                95 %
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', marginTop: 6 }}>
                Recouvrés dès le 5 du mois
              </div>
              <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 4 }}>
                Grâce au lien Wave 1-clic envoyé sur WhatsApp
              </div>
            </div>

            {/* KPI 3 : Litiges & Contestations */}
            <div style={{
              background: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: '22px 18px',
              border: '1px solid rgba(255,255,255,0.12)', textAlign: 'center'
            }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(199, 91, 0, 0.2)', color: '#FDBA74', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <ShieldCheck size={20} />
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#FDBA74', lineHeight: 1 }}>
                0 Litige
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', marginTop: 6 }}>
                Quittances infalsifiables
              </div>
              <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 4 }}>
                QR code de vérification conforme droit OHADA
              </div>
            </div>

            {/* KPI 4 : Forfait conseillé */}
            <div style={{
              background: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: '22px 18px',
              border: '1px solid rgba(255,255,255,0.12)', textAlign: 'center'
            }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255, 255, 255, 0.15)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Sparkles size={20} />
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#FFFFFF', lineHeight: 1 }}>
                {coutGestion === 0 ? 'Gratuit' : `${coutGestion.toLocaleString()} F`}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#FED7AA', marginTop: 6 }}>
                {lots <= 3 ? 'Formule Starter' : lots <= 25 ? 'Formule Croissance' : 'Formule Cabinet Pro'}
              </div>
              <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 4 }}>
                Sans engagement · 1er mois offert
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <Link
              href="/inscription?role=agence&redirect=/agence"
              style={{
                background: 'linear-gradient(135deg, #FF6600 0%, #C75B00 100%)',
                color: '#FFFFFF',
                padding: '14px 36px',
                borderRadius: 30,
                fontSize: 15,
                fontWeight: 900,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 8px 24px rgba(199,91,0,0.4)'
              }}
            >
              <span>Activer mon agence (Essai gratuit 30 jours)</span>
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
