'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Home,
  MapPin,
  MessageCircle,
  Video,
  Calendar,
  Camera,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { AgenceData } from './VitrineBanner';
import ModalAlbumPhotos from './ModalAlbumPhotos';

export interface BienItem {
  id: string;
  reference: string;
  titre: string;
  type_bien: string;
  ville: string;
  quartier?: string;
  surface_m2?: number;
  nb_pieces?: number;
  nb_chambres?: number;
  prix_location?: number;
  prix_vente?: number;
  meuble: boolean;
  photos?: string[];
  videos?: string[];
  annonce_publiee_id?: string;
}

interface VitrineBiensGridProps {
  biens: BienItem[];
  agence: AgenceData | null;
  waNum: string;
  socialPosts?: any[];
  onRequestVisite?: (bien: BienItem) => void;
  onOpenVideo?: (post: any) => void;
}

function detectVideoPlatform(url: string): 'youtube' | 'tiktok' | 'instagram' | 'direct' {
  if (!url) return 'direct';
  const l = url.toLowerCase();
  if (l.includes('youtube.com') || l.includes('youtu.be')) return 'youtube';
  if (l.includes('tiktok.com')) return 'tiktok';
  if (l.includes('instagram.com')) return 'instagram';
  return 'direct';
}

export default function VitrineBiensGrid({
  biens,
  agence,
  waNum,
  socialPosts = [],
  onRequestVisite,
  onOpenVideo,
}: VitrineBiensGridProps) {
  const [photoIndices, setPhotoIndices] = useState<Record<string, number>>({});
  const [albumBien, setAlbumBien] = useState<{ photos: string[]; index: number; titre: string } | null>(null);

  if (biens.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: '#FFFFFF',
          borderRadius: 14,
          border: '1px solid var(--border, #E8DDD2)',
        }}
      >
        <Home size={34} style={{ margin: '0 auto 12px', opacity: 0.35, color: 'var(--navy, #1C2B4A)' }} />
        <p style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)', fontSize: 16, margin: '0 0 6px' }}>
          Aucun bien disponible pour ces critères
        </p>
        <p style={{ fontSize: 13.5, color: '#64748B', margin: 0 }}>
          Modifiez vos filtres ou contactez l&apos;agence directement pour une recherche sur mesure.
        </p>
      </div>
    );
  }

  const cleanWaNum = waNum.replace(/\D/g, '');

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 22,
        }}
      >
        {biens.map((b) => {
          const isLoc = !!b.prix_location;
          const prix = isLoc
            ? `${Number(b.prix_location).toLocaleString('fr-FR')} FCFA / mois`
            : `${Number(b.prix_vente || 0).toLocaleString('fr-FR')} FCFA`;

          const photosList = Array.isArray(b.photos) ? b.photos : [];
          const currentIdx = photoIndices[b.id] || 0;
          const safeIdx = currentIdx < photosList.length ? currentIdx : 0;
          const coverPhoto = photosList.length > 0 ? photosList[safeIdx] : null;
          const hasMultiplePhotos = photosList.length > 1;

          const hasRealVideo = Array.isArray(b.videos) && b.videos.length > 0 && !!b.videos[0];
          const matchingSocial = socialPosts.find(
            (p) => p.visible && p.biens_associes?.some((ba: any) => ba.id === b.id)
          );

          const hrefDetail = `/immo/${b.annonce_publiee_id || b.id}`;

          return (
            <div
              key={b.id}
              style={{
                background: '#FFFFFF',
                borderRadius: 14,
                border: '1px solid var(--border, #E8DDD2)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 2px 10px rgba(28, 43, 74, 0.05)',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
            >
              {/* ── Photo de couverture & Album interactif ── */}
              <div
                style={{
                  position: 'relative',
                  height: 215,
                  background: '#0F172A',
                  overflow: 'hidden',
                  cursor: photosList.length > 0 ? 'pointer' : 'default',
                }}
                onClick={() => {
                  if (photosList.length > 0) {
                    setAlbumBien({ photos: photosList, index: safeIdx, titre: b.titre });
                  }
                }}
              >
                {coverPhoto ? (
                  <img
                    src={coverPhoto}
                    alt={b.titre}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#94A3B8',
                      gap: 6,
                    }}
                  >
                    <Home size={38} />
                    <span style={{ fontSize: 11.5, fontWeight: 600 }}>Photos à venir</span>
                  </div>
                )}

                {/* Flèche Gauche Carousel */}
                {hasMultiplePhotos && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setPhotoIndices((prev) => ({
                        ...prev,
                        [b.id]: safeIdx > 0 ? safeIdx - 1 : photosList.length - 1,
                      }));
                    }}
                    style={{
                      position: 'absolute',
                      left: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      zIndex: 3,
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'rgba(15, 23, 42, 0.75)',
                      color: '#FFFFFF',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title="Photo précédente"
                  >
                    <ChevronLeft size={18} />
                  </button>
                )}

                {/* Flèche Droite Carousel */}
                {hasMultiplePhotos && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setPhotoIndices((prev) => ({
                        ...prev,
                        [b.id]: safeIdx < photosList.length - 1 ? safeIdx + 1 : 0,
                      }));
                    }}
                    style={{
                      position: 'absolute',
                      right: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      zIndex: 3,
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'rgba(15, 23, 42, 0.75)',
                      color: '#FFFFFF',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title="Photo suivante"
                  >
                    <ChevronRight size={18} />
                  </button>
                )}

                {/* Badge Opération (Location / Vente) */}
                <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6, zIndex: 2 }}>
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      padding: '4px 10px',
                      borderRadius: 6,
                      background: isLoc ? '#0284C7' : 'var(--accent, #C75B00)',
                      color: '#FFFFFF',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                    }}
                  >
                    {isLoc ? 'Location' : 'Vente'}
                  </span>
                  {b.meuble && (
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 800,
                        padding: '4px 8px',
                        borderRadius: 6,
                        background: 'rgba(0,0,0,0.65)',
                        backdropFilter: 'blur(4px)',
                        color: '#FFFFFF',
                      }}
                    >
                      Meublé
                    </span>
                  )}
                </div>

                {/* Badge Visite Vidéo Réelle du Bien */}
                {hasRealVideo ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onOpenVideo?.({
                        id: `video-${b.id}`,
                        post_url: b.videos![0],
                        caption: b.titre,
                        plateforme: detectVideoPlatform(b.videos![0]),
                        biens_associes: [
                          {
                            id: b.id,
                            titre: b.titre,
                            prix: b.prix_location || b.prix_vente || 0,
                            type_operation: isLoc ? 'location' : 'vente',
                            quartier: b.quartier,
                            image_url: photosList[0],
                          },
                        ],
                      });
                    }}
                    style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      zIndex: 2,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '5px 12px',
                      borderRadius: 20,
                      background: 'rgba(199, 91, 0, 0.95)',
                      color: '#FFFFFF',
                      fontSize: 11.5,
                      fontWeight: 800,
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(199, 91, 0, 0.4)',
                    }}
                    title="Lancer la vidéo du bien"
                  >
                    <Video size={13} />
                    <span>Visite Vidéo</span>
                  </button>
                ) : matchingSocial ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onOpenVideo?.({
                        ...matchingSocial,
                        biens_associes: [
                          {
                            id: b.id,
                            titre: b.titre,
                            prix: b.prix_location || b.prix_vente || 0,
                            type_operation: isLoc ? 'location' : 'vente',
                            quartier: b.quartier,
                            image_url: photosList[0],
                          },
                        ],
                      });
                    }}
                    style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      zIndex: 2,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '5px 12px',
                      borderRadius: 20,
                      background: 'rgba(28, 43, 74, 0.9)',
                      color: '#FFFFFF',
                      fontSize: 11.5,
                      fontWeight: 800,
                      border: 'none',
                      cursor: 'pointer',
                    }}
                    title="Voir le reel vidéo"
                  >
                    <Video size={13} />
                    <span>Reel Vidéo</span>
                  </button>
                ) : null}

                {/* Indicateur de pagination (dots) */}
                {hasMultiplePhotos && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 10,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      display: 'flex',
                      gap: 5,
                      zIndex: 2,
                    }}
                  >
                    {photosList.map((_, pIdx) => (
                      <span
                        key={pIdx}
                        style={{
                          width: safeIdx === pIdx ? 16 : 6,
                          height: 6,
                          borderRadius: 3,
                          background: safeIdx === pIdx ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
                          transition: 'all 0.2s ease',
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Compteur Photos cliquable pour ouvrir l'album */}
                {hasMultiplePhotos && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 10,
                      right: 12,
                      zIndex: 2,
                      background: 'rgba(0,0,0,0.65)',
                      backdropFilter: 'blur(4px)',
                      color: '#FFFFFF',
                      padding: '3px 8px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                    title="Ouvrir l'album photos"
                  >
                    <Camera size={11} />
                    <span>{safeIdx + 1}/{photosList.length}</span>
                  </div>
                )}
              </div>

              {/* ── Contenu du Bien & Lien vers Fiche ── */}
              <div style={{ padding: '16px 18px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent, #C75B00)', textTransform: 'capitalize' }}>
                    {b.type_bien}
                  </span>
                  {b.reference && (
                    <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>
                      Réf. {b.reference}
                    </span>
                  )}
                </div>

                {/* Titre cliquable */}
                <Link
                  href={hrefDetail}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                  title="Consulter ce bien"
                >
                  <h3
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: 'var(--navy, #1C2B4A)',
                      margin: '0 0 8px',
                      lineHeight: 1.35,
                      cursor: 'pointer',
                    }}
                  >
                    {b.titre}
                  </h3>
                </Link>

                <div style={{ fontSize: 12.5, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12 }}>
                  <MapPin size={13} style={{ flexShrink: 0 }} />
                  <span>{b.quartier ? `${b.quartier}, ${b.ville}` : b.ville}</span>
                </div>

                <div
                  style={{
                    fontSize: 12.5,
                    color: '#475569',
                    display: 'flex',
                    gap: 12,
                    flexWrap: 'wrap',
                    marginBottom: 16,
                    padding: '8px 12px',
                    background: '#F8F5F0',
                    borderRadius: 8,
                  }}
                >
                  {b.surface_m2 && <span><strong>{b.surface_m2}</strong> m²</span>}
                  {b.nb_pieces && <span><strong>{b.nb_pieces}</strong> pièces</span>}
                  {b.nb_chambres && <span><strong>{b.nb_chambres}</strong> ch.</span>}
                </div>

                <div style={{ marginTop: 'auto', fontSize: 18, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
                  {prix}
                </div>
              </div>

              {/* ── Barre d'Actions ── */}
              <div
                style={{
                  padding: '12px 16px',
                  borderTop: '1px solid var(--border, #E8DDD2)',
                  background: '#FAF8F5',
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                }}
              >
                {/* Bouton Réserver une Visite */}
                <button
                  type="button"
                  onClick={() => onRequestVisite?.(b)}
                  style={{
                    flex: 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '9px 12px',
                    borderRadius: 8,
                    background: 'var(--navy, #1C2B4A)',
                    color: '#FFFFFF',
                    fontSize: 12.5,
                    fontWeight: 800,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <Calendar size={14} />
                  <span>Demander une visite</span>
                </button>

                {/* Bouton Voir l'Annonce Complète */}
                <Link
                  href={hrefDetail}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '9px 12px',
                    borderRadius: 8,
                    background: '#FFFFFF',
                    color: 'var(--navy, #1C2B4A)',
                    border: '1px solid var(--border, #E8DDD2)',
                    fontSize: 12.5,
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                  title="Consulter la fiche détaillée"
                >
                  <ExternalLink size={14} />
                </Link>

                {/* Bouton WhatsApp Rapide */}
                {cleanWaNum && (
                  <a
                    href={`https://wa.me/${cleanWaNum}?text=${encodeURIComponent(
                      `Bonjour ${agence?.nom || "l'agence"}, je vous contacte depuis votre vitrine au sujet du bien : ${b.titre} (${prix}). Est-il toujours disponible pour une visite ?`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '9px 12px',
                      borderRadius: 8,
                      background: '#16a34a',
                      color: '#FFFFFF',
                    }}
                    title="Échanger directement sur WhatsApp"
                  >
                    <MessageCircle size={15} />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Modale Album Photos Plein Écran ── */}
      {albumBien && (
        <ModalAlbumPhotos
          photos={albumBien.photos}
          initialIndex={albumBien.index}
          titreBien={albumBien.titre}
          onClose={() => setAlbumBien(null)}
        />
      )}
    </>
  );
}
