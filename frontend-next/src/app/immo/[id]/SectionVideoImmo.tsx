'use client';

import React, { useState } from 'react';
import { Video, Film, ExternalLink } from 'lucide-react';

interface SectionVideoImmoProps {
  videos: string[];
  titre: string;
  posterPhoto?: string | null;
}

export default function SectionVideoImmo({ videos, titre, posterPhoto }: SectionVideoImmoProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [videoError, setVideoError] = useState(false);

  if (!videos || videos.length === 0) return null;

  const currentUrl = videos[selectedIdx] || videos[0];

  // Helper de détection de type de vidéo
  let isYouTube = false;
  let ytEmbed = '';
  let isMatterport = false;
  let isDirectVideo = false;

  const lower = currentUrl.toLowerCase();
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
    isYouTube = true;
    const match = currentUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:shorts\/|watch\?v=))([A-Za-z0-9_-]{11})/);
    if (match) {
      ytEmbed = `https://www.youtube-nocookie.com/embed/${match[1]}`;
    }
  } else if (lower.includes('matterport.com')) {
    isMatterport = true;
  } else if (lower.match(/\.(mp4|webm|mov)(\?.*)?$/i) || lower.includes('cloudinary') || lower.includes('video/upload')) {
    isDirectVideo = true;
  }

  return (
    <div
      style={{
        marginTop: 28,
        marginBottom: 28,
        background: '#FFFFFF',
        borderRadius: 14,
        border: '1px solid var(--border, #E8DDD2)',
        overflow: 'hidden',
        boxShadow: '0 2px 10px rgba(28, 43, 74, 0.04)',
      }}
    >
      {/* En-tête de section */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border, #E8DDD2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
          background: '#FAF8F5',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'rgba(199, 91, 0, 0.12)',
              color: 'var(--accent, #C75B00)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Video size={18} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
              Visite Vidéo & Immersion
            </h3>
            <span style={{ fontSize: 12, color: '#64748B' }}>
              Découvrez ce bien en immersion vidéo interactive
            </span>
          </div>
        </div>

        {/* Sélecteur de vidéos si plusieurs */}
        {videos.length > 1 && (
          <div style={{ display: 'flex', gap: 6 }}>
            {videos.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSelectedIdx(idx);
                  setVideoError(false);
                }}
                style={{
                  padding: '5px 12px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  border: selectedIdx === idx ? 'none' : '1px solid var(--border, #E8DDD2)',
                  background: selectedIdx === idx ? 'var(--navy, #1C2B4A)' : '#FFFFFF',
                  color: selectedIdx === idx ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
                  cursor: 'pointer',
                }}
              >
                Vidéo {idx + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lecteur Vidéo */}
      <div style={{ padding: 16, background: '#0F172A' }}>
        <div
          style={{
            position: 'relative',
            width: '100%',
            paddingTop: '56.25%', // 16:9 aspect ratio
            borderRadius: 8,
            overflow: 'hidden',
            background: '#1C2B4A',
          }}
        >
          {isYouTube && ytEmbed ? (
            <iframe
              src={ytEmbed}
              title={`Vidéo de ${titre}`}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 'none',
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : isMatterport ? (
            <iframe
              src={currentUrl}
              title={`Visite 3D Matterport de ${titre}`}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 'none',
              }}
              allowFullScreen
            />
          ) : isDirectVideo ? (
            videoError ? (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  color: '#FFFFFF',
                  background: 'linear-gradient(135deg, #1C2B4A 0%, #0F172A 100%)',
                  padding: 24,
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    background: 'rgba(199, 91, 0, 0.2)',
                    color: 'var(--accent, #C75B00)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Film size={24} />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: 15, fontWeight: 700 }}>
                    Flux vidéo protégé ou non lisible directement
                  </h4>
                  <p style={{ margin: 0, fontSize: 13, color: '#94A3B8', maxWidth: 360 }}>
                    Vous pouvez ouvrir la visite vidéo directement dans un lecteur plein écran.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                  <button
                    type="button"
                    onClick={() => setVideoError(false)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 8,
                      background: 'rgba(255, 255, 255, 0.12)',
                      color: '#FFFFFF',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Réessayer
                  </button>
                  <a
                    href={currentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 16px',
                      borderRadius: 8,
                      background: 'var(--accent, #C75B00)',
                      color: '#FFFFFF',
                      textDecoration: 'none',
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    <span>Ouvrir la vidéo</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            ) : (
              <video
                key={currentUrl}
                src={currentUrl}
                poster={posterPhoto || undefined}
                preload="metadata"
                controls
                playsInline
                onError={() => setVideoError(true)}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
            )
          ) : (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                color: '#FFFFFF',
              }}
            >
              <Film size={40} style={{ opacity: 0.6 }} />
              <a
                href={currentUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  borderRadius: 8,
                  background: 'var(--accent, #C75B00)',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                <span>Ouvrir la vidéo</span>
                <ExternalLink size={14} />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
