'use client';

import React from 'react';
import { Video, Play } from 'lucide-react';
import { AgenceData } from './VitrineBanner';

interface VitrineVideoReelsProps {
  agence: AgenceData | null;
  onOpenPost?: (post: any) => void;
}

export default function VitrineVideoReels({ agence, onOpenPost }: VitrineVideoReelsProps) {
  const socialPosts = (agence?.parametres as any)?.social_posts || [];
  const visiblePosts = socialPosts.filter((p: any) => p.visible);
  if (visiblePosts.length === 0) return null;

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
        {visiblePosts.map((post: any) => {
          const bien = post.biens_associes?.[0];
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
                    fontSize: 10.5,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                  }}
                >
                  {post.plateforme}
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
                      {Number(bien.prix).toLocaleString('fr-FR')} FCFA {bien.type_operation === 'location' ? '/ mois' : ''}
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>
                    Visite d'agence
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
