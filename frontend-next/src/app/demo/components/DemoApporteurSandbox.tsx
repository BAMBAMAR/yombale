import React from 'react'
import { FileText, FileSpreadsheet } from 'lucide-react'

export default function DemoApporteurSandbox() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        style={{
          background: '#020617',
          padding: 14,
          borderRadius: 10,
          border: '1px solid #1E293B',
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>Kit Commercial &amp; Matériel de Démarchage</div>
        <div style={{ fontSize: 12, color: '#CBD5E1' }}>
          Téléchargez les visuels officiels et la brochure de 13 pages pour démarcher les commerçants de votre secteur.
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
          <a
            href="/brochure-apporteur.pdf"
            target="_blank"
            download
            style={{
              background: '#1E293B',
              border: '1px solid #334155',
              padding: 12,
              borderRadius: 8,
              textDecoration: 'none',
              color: '#FFF',
              display: 'flex',
              flexDirection: 'column',
              gap: 4
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileText size={15} color="#10B981" />
              <span style={{ fontWeight: 800, color: '#10B981', fontSize: 13 }}>Brochure PDF (13 p.)</span>
            </div>
            <span style={{ fontSize: 10, color: '#94A3B8' }}>Document complet imprimable</span>
          </a>

          <div
            style={{
              background: '#1E293B',
              border: '1px solid #334155',
              padding: 12,
              borderRadius: 8,
              display: 'flex',
              flexDirection: 'column',
              gap: 4
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileSpreadsheet size={15} color="#38BDF8" />
              <span style={{ fontWeight: 800, color: '#38BDF8', fontSize: 13 }}>Flyers A5 Terrain</span>
            </div>
            <span style={{ fontSize: 10, color: '#94A3B8' }}>Pour distribuer en boutique</span>
          </div>
        </div>
      </div>
    </div>
  )
}
