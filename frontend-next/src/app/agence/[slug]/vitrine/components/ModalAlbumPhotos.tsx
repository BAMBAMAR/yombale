'use client';

import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Camera } from 'lucide-react';

interface ModalAlbumPhotosProps {
  photos: string[];
  initialIndex?: number;
  titreBien: string;
  onClose: () => void;
}

export default function ModalAlbumPhotos({
  photos,
  initialIndex = 0,
  titreBien,
  onClose,
}: ModalAlbumPhotosProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, photos.length]);

  if (!photos || photos.length === 0) return null;

  function handlePrev() {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  }

  function handleNext() {
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  }

  const currentPhoto = photos[currentIndex];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.94)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 1200,
        padding: '16px 20px',
      }}
      onClick={onClose}
    >
      {/* ── Barre Supérieure (Titre, Compteur, Fermeture) ── */}
      <div
        style={{
          width: '100%',
          maxWidth: 1080,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#FFFFFF',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ minWidth: 0 }}>
          <h3
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 800,
              color: '#FFFFFF',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {titreBien}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#94A3B8', marginTop: 3 }}>
            <Camera size={14} />
            <span>
              Photo {currentIndex + 1} sur {photos.length}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.12)',
            color: '#FFFFFF',
            border: 'none',
            cursor: 'pointer',
            transition: 'background 0.15s ease',
          }}
          title="Fermer l'album (Échap)"
        >
          <X size={20} />
        </button>
      </div>

      {/* ── Zone Centrale (Image Haute Résolution & Flèches) ── */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 1080,
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '12px 0',
          minHeight: 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Flèche Gauche */}
        {photos.length > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              width: 46,
              height: 46,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(4px)',
              color: '#FFFFFF',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
            title="Photo précédente"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        {/* Photo affichée */}
        <div
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            borderRadius: 12,
          }}
        >
          <img
            src={currentPhoto}
            alt={`${titreBien} - photo ${currentIndex + 1}`}
            style={{
              maxWidth: '100%',
              maxHeight: '75vh',
              objectFit: 'contain',
              borderRadius: 8,
              boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
              userSelect: 'none',
            }}
          />
        </div>

        {/* Flèche Droite */}
        {photos.length > 1 && (
          <button
            type="button"
            onClick={handleNext}
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              width: 46,
              height: 46,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(4px)',
              color: '#FFFFFF',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
            title="Photo suivante"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>

      {/* ── Galerie de Miniatures en Bas ── */}
      {photos.length > 1 && (
        <div
          style={{
            width: '100%',
            maxWidth: 1080,
            display: 'flex',
            justifyContent: 'center',
            gap: 10,
            overflowX: 'auto',
            padding: '8px 0',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {photos.map((url, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              style={{
                width: 68,
                height: 48,
                borderRadius: 6,
                overflow: 'hidden',
                border: currentIndex === idx ? '2.5px solid var(--accent, #C75B00)' : '1px solid rgba(255,255,255,0.2)',
                opacity: currentIndex === idx ? 1 : 0.6,
                background: '#1E293B',
                cursor: 'pointer',
                padding: 0,
                flexShrink: 0,
                transition: 'all 0.15s ease',
              }}
            >
              <img
                src={url}
                alt={`Miniature ${idx + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
