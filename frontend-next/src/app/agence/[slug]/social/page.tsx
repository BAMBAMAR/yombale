'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Share2,
  Copy,
  CheckCircle2,
  ExternalLink,
  MessageCircle,
  Camera,
  Music,
  Globe,
  Video,
  Send,
  Sparkles,
  Save,
  Check,
  Home
} from 'lucide-react'

interface BienItem {
  id: string
  reference: string
  titre: string
  type_bien: string
  ville: string
  quartier?: string
  surface_m2?: number
  nb_pieces?: number
  nb_chambres?: number
  prix_location?: number
  prix_vente?: number
  meuble: boolean
  description?: string
  annonce_publiee_id?: string
}

interface SocialAccounts {
  instagram?: string
  tiktok?: string
  facebook?: string
  whatsapp?: string
  linkedin?: string
  youtube?: string
  twitter?: string
  site_web?: string
}

interface AgenceItem {
  id: string
  nom: string
  slug: string
  telephone?: string
  whatsapp?: string
  site_web?: string
  ville: string
  parametres?: {
    reseaux_sociaux?: SocialAccounts
    vitrine_active?: boolean
  }
}

const SOCIAL_NETWORKS_CONFIG = [
  { key: 'instagram', label: 'Instagram', Icon: Camera, placeholder: '@nom_agence ou lien de profil', color: '#E1306C' },
  { key: 'tiktok', label: 'TikTok', Icon: Music, placeholder: '@nom_agence ou lien profil', color: '#000000' },
  { key: 'facebook', label: 'Facebook', Icon: Share2, placeholder: 'Lien page Facebook ou profil', color: '#1877F2' },
  { key: 'whatsapp', label: 'WhatsApp Pro / Groupe', Icon: MessageCircle, placeholder: '+221 77 000 00 00 ou lien wa.me', color: '#25D366' },
  { key: 'linkedin', label: 'LinkedIn Pro', Icon: Globe, placeholder: 'Lien page LinkedIn Entreprise', color: '#0A66C2' },
  { key: 'youtube', label: 'YouTube (Visites & Vidéos)', Icon: Video, placeholder: 'Lien chaîne YouTube', color: '#FF0000' },
  { key: 'twitter', label: 'X / Twitter', Icon: Send, placeholder: '@nom_agence', color: '#0F1419' },
  { key: 'site_web', label: 'Site Web Officiel', Icon: Globe, placeholder: 'https://monagence.sn', color: '#1C2B4A' },
] as const

