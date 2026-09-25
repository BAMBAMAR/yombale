'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Monitor,
  Smartphone,
  Receipt,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  CreditCard,
  Zap,
  WifiOff,
  MessageCircle,
  FileText
} from 'lucide-react'

export default function WorkflowsShowcaseSection() {
  const [activeWorkflow, setActiveWorkflow] = useState<'pos' | 'dette' | 'immo'>('pos')

  return (
    <section
      style={{
        margin: '0 auto 32px',
        maxWidth: 'var(--max-w-narrow, 1280px)',
        padding: '0 16px',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
      aria-label="Démonstration des workflows majeurs Nopalou"
    >
      {/* ── En-tête de section ── */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: '#fff7ed', color: '#9a3412', border: '1px solid #fed7aa',
          padding: '4px 14px', borderRadius: 20, fontSize: 11.5, fontWeight: 800,
          marginBottom: 8
        }}>
          <Zap size={14} color="#ea580c" />
          <span>LA PUISSANCE TECHNIQUE DE NOPALOU EN ACTION</span>
        </div>
        <h2 style={{
          fontSize: 'clamp(20px, 3.2vw, 28px)',
          fontWeight: 900,
          color: 'var(--navy, #1C2B4A)',
          margin: '0 0 6px',
          letterSpacing: '-0.02em'
        }}>
          Un écosystème conçu pour les réalités du <span style={{ color: 'var(--accent, #C75B00)' }}>Sénégal</span>
        </h2>
        <p style={{
          fontSize: 13,
          color: 'var(--text-subtle, #5A4E42)',
          margin: '0 auto',
          maxWidth: 620,
          lineHeight: 1.4
        }}>
          Caisse tactile hors-ligne, carnet de dettes avec relance Wave et quittances de loyer certifiées PDF.
        </p>
      </div>

      {/* ── Sélecteur d'onglets de démonstration ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 20,
        flexWrap: 'wrap'
      }}>
        <button
          type="button"
          onClick={() => setActiveWorkflow('pos')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '8px 16px', borderRadius: 24, fontSize: 12.5,
            fontWeight: activeWorkflow === 'pos' ? 850 : 650,
            cursor: 'pointer', border: '1px solid',
            background: activeWorkflow === 'pos' ? 'var(--navy, #1C2B4A)' : '#ffffff',
            color: activeWorkflow === 'pos' ? '#ffffff' : 'var(--navy, #1C2B4A)',
            borderColor: activeWorkflow === 'pos' ? 'var(--navy, #1C2B4A)' : 'var(--border, #E8DDD2)',
            boxShadow: activeWorkflow === 'pos' ? '0 3px 10px rgba(28,43,74,0.2)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <Monitor size={15} color={activeWorkflow === 'pos' ? '#fed7aa' : 'currentColor'} />
          <span>1. Caisse POS &amp; Douchette Mobile</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveWorkflow('dette')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '8px 16px', borderRadius: 24, fontSize: 12.5,
            fontWeight: activeWorkflow === 'dette' ? 850 : 650,
            cursor: 'pointer', border: '1px solid',
            background: activeWorkflow === 'dette' ? 'var(--navy, #1C2B4A)' : '#ffffff',
            color: activeWorkflow === 'dette' ? '#ffffff' : 'var(--navy, #1C2B4A)',
            borderColor: activeWorkflow === 'dette' ? 'var(--navy, #1C2B4A)' : 'var(--border, #E8DDD2)',
            boxShadow: activeWorkflow === 'dette' ? '0 3px 10px rgba(28,43,74,0.2)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <CreditCard size={15} color={activeWorkflow === 'dette' ? '#fed7aa' : 'currentColor'} />
          <span>2. Carnet de Dettes &amp; Lien Wave</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveWorkflow('immo')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '8px 16px', borderRadius: 24, fontSize: 12.5,
            fontWeight: activeWorkflow === 'immo' ? 850 : 650,
            cursor: 'pointer', border: '1px solid',
            background: activeWorkflow === 'immo' ? 'var(--navy, #1C2B4A)' : '#ffffff',
            color: activeWorkflow === 'immo' ? '#ffffff' : 'var(--navy, #1C2B4A)',
            borderColor: activeWorkflow === 'immo' ? 'var(--navy, #1C2B4A)' : 'var(--border, #E8DDD2)',
            boxShadow: activeWorkflow === 'immo' ? '0 3px 10px rgba(28,43,74,0.2)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <FileText size={15} color={activeWorkflow === 'immo' ? '#fed7aa' : 'currentColor'} />
          <span>3. Baux &amp; Quittances PDFKit</span>
        </button>
      </div>

      {/* ── Contenu du workflow sélectionné ── */}
      <div style={{
        background: '#ffffff',
        borderRadius: 20,
        border: '1px solid var(--border, #E8DDD2)',
        boxShadow: '0 6px 24px rgba(26,22,18,0.04)',
        padding: '24px 20px',
        overflow: 'hidden'
      }}>
        
        {/* WORKFLOW 1 : CAISSE POS MAGASIN */}
        {activeWorkflow === 'pos' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 24, alignItems: 'center' }}>
            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: '#dcfce7', color: '#166534', padding: '3px 10px', borderRadius: 12,
                fontSize: 11, fontWeight: 800, marginBottom: 10
              }}>
                <WifiOff size={13} />
                <span>FONCTIONNE SANS INTERNET (100% HORS-LIGNE)</span>
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 900, color: 'var(--navy, #1C2B4A)', margin: '0 0 10px' }}>
                Votre smartphone devient une caisse tactile et une douchette sans fil
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-subtle, #5A4E42)', lineHeight: 1.55, margin: '0 0 16px' }}>
                Encaissez rapidement vos clients, calculez automatiquement la monnaie à rendre et imprimez les tickets sans dépendre de la connexion Sonatel ou des coupures de courant.
              </p>
              
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--navy, #1C2B4A)', fontWeight: 650 }}>
                  <CheckCircle2 size={16} color="#16a34a" style={{ flexShrink: 0 }} />
                  <span>Scan codes-barres par caméra smartphone ou douchette USB</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--navy, #1C2B4A)', fontWeight: 650 }}>
                  <CheckCircle2 size={16} color="#16a34a" style={{ flexShrink: 0 }} />
                  <span>Clôture de caisse Z avec réconciliation Espèces, Wave et OM</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--navy, #1C2B4A)', fontWeight: 650 }}>
                  <CheckCircle2 size={16} color="#16a34a" style={{ flexShrink: 0 }} />
                  <span>Codes PIN caissiers individuels et multi-boutiques</span>
                </li>
              </ul>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Link
                  href="/logiciel-caisse-senegal"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '10px 20px', borderRadius: 12, background: 'var(--navy, #1C2B4A)',
                    color: '#ffffff', fontSize: 13, fontWeight: 800, textDecoration: 'none'
                  }}
                >
                  <span>Découvrir Nopalou POS</span>
                  <ArrowRight size={14} />
                </Link>
                <Link
                  href="/demo?role=marchand&tab=pos"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '10px 18px', borderRadius: 12, background: '#f1f5f9',
                    color: 'var(--navy, #1C2B4A)', fontSize: 13, fontWeight: 750, textDecoration: 'none',
                    border: '1px solid var(--border, #E8DDD2)'
                  }}
                >
                  <span>Tester la caisse en démo</span>
                </Link>
              </div>
            </div>

            {/* Mockup interactif POS */}
            <div style={{
              background: 'linear-gradient(135deg, #1C2B4A 0%, #111e33 100%)',
              borderRadius: 16, padding: '18px 16px', color: '#ffffff',
              boxShadow: '0 8px 24px rgba(28,43,74,0.18)', border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.12)', paddingBottom: 10, marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#a7f3d0' }}>Caisse Active · Mode Hors-Ligne OK</span>
                </div>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>Session #402</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.06)', padding: '8px 12px', borderRadius: 8, fontSize: 12 }}>
                  <span>2x Robe Soie Wax Dakar</span>
                  <strong style={{ color: '#fed7aa' }}>30 000 FCFA</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.06)', padding: '8px 12px', borderRadius: 8, fontSize: 12 }}>
                  <span>1x Sac Cuir Artisanal</span>
                  <strong style={{ color: '#fed7aa' }}>15 000 FCFA</strong>
                </div>
              </div>

              <div style={{ borderTop: '1px dashed rgba(255,255,255,0.2)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Total Net à Payer :</span>
                <span style={{ fontSize: 18, fontWeight: 900, color: '#10b981' }}>45 000 FCFA</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, fontSize: 11, textAlign: 'center' }}>
                <div style={{ background: '#10b981', color: '#fff', padding: '7px 4px', borderRadius: 6, fontWeight: 800 }}>
                  ✓ Espèces
                </div>
                <div style={{ background: '#0284c7', color: '#fff', padding: '7px 4px', borderRadius: 6, fontWeight: 800 }}>
                  Wave
                </div>
                <div style={{ background: '#ea580c', color: '#fff', padding: '7px 4px', borderRadius: 6, fontWeight: 800 }}>
                  Crédit Bor
                </div>
              </div>
            </div>
          </div>
        )}

        {/* WORKFLOW 2 : CARNET DE DETTES & RECOUVREMENT WAVE */}
        {activeWorkflow === 'dette' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 24, alignItems: 'center' }}>
            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: '#eff6ff', color: '#1d4ed8', padding: '3px 10px', borderRadius: 12,
                fontSize: 11, fontWeight: 800, marginBottom: 10
              }}>
                <Smartphone size={13} />
                <span>FINI LES CARNETS PERDUS ET LES OUBLIS</span>
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 900, color: 'var(--navy, #1C2B4A)', margin: '0 0 10px' }}>
                Recouvrez vos créances sans gêne grâce au lien Wave automatique
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-subtle, #5A4E42)', lineHeight: 1.55, margin: '0 0 16px' }}>
                Ne perdez plus votre argent. Notez le crédit en caisse en 3 secondes. Le jour de l&apos;échéance, cliquez sur « Relancer » : un message poli avec lien de règlement Wave arrive directement sur son WhatsApp.
              </p>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--navy, #1C2B4A)', fontWeight: 650 }}>
                  <CheckCircle2 size={16} color="#16a34a" style={{ flexShrink: 0 }} />
                  <span>Historique des articles pris à crédit par chaque client</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--navy, #1C2B4A)', fontWeight: 650 }}>
                  <CheckCircle2 size={16} color="#16a34a" style={{ flexShrink: 0 }} />
                  <span>Lien Wave prérempli avec le montant exact à payer</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--navy, #1C2B4A)', fontWeight: 650 }}>
                  <CheckCircle2 size={16} color="#16a34a" style={{ flexShrink: 0 }} />
                  <span>Mise à jour immédiate du solde débiteur après acompte</span>
                </li>
              </ul>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Link
                  href="/marchands"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '10px 20px', borderRadius: 12, background: 'var(--accent, #C75B00)',
                    color: '#ffffff', fontSize: 13, fontWeight: 800, textDecoration: 'none'
                  }}
                >
                  <span>Créer ma boutique avec Carnet</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* Mockup bulle WhatsApp */}
            <div style={{
              background: '#efeae2', borderRadius: 16, padding: '16px',
              border: '1px solid #d1d7db', boxShadow: '0 8px 24px rgba(0,0,0,0.06)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#075e54', color: '#fff', padding: '8px 12px', borderRadius: '10px 10px 0 0' }}>
                <MessageCircle size={16} />
                <span style={{ fontSize: 12, fontWeight: 700 }}>Relance Amicale WhatsApp</span>
              </div>
              <div style={{ background: '#ffffff', padding: 14, borderRadius: '0 0 10px 10px', fontSize: 12.5, lineHeight: 1.45, color: '#111b21' }}>
                <p style={{ margin: '0 0 8px' }}>
                  Bonjour <strong>Mme Diallo</strong>, nous espérons que vous allez bien !
                </p>
                <p style={{ margin: '0 0 10px', color: '#54656f' }}>
                  Votre échéance de <strong>25 000 FCFA</strong> pour votre achat du 12/09 chez <em>Boutique Teranga</em> est arrivée.
                </p>
                <div style={{
                  background: '#00a884', color: '#ffffff', padding: '10px', borderRadius: 8,
                  textAlign: 'center', fontWeight: 800, fontSize: 13
                }}>
                  👉 Cliquez pour régler 25 000 F par Wave
                </div>
                <div style={{ fontSize: 10.5, color: '#8696a0', textAlign: 'right', marginTop: 6 }}>10:42 ✓✓</div>
              </div>
            </div>
          </div>
        )}

        {/* WORKFLOW 3 : BAUX LOCATIFS & QUITTANCES PDF */}
        {activeWorkflow === 'immo' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 24, alignItems: 'center' }}>
            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: '#fef3c7', color: '#92400e', padding: '3px 10px', borderRadius: 12,
                fontSize: 11, fontWeight: 800, marginBottom: 10
              }}>
                <ShieldCheck size={13} />
                <span>CONFORME STANDARDS JURIDIQUES SÉNÉGALAIS</span>
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 900, color: 'var(--navy, #1C2B4A)', margin: '0 0 10px' }}>
                Baux sécurisés, quittances PDFKit &amp; encaissements Wave 1-clic
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-subtle, #5A4E42)', lineHeight: 1.55, margin: '0 0 16px' }}>
                Offrez à vos propriétaires et locataires une gestion moderne. Téléchargement immédiat des quittances certifiées avec QR code et historique complet dans l&apos;espace locataire.
              </p>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--navy, #1C2B4A)', fontWeight: 650 }}>
                  <CheckCircle2 size={16} color="#16a34a" style={{ flexShrink: 0 }} />
                  <span>Quittance PDF téléchargeable dès validation du paiement</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--navy, #1C2B4A)', fontWeight: 650 }}>
                  <CheckCircle2 size={16} color="#16a34a" style={{ flexShrink: 0 }} />
                  <span>Portail public de règlement 1-clic par Wave ou OM</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--navy, #1C2B4A)', fontWeight: 650 }}>
                  <CheckCircle2 size={16} color="#16a34a" style={{ flexShrink: 0 }} />
                  <span>Matching automatique de prospects acheteurs/locataires</span>
                </li>
              </ul>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Link
                  href="/agence"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '10px 20px', borderRadius: 12, background: 'var(--navy, #1C2B4A)',
                    color: '#ffffff', fontSize: 13, fontWeight: 800, textDecoration: 'none'
                  }}
                >
                  <span>Espace Agences &amp; Bailleurs</span>
                  <ArrowRight size={14} />
                </Link>
                <Link
                  href="/agences"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '10px 18px', borderRadius: 12, background: '#f1f5f9',
                    color: 'var(--navy, #1C2B4A)', fontSize: 13, fontWeight: 750, textDecoration: 'none',
                    border: '1px solid var(--border, #E8DDD2)'
                  }}
                >
                  <span>Annuaire des agences</span>
                </Link>
              </div>
            </div>

            {/* Mockup Quittance certifiée */}
            <div style={{
              background: '#ffffff', borderRadius: 16, padding: '18px 16px',
              border: '1.5px solid #cbd5e1', boxShadow: '0 8px 24px rgba(0,0,0,0.06)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: 10, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>QUITTANCE DE LOYER</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Réf : QUIT-2026-09-418</div>
                </div>
                <div style={{ width: 34, height: 34, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <QrCode size={20} color="#1C2B4A" />
                </div>
              </div>

              <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                <div><strong>Bien :</strong> Appartement F3 Almadies, Dakar</div>
                <div><strong>Locataire :</strong> Ousmane Ndiaye</div>
                <div><strong>Période :</strong> Septembre 2026</div>
              </div>

              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '10px', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#166534' }}>Total Réglé (Wave) :</span>
                <span style={{ fontSize: 15, fontWeight: 900, color: '#15803D' }}>350 000 FCFA</span>
              </div>
              <div style={{ fontSize: 10.5, color: '#16a34a', fontWeight: 800, marginTop: 8, textAlign: 'center' }}>
                ✓ Certifié authentique &amp; Signature électronique
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  )
}
