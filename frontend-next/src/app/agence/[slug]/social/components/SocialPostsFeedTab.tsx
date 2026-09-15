'use client'

import React, { useState } from 'react'
import {
  Camera,
  Music,
  Share2,
  Video,
  ExternalLink,
  Trash2,
  Eye,
  EyeOff,
  Star,
  Link2,
  Plus,
  Home,
  Check,
  X,
  Play
} from 'lucide-react'
import { BienItem, SocialPostItem } from '../types'

interface SocialPostsFeedTabProps {
  posts: SocialPostItem[]
  biens: BienItem[]
  onUpdatePost: (updatedPost: SocialPostItem) => void
  onDeletePost: (postId: string) => void
}

export function SocialPostsFeedTab({
  posts,
  biens,
  onUpdatePost,
  onDeletePost,
}: SocialPostsFeedTabProps) {
  const [filterPlatform, setFilterPlatform] = useState<string>('all')
  const [filterLinked, setFilterLinked] = useState<string>('all')
  const [associatingPost, setAssociatingPost] = useState<SocialPostItem | null>(null)
  const [selectedBienId, setSelectedBienId] = useState<string>('')

  const filteredPosts = posts.filter(p => {
    if (filterPlatform !== 'all' && p.plateforme !== filterPlatform) return false
    if (filterLinked === 'linked' && (!p.biens_associes || p.biens_associes.length === 0)) return false
    if (filterLinked === 'unlinked' && p.biens_associes && p.biens_associes.length > 0) return false
    if (filterLinked === 'featured' && !p.is_featured) return false
    return true
  })

  function handleSaveAssociation() {
    if (!associatingPost) return
    const chosenBien = biens.find(b => b.id === selectedBienId)

    const updated: SocialPostItem = {
      ...associatingPost,
      biens_associes: chosenBien
        ? [
            {
              id: chosenBien.id,
              titre: chosenBien.titre,
              prix: chosenBien.prix_location || chosenBien.prix_vente || 0,
              type_operation: chosenBien.prix_location ? 'location' : 'vente',
              quartier: chosenBien.quartier,
              image_url: chosenBien.images?.[0],
            },
          ]
        : [],
    }

    onUpdatePost(updated)
    setAssociatingPost(null)
    setSelectedBienId('')
  }

  function getPlatformIcon(plat: string) {
    if (plat === 'tiktok') return <Music size={14} />
    if (plat === 'facebook') return <Share2 size={14} />
    if (plat === 'youtube') return <Video size={14} />
    return <Camera size={14} />
  }

  function getPlatformColor(plat: string) {
    if (plat === 'tiktok') return '#000000'
    if (plat === 'facebook') return '#1877F2'
    if (plat === 'youtube') return '#FF0000'
    return '#E1306C'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ── Barre de Filtres ── */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid var(--border, #E8DDD2)',
          borderRadius: 12,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>Plateforme :</span>
          {['all', 'instagram', 'tiktok', 'facebook', 'youtube'].map(plat => (
            <button
              key={plat}
              type="button"
              onClick={() => setFilterPlatform(plat)}
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 700,
                border: 'none',
                background: filterPlatform === plat ? 'var(--navy, #1C2B4A)' : '#F1F5F9',
                color: filterPlatform === plat ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {plat === 'all' ? 'Toutes' : plat}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>Statut :</span>
          <select
            value={filterLinked}
            onChange={e => setFilterLinked(e.target.value)}
            className="form-select"
            style={{ padding: '4px 8px', fontSize: 12, width: 'auto' }}
          >
            <option value="all">Toutes les vidéos ({posts.length})</option>
            <option value="linked">Biens associés</option>
            <option value="unlinked">Sans bien associé</option>
            <option value="featured">À la une</option>
          </select>
        </div>
      </div>

      {/* ── Liste des Publications Vidéo ── */}
      {filteredPosts.length === 0 ? (
        <div
          style={{
            background: '#FFFFFF',
            border: '1px dashed var(--border, #E8DDD2)',
            borderRadius: 12,
            padding: '40px 20px',
            textAlign: 'center',
            color: '#64748B',
          }}
        >
          <p style={{ fontWeight: 700, fontSize: 14 }}>Aucune vidéo trouvée</p>
          <p style={{ fontSize: 12.5, marginTop: 4 }}>
            Utilisez l'onglet "Importer des Vidéos" pour ajouter des visites virtuelles depuis TikTok, Instagram ou Facebook.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {filteredPosts.map(post => {
            const hasBien = post.biens_associes && post.biens_associes.length > 0
            const bien = hasBien ? post.biens_associes![0] : null

            return (
              <div
                key={post.id}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid var(--border, #E8DDD2)',
                  borderRadius: 12,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 1px 3px rgba(28, 43, 74, 0.04)',
                }}
              >
                {/* Miniature Vidéo */}
                <div style={{ position: 'relative', height: 180, background: '#0F172A', overflow: 'hidden' }}>
                  <img
                    src={post.thumbnail_url || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80'}
                    alt={post.caption || 'Visite'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: post.visible ? 1 : 0.4 }}
                  />

                  {/* Badge Plateforme */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 10,
                      left: 10,
                      background: 'rgba(0,0,0,0.7)',
                      backdropFilter: 'blur(4px)',
                      color: '#FFFFFF',
                      padding: '3px 8px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <span style={{ color: getPlatformColor(post.plateforme) }}>
                      {getPlatformIcon(post.plateforme)}
                    </span>
                    <span style={{ textTransform: 'uppercase' }}>{post.plateforme}</span>
                  </div>

                  {/* Bouton Play */}
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
                    <Play size={20} style={{ marginLeft: 2 }} />
                  </a>

                  {/* Badge À la une */}
                  {post.is_featured && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        background: 'var(--accent, #C75B00)',
                        color: '#FFFFFF',
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 10.5,
                        fontWeight: 800,
                      }}
                    >
                      À la une
                    </div>
                  )}
                </div>

                {/* Contenu & Bien Associé */}
                <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                  <div
                    style={{
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: 'var(--navy, #1C2B4A)',
                      lineHeight: 1.4,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {post.caption || 'Sans légende'}
                  </div>

                  {/* Fiche Bien Taggué */}
                  {bien ? (
                    <div
                      style={{
                        background: '#FAF8F5',
                        border: '1px solid var(--border, #E8DDD2)',
                        borderRadius: 8,
                        padding: '8px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <Home size={16} style={{ color: 'var(--accent, #C75B00)', flexShrink: 0 }} />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 750,
                            color: 'var(--navy, #1C2B4A)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {bien.titre}
                        </div>
                        <div style={{ fontSize: 11, color: '#166534', fontWeight: 800 }}>
                          {Number(bien.prix).toLocaleString('fr-FR')} FCFA {bien.type_operation === 'location' ? '/ mois' : ''}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        background: '#FEF3C7',
                        borderRadius: 8,
                        padding: '6px 10px',
                        fontSize: 11.5,
                        color: '#92400E',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>Aucun bien taggué</span>
                      <button
                        type="button"
                        onClick={() => {
                          setAssociatingPost(post)
                          setSelectedBienId('')
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#92400E',
                          fontWeight: 800,
                          fontSize: 11,
                          cursor: 'pointer',
                          textDecoration: 'underline',
                        }}
                      >
                        Taguer +
                      </button>
                    </div>
                  )}

                  {/* Actions Rapides */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: 'auto',
                      paddingTop: 8,
                      borderTop: '1px solid var(--border, #E8DDD2)',
                    }}
                  >
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        title={post.visible ? 'Masquer de la vitrine' : 'Rendre visible sur la vitrine'}
                        onClick={() => onUpdatePost({ ...post, visible: !post.visible })}
                        style={{
                          background: 'none',
                          border: '1px solid var(--border, #E8DDD2)',
                          padding: '4px 6px',
                          borderRadius: 6,
                          cursor: 'pointer',
                          color: post.visible ? '#166534' : '#64748B',
                        }}
                      >
                        {post.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>

                      <button
                        type="button"
                        title="Mettre à la une"
                        onClick={() => onUpdatePost({ ...post, is_featured: !post.is_featured })}
                        style={{
                          background: post.is_featured ? '#FEF3C7' : 'none',
                          border: '1px solid var(--border, #E8DDD2)',
                          padding: '4px 6px',
                          borderRadius: 6,
                          cursor: 'pointer',
                          color: post.is_featured ? '#D97706' : '#64748B',
                        }}
                      >
                        <Star size={14} />
                      </button>

                      <button
                        type="button"
                        title="Modifier l'association de bien"
                        onClick={() => {
                          setAssociatingPost(post)
                          setSelectedBienId(bien?.id || '')
                        }}
                        style={{
                          background: 'none',
                          border: '1px solid var(--border, #E8DDD2)',
                          padding: '4px 6px',
                          borderRadius: 6,
                          cursor: 'pointer',
                          color: 'var(--navy, #1C2B4A)',
                        }}
                      >
                        <Link2 size={14} />
                      </button>
                    </div>

                    <button
                      type="button"
                      title="Supprimer la vidéo"
                      onClick={() => onDeletePost(post.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#DC2626',
                        padding: 4,
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Modale d'Association de Bien ── */}
      {associatingPost && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 12,
              padding: 24,
              maxWidth: 460,
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                Associer un bien immobilier
              </div>
              <button
                type="button"
                onClick={() => setAssociatingPost(null)}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>
              Sélectionnez le bien présenté dans cette vidéo afin que les visiteurs puissent réserver une visite ou contacter l'agence directement.
            </p>

            <div className="form-group">
              <label className="form-label">Bien du catalogue</label>
              <select
                value={selectedBienId}
                onChange={e => setSelectedBienId(e.target.value)}
                className="form-select"
              >
                <option value="">-- Aucun bien associé --</option>
                {biens.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.titre} — {b.prix_location ? `${Number(b.prix_location).toLocaleString('fr-FR')} FCFA/mois` : `${Number(b.prix_vente || 0).toLocaleString('fr-FR')} FCFA`}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button
                type="button"
                onClick={() => setAssociatingPost(null)}
                style={{
                  padding: '9px 16px',
                  borderRadius: 8,
                  background: '#F1F5F9',
                  color: '#64748B',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveAssociation}
                style={{
                  padding: '9px 16px',
                  borderRadius: 8,
                  background: 'var(--accent, #C75B00)',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Valider l'association
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