export default function SocialMarketingPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [activeTab, setActiveTab] = useState<'accounts' | 'generator' | 'showcase'>('accounts')
  const [agence, setAgence] = useState<AgenceItem | null>(null)
  const [biens, setBiens] = useState<BienItem[]>([])
  const [selectedBienId, setSelectedBienId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [savingAccounts, setSavingAccounts] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const [socialAccounts, setSocialAccounts] = useState<SocialAccounts>({
    instagram: '',
    tiktok: '',
    facebook: '',
    whatsapp: '',
    linkedin: '',
    youtube: '',
    twitter: '',
    site_web: '',
  })

  async function chargerDonnees() {
    try {
      setLoading(true)
      const [resAgence, resBiens] = await Promise.all([
        fetch(`/api/agences/${slug}`),
        fetch(`/api/biens/agence/${slug}?statut=actif`),
      ])
      const dataAgence = await resAgence.json()
      const dataBiens = await resBiens.json()

      if (dataAgence.success && dataAgence.agence) {
        setAgence(dataAgence.agence)
        const reseaux = dataAgence.agence.parametres?.reseaux_sociaux || {}
        setSocialAccounts({
          instagram: reseaux.instagram || '',
          tiktok: reseaux.tiktok || '',
          facebook: reseaux.facebook || '',
          whatsapp: reseaux.whatsapp || dataAgence.agence.whatsapp || '',
          linkedin: reseaux.linkedin || '',
          youtube: reseaux.youtube || '',
          twitter: reseaux.twitter || '',
          site_web: reseaux.site_web || dataAgence.agence.site_web || '',
        })
      }

      if (dataBiens.success && dataBiens.biens) {
        setBiens(dataBiens.biens)
        if (dataBiens.biens.length > 0) {
          setSelectedBienId(dataBiens.biens[0].id)
        }
      }
    } catch (err) {
      console.error('[LOAD_SOCIAL_ERR]', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (slug) chargerDonnees()
  }, [slug])

  async function handleEnregistrerComptes(e: React.FormEvent) {
    e.preventDefault()
    try {
      setSavingAccounts(true)
      const resGet = await fetch(`/api/agences/${slug}`)
      const dataGet = await resGet.json()
      const currentParametres = dataGet.agence?.parametres || {}

      const res = await fetch(`/api/agences/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsapp: socialAccounts.whatsapp,
          site_web: socialAccounts.site_web,
          parametres: {
            ...currentParametres,
            reseaux_sociaux: socialAccounts,
          },
        }),
      })

      const data = await res.json()
      if (data.success) {
        setToastMsg('Réseaux sociaux enregistrés avec succès ! Ils sont visibles sur votre vitrine.')
        setTimeout(() => setToastMsg(null), 4000)
      }
    } catch (err) {
      console.error('[SAVE_SOCIAL_ACCOUNTS_ERR]', err)
    } finally {
      setSavingAccounts(false)
    }
  }

  const selectedBien = biens.find(b => b.id === selectedBienId)
  const waContact = socialAccounts.whatsapp || agence?.whatsapp || agence?.telephone || '+221 77 000 00 00'

  function genererTextePost() {
    if (!selectedBien) return ''
    const isLoc = !!selectedBien.prix_location
    const prix = isLoc
      ? `${Number(selectedBien.prix_location).toLocaleString('fr-FR')} FCFA / mois`
      : `${Number(selectedBien.prix_vente || 0).toLocaleString('fr-FR')} FCFA`
    const typeLabel = selectedBien.type_bien.toUpperCase()
    const operation = isLoc ? 'À LOUER' : 'À VENDRE'
    const quartier = selectedBien.quartier ? `${selectedBien.quartier}, ${selectedBien.ville}` : selectedBien.ville

    return `*${operation} — ${typeLabel} D'EXCEPTION*\n\n` +
      `📍 *Localisation* : ${quartier}\n` +
      `💰 *Prix* : ${prix}\n` +
      `📐 *Caractéristiques* : ${selectedBien.nb_pieces || 1} pièces • ${selectedBien.nb_chambres || 1} chambres • ${selectedBien.surface_m2 ? `${selectedBien.surface_m2}m²` : 'Spacieux'}\n` +
      `${selectedBien.meuble ? '🛋️ *Meublé & Équipé*\n' : ''}` +
      `\n${selectedBien.description ? `${selectedBien.description.substring(0, 160)}...\n\n` : ''}` +
      `📲 *Contact & Visite WhatsApp* : https://wa.me/${waContact.replace(/[^0-9]/g, '')}\n` +
      `🏢 *Agence* : ${agence?.nom || 'Nopalou Immobilier'}\n` +
      `🔗 *Voir la vitrine complète* : https://nopalou.com/agence/${slug}/vitrine`
  }

  function handleCopier() {
    navigator.clipboard.writeText(genererTextePost())
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  const nbReseauxConfigures = Object.values(socialAccounts).filter(v => !!v?.trim()).length

  return (
    <div style={{ maxWidth: 880, margin: '0 auto' }}>
      {/* ── En-tête ── */}
      <div className="agence-header">
        <div>
          <h1 className="agence-title">Social Shop & Réseaux Sociaux</h1>
          <p className="agence-subtitle">Configurez vos profils officiels et diffusez vos biens sur tous vos canaux.</p>
        </div>

        <Link
          href={`/agence/${slug}/vitrine`}
          target="_blank"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '9px 16px',
            borderRadius: 8,
            background: 'var(--navy, #1C2B4A)',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: 13,
            textDecoration: 'none',
          }}
        >
          <ExternalLink size={15} />
          Voir ma vitrine publique
        </Link>
      </div>

      {toastMsg && (
        <div
          style={{
            padding: '12px 16px',
            background: '#DCFCE7',
            color: '#166534',
            borderRadius: 8,
            fontSize: 13.5,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 16,
          }}
        >
          <CheckCircle2 size={18} />
          {toastMsg}
        </div>
      )}

      {/* ── Onglets de Navigation ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setActiveTab('accounts')}
          style={{
            padding: '9px 18px',
            borderRadius: 8,
            fontSize: 13.5,
            fontWeight: 750,
            cursor: 'pointer',
            border: '1px solid',
            borderColor: activeTab === 'accounts' ? 'var(--navy, #1C2B4A)' : 'var(--border, #E8DDD2)',
            background: activeTab === 'accounts' ? 'var(--navy, #1C2B4A)' : '#FFFFFF',
            color: activeTab === 'accounts' ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
          }}
        >
          Mes Réseaux Sociaux ({nbReseauxConfigures}/8)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('generator')}
          style={{
            padding: '9px 18px',
            borderRadius: 8,
            fontSize: 13.5,
            fontWeight: 750,
            cursor: 'pointer',
            border: '1px solid',
            borderColor: activeTab === 'generator' ? 'var(--navy, #1C2B4A)' : 'var(--border, #E8DDD2)',
            background: activeTab === 'generator' ? 'var(--navy, #1C2B4A)' : '#FFFFFF',
            color: activeTab === 'generator' ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
          }}
        >
          Générateur de Posts 1-Clic
        </button>
      </div>

      {/* ── ONGLET 1 : Configuration des Réseaux Sociaux (Social Shop) ── */}
      {activeTab === 'accounts' && (
        <form onSubmit={handleEnregistrerComptes}>
          <div className="agence-card">
            <div className="agence-card-header">
              <div className="agence-card-title">
                <Share2 size={18} />
                Comptes & Liens Sociaux de l'Agence
              </div>
              <span style={{ fontSize: 12, color: '#64748B' }}>
                Affichés sur votre page vitrine et partages
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {SOCIAL_NETWORKS_CONFIG.map(plat => {
                const IconComp = plat.Icon
                const val = (socialAccounts as any)[plat.key] || ''
                const isConfigured = !!val.trim()

                return (
                  <div
                    key={plat.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: 12,
                      borderRadius: 8,
                      border: '1px solid',
                      borderColor: isConfigured ? 'rgba(22, 163, 74, 0.3)' : 'var(--border, #E8DDD2)',
                      background: isConfigured ? '#F0FDF4' : '#FFFFFF',
                    }}
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 8,
                        background: 'rgba(28, 43, 74, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: plat.color,
                        flexShrink: 0,
                      }}
                    >
                      <IconComp size={18} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: 800, fontSize: 13.5, color: 'var(--navy, #1C2B4A)' }}>
                          {plat.label}
                        </span>
                        {isConfigured && (
                          <span
                            style={{
                              fontSize: 10.5,
                              padding: '1px 6px',
                              borderRadius: 10,
                              background: '#16a34a',
                              color: '#FFFFFF',
                              fontWeight: 800,
                            }}
                          >
                            Actif
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder={plat.placeholder}
                        value={val}
                        onChange={e =>
                          setSocialAccounts({
                            ...socialAccounts,
                            [plat.key]: e.target.value,
                          })
                        }
                        className="form-input"
                        style={{ padding: '7px 10px', fontSize: 13 }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <button
                type="submit"
                disabled={savingAccounts}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 20px',
                  borderRadius: 8,
                  background: 'var(--accent, #C75B00)',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: 13.5,
                  cursor: savingAccounts ? 'not-allowed' : 'pointer',
                }}
              >
                <Save size={16} />
                {savingAccounts ? 'Enregistrement...' : 'Enregistrer mes réseaux sociaux'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ── ONGLET 2 : Générateur Marketing ── */}
      {activeTab === 'generator' && (
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B' }}>
              <p>Chargement des outils marketing...</p>
            </div>
          ) : biens.length === 0 ? (
            <div className="agence-card" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
              <Home size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p style={{ fontWeight: 700, color: 'var(--navy, #1C2B4A)', fontSize: 16 }}>Aucun bien dans votre portefeuille</p>
              <p style={{ fontSize: 13.5 }}>Ajoutez d'abord un bien pour générer des publications pour vos réseaux.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
              <div className="agence-card">
                <div className="agence-card-header">
                  <div className="agence-card-title">
                    <Share2 size={18} />
                    Sélection du Bien à Diffuser
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Choisir un bien immobilier *</label>
                  <select
                    value={selectedBienId}
                    onChange={e => setSelectedBienId(e.target.value)}
                    className="form-select"
                  >
                    {biens.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.titre} — {b.quartier ? `${b.quartier}, ${b.ville}` : b.ville}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedBien && (
                  <div style={{ marginTop: 16, padding: 14, background: '#FAF8F5', borderRadius: 8, border: '1px solid var(--border, #E8DDD2)' }}>
                    <div style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)', fontSize: 14 }}>{selectedBien.titre}</div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                      {selectedBien.type_bien} • {selectedBien.quartier || selectedBien.ville}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--accent, #C75B00)', marginTop: 6 }}>
                      {selectedBien.prix_location
                        ? `${Number(selectedBien.prix_location).toLocaleString('fr-FR')} FCFA/mois`
                        : `${Number(selectedBien.prix_vente || 0).toLocaleString('fr-FR')} FCFA`}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(genererTextePost())}`}
                    target="_blank"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      padding: '12px',
                      borderRadius: 8,
                      background: '#16a34a',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: 13.5,
                      textDecoration: 'none',
                    }}
                  >
                    <MessageCircle size={18} />
                    Partager sur WhatsApp (Groupe / Statut)
                  </a>

                  <button
                    type="button"
                    onClick={handleCopier}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      padding: '12px',
                      borderRadius: 8,
                      background: copied ? '#DCFCE7' : '#FFFFFF',
                      color: copied ? '#166534' : 'var(--navy, #1C2B4A)',
                      border: '1px solid var(--border, #E8DDD2)',
                      fontWeight: 700,
                      fontSize: 13.5,
                      cursor: 'pointer',
                    }}
                  >
                    {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                    {copied ? 'Texte copié dans le presse-papier !' : 'Copier le texte (Facebook / Instagram)'}
                  </button>
                </div>
              </div>

              <div className="agence-card">
                <div className="agence-card-header">
                  <div className="agence-card-title">
                    <Sparkles size={18} color="var(--accent, #C75B00)" />
                    Aperçu de la Publication
                  </div>
                </div>

                <div
                  style={{
                    background: '#FAF8F5',
                    border: '1px solid var(--border, #E8DDD2)',
                    borderRadius: 10,
                    padding: 16,
                    fontSize: 13,
                    lineHeight: 1.6,
                    color: 'var(--navy, #1C2B4A)',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'inherit',
                    maxHeight: 380,
                    overflowY: 'auto',
                  }}
                >
                  {genererTextePost()}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
