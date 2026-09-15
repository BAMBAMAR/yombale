'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Building2,
  MapPin,
  Phone,
  MessageCircle,
  Home,
  CheckCircle2,
  ExternalLink,
  Search,
  Filter,
  Camera,
  Music,
  Globe,
  Video,
  Send,
  Share2
} from 'lucide-react'

interface AgenceData {
  id: string
  nom: string
  slug: string
  description?: string
  logo_url?: string
  ville: string
  quartier?: string
  telephone?: string
  whatsapp?: string
  site_web?: string
  email_contact?: string
  numero_agrement?: string
  parametres?: {
    reseaux_sociaux?: {
      instagram?: string
      tiktok?: string
      facebook?: string
      whatsapp?: string
      linkedin?: string
      youtube?: string
      twitter?: string
      site_web?: string
    }
  }
}

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
  photos?: string[]
  annonce_publiee_id?: string
}

export default function AgenceVitrinePubliquePage() {
  const params = useParams()
  const slug = params?.slug as string

  const [agence, setAgence] = useState<AgenceData | null>(null)
  const [biens, setBiens] = useState<BienItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filterOp, setFilterOp] = useState<'tous' | 'location' | 'vente'>('tous')
  const [filterType, setFilterType] = useState('tous')

  async function chargerVitrine() {
    try {
      setLoading(true)
      const [resAgence, resBiens] = await Promise.all([
        fetch(`/api/agences/${slug}`),
        fetch(`/api/biens/agence/${slug}?statut=actif&statut_occupation=disponible`),
      ])
      const dataAgence = await resAgence.json()
      const dataBiens = await resBiens.json()

      if (dataAgence.success) setAgence(dataAgence.agence)
      if (dataBiens.success) setBiens(dataBiens.biens || [])
    } catch (err) {
      console.error('[LOAD_VITRINE_ERR]', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (slug) chargerVitrine()
  }, [slug])

  const biensFiltres = biens.filter(b => {
    if (filterOp === 'location' && !b.prix_location) return false
    if (filterOp === 'vente' && !b.prix_vente) return false
    if (filterType !== 'tous' && b.type_bien !== filterType) return false
    return true
  })

  const waNum = (agence?.whatsapp || agence?.telephone || '').replace(/[^0-9]/g, '')

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: '#64748B' }}>
        <p>Chargement de la vitrine de l'agence...</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1140, margin: '0 auto', padding: '20px 16px 60px' }}>
      {/* ── Bannière / Carte d'Identité de l'Agence ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1C2B4A 0%, #2A3F6D 100%)',
          borderRadius: 16,
          padding: '32px 24px',
          color: '#FFFFFF',
          marginBottom: 30,
          boxShadow: '0 4px 20px rgba(28, 43, 74, 0.15)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 12,
                background: '#FFFFFF',
                color: 'var(--navy, #1C2B4A)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 26,
                fontWeight: 900,
              }}
            >
              {agence?.nom.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                {agence?.nom}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6, fontSize: 13, color: '#E2E8F0', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <MapPin size={14} />
                  {agence?.quartier ? `${agence.quartier}, ${agence.ville}` : agence?.ville}
                </span>
                {agence?.numero_agrement && (
                  <span>• Agrément : {agence.numero_agrement}</span>
                )}
                <span>• {biens.length} bien(s) disponible(s)</span>
              </div>
            </div>
          </div>

          {agence?.description && (
            <p style={{ fontSize: 14, color: '#E2E8F0', lineHeight: 1.6, maxWidth: 800, margin: 0 }}>
              {agence.description}
            </p>
          )}

          {/* Boutons d'Action Rapide */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', paddingTop: 8 }}>
            {waNum && (
              <a
                href={`https://wa.me/${waNum}?text=${encodeURIComponent(
                  `Bonjour ${agence?.nom}, je visite votre vitrine Nopalou et souhaite des informations sur vos biens.`
                )}`}
                target="_blank"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 20px',
                  borderRadius: 8,
                  background: '#16a34a',
                  color: '#FFFFFF',
                  fontWeight: 750,
                  fontSize: 14,
                  textDecoration: 'none',
                }}
              >
                <MessageCircle size={18} />
                Contacter sur WhatsApp
              </a>
            )}
            {agence?.telephone && (
              <a
                href={`tel:${agence.telephone}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 18px',
                  borderRadius: 8,
                  background: 'rgba(255, 255, 255, 0.12)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: 14,
                  textDecoration: 'none',
                  backdropFilter: 'blur(4px)',
                }}
              >
                <Phone size={16} />
                Appeler l'agence
              </a>
            )}
          </div>

          {/* ── Réseaux Sociaux Officiels de l'Agence ── */}
          {agence?.parametres?.reseaux_sociaux && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.15)' }}>
              <span style={{ fontSize: 12, color: '#CBD5E1', fontWeight: 600 }}>Nos réseaux :</span>
              {agence.parametres.reseaux_sociaux.instagram && (
                <a
                  href={agence.parametres.reseaux_sociaux.instagram.startsWith('http') ? agence.parametres.reseaux_sociaux.instagram : `https://instagram.com/${agence.parametres.reseaux_sociaux.instagram.replace(/^@/, '')}`}
                  target="_blank"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: 'rgba(225, 48, 108, 0.25)', color: '#FFFFFF', fontSize: 12, textDecoration: 'none', fontWeight: 700 }}
                >
                  <Camera size={13} />
                  Instagram
                </a>
              )}
              {agence.parametres.reseaux_sociaux.facebook && (
                <a
                  href={agence.parametres.reseaux_sociaux.facebook.startsWith('http') ? agence.parametres.reseaux_sociaux.facebook : `https://facebook.com/${agence.parametres.reseaux_sociaux.facebook}`}
                  target="_blank"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: 'rgba(24, 119, 242, 0.25)', color: '#FFFFFF', fontSize: 12, textDecoration: 'none', fontWeight: 700 }}
                >
                  <Share2 size={13} />
                  Facebook
                </a>
              )}
              {agence.parametres.reseaux_sociaux.tiktok && (
                <a
                  href={agence.parametres.reseaux_sociaux.tiktok.startsWith('http') ? agence.parametres.reseaux_sociaux.tiktok : `https://tiktok.com/@${agence.parametres.reseaux_sociaux.tiktok.replace(/^@/, '')}`}
                  target="_blank"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: 'rgba(0, 0, 0, 0.35)', color: '#FFFFFF', fontSize: 12, textDecoration: 'none', fontWeight: 700 }}
                >
                  <Music size={13} />
                  TikTok
                </a>
              )}
              {agence.parametres.reseaux_sociaux.linkedin && (
                <a
                  href={agence.parametres.reseaux_sociaux.linkedin.startsWith('http') ? agence.parametres.reseaux_sociaux.linkedin : `https://linkedin.com/company/${agence.parametres.reseaux_sociaux.linkedin}`}
                  target="_blank"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: 'rgba(10, 102, 194, 0.25)', color: '#FFFFFF', fontSize: 12, textDecoration: 'none', fontWeight: 700 }}
                >
                  <Globe size={13} />
                  LinkedIn
                </a>
              )}
              {agence.parametres.reseaux_sociaux.youtube && (
                <a
                  href={agence.parametres.reseaux_sociaux.youtube.startsWith('http') ? agence.parametres.reseaux_sociaux.youtube : `https://youtube.com/${agence.parametres.reseaux_sociaux.youtube}`}
                  target="_blank"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: 'rgba(255, 0, 0, 0.25)', color: '#FFFFFF', fontSize: 12, textDecoration: 'none', fontWeight: 700 }}
                >
                  <Video size={13} />
                  YouTube
                </a>
              )}
              {agence.parametres.reseaux_sociaux.site_web && (
                <a
                  href={agence.parametres.reseaux_sociaux.site_web.startsWith('http') ? agence.parametres.reseaux_sociaux.site_web : `https://${agence.parametres.reseaux_sociaux.site_web}`}
                  target="_blank"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: 'rgba(255, 255, 255, 0.2)', color: '#FFFFFF', fontSize: 12, textDecoration: 'none', fontWeight: 700 }}
                >
                  <Globe size={13} />
                  Site Web
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Section Visites Virtuelles Vidéo & Social Feed ── */}
      {(() => {
        const socialPosts = (agence?.parametres as any)?.social_posts || []
        const visiblePosts = socialPosts.filter((p: any) => p.visible)
        if (visiblePosts.length === 0) return null

        return (
          <div style={{ marginBottom: 36 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
                  Visites Virtuelles & Reels
                </h2>
                <p style={{ fontSize: 12.5, color: '#64748B', margin: '2px 0 0' }}>
                  Découvrez nos biens en immersion vidéo directe.
                </p>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: 14,
              }}
            >
              {visiblePosts.map((post: any) => {
                const bien = post.biens_associes?.[0]
                return (
                  <div
                    key={post.id}
                    style={{
                      background: '#FFFFFF',
                      borderRadius: 12,
                      border: '1px solid var(--border, #E8DDD2)',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                    }}
                  >
                    <div style={{ position: 'relative', height: 260, background: '#0F172A' }}>
                      <img
                        src={post.thumbnail_url || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80'}
                        alt={post.caption || 'Visite vidéo'}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />

                      {/* Bouton lecture */}
                      <a
                        href={post.post_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          background: 'rgba(255,255,255,0.9)',
                          color: 'var(--navy, #1C2B4A)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textDecoration: 'none',
                        }}
                      >
                        <Video size={20} />
                      </a>

                      {/* Badge Plateforme */}
                      <div
                        style={{
                          position: 'absolute',
                          top: 10,
                          left: 10,
                          background: 'rgba(0,0,0,0.65)',
                          backdropFilter: 'blur(4px)',
                          color: '#FFFFFF',
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 10.5,
                          fontWeight: 800,
                          textTransform: 'uppercase',
                        }}
                      >
                        {post.plateforme}
                      </div>
                    </div>

                    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: 'var(--navy, #1C2B4A)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {post.caption || 'Visite exclusive'}
                      </div>

                      {bien && (
                        <div
                          style={{
                            background: '#FAF8F5',
                            borderRadius: 6,
                            padding: '6px 8px',
                            border: '1px solid var(--border, #E8DDD2)',
                          }}
                        >
                          <div style={{ fontSize: 11.5, fontWeight: 750, color: 'var(--navy, #1C2B4A)' }}>
                            {bien.titre}
                          </div>
                          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent, #C75B00)' }}>
                            {Number(bien.prix).toLocaleString('fr-FR')} FCFA {bien.type_operation === 'location' ? '/ mois' : ''}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* ── Filtres de la Vitrine ── */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'center',
          marginBottom: 24,
          padding: '12px 16px',
          background: '#FFFFFF',
          borderRadius: 10,
          border: '1px solid var(--border, #E8DDD2)',
        }}
      >
        <div style={{ display: 'flex', gap: 8 }}>
          {(['tous', 'location', 'vente'] as const).map(op => (
            <button
              key={op}
              type="button"
              onClick={() => setFilterOp(op)}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                border: 'none',
                background: filterOp === op ? 'var(--navy, #1C2B4A)' : '#FAF8F5',
                color: filterOp === op ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
              }}
            >
              {op === 'tous' ? 'Tous les biens' : op === 'location' ? 'À Louer' : 'À Vendre'}
            </button>
          ))}
        </div>

        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="form-select"
          style={{ width: 'auto', padding: '6px 12px', fontSize: 13 }}
        >
          <option value="tous">Tous les types</option>
          <option value="appartement">Appartements</option>
          <option value="villa">Villas</option>
          <option value="studio">Studios</option>
          <option value="terrain">Terrains</option>
          <option value="bureau">Bureaux</option>
        </select>
      </div>

      {/* ── Grille des Biens de la Vitrine ── */}
      {biensFiltres.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#FFFFFF', borderRadius: 12, border: '1px solid var(--border, #E8DDD2)' }}>
          <Home size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <p style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)', fontSize: 16 }}>Aucun bien disponible pour ces critères</p>
          <p style={{ fontSize: 13.5, color: '#64748B' }}>Modifiez vos filtres ou contactez l'agence directement pour une recherche sur mesure.</p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 20,
          }}
        >
          {biensFiltres.map(b => {
            const isLoc = !!b.prix_location
            const prix = isLoc
              ? `${Number(b.prix_location).toLocaleString('fr-FR')} FCFA / mois`
              : `${Number(b.prix_vente || 0).toLocaleString('fr-FR')} FCFA`
            return (
              <div
                key={b.id}
                style={{
                  background: '#FFFFFF',
                  borderRadius: 12,
                  border: '1px solid var(--border, #E8DDD2)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                <div style={{ padding: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        padding: '3px 8px',
                        borderRadius: 4,
                        background: isLoc ? '#E0F2FE' : '#FFEDD5',
                        color: isLoc ? '#0369A1' : '#9A3412',
                      }}
                    >
                      {isLoc ? 'Location' : 'Vente'}
                    </span>
                    <span style={{ fontSize: 11.5, color: '#64748B', textTransform: 'capitalize' }}>
                      {b.type_bien}
                    </span>
                  </div>

                  <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: '0 0 8px', lineHeight: 1.4 }}>
                    {b.titre}
                  </h3>

                  <div style={{ fontSize: 12.5, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12 }}>
                    <MapPin size={13} />
                    {b.quartier ? `${b.quartier}, ${b.ville}` : b.ville}
                  </div>

                  <div style={{ fontSize: 13, color: '#475569', display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                    {b.surface_m2 && <span>{b.surface_m2} m²</span>}
                    {b.nb_chambres && <span>{b.nb_chambres} ch.</span>}
                    {b.meuble && <span style={{ color: 'var(--accent, #C75B00)', fontWeight: 600 }}>Meublé</span>}
                  </div>

                  <div style={{ fontSize: 17, fontWeight: 900, color: 'var(--accent, #C75B00)' }}>
                    {prix}
                  </div>
                </div>

                <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border, #E8DDD2)', background: '#FAF8F5', display: 'flex', gap: 8 }}>
                  <Link
                    href={`/immo/${b.annonce_publiee_id || b.id}`}
                    target="_blank"
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      padding: '8px',
                      borderRadius: 6,
                      background: 'var(--navy, #1C2B4A)',
                      color: '#FFFFFF',
                      fontSize: 12.5,
                      fontWeight: 700,
                      textDecoration: 'none',
                    }}
                  >
                    Voir l'annonce
                  </Link>
                  {waNum && (
                    <a
                      href={`https://wa.me/${waNum}?text=${encodeURIComponent(
                        `Bonjour ${agence?.nom}, je suis intéressé(e) par votre bien : ${b.titre} (${prix}). Pouvons-nous échanger ?`
                      )}`}
                      target="_blank"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '8px 12px',
                        borderRadius: 6,
                        background: '#16a34a',
                        color: '#FFFFFF',
                      }}
                      title="Demande WhatsApp"
                    >
                      <MessageCircle size={15} />
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
