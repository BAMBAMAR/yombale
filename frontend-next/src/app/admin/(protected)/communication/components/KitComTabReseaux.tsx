import { Copy, ExternalLink, Download, Send } from 'lucide-react'
import { VisualItem, SocialItem, PostTemplate, SocialLinkItem } from './types'
import KitComSocialLinksManager from './KitComSocialLinksManager'

interface KitComTabReseauxProps {
  visuels: VisualItem[]
  textes: SocialItem[]
  postTemplates: PostTemplate[]
  initialSocialLinks?: SocialLinkItem[]
  onCopy: (txt: string, label: string) => void
  onPublishFb: (texte: string, imageUrl?: string) => void
  publiEnCours: boolean
}

export default function KitComTabReseaux({
  visuels,
  textes,
  postTemplates,
  initialSocialLinks,
  onCopy,
  onPublishFb,
  publiEnCours,
}: KitComTabReseauxProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
      {/* Gestionnaire Interactif des Réseaux Sociaux Nopalou */}
      <KitComSocialLinksManager
        initialLinks={initialSocialLinks}
        onCopy={onCopy}
      />

      {/* Section Visuels HD à télécharger */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Download size={18} color="var(--navy, #1C2B4A)" />
          <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
            Visuels HD avec Téléchargement Direct 1-Clic
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {visuels.map(v => (
            <div
              key={v.url}
              style={{
                border: '1px solid var(--border, #E2E8F0)',
                borderRadius: 12,
                overflow: 'hidden',
                background: '#fff',
              }}
            >
              <a
                href={v.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#F8FAFC',
                  padding: v.url.includes('icon') || v.url.includes('logo-mark') ? 20 : 0,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={v.url}
                  alt={v.titre}
                  style={{
                    width: '100%',
                    aspectRatio: '4/3',
                    objectFit: v.url.includes('icon') || v.url.includes('logo') ? 'contain' : 'cover',
                    display: 'block',
                  }}
                />
              </a>
              <div style={{ padding: 14 }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: '0 0 4px' }}>{v.titre}</p>
                <p style={{ fontSize: 11, color: '#64748B', margin: '0 0 12px' }}>{v.desc}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      fontSize: 10,
                      background: '#FFF7ED',
                      color: 'var(--accent, #C75B00)',
                      padding: '3px 8px',
                      borderRadius: 6,
                      fontWeight: 800,
                    }}
                  >
                    {v.usage}
                  </span>
                  <a
                    href={v.url}
                    download={
                      v.url.endsWith('.svg')
                        ? `nopalou-${v.titre.toLowerCase().replace(/[^a-z0-9]/g, '-')}.svg`
                        : `nopalou-${v.titre.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`
                    }
                    style={{
                      padding: '6px 12px',
                      background: 'var(--accent, #C75B00)',
                      color: '#fff',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 800,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Download size={11} />
                    {v.url.endsWith('.svg') ? 'SVG Vectoriel' : 'HD PNG'}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section Templates de Posts & Publications Automatiques */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Send size={18} color="var(--navy, #1C2B4A)" />
          <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
            Templates de Posts avec Publication Automatique Multi-Réseaux
          </h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {postTemplates.map(p => (
            <div key={p.titre} style={{ border: '1px solid var(--border, #E2E8F0)', borderRadius: 12, padding: 20, background: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--accent, #C75B00)', margin: 0 }}>{p.titre}</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => onCopy(p.texte, p.titre)}
                    style={{
                      padding: '6px 12px',
                      background: '#F1F5F9',
                      border: '1px solid #CBD5E1',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--navy, #1C2B4A)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Copy size={12} />
                    Copier
                  </button>
                  <button
                    type="button"
                    onClick={() => onPublishFb(p.texte)}
                    disabled={publiEnCours}
                    style={{
                      padding: '6px 14px',
                      background: '#1877F2',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 800,
                      color: '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    Publier FB / IG
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(p.texte)}`
                      window.open(waUrl, '_blank')
                    }}
                    style={{
                      padding: '6px 14px',
                      background: '#25D366',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 800,
                      color: '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    Diffuser Canal WA
                  </button>
                </div>
              </div>
              <pre
                style={{
                  fontSize: 13,
                  color: 'var(--navy, #1C2B4A)',
                  whiteSpace: 'pre-wrap',
                  background: '#F8FAFC',
                  border: '1px solid var(--border, #E2E8F0)',
                  borderRadius: 8,
                  padding: 14,
                  margin: 0,
                  lineHeight: 1.7,
                  fontFamily: 'inherit',
                }}
              >
                {p.texte}
              </pre>
            </div>
          ))}
        </div>
      </section>

      {/* Section Bios Réseaux */}
      <section>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy, #1C2B4A)', marginBottom: 16 }}>
          Bios et Descriptions pour vos Profils Réseaux
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {textes.map(t => (
            <div key={t.reseau} style={{ border: '1px solid var(--border, #E2E8F0)', borderRadius: 12, padding: 20, background: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
                  {t.reseau}
                </h3>
                <button
                  type="button"
                  onClick={() => onCopy(`${t.bio}\n\n${t.site}\n${t.hashtags}`, `Bio ${t.reseau}`)}
                  style={{
                    padding: '6px 12px',
                    background: '#F1F5F9',
                    border: '1px solid #CBD5E1',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--navy, #1C2B4A)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Copy size={12} />
                  Copier Bio
                </button>
              </div>
              <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 10px' }}>
                <strong>Pseudo :</strong> {t.nom} · <strong>Catégorie :</strong> {t.categorie}
              </p>
              <pre
                style={{
                  fontSize: 13,
                  color: 'var(--navy, #1C2B4A)',
                  whiteSpace: 'pre-wrap',
                  background: '#F8FAFC',
                  border: '1px solid var(--border, #E2E8F0)',
                  borderRadius: 8,
                  padding: 12,
                  margin: 0,
                  fontFamily: 'inherit',
                }}
              >
                {t.bio}
              </pre>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
