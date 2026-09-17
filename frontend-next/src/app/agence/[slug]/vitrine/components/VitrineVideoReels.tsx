'use client';

import React from 'react';
import { Video, Play } from 'lucide-react';
import { AgenceData } from './VitrineBanner';
import { BienItem } from './VitrineBiensGrid';

interface VitrineVideoReelsProps {
  agence: AgenceData | null;
  biens?: BienItem[];
  onOpenPost?: (post: any) => void;
}

function detectPlatform(url: string): 'youtube' | 'tiktok' | 'instagram' | 'direct' {
  if (!url) return 'direct';
  const l = url.toLowerCase();
  if (l.includes('youtube.com') || l.includes('youtu.be')) return 'youtube';
  if (l.includes('tiktok.com')) return 'tiktok';
  if (l.includes('instagram.com')) return 'instagram';
  return 'direct';
}

export default function VitrineVideoReels({ agence, biens = [], onOpenPost }: VitrineVideoReelsProps) {
  // 1. Visites vidéos issues directement des biens de l'agence
  const propertyVideoCards = (biens || [])
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
            quartier: b.quartier,
            image_url: b.photos?.[0],
          },
        ],
      };
    });

  // 2. Posts réseaux sociaux (synchronisés dynamiquement avec les données réelles des biens)
  const socialPosts = (agence?.parametres as any)?.social_posts || [];
  const socialCards = socialPosts
    .filter((p: any) => p.visible)
    .map((post: any) => {
      // Synchronisation dynamique : si rattaché à un bien, on prend les données réelles du bien
      const linked = post.biens_associes?.[0];
      const liveBien = linked ? biens.find((b) => b.id === linked.id) : null;

      const bienData = liveBien
        ? {
            id: liveBien.id,
            titre: liveBien.titre,
            prix: liveBien.prix_location || liveBien.prix_vente || 0,
            type_operation: liveBien.prix_location ? 'location' : 'vente',
            quartier: liveBien.quartier,
            image_url: liveBien.photos?.[0] || linked.image_url,
          }
        : linked;

      return {
        ...post,
        thumbnail_url: post.thumbnail_url || bienData?.image_url,
        biens_associes: bienData ? [bienData] : [],
      };
    });

  // Combiner en évitant les doublons exacts
  const allVideoCards = [...propertyVideoCards, ...socialCards];

  if (allVideoCards.length === 0) return null;

  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
            Visites Virtuelles & Reels
          </h2>
          <p style={{ fontSize: 12.5, color: '#64748B', margin: '2px 0 0' }}>
            Découvrez nos biens en immersion vidéo directe. Cliquez sur une visite pour lancer le lecteur interactif.
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
        {allVideoCards.map((post: any) => {
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
    </div>
  );
}
