'use client';

// frontend-next/src/app/surga/components/SurgaDemarcheNonCouvertBanner.tsx
// Bannière déterministe Zéro-Hallucination si démarche non couverte
// Modularité < 450 lignes, zéro émoji, tokens officiels, vouvoiement strict D19

import React from 'react';
import { ShieldCheck, ExternalLink } from 'lucide-react';

export default function SurgaDemarcheNonCouvertBanner() {
  return (
    <div
      style={{
        padding: 20,
        borderRadius: 12,
        backgroundColor: 'var(--bg, #F8F5F0)',
        border: '1px dashed var(--border, #E8DDD2)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <ShieldCheck size={32} color="var(--navy, #1C2B4A)" />
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: '0 0 6px 0' }}>
          Cette démarche n&apos;est pas encore répertoriée
        </h3>
        <p style={{ fontSize: 12, color: 'var(--text2, #5A4E42)', margin: 0, lineHeight: 1.4, maxWidth: 440 }}>
          Par rigueur éditoriale, Surga ne génère aucune réponse improvisée. Vous pouvez consulter directement
          le portail officiel des démarches administratives du Sénégal.
        </p>
      </div>
      <a
        href="https://servicepublic.gouv.sn"
        target="_blank"
        rel="noopener noreferrer"
        className="surga-btn-primary"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 12,
          padding: '8px 14px',
          textDecoration: 'none',
        }}
      >
        <span>Accéder à servicepublic.gouv.sn</span>
        <ExternalLink size={13} />
      </a>
    </div>
  );
}
