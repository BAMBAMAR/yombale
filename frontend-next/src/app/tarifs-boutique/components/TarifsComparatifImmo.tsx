'use client'

import React from 'react'
import { Building2, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react'

export default function TarifsComparatifImmo() {
  return (
    <>
      {/* ── COMPARATIF DIRECT : NOPALOU ERP IMMO VS EXCEL / PAPIER VS LOGICIELS ÉTRANGERS ── */}
      <section style={{ maxWidth: 1000, margin: '0 auto 80px', padding: '0 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#7c3aed', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Comparatif de Rentabilité &amp; Efficacité
          </span>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 900, color: 'var(--navy, #1C2B4A)', marginTop: 10 }}>
            Pourquoi abandonner les classeurs papier et Excel au Sénégal ?
          </h2>
          <p style={{ margin: '8px auto 0', color: 'var(--text-subtle, #5A4E42)', maxWidth: 640, fontSize: 14.5 }}>
            Une solution 100% pensée pour le marché local : encaissements Wave directs, baux conformes droit OHADA et quittances certifiées avec QR code.
          </p>
        </div>

        <div style={{ overflowX: 'auto', background: '#ffffff', borderRadius: 24, border: '1px solid #e2e8f0', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', minWidth: 540, borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '16px 20px', fontWeight: 800, color: '#334155' }}>Critères clés</th>
                <th style={{ padding: '16px 20px', fontWeight: 900, color: '#7c3aed', background: '#faf5ff', fontSize: 16 }}>Nopalou ERP Immo</th>
                <th style={{ padding: '16px 20px', fontWeight: 700, color: '#64748b' }}>Cahiers Papier &amp; Excel</th>
                <th style={{ padding: '16px 20px', fontWeight: 700, color: '#64748b' }}>Logiciels Étrangers</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '16px 24px', fontWeight: 700, color: '#475569' }}>Baux conformes OHADA</td>
                <td style={{ padding: '16px 24px', fontWeight: 900, color: '#10b981', background: '#faf5ff' }}>Natif &amp; Conforme Sénégal</td>
                <td style={{ padding: '16px 24px', color: '#ef4444' }}>Modèles Word non sécurisés</td>
                <td style={{ padding: '16px 24px', color: '#ef4444' }}>Droit français inadapté</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '16px 24px', fontWeight: 700, color: '#475569' }}>Quittances de Loyer</td>
                <td style={{ padding: '16px 24px', fontWeight: 900, color: '#10b981', background: '#faf5ff' }}>Certifiées PDF avec QR Code</td>
                <td style={{ padding: '16px 24px', color: '#ef4444' }}>Reçus papier falsifiables</td>
                <td style={{ padding: '16px 24px', color: '#64748b' }}>PDF simples sans vérification</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '16px 24px', fontWeight: 700, color: '#475569' }}>Paiement Wave &amp; OM</td>
                <td style={{ padding: '16px 24px', fontWeight: 900, color: '#10b981', background: '#faf5ff' }}>Natif 1-clic direct (/payer-loyer)</td>
                <td style={{ padding: '16px 24px', color: '#ef4444' }}>Déplacements physiques &amp; cash</td>
                <td style={{ padding: '16px 24px', color: '#ef4444' }}>CB / Virements SEPA inutilisés</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '16px 24px', fontWeight: 700, color: '#475569' }}>Relances Impayés</td>
                <td style={{ padding: '16px 24px', fontWeight: 900, color: '#10b981', background: '#faf5ff' }}>Automatiques sur WhatsApp</td>
                <td style={{ padding: '16px 24px', color: '#ef4444' }}>Appels téléphoniques conflictuels</td>
                <td style={{ padding: '16px 24px', color: '#ef4444' }}>E-mails souvent non ouverts</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '16px 24px', fontWeight: 700, color: '#475569' }}>Comptes Bailleurs</td>
                <td style={{ padding: '16px 24px', fontWeight: 900, color: '#10b981', background: '#faf5ff' }}>Reddition nette en 1 clic</td>
                <td style={{ padding: '16px 24px', color: '#ef4444' }}>Heures de calculs manuels Excel</td>
                <td style={{ padding: '16px 24px', color: '#64748b' }}>Comptabilité lourde et complexe</td>
              </tr>
              <tr>
                <td style={{ padding: '16px 24px', fontWeight: 700, color: '#475569' }}>Coût d&apos;entrée</td>
                <td style={{ padding: '16px 24px', fontWeight: 900, color: '#10b981', background: '#faf5ff' }}>Dès 0 FCFA (Plan Essentiel)</td>
                <td style={{ padding: '16px 24px', color: '#ef4444' }}>Pertes sur retards et litiges</td>
                <td style={{ padding: '16px 24px', color: '#ef4444' }}>100.000 à 250.000 FCFA / mois</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── SECTION WORKFLOW MÉTIER IMMOBILIER ── */}
      <section style={{ maxWidth: 1000, margin: '0 auto 60px', padding: '0 20px' }}>
        <div style={{ background: '#ffffff', borderRadius: 20, padding: 32, border: '1.5px solid var(--border, #E8DDD2)', boxShadow: '0 6px 24px rgba(0,0,0,0.03)' }}>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: 'var(--navy, #1C2B4A)', margin: '0 0 12px' }}>
            Vous administrez des locations à Dakar, Saly ou Thiès ? Gagnez 15h par mois !
          </h2>
          <p style={{ color: 'var(--text-subtle, #5A4E42)', fontSize: 15, lineHeight: 1.65, margin: '0 0 24px' }}>
            Des centaines d&apos;agences et de gestionnaires locatifs sénégalais ont numérisé leur parc locatif pour éradiquer les retards de loyers et sécuriser leurs mandats de gestion :
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            <div style={{ background: '#faf5ff', padding: 20, borderRadius: 14, border: '1px solid #ede9fe' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, background: '#7c3aed', color: '#fff', fontSize: 13, fontWeight: 900, marginBottom: 10 }}>1</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#1C2B4A', marginBottom: 4 }}>Bail OHADA en 2 min</div>
              <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>Enregistrez le bailleur, le locataire et le loyer. Les clauses légales sénégalaises sont prêtes immédiatement.</div>
            </div>
            <div style={{ background: '#f0fdf4', padding: 20, borderRadius: 14, border: '1px solid #dcfce7' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, background: '#10b981', color: '#fff', fontSize: 13, fontWeight: 900, marginBottom: 10 }}>2</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#1C2B4A', marginBottom: 4 }}>Avis d&apos;échéance Wave direct</div>
              <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>Le locataire reçoit son alerte WhatsApp avec lien direct Wave pour régler sans se déplacer ni faire la queue.</div>
            </div>
            <div style={{ background: '#fffbeb', padding: 20, borderRadius: 14, border: '1px solid #fef3c7' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, background: '#b45309', color: '#fff', fontSize: 13, fontWeight: 900, marginBottom: 10 }}>3</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#1C2B4A', marginBottom: 4 }}>Quittance QR &amp; Reversement</div>
              <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>La quittance officielle certifiée est émise sans intervention et le solde net est reversé au propriétaire.</div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
