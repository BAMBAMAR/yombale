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
    studio?: {
      theme_id?: string;
      couleur_accent?: string;
      couleur_fond?: string;
      forme_boutons?: string;
      cover_url?: string;
      logo_url?: string;
      slogan?: string;
      bandeau_annonce?: string;
      bandeau_annonce_actif?: boolean;
      message_accueil_wa?: string;
      disposition_sections?: any[];
    };
  };
}

interface VitrineBannerProps {
  agence: AgenceData | null;
  waNum: string;
}

export default function VitrineBanner({ agence, waNum }: VitrineBannerProps) {
  if (!agence) return null;

  const studio = agence.parametres?.studio;
  const coverImg = studio?.cover_url;
  const logoImg = studio?.logo_url || agence.logo_url;
  const slogan = studio?.slogan;
  const bandeauActif = studio?.bandeau_annonce_actif && studio?.bandeau_annonce;
  const accentColor = studio?.couleur_accent || 'var(--accent, #C75B00)';

  return (
    <div style={{ marginBottom: 30 }}>
      {/* Bandeau d'Annonce / Alerte Portes Ouvertes si actif */}
      {bandeauActif && (
        <div
          style={{
            background: 'linear-gradient(90deg, #FEF3C7 0%, #FFFBEB 100%)',
            border: '1px solid #FDE68A',
            borderRadius: 12,
            padding: '10px 16px',
            marginBottom: 16,
            color: '#92400E',
            fontSize: 13,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: '0 2px 6px rgba(146, 64, 14, 0.06)',
          }}
        >
          <span>{studio.bandeau_annonce}</span>
        </div>
      )}

      <div
        style={{
          background: coverImg
            ? `linear-gradient(135deg, rgba(28, 43, 74, 0.92) 0%, rgba(15, 23, 42, 0.85) 100%), url(${coverImg}) center/cover no-repeat`
            : 'linear-gradient(135deg, #1C2B4A 0%, #2A3F6D 100%)',
          borderRadius: 16,
          padding: '32px 24px',
          color: '#FFFFFF',
          boxShadow: '0 6px 24px rgba(28, 43, 74, 0.18)',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div
              style={{
                width: 68,
                height: 68,
                borderRadius: 14,
                background: '#FFFFFF',
                color: 'var(--navy, #1C2B4A)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 26,
                fontWeight: 900,
                overflow: 'hidden',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
            >
              {logoImg ? (
                <img
                  src={logoImg}
                  alt={agence.nom}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              ) : (
                agence.nom.charAt(0).toUpperCase()
              )}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: 26, fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>
                  {agence.nom}
                </h1>
                {studio?.theme_id && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: 6,
                      background: 'rgba(255,255,255,0.15)',
                      backdropFilter: 'blur(4px)',
                      color: '#FFFFFF',
                      textTransform: 'uppercase',
                    }}
                  >
                    {studio.theme_id}
                  </span>
                )}
              </div>

              {slogan && (
                <p style={{ margin: '4px 0 0', fontSize: 13.5, color: '#F8FAFC', fontStyle: 'italic', fontWeight: 600 }}>
                  « {slogan} »
                </p>
              )}

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
    </div>
  );
}
