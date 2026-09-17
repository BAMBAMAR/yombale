'use client';

import React, { useState, useMemo } from 'react';
import { Video, Play, Search, X, RotateCcw } from 'lucide-react';
import { AgenceData } from './VitrineBanner';
import { BienItem } from './VitrineBiensGrid';

interface VitrineVideoReelsProps {
  agence: AgenceData | null;
  biens?: BienItem[];
  onOpenPost?: (post: any) => void;
  initialSearchQuery?: string;
  initialFilterOp?: 'tous' | 'location' | 'vente';
}

function detectPlatform(url: string): 'youtube' | 'tiktok' | 'instagram' | 'direct' {
  if (!url) return 'direct';
  const l = url.toLowerCase();
  if (l.includes('youtube.com') || l.includes('youtu.be')) return 'youtube';
  if (l.includes('tiktok.com')) return 'tiktok';
  if (l.includes('instagram.com')) return 'instagram';
  return 'direct';
}

export default function VitrineVideoReels({
  agence,
  biens = [],
  onOpenPost,
  initialSearchQuery = '',
  initialFilterOp = 'tous',
}: VitrineVideoReelsProps) {
  // Filtres internes interactifs
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [filterOp, setFilterOp] = useState<'tous' | 'location' | 'vente'>(initialFilterOp);
  const [filterSource, setFilterSource] = useState('tous');
  const [filterType, setFilterType] = useState('tous');

  // 1. Visites vidéos issues directement des biens de l'agence
  const propertyVideoCards = useMemo(() => {
    return (biens || [])
      .filter((b) => Array.isArray(b.videos) && b.videos.length > 0 && !!b.videos[0])
      .map((b) => {
        const isLoc = !!b.prix_location;
        const prix = b.prix_location || b.prix_vente || 0;
        return {
          id: `prop-video-${b.id}`,
          post_url: b.videos![0],
          plateforme: detectPlatform(b.videos![0]),
          caption: b.titre,
          thumbnail_url: b.photos?.[0] || null,
          is_property_video: true,
          biens_associes: [
            {
              id: b.id,
              titre: b.titre,
              prix,
              type_operation: isLoc ? 'location' : 'vente',
              type_bien: b.type_bien || 'appartement',
              quartier: b.quartier,
              ville: b.ville,
              image_url: b.photos?.[0],
            },
          ],
        };
      });
  }, [biens]);

  // 2. Posts réseaux sociaux (synchronisés dynamiquement avec les données réelles des biens)
  const socialCards = useMemo(() => {
    const socialPosts = (agence?.parametres as any)?.social_posts || [];
    return socialPosts
      .filter((p: any) => p.visible)
      .map((post: any) => {
        const linked = post.biens_associes?.[0];
        const liveBien = linked ? biens.find((b) => b.id === linked.id) : null;

        const bienData = liveBien
          ? {
              id: liveBien.id,
              titre: liveBien.titre,
              prix: liveBien.prix_location || liveBien.prix_vente || 0,
              type_operation: liveBien.prix_location ? 'location' : 'vente',
              type_bien: liveBien.type_bien || 'appartement',
              quartier: liveBien.quartier,
              ville: liveBien.ville,
              image_url: liveBien.photos?.[0] || linked.image_url,
            }
          : linked;

        return {
          ...post,
          thumbnail_url: post.thumbnail_url || bienData?.image_url,
          biens_associes: bienData ? [bienData] : [],
        };
      });
  }, [agence, biens]);

  // Combiner l'ensemble des vidéos disponibles
  const allVideoCards = useMemo(() => {
    return [...propertyVideoCards, ...socialCards];
  }, [propertyVideoCards, socialCards]);

  // Calcul dynamique des statistiques pour les filtres
  const stats = useMemo(() => {
    let loc = 0;
    let vente = 0;
    const sourcesSet = new Set<string>();

    for (const card of allVideoCards) {
      const bien = card.biens_associes?.[0];
      if (bien?.type_operation === 'location') loc++;
      if (bien?.type_operation === 'vente') vente++;
      if (card.is_property_video) sourcesSet.add('biens');
      if (card.plateforme) sourcesSet.add(card.plateforme);
    }

    return {
      total: allVideoCards.length,
      location: loc,
      vente: vente,
      hasTikTok: sourcesSet.has('tiktok'),
      hasInstagram: sourcesSet.has('instagram'),
      hasYouTube: sourcesSet.has('youtube'),
      hasProperty: sourcesSet.has('biens'),
    };
  }, [allVideoCards]);

  // Filtrage combiné (Opération + Source/Plateforme + Typologie + Recherche textuelle)
  const filteredVideos = useMemo(() => {
    return allVideoCards.filter((card) => {
      const bien = card.biens_associes?.[0];

      // Filtre Opération
      if (filterOp !== 'tous') {
        if (!bien || bien.type_operation !== filterOp) return false;
      }

      // Filtre Source / Plateforme
      if (filterSource !== 'tous') {
        if (filterSource === 'biens') {
          if (!card.is_property_video) return false;
        } else if (card.plateforme !== filterSource) {
          return false;
        }
      }

      // Filtre Typologie de bien
      if (filterType !== 'tous') {
        if (!bien || !bien.type_bien) return false;
        if (bien.type_bien.toLowerCase() !== filterType.toLowerCase()) return false;
      }

      // Recherche textuelle multi-champs
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inCaption = card.caption?.toLowerCase().includes(q);
        const inTitre = bien?.titre?.toLowerCase().includes(q);
        const inQuartier = bien?.quartier?.toLowerCase().includes(q);
        const inVille = bien?.ville?.toLowerCase().includes(q);
        const inPlateforme = card.plateforme?.toLowerCase().includes(q);
        if (!inCaption && !inTitre && !inQuartier && !inVille && !inPlateforme) {
          return false;
        }
      }

      return true;
    });
  }, [allVideoCards, filterOp, filterSource, filterType, searchQuery]);

  const hasActiveFilters = Boolean(
    searchQuery.trim() !== '' || filterOp !== 'tous' || filterSource !== 'tous' || filterType !== 'tous'
  );

  function resetFilters() {
    setSearchQuery('');
    setFilterOp('tous');
    setFilterSource('tous');
    setFilterType('tous');
  }

  if (allVideoCards.length === 0) return null;

  return (
    <div style={{ marginBottom: 36 }}>
      {/* ── En-tête de section ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
            Visites Virtuelles &amp; Reels
          </h2>
          <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0' }}>
            Découvrez les biens en vidéo immersive. Cliquez sur une visite pour ouvrir le lecteur interactif.
          </p>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11.5,
              fontWeight: 700,
              color: 'var(--accent, #C75B00)',
              background: 'rgba(199, 91, 0, 0.08)',
              border: '1px solid rgba(199, 91, 0, 0.2)',
              borderRadius: 6,
              padding: '4px 8px',
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={12} />
            <span>Réinitialiser filtres</span>
          </button>
        )}
      </div>

      {/* ── Barre de Filtres & Recherche Spécifique Vidéo ── */}
      <div className="vitrine-video-filters-bar">
        <div className="vitrine-video-filters-top">
          {/* Boutons Opération */}
          <div className="vitrine-video-controls-group">
            <button
              type="button"
              onClick={() => setFilterOp('tous')}
              className={`vitrine-video-op-btn ${filterOp === 'tous' ? 'active' : ''}`}
            >
              <span>Tous</span>
              <span className="vitrine-video-op-badge">{stats.total}</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterOp('location')}
              className={`vitrine-video-op-btn ${filterOp === 'location' ? 'active' : ''}`}
            >
              <span>Location</span>
              <span className="vitrine-video-op-badge">{stats.location}</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterOp('vente')}
              className={`vitrine-video-op-btn ${filterOp === 'vente' ? 'active' : ''}`}
            >
              <span>Vente</span>
              <span className="vitrine-video-op-badge">{stats.vente}</span>
            </button>

            {/* Sélecteur Source / Plateforme */}
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              aria-label="Filtrer par source vidéo"
              className="vitrine-video-select"
            >
              <option value="tous">Toutes les sources</option>
              {stats.hasProperty && <option value="biens">Visites virtuelles directes</option>}
              {stats.hasInstagram && <option value="instagram">Instagram Reels</option>}
              {stats.hasTikTok && <option value="tiktok">TikTok</option>}
              {stats.hasYouTube && <option value="youtube">YouTube</option>}
            </select>

            {/* Sélecteur Typologie */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              aria-label="Filtrer par type de bien"
              className="vitrine-video-select"
            >
              <option value="tous">Tous les types</option>
              <option value="appartement">Appartements</option>
              <option value="villa">Villas</option>
              <option value="studio">Studios</option>
              <option value="terrain">Terrains</option>
              <option value="bureau">Bureaux</option>
            </select>
          </div>

          {/* Champ de recherche rapide */}
          <div className="vitrine-video-search-wrap">
            <Search size={14} style={{ position: 'absolute', left: 10, top: 9, color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Rechercher (quartier, titre...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="vitrine-video-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="vitrine-video-clear-btn"
                title="Effacer la recherche"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Indicateur de résultats */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5, color: '#64748B' }}>
          <span>
            <strong>{filteredVideos.length}</strong> visite{filteredVideos.length > 1 ? 's' : ''} vidéo{filteredVideos.length > 1 ? 's' : ''} disponible{filteredVideos.length > 1 ? 's' : ''}
          </span>
          {hasActiveFilters && (
            <span style={{ color: 'var(--accent, #C75B00)', fontWeight: 600 }}>
              Filtres actifs
            </span>
          )}
        </div>
      </div>

      {/* ── État Vide si aucun résultat filtré ── */}
      {filteredVideos.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '36px 16px',
            background: '#FFFFFF',
            borderRadius: 12,
            border: '1px solid var(--border, #E8DDD2)',
          }}
        >
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#F1F5F9', color: '#64748B', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <Video size={22} />
          </div>
          <h3 style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: '0 0 4px' }}>
            Aucune visite vidéo ne correspond à vos critères
          </h3>
          <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 12px' }}>
            Essayez de modifier votre recherche ou de réinitialiser vos filtres.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="vitrine-btn-base vitrine-btn-phone"
            style={{ fontSize: 12, display: 'inline-flex', margin: '0 auto' }}
          >
            <RotateCcw size={13} />
            <span>Réinitialiser les filtres</span>
          </button>
        </div>
      ) : (
        /* ── Grille des cartes vidéo filtrées ── */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 14,
          }}
        >
          {filteredVideos.map((post: any) => {
            const bien = post.biens_associes?.[0];
            const isLoc = bien?.type_operation === 'location';

            return (
              <div
                key={post.id}
                onClick={() => onOpenPost?.(post)}
                style={{
                  background: '#FFFFFF',
                  borderRadius: 14,
                  border: '1px solid var(--border, #E8DDD2)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                <div style={{ position: 'relative', height: 230, background: '#0F172A', overflow: 'hidden' }}>
                  {(post.thumbnail_url || bien?.image_url) ? (
                    <img
                      src={post.thumbnail_url || bien?.image_url}
                      alt={post.caption || 'Visite vidéo'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                      <Video size={36} />
                    </div>
                  )}

                  {/* Bouton lecture interactif */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.92)',
                      color: 'var(--navy, #1C2B4A)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                    }}
                  >
                    <Play size={20} fill="var(--navy, #1C2B4A)" />
                  </div>

                  {/* Badge Plateforme ou Visite Bien */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 10,
                      left: 10,
                      background: post.is_property_video ? 'var(--accent, #C75B00)' : 'rgba(0,0,0,0.7)',
                      backdropFilter: 'blur(4px)',
                      color: '#FFFFFF',
                      padding: '3px 8px',
                      borderRadius: 6,
                      fontSize: 10.5,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                    }}
                  >
                    {post.is_property_video ? 'Visite Vidéo' : post.plateforme}
                  </div>
                </div>

                <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8, flex: 1, justifyContent: 'space-between' }}>
                  <div
                    style={{
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: 'var(--navy, #1C2B4A)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {post.caption || 'Visite exclusive'}
                  </div>

                  {bien ? (
                    <div
                      style={{
                        background: '#FAF8F5',
                        borderRadius: 8,
                        padding: '8px 10px',
                        border: '1px solid var(--border, #E8DDD2)',
                      }}
                    >
                      <div style={{ fontSize: 11.5, fontWeight: 750, color: 'var(--navy, #1C2B4A)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {bien.titre}
                      </div>
                      <div style={{ fontSize: 11.5, fontWeight: 900, color: 'var(--accent, #C75B00)', marginTop: 2 }}>
                        {Number(bien.prix).toLocaleString('fr-FR')} FCFA {isLoc ? '/ mois' : ''}
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>
                      Visite d&apos;agence
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
