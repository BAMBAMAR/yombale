'use client';

import React, { useState } from 'react';
import {
  MapPin,
  Phone,
  MessageCircle,
  Globe,
  Share2,
  Building2,
  Clock,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { showToast } from '@/context/ToastContext';
import { calculerStatutAgence, JOURS_SEMAINE_KEYS } from '../lib/vitrineStatut';

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
    horaires?: Record<string, string>;
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
  const [showHoraires, setShowHoraires] = useState(false);

  if (!agence) return null;

  const studio = agence.parametres?.studio;
  const coverImg = studio?.cover_url;
  const logoImg = studio?.logo_url || agence.logo_url;
  const slogan = studio?.slogan;
  const bandeauActif = studio?.bandeau_annonce_actif && studio?.bandeau_annonce;
  const horaires = agence.parametres?.horaires;
  const reseaux = agence.parametres?.reseaux_sociaux || {};

  const statut = calculerStatutAgence(horaires);

  // Liste exhaustive des canaux officiels & réseaux sociaux
  const socialList = [
    {
      id: 'instagram',
      label: 'Instagram',
      handle: reseaux.instagram ? reseaux.instagram.replace(/^@/, '') : null,
      url: reseaux.instagram ? (reseaux.instagram.startsWith('http') ? reseaux.instagram : `https://instagram.com/${reseaux.instagram.replace(/^@/, '').trim()}`) : null,
      color: '#E1306C',
      svg: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
      ),
    },
    {
      id: 'facebook',
      label: 'Facebook',
      handle: null,
      url: reseaux.facebook ? (reseaux.facebook.startsWith('http') ? reseaux.facebook : `https://facebook.com/${reseaux.facebook.replace(/^@/, '').trim()}`) : null,
      color: '#1877F2',
      svg: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
      ),
    },
    {
      id: 'tiktok',
      label: 'TikTok',
      handle: reseaux.tiktok ? reseaux.tiktok.replace(/^@/, '') : null,
      url: reseaux.tiktok ? (reseaux.tiktok.startsWith('http') ? reseaux.tiktok : `https://tiktok.com/@${reseaux.tiktok.replace(/^@/, '').trim()}`) : null,
      color: '#0F172A',
      svg: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 1 1-5.2-1.74 2.89 2.89 0 0 1 2.31-2.85V7.6a6.34 6.34 0 0 0-5.1 6.2 6.34 6.34 0 1 0 10.9-4.38v-3.7a8.16 8.16 0 0 0 4.31 1.25v-3.28a4.85 4.85 0 0 1-.03-.01z"/></svg>
      ),
    },
    {
      id: 'linkedin',
      label: 'LinkedIn',
      handle: null,
      url: reseaux.linkedin ? (reseaux.linkedin.startsWith('http') ? reseaux.linkedin : `https://linkedin.com/company/${reseaux.linkedin.replace(/^@/, '').trim()}`) : null,
      color: '#0A66C2',
      svg: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.88a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2Z"/></svg>
      ),
    },
    {
      id: 'youtube',
      label: 'YouTube',
      handle: null,
      url: reseaux.youtube ? (reseaux.youtube.startsWith('http') ? reseaux.youtube : `https://youtube.com/${reseaux.youtube.startsWith('@') ? reseaux.youtube.trim() : '@' + reseaux.youtube.trim()}`) : null,
      color: '#FF0000',
      svg: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
      ),
    },
    {
      id: 'twitter',
      label: 'X',
      handle: reseaux.twitter ? reseaux.twitter.replace(/^@/, '') : null,
      url: reseaux.twitter ? (reseaux.twitter.startsWith('http') ? reseaux.twitter : `https://x.com/${reseaux.twitter.replace(/^@/, '').trim()}`) : null,
      color: '#0F172A',
      svg: (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
      ),
    },
    {
      id: 'site_web',
      label: 'Site officiel',
      handle: null,
      url: (agence.site_web || reseaux.site_web) ? ((agence.site_web || reseaux.site_web)!.startsWith('http') ? (agence.site_web || reseaux.site_web)! : `https://${(agence.site_web || reseaux.site_web)!.trim()}`) : null,
      color: 'var(--navy, #1C2B4A)',
      svg: <Globe size={13} />,
    },
  ].filter((s) => Boolean(s.url));

  return (
    <div className="vitrine-banner-wrapper">
      {/* ── Bandeau d'Alerte / Événement spécial ── */}
      {bandeauActif && (
        <div
          style={{
            background: 'linear-gradient(90deg, #FEF3C7 0%, #FFFBEB 100%)',
            border: '1px solid #FDE68A',
            borderRadius: 12,
            padding: '10px 16px',
            marginBottom: 14,
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

      {/* ── Carte Héro Option 1 (Panoramique dégagée + Badge Statut + Logo Chevauchant) ── */}
      <div className="vitrine-hero-card">
        {/* Couverture Panoramique 100% Dégagée */}
        <div
          className="vitrine-hero-cover"
          style={{
            backgroundImage: coverImg
              ? `linear-gradient(180deg, rgba(15, 23, 42, 0.08) 0%, rgba(15, 23, 42, 0.45) 100%), url(${coverImg})`
              : 'linear-gradient(135deg, #1C2B4A 0%, #2A3F6D 100%)',
          }}
        >
          {/* Badge Statut Ouverture en Temps Réel (Glassmorphism) */}
          <div className="vitrine-badge-status">
            <span className={`vitrine-status-dot ${statut.ouvert ? 'open' : 'closed'}`} />
            <span>{statut.badgeText}</span>
          </div>
        </div>

        {/* Corps d'Informations & Logo Chevauchant */}
        <div className="vitrine-hero-body">
          {/* Logo Chevauchant */}
          <div className="vitrine-hero-logo-wrap">
            <div className="vitrine-hero-logo">
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
          </div>

          {/* En-tête Agence : Nom, Slogan, Agrément */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 className="vitrine-hero-title">
                {agence.nom}
              </h1>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11.5,
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: 6,
                  background: 'rgba(10, 92, 54, 0.1)',
                  color: 'var(--price, #0A5C36)',
                  border: '1px solid rgba(10, 92, 54, 0.2)',
                }}
              >
                <CheckCircle2 size={13} />
                Agence Partenaire
              </span>
            </div>

            {slogan && (
              <p className="vitrine-hero-slogan">
                « {slogan} »
              </p>
            )}

            {/* Chips d'Informations de Contact & Agrément */}
            <div className="vitrine-meta-chips-row">
              <span className="vitrine-meta-chip">
                <MapPin size={13} style={{ color: 'var(--accent, #C75B00)' }} />
                <span>{agence.quartier ? `${agence.quartier}, ${agence.ville}` : agence.ville}</span>
              </span>
              {agence.numero_agrement && (
                <span className="vitrine-meta-chip">
                  <ShieldCheck size={13} style={{ color: '#0284C7' }} />
                  <span>Agrément n° {agence.numero_agrement}</span>
                </span>
              )}
            </div>
          </div>

          {/* Description Commerciale */}
          {agence.description && (
            <p className="vitrine-hero-desc">
              {agence.description}
            </p>
          )}

          {/* ── Volet Interactif des Horaires d'Ouverture ── */}
          <div style={{ marginTop: 2 }}>
            <button
              type="button"
              onClick={() => setShowHoraires(!showHoraires)}
              className="vitrine-hours-bar"
              title="Consulter les horaires d'ouverture de l'agence"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0, flexWrap: 'wrap' }}>
                <Clock size={13} style={{ color: 'var(--accent, #C75B00)', flexShrink: 0 }} />
                <span className="vitrine-hours-text">
                  Aujourd&apos;hui : <strong>{statut.plageAujourdhui}</strong>
                </span>
                <span className={`vitrine-hours-pill ${statut.ouvert ? 'open' : 'closed'}`}>
                  {statut.ouvert ? 'Ouvert' : 'Fermé'}
                </span>
              </div>
              <div className="vitrine-hours-toggle">
                <span>7j/7</span>
                {showHoraires ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </div>
            </button>

            {/* Déroulé complet des 7 jours */}
            {showHoraires && (
              <div className="vitrine-hours-dropdown">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 6 }}>
                  {JOURS_SEMAINE_KEYS.map((j) => {
                    const isToday = j.key === statut.jourActuelKey;
                    const defaultVal =
                      j.key === 'dimanche' ? 'Fermé' : j.key === 'samedi' ? '09:00 - 13:00' : '08:30 - 18:30';
                    const val = (horaires && horaires[j.key]) ? horaires[j.key] : defaultVal;
                    const isFerme = val.toLowerCase().includes('fermé');

                    return (
                      <div
                        key={j.key}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '7px 12px',
                          borderRadius: 8,
                          background: isToday ? '#FFF7ED' : '#F8FAFC',
                          border: '1px solid',
                          borderColor: isToday ? '#FFEDD5' : '#F1F5F9',
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12.5,
                            fontWeight: isToday ? 800 : 600,
                            color: isToday ? 'var(--accent, #C75B00)' : '#334155',
                          }}
                        >
                          {j.label} {isToday && '•'}
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 750,
                            color: isFerme ? '#DC2626' : '#16A34A',
                          }}
                        >
                          {val}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── Actions & Coordonnées Agence ── */}
          <div className="vitrine-actions-wrapper">
            {/* Grille principale 2×2 */}
            <div className="vitrine-actions-primary-grid">
              {waNum && (
                <a
                  href={`https://wa.me/${waNum}?text=${encodeURIComponent(
                    `Bonjour ${agence.nom}, je visite votre vitrine Nopalou et souhaite me renseigner sur vos biens disponibles.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="vitrine-btn-base vitrine-btn-wa"
                  title="Contacter l'agence sur WhatsApp"
                >
                  <MessageCircle size={15} />
                  <span>WhatsApp Agence</span>
                </a>
              )}

              {agence.telephone && (
                <a
                  href={`tel:${agence.telephone.replace(/\s+/g, '')}`}
                  className="vitrine-btn-base vitrine-btn-phone"
                  title="Appeler l'agence"
                >
                  <Phone size={14} />
                  <span>{agence.telephone}</span>
                </a>
              )}

              <a
                href={`/agence/${agence.slug}`}
                className="vitrine-btn-base vitrine-btn-pro"
                title="Accéder à l'espace de gestion de l'agence"
              >
                <Building2 size={15} style={{ color: 'var(--accent, #C75B00)' }} />
                <span>Espace Agence</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  if (navigator.share) {
                    navigator
                      .share({
                        title: `${agence.nom} — Nopalou`,
                        url: window.location.href,
                      })
                      .catch(() => {});
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    showToast('Lien copié dans le presse-papier !', 'info', 'Partage Vitrine');
                  }
                }}
                className="vitrine-btn-base vitrine-btn-share"
                title="Partager la vitrine"
              >
                <Share2 size={14} />
                <span>Partager la vitrine</span>
              </button>
            </div>

            {/* ── Ligne dédiée : Réseaux Sociaux & Canaux Officiels ── */}
            {socialList.length > 0 && (
              <div className="vitrine-social-links-container">
                <span className="vitrine-social-label">
                  Réseaux :
                </span>
                {socialList.map((s) => (
                  <a
                    key={s.id}
                    href={s.url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`vitrine-social-pill vitrine-social-pill--${s.id}`}
                    title={`${s.label} de l'agence`}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', color: s.color }}>
                      {s.svg}
                    </span>
                    <span>
                      {s.handle ? `@${s.handle}` : s.label}
                    </span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
