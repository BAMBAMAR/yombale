'use client';

import React, { useState, useEffect } from 'react';
import { Camera, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { cloudinaryHQ } from '@/lib/cloudinary';
import ModalAlbumPhotos from '@/app/agence/[slug]/vitrine/components/ModalAlbumPhotos';

interface GaleriePhotosFicheProps {
  photos: string[];
  titre: string;
}

export default function GaleriePhotosFiche({ photos, titre }: GaleriePhotosFicheProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const prevPhoto = () => setActiveIdx((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  const nextPhoto = () => setActiveIdx((prev) => (prev < photos.length - 1 ? prev + 1 : 0));

  // Navigation clavier flèche gauche / droite
  useEffect(() => {
    if (!photos || photos.length <= 1 || isLightboxOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      if (tagName === 'input' || tagName === 'textarea' || tagName === 'select' || target?.isContentEditable) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevPhoto();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextPhoto();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [photos, isLightboxOpen]);

  if (!photos || photos.length === 0) return null;

  const currentPhoto = photos[activeIdx] || photos[0];
  const hasMultiple = photos.length > 1;

  function handlePrev(e: React.MouseEvent) {
    e.stopPropagation();
    prevPhoto();
  }

  function handleNext(e: React.MouseEvent) {
    e.stopPropagation();
    nextPhoto();
  }

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        {/* Photo principale avec contrôles interactifs */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 380,
            borderRadius: 12,
            overflow: 'hidden',
            background: '#0F172A',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
          }}
          onClick={() => setIsLightboxOpen(true)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cloudinaryHQ(currentPhoto, { width: 1000 })}
            alt={`${titre} - photo ${activeIdx + 1}`}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loading="eager"
          />

          {/* Flèche Gauche */}
          {hasMultiple && (
            <button
              type="button"
              onClick={handlePrev}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: 'rgba(15, 23, 42, 0.7)',
                color: '#FFFFFF',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(4px)',
                zIndex: 2,
              }}
              title="Photo précédente"
            >
              <ChevronLeft size={20} />
            </button>
          )}

          {/* Flèche Droite */}
          {hasMultiple && (
            <button
              type="button"
              onClick={handleNext}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: 'rgba(15, 23, 42, 0.7)',
                color: '#FFFFFF',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(4px)',
                zIndex: 2,
              }}
              title="Photo suivante"
            >
              <ChevronRight size={20} />
            </button>
          )}

          {/* Badge Bouton Agrandir / Album */}
          <div
            style={{
              position: 'absolute',
              bottom: 12,
              right: 12,
              background: 'rgba(0,0,0,0.75)',
              backdropFilter: 'blur(4px)',
              color: '#FFFFFF',
              padding: '6px 12px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              zIndex: 2,
            }}
          >
            <Camera size={14} />
            <span>
              {activeIdx + 1} / {photos.length} photos
            </span>
            <Maximize2 size={13} style={{ marginLeft: 2 }} />
          </div>
        </div>

        {/* Galerie miniatures défilante */}
        {hasMultiple && (
          <div
            style={{
              display: 'flex',
              gap: 10,
              overflowX: 'auto',
              marginTop: 10,
              paddingBottom: 4,
            }}
          >
            {photos.map((url, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveIdx(i)}
                style={{
                  flexShrink: 0,
                  width: 90,
                  height: 64,
                  borderRadius: 8,
                  overflow: 'hidden',
                  background: '#1E293B',
                  border: activeIdx === i ? '2.5px solid var(--accent, #C75B00)' : '1px solid var(--border, #E8DDD2)',
                  cursor: 'pointer',
                  padding: 0,
                  opacity: activeIdx === i ? 1 : 0.65,
                  transition: 'all 0.15s ease',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cloudinaryHQ(url, { width: 200 })}
                  alt={`${titre} miniature ${i + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Album Plein Écran */}
      {isLightboxOpen && (
        <ModalAlbumPhotos
          photos={photos}
          initialIndex={activeIdx}
          titreBien={titre}
          onClose={() => setIsLightboxOpen(false)}
        />
      )}
    </>
  );
}
