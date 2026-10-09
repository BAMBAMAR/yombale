'use client'

import React from 'react'
import { Share, MoreVertical, MoreHorizontal, Smartphone, Download, CheckCircle2, Copy, Lightbulb } from 'lucide-react'
import { GUIDES, type Plateforme } from '@/lib/surga-pwa-plateforme'

// Guide d'installation adapté à l'appareil et au navigateur (voir surga-pwa-plateforme.ts).
// Les étapes s'écrivent en texte avec **gras** et des repères d'icône : [[partager]], [[menu]], [[menu-horizontal]], [[telephone]], [[installer]].

const ICONES: Record<string, React.ReactNode> = {
  partager: <Share size={14} />,
  menu: <MoreVertical size={14} />,
  'menu-horizontal': <MoreHorizontal size={14} />,
  telephone: <Smartphone size={14} />,
  installer: <Download size={14} />,
}

function Riche({ texte }: { texte: string }) {
  const morceaux = texte.split(/(\*\*[^*]+\*\*|\[\[[a-z-]+\]\])/g).filter(Boolean)
  return (
    <>
      {morceaux.map((m, i) => {
        if (m.startsWith('**')) return <strong key={i}>{m.slice(2, -2)}</strong>
        if (m.startsWith('[[')) {
          const icone = ICONES[m.slice(2, -2)]
          return icone ? <span key={i} aria-hidden="true" style={{ display: 'inline-flex', verticalAlign: 'middle', margin: '0 2px', color: 'var(--surga-info, #0284C7)' }}>{icone}</span> : null
        }
        return <React.Fragment key={i}>{m}</React.Fragment>
      })}
    </>
  )
}

const CARTE: React.CSSProperties = { display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 12px', borderRadius: 12, background: 'rgba(15, 23, 42, 0.03)', border: '1px solid var(--surga-border, #E2E8F0)' }
const TEXTE: React.CSSProperties = { fontSize: 13, lineHeight: 1.45, color: 'var(--surga-text1, #0F172A)', minWidth: 0 }
const PUCE = (fond: string, couleur: string): React.CSSProperties => ({ width: 26, height: 26, borderRadius: '50%', background: fond, color: couleur, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, flexShrink: 0 })

interface Props {
  plateforme: Plateforme
  adresse: string
  lienCopie: boolean
  onCopier: () => void
}

export default function SurgaPwaGuide({ plateforme, adresse, lienCopie, onCopier }: Props) {
  const guide = GUIDES[plateforme]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>
      {guide.intro && <p style={{ margin: 0, ...TEXTE }}>{guide.intro}</p>}

      {guide.etapes.map((etape, i) => (
        <div key={i} style={CARTE}>
          <div style={i % 2 === 0 ? PUCE('rgba(2, 132, 199, 0.12)', 'var(--surga-info, #0284C7)') : PUCE('rgba(217, 119, 6, 0.12)', 'var(--surga-accent-ink, #A64B08)')}>{i + 1}</div>
          <div style={TEXTE}><Riche texte={etape} /></div>
        </div>
      ))}

      {guide.copierLien && (
        <div style={{ ...CARTE, flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
          <div style={{ ...TEXTE, wordBreak: 'break-all', fontWeight: 700 }}>{adresse.replace(/^https?:\/\//, '')}</div>
          <button type="button" onClick={onCopier} className="surga-btn-secondary" style={{ width: 'auto', alignSelf: 'flex-start', fontSize: 13, padding: '8px 14px', display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            {lienCopie ? <CheckCircle2 size={14} /> : <Copy size={14} />}
            <span>{lienCopie ? 'Lien copié' : 'Copier le lien'}</span>
          </button>
        </div>
      )}

      <div style={{ ...CARTE, background: 'rgba(5, 150, 105, 0.05)', border: '1px solid rgba(5, 150, 105, 0.2)' }}>
        <div style={PUCE('rgba(5, 150, 105, 0.12)', 'var(--surga-emerald-ink, #047857)')}><CheckCircle2 size={15} /></div>
        <div style={TEXTE}><Riche texte={guide.fin} /></div>
      </div>

      {guide.astuce && (
        <div style={{ ...CARTE, background: 'rgba(2, 132, 199, 0.05)', border: '1px solid rgba(2, 132, 199, 0.2)' }}>
          <div style={PUCE('rgba(2, 132, 199, 0.12)', 'var(--surga-info, #0284C7)')}><Lightbulb size={15} /></div>
          <div style={TEXTE}><Riche texte={guide.astuce} /></div>
        </div>
      )}
    </div>
  )
}
