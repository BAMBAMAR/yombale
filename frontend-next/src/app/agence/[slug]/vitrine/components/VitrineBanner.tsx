'use client';

import React from 'react';
import {
  MapPin,
  Phone,
  MessageCircle,
  Globe,
  Share2,
  Video,
  Camera,
  Music
} from 'lucide-react';

export interface AgenceData {
  id: string;
  nom: string;
  slug: string;
  description?: string;
  logo_url?: string;
  ville: string;
  quartier?: string;
  telephone?: string;
  whatsapp?: string;
  site_web?: string;
  email_contact?: string;
  numero_agrement?: string;
  parametres?: {
    reseaux_sociaux?: {
      instagram?: string;
      tiktok?: string;
      facebook?: string;
      whatsapp?: string;
      linkedin?: string;
      youtube?: string;
      twitter?: string;
      site_web?: string;
    };
  };
}

interface VitrineBannerProps {
  agence: AgenceData | null;
  waNum: string;
}

export default function VitrineBanner({ agence, waNum }: VitrineBannerProps) {
  if (!agence) return null;

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #1C2B4A 0%, #2A3F6D 100%)',
        borderRadius: 16,
        padding: '32px 24px',
        color: '#FFFFFF',
        marginBottom: 30,
        boxShadow: '0 4px 20px rgba(28, 43, 74, 0.15)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 12,
              background: '#FFFFFF',
              color: 'var(--navy, #1C2B4A)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              fontWeight: 900,
            }}
          >
            {agence.nom.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
              {agence.nom}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6, fontSize: 13, color: '#E2E8F0', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={14} />
                {agence.quartier ? `${agence.quartier}, ${agence.ville}` : agence.ville}
              </span>
              {agence.numero_agrement && (
                <span>• Agrément : {agence.numero_agrement}</span>
              )}
            </div>
          </div>
        </div>

        {agence.description && (
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: '#CBD5E1', maxWidth: 800 }}>
            {agence.description}
          </p>
        )}

        {/* Coordonnées & Réseaux Sociaux */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          {waNum && (
            <a
              href={`https://wa.me/${waNum}?text=${encodeURIComponent(`Bonjour ${agence.nom}, je visite votre vitrine Nopalou et souhaite me renseigner sur vos biens disponibles.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: '#25D366',
                color: '#FFFFFF',
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 750,
                textDecoration: 'none',
              }}
            >
              <MessageCircle size={16} />
              <span>WhatsApp Agence</span>
            </a>
          )}

          {agence.telephone && (
            <a
              href={`tel:${agence.telephone.replace(/\s+/g, '')}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(255,255,255,0.1)',
                color: '#FFFFFF',
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <Phone size={14} />
              <span>{agence.telephone}</span>
            </a>
          )}

          {agence.site_web && (
            <a
              href={agence.site_web.startsWith('http') ? agence.site_web : `https://${agence.site_web}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(255,255,255,0.1)',
                color: '#FFFFFF',
                padding: '8px 14px',
                borderRadius: 8,
                fontSize: 13,
                textDecoration: 'none',
              }}
            >
              <Globe size={14} />
              <span>Site officiel</span>
            </a>
          )}

          {/* Réseaux sociaux */}
          {agence.parametres?.reseaux_sociaux?.instagram && (
            <a
              href={`https://instagram.com/${agence.parametres.reseaux_sociaux.instagram.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'rgba(255,255,255,0.1)',
                color: '#FFFFFF',
              }}
            >
              <Camera size={16} />
            </a>
          )}

          {agence.parametres?.reseaux_sociaux?.tiktok && (
            <a
              href={`https://tiktok.com/@${agence.parametres.reseaux_sociaux.tiktok.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'rgba(255,255,255,0.1)',
                color: '#FFFFFF',
              }}
            >
              <Music size={16} />
            </a>
          )}

          {agence.parametres?.reseaux_sociaux?.youtube && (
            <a
              href={agence.parametres.reseaux_sociaux.youtube.startsWith('http') ? agence.parametres.reseaux_sociaux.youtube : `https://youtube.com/${agence.parametres.reseaux_sociaux.youtube}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'rgba(255,255,255,0.1)',
                color: '#FFFFFF',
              }}
            >
              <Video size={16} />
            </a>
          )}

          {/* Bouton Partager */}
          <button
            type="button"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: `${agence.nom} — Nopalou`,
                  url: window.location.href,
                }).catch(() => {});
              } else {
                navigator.clipboard.writeText(window.location.href);
                alert('Lien copié dans le presse-papier !');
              }
            }}
            style={{
              marginLeft: 'auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(255,255,255,0.15)',
              color: '#FFFFFF',
              border: 'none',
              padding: '8px 14px',
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Share2 size={14} />
            <span>Partager la vitrine</span>
          </button>
        </div>
      </div>
    </div>
  );
}
