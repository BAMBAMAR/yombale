'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  ExternalLink,
  Home,
  MapPin,
  Play,
  Share2,
  Video,
  Camera,
  Music
} from 'lucide-react';

interface LinkedBien {
  id: string;
  titre: string;
  prix: number;
  type_operation: 'vente' | 'location';
  quartier?: string;
  image_url?: string;
}

interface SocialPostItem {
  id: string;
  plateforme: 'instagram' | 'tiktok' | 'facebook' | 'youtube';
  external_post_id?: string;
  post_url: string;
  media_type?: string;
  thumbnail_url?: string;
  caption?: string;
  auteur?: string;
  biens_associes?: LinkedBien[];
}

interface ModalLecteurVideoImmoProps {
  post: SocialPostItem | null;
  posts: SocialPostItem[];
  onClose: () => void;
  onSelectPost: (post: SocialPostItem) => void;
  onRequestVisite: (bien: LinkedBien) => void;
}

export default function ModalLecteurVideoImmo({
  post,
  posts,
  onClose,
  onSelectPost,
  onRequestVisite,
}: ModalLecteurVideoImmoProps) {
  const [iframeError, setIframeError] = useState(false);

  useEffect(() => {
    setIframeError(false);
  }, [post?.id]);

  // Écoute touche Echap
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [post, posts]);

  if (!post) return null;

  const currentIndex = posts.findIndex((p) => p.id === post.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < posts.length - 1;

  function handlePrev() {
    if (hasPrev) onSelectPost(posts[currentIndex - 1]);
  }

  function handleNext() {
    if (hasNext) onSelectPost(posts[currentIndex + 1]);
  }

  const bien = post.biens_associes && post.biens_associes.length > 0 ? post.biens_associes[0] : null;

  // Extraction pour iframe
  const url = post.post_url || '';
  let embedSrc = '';
  let isDirectVideo = false;

  if (url.endsWith('.mp4') || url.endsWith('.webm')) {
    isDirectVideo = true;
  } else if (post.plateforme === 'youtube') {
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:shorts\/|watch\?v=))([A-Za-z0-9_-]{11})/);
    if (ytMatch) {
      embedSrc = `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;
    }
  } else if (post.plateforme === 'tiktok') {
    const ttMatch = url.match(/\/video\/(\d+)/);
    if (ttMatch) {
      embedSrc = `https://www.tiktok.com/embed/v2/${ttMatch[1]}`;
    }
  } else if (post.plateforme === 'instagram') {
    const igMatch = url.match(/\/(?:reel|p|tv)\/([A-Za-z0-9_-]+)/);
    if (igMatch) {
      embedSrc = `https://www.instagram.com/p/${igMatch[1]}/embed/captioned/`;
    }
  }

  const isLoc = bien?.type_operation === 'location';
  const prixFormatted = bien?.prix
    ? `${Number(bien.prix).toLocaleString('fr-FR')} FCFA ${isLoc ? '/ mois' : ''}`
    : '';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: 16,
      }}
      onClick={onClose}
    >
      {/* ── Flèche Précédent (Desktop) ── */}
      {hasPrev && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          aria-label="Vidéo précédente"
          style={{
            position: 'absolute',
            left: 20,
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.15)',
            color: '#FFFFFF',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 1200,
          }}
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {/* ── Flèche Suivant (Desktop) ── */}
      {hasNext && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          aria-label="Vidéo suivante"
          style={{
            position: 'absolute',
            right: 20,
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.15)',
            color: '#FFFFFF',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 1200,
          }}
        >
          <ChevronRight size={24} />
        </button>
      )}

      {/* ── Conteneur Modal ── */}
      <div
        style={{
          background: '#0F172A',
          borderRadius: 20,
          maxWidth: 920,
          width: '100%',
          maxHeight: '92vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'row',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bouton Fermer */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer le lecteur"
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'rgba(0, 0, 0, 0.6)',
            color: '#FFFFFF',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
          }}
        >
          <X size={20} />
        </button>

        {/* ── Zone Vidéo (Gauche / Centre) ── */}
        <div
          style={{
            flex: '1 1 54%',
            background: '#000000',
            minHeight: 480,
            maxHeight: '90vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {isDirectVideo ? (
            <video
              src={url}
              poster={post.thumbnail_url || post.biens_associes?.[0]?.image_url || undefined}
              controls
              autoPlay
              playsInline
              preload="metadata"
              onError={() => setIframeError(true)}
              style={{ width: '100%', height: '100%', maxHeight: '90vh', objectFit: 'contain' }}
            />
          ) : embedSrc && !iframeError ? (
            <iframe
              src={embedSrc}
              title={post.caption || 'Visite vidéo'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onError={() => setIframeError(true)}
              style={{
                width: '100%',
                height: '100%',
                minHeight: 480,
                maxHeight: '90vh',
                border: 'none',
              }}
            />
          ) : (
            /* Fallback si iframe bloquée ou lecteur tiers */
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 30,
                textAlign: 'center',
                gap: 16,
                color: '#FFFFFF',
              }}
            >
              {post.thumbnail_url ? (
                <div style={{ position: 'relative', width: 220, height: 320, borderRadius: 12, overflow: 'hidden' }}>
                  <img
                    src={post.thumbnail_url}
                    alt={post.caption || 'Aperçu vidéo'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(0,0,0,0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Play size={48} color="#FFFFFF" />
                  </div>
                </div>
              ) : (
                <Video size={48} color="var(--accent, #C75B00)" />
              )}

              <p style={{ fontSize: 13, color: '#94A3B8', maxWidth: 300, margin: 0 }}>
                Cette publication vidéo est hébergée sur {post.plateforme}.
              </p>

              <a
                href={post.post_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'var(--accent, #C75B00)',
                  color: '#FFFFFF',
                  padding: '10px 18px',
                  borderRadius: 8,
                  fontSize: 13.5,
                  fontWeight: 800,
                  textDecoration: 'none',
                }}
              >
                <ExternalLink size={15} />
                <span>Ouvrir sur {post.plateforme}</span>
              </a>
            </div>
          )}
        </div>

        {/* ── Zone Fiche Bien & Informations (Droite) ── */}
        <div
          style={{
            flex: '1 1 46%',
            background: '#FFFFFF',
            padding: '24px 22px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Badge Plateforme */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  padding: '4px 8px',
                  borderRadius: 6,
                  background: '#F1F5F9',
                  color: 'var(--navy, #1C2B4A)',
                }}
              >
                {post.plateforme === 'instagram' && <Camera size={12} />}
                {post.plateforme === 'tiktok' && <Music size={12} />}
                {post.plateforme === 'youtube' && <Video size={12} />}
                {post.plateforme}
              </span>
              <span style={{ fontSize: 12, color: '#94A3B8' }}>
                Visite virtuelle interactive
              </span>
            </div>

            {/* Description du post */}
            {post.caption && (
              <p
                style={{
                  fontSize: 13.5,
                  lineHeight: 1.5,
                  color: '#334155',
                  margin: 0,
                  maxHeight: 120,
                  overflowY: 'auto',
                }}
              >
                {post.caption}
              </p>
            )}

            {/* ── Carte du Bien Associé ── */}
            {bien ? (
              <div
                style={{
                  background: '#FAF8F5',
                  borderRadius: 14,
                  border: '1px solid var(--border, #E8DDD2)',
                  padding: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  {bien.image_url ? (
                    <img
                      src={bien.image_url}
                      alt={bien.titre}
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: 10,
                        objectFit: 'cover',
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: 10,
                        background: '#E2E8F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#64748B',
                        flexShrink: 0,
                      }}
                    >
                      <Home size={28} />
                    </div>
                  )}

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        color: 'var(--accent, #C75B00)',
                      }}
                    >
                      {isLoc ? 'À Louer' : 'À Vendre'}
                    </span>
                    <h3
                      style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: 'var(--navy, #1C2B4A)',
                        margin: '2px 0 4px',
                        lineHeight: 1.3,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {bien.titre}
                    </h3>
                    {bien.quartier && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#64748B' }}>
                        <MapPin size={11} />
                        <span>{bien.quartier}</span>
                      </div>
                    )}
                    <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--navy, #1C2B4A)', marginTop: 2 }}>
                      {prixFormatted}
                    </div>
                  </div>
                </div>

                {/* Bouton Demander Visite */}
                <button
                  type="button"
                  onClick={() => onRequestVisite(bien)}
                  style={{
                    width: '100%',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    background: 'var(--navy, #1C2B4A)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 8,
                    padding: '11px 16px',
                    fontSize: 13.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(28, 43, 74, 0.15)',
                  }}
                >
                  <Calendar size={15} />
                  <span>Demander une visite pour ce bien</span>
                </button>
              </div>
            ) : (
              <div
                style={{
                  background: '#F8FAFC',
                  borderRadius: 12,
                  padding: 16,
                  border: '1px dashed #CBD5E1',
                  textAlign: 'center',
                  color: '#64748B',
                  fontSize: 13,
                }}
              >
                <p style={{ margin: 0, fontWeight: 600 }}>
                  Visite générale de l'agence
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 12 }}>
                  Consultez la liste des biens ci-dessous pour découvrir nos opportunités disponibles.
                </p>
              </div>
            )}
          </div>

          {/* ── Footer Navigation ── */}
          <div
            style={{
              paddingTop: 16,
              borderTop: '1px solid var(--border, #E8DDD2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 16,
            }}
          >
            <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>
              {currentIndex + 1} / {posts.length} vidéos
            </span>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={handlePrev}
                disabled={!hasPrev}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  background: hasPrev ? '#F1F5F9' : '#F8FAFC',
                  color: hasPrev ? 'var(--navy, #1C2B4A)' : '#CBD5E1',
                  border: 'none',
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: hasPrev ? 'pointer' : 'not-allowed',
                }}
              >
                Précédente
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={!hasNext}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  background: hasNext ? '#F1F5F9' : '#F8FAFC',
                  color: hasNext ? 'var(--navy, #1C2B4A)' : '#CBD5E1',
                  border: 'none',
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: hasNext ? 'pointer' : 'not-allowed',
                }}
              >
                Suivante
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
