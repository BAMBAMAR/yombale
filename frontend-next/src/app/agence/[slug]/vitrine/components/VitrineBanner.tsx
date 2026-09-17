'use client';

import React, { useState } from 'react';
import {
  MapPin,
  Phone,
  MessageCircle,
  Globe,
  Share2,
  Video,
  Camera,
  Music,
  Building2,
  Clock,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { showToast } from '@/context/ToastContext';

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

const JOURS_SEMAINE_KEYS = [
  { key: 'lundi', label: 'Lundi' },
  { key: 'mardi', label: 'Mardi' },
  { key: 'mercredi', label: 'Mercredi' },
  { key: 'jeudi', label: 'Jeudi' },
  { key: 'vendredi', label: 'Vendredi' },
  { key: 'samedi', label: 'Samedi' },
  { key: 'dimanche', label: 'Dimanche' },
] as const;

export function calculerStatutAgence(horaires?: Record<string, string>): {
  ouvert: boolean;
  label: string;
  badgeText: string;
  plageAujourdhui: string;
  jourActuelKey: string;
} {
  const JOURS_ORDRE = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const now = new Date();
  const jourActuelKey = JOURS_ORDRE[now.getDay()];
  const defaultPlage =
    jourActuelKey === 'dimanche'
      ? 'Fermé'
      : jourActuelKey === 'samedi'
      ? '09:00 - 13:00'
      : '08:30 - 18:30';

  const plage = (horaires && horaires[jourActuelKey]) ? horaires[jourActuelKey] : defaultPlage;

  if (!plage || plage.toLowerCase().includes('fermé')) {
    return {
      ouvert: false,
      label: 'Fermé actuellement',
      badgeText: 'Fermé',
      plageAujourdhui: 'Fermé',
      jourActuelKey,
    };
  }

  const match = plage.match(/(\d{1,2})[:h](\d{2})?\s*-\s*(\d{1,2})[:h](\d{2})?/);
  if (match) {
    const debutH = parseInt(match[1], 10);
    const debutM = match[2] ? parseInt(match[2], 10) : 0;
    const finH = parseInt(match[3], 10);
    const finM = match[4] ? parseInt(match[4], 10) : 0;

    const minutesNow = now.getHours() * 60 + now.getMinutes();
    const minutesDebut = debutH * 60 + debutM;
    const minutesFin = finH * 60 + finM;

    if (minutesNow >= minutesDebut && minutesNow < minutesFin) {
      const heureFinStr = finM > 0 ? `${finH}h${String(finM).padStart(2, '0')}` : `${finH}h`;
      return {
        ouvert: true,
        label: `Ouvert jusqu'à ${heureFinStr}`,
        badgeText: `Ouvert • Ferme à ${heureFinStr}`,
        plageAujourdhui: plage,
        jourActuelKey,
      };
    } else if (minutesNow < minutesDebut) {
      const heureDebStr = debutM > 0 ? `${debutH}h${String(debutM).padStart(2, '0')}` : `${debutH}h`;
      return {
        ouvert: false,
        label: `Fermé (Ouvre à ${heureDebStr})`,
        badgeText: `Fermé • Ouvre à ${heureDebStr}`,
        plageAujourdhui: plage,
        jourActuelKey,
      };
    } else {
      return {
        ouvert: false,
        label: 'Fermé pour la journée',
        badgeText: 'Fermé',
        plageAujourdhui: plage,
        jourActuelKey,
      };
    }
  }

  return {
    ouvert: true,
    label: 'Ouvert',
    badgeText: 'Ouvert',
    plageAujourdhui: plage,
    jourActuelKey,
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

  const statut = calculerStatutAgence(horaires);

  return (
    <div style={{ marginBottom: 26 }}>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <Clock size={15} style={{ color: 'var(--accent, #C75B00)', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: 'var(--navy, #1C2B4A)' }}>
                  Aujourd&apos;hui : <strong>{statut.plageAujourdhui}</strong>
                </span>
                <span className={`vitrine-hours-pill ${statut.ouvert ? 'open' : 'closed'}`}>
                  {statut.ouvert ? 'Ouvert' : 'Fermé'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#64748B', fontWeight: 700, flexShrink: 0 }}>
                <span>Horaires 7j/7</span>
                {showHoraires ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
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

            {/* Ligne secondaire : Site web officiel & Réseaux sociaux */}
            {(agence.site_web ||
              agence.parametres?.reseaux_sociaux?.instagram ||
              agence.parametres?.reseaux_sociaux?.tiktok ||
              agence.parametres?.reseaux_sociaux?.youtube) && (
              <div className="vitrine-actions-links-row">
                {agence.site_web && (
                  <a
                    href={agence.site_web.startsWith('http') ? agence.site_web : `https://${agence.site_web}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="vitrine-btn-base vitrine-btn-site"
                    title="Visiter le site officiel de l'agence"
                  >
                    <Globe size={13} />
                    <span>Site officiel</span>
                  </a>
                )}

                {agence.parametres?.reseaux_sociaux?.instagram && (
                  <a
                    href={`https://instagram.com/${agence.parametres.reseaux_sociaux.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    title="Instagram de l'agence"
                    className="vitrine-social-icon-btn"
                  >
                    <Camera size={15} />
                  </a>
                )}

                {agence.parametres?.reseaux_sociaux?.tiktok && (
                  <a
                    href={`https://tiktok.com/@${agence.parametres.reseaux_sociaux.tiktok.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="TikTok"
                    title="TikTok de l'agence"
                    className="vitrine-social-icon-btn"
                  >
                    <Music size={15} />
                  </a>
                )}

                {agence.parametres?.reseaux_sociaux?.youtube && (
                  <a
                    href={
                      agence.parametres.reseaux_sociaux.youtube.startsWith('http')
                        ? agence.parametres.reseaux_sociaux.youtube
                        : `https://youtube.com/${agence.parametres.reseaux_sociaux.youtube}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="YouTube"
                    title="Chaîne YouTube de l'agence"
                    className="vitrine-social-icon-btn"
                  >
                    <Video size={15} />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
