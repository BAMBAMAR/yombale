'use client';

import React, { useState, useEffect } from 'react';
import { Camera, ChevronLeft, ChevronRight, Maximize2, Building2 } from 'lucide-react';
import { cloudinaryHQ } from '@/lib/cloudinary';
import ModalAlbumPhotos from '@/app/agence/[slug]/vitrine/components/ModalAlbumPhotos';

interface GaleriePhotosFicheProps {
  photos: string[];
  titre: string;
}

export default function GaleriePhotosFiche({ photos, titre }: GaleriePhotosFicheProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});

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

  if (!photos || photos.length === 0) {
    return (
      <div
        style={{
          width: '100%',
          minHeight: 240,
          borderRadius: 12,
          background: 'linear-gradient(135deg, var(--bg, #F8F5F0) 0%, #EFE9DF 100%)',
          border: '1px solid var(--border, #E8DDD2)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 20px',
          marginBottom: 20,
          textAlign: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: 'rgba(28, 43, 74, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--navy, #1C2B4A)',
          }}
        >
          <Building2 size={26} />
        </div>
        <div>
          <h4 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
            Photos disponibles sur demande
          </h4>
          <p style={{ margin: 0, fontSize: 13, color: '#64748B', maxWidth: 440, lineHeight: 1.5 }}>
            Le propriétaire ou démarcheur peut vous transmettre les photos récentes et organiser une visite directe par WhatsApp ou téléphone.
          </p>
        </div>
      </div>
    );
  }

  const currentPhoto = photos[activeIdx] || photos[0];
  const hasMultiple = photos.length > 1;
  const isCurrentBroken = Boolean(imgErrors[activeIdx]);

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
            background: 'linear-gradient(135deg, #1C2B4A 0%, #0F172A 100%)',
            cursor: isCurrentBroken ? 'default' : 'pointer',
            boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
          }}
          onClick={() => {
            if (!isCurrentBroken) setIsLightboxOpen(true);
          }}
        >
          {isCurrentBroken ? (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#CBD5E1',
                padding: 24,
                textAlign: 'center',
                gap: 12,
              }}
            >
              <Building2 size={36} color="#94A3B8" />
              <div>
                <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600, color: '#F8FAFC' }}>
                  Photo non disponible en ligne
                </p>
                <p style={{ margin: 0, fontSize: 12, color: '#94A3B8', maxWidth: 360 }}>
                  Contactez l’annonceur ci-contre pour obtenir les photos récentes du bien.
                </p>
              </div>
            </div>
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={cloudinaryHQ(currentPhoto, { width: 1000 })}
              alt={`${titre} - photo ${activeIdx + 1}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              loading="eager"
              onError={() => setImgErrors(prev => ({ ...prev, [activeIdx]: true }))}
            />
          )}

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
                {imgErrors[i] ? (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1E293B', color: '#94A3B8' }}>
                    <Building2 size={18} />
                  </div>
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={cloudinaryHQ(url, { width: 200 })}
                    alt={`${titre} miniature ${i + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    loading="lazy"
                    onError={() => setImgErrors(prev => ({ ...prev, [i]: true }))}
                  />
                )}
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
