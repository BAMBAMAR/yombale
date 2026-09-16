'use client';

import React from 'react';
import { Video } from 'lucide-react';
import { AgenceData } from './VitrineBanner';

interface VitrineVideoReelsProps {
  agence: AgenceData | null;
}

export default function VitrineVideoReels({ agence }: VitrineVideoReelsProps) {
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
          const bien = post.biens_associes?.[0];
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
              <div style={{ position: 'relative', height: 220, background: '#0F172A', overflow: 'hidden' }}>
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

                {/* Bouton lecture */}
                <a
                  href={post.post_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Regarder la visite vidéo"
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
          );
        })}
      </div>
    </div>
  );
}
