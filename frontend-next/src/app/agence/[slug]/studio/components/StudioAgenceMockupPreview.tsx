'use client';

import React from 'react';
import {
  Smartphone,
  Video,
  Home,
  ShieldCheck,
  Phone,
  MessageCircle,
  MapPin,
  ExternalLink,
  Play,
  Bell
} from 'lucide-react';
import type { AgenceStudioConfig } from '../types';

interface StudioAgenceMockupPreviewProps {
  config: AgenceStudioConfig;
  agenceNom: string;
  agenceVille: string;
  agenceQuartier?: string;
}

export default function StudioAgenceMockupPreview({
  config,
  agenceNom,
  agenceVille,
  agenceQuartier,
}: StudioAgenceMockupPreviewProps) {
  const btnRadius =
    config.forme_boutons === 'arrondi' ? 20 : config.forme_boutons === 'squircle' ? 8 : 3;

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 14,
        border: '1px solid var(--border, #E8DDD2)',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 14,
        position: 'sticky',
        top: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
        <Smartphone size={16} style={{ color: config.couleur_accent }} />
        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
          Aperçu Smartphone en Direct
        </span>
      </div>

      {/* Cadre du Smartphone */}
      <div
        style={{
          width: 290,
          height: 560,
          background: '#0F172A',
          borderRadius: 36,
          padding: '10px 8px',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.35)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Encoche haut */}
        <div
          style={{
            width: 100,
            height: 14,
            background: '#0F172A',
            borderRadius: '0 0 10px 10px',
            position: 'absolute',
            top: 10,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
          }}
        />

        {/* Écran intérieur */}
        <div
          style={{
            background: config.couleur_fond || '#FFFFFF',
            borderRadius: 28,
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            fontSize: 11,
          }}
        >
          {/* ── Bannière de couverture ── */}
          <div
            style={{
              position: 'relative',
              height: 115,
              background: 'linear-gradient(135deg, #1C2B4A 0%, #2A3F6D 100%)',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {config.cover_url && (
              <img
                src={config.cover_url}
                alt="Bannière"
                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.65 }}
              />
            )}

            <div
              style={{
                position: 'absolute',
                inset: 0,
                padding: '24px 12px 10px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                color: '#FFFFFF',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    background: '#FFFFFF',
                    color: config.couleur_accent,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: 13,
                    flexShrink: 0,
                    overflow: 'hidden',
                  }}
                >
                  {config.logo_url ? (
                    <img src={config.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    agenceNom.charAt(0).toUpperCase()
                  )}
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {agenceNom}
                  </div>
                  <div style={{ fontSize: 9.5, opacity: 0.9 }}>
                    {agenceQuartier ? `${agenceQuartier}, ${agenceVille}` : agenceVille}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Slogan */}
          {config.slogan && (
            <div style={{ padding: '8px 12px 4px', fontSize: 10.5, color: '#475569', fontStyle: 'italic', textAlign: 'center' }}>
              « {config.slogan} »
            </div>
          )}

          {/* Bandeau d'alerte / annonce */}
          {config.bandeau_annonce_actif && config.bandeau_annonce && (
            <div
              style={{
                margin: '6px 10px',
                padding: '5px 8px',
                borderRadius: 6,
                background: '#FEF3C7',
                border: '1px solid #FDE68A',
                color: '#92400E',
                fontSize: 9.5,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Bell size={11} style={{ flexShrink: 0 }} />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {config.bandeau_annonce}
              </span>
            </div>
          )}

          {/* Boutons d'action rapides */}
          <div style={{ display: 'flex', gap: 6, padding: '8px 10px' }}>
            <div
              style={{
                flex: 1,
                padding: '6px 8px',
                borderRadius: btnRadius,
                background: '#16A34A',
                color: '#FFFFFF',
                fontSize: 10,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}
            >
              <MessageCircle size={11} />
              <span>WhatsApp</span>
            </div>
            <div
              style={{
                flex: 1,
                padding: '6px 8px',
                borderRadius: btnRadius,
                background: config.couleur_accent,
                color: '#FFFFFF',
                fontSize: 10,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}
            >
              <Phone size={11} />
              <span>Appeler</span>
            </div>
          </div>

          {/* ── Sections Dynamiques selon disposition_sections ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '4px 10px 16px' }}>
            {config.disposition_sections
              .filter((s) => s.visible)
              .map((sec) => {
                if (sec.id === 'reels') {
                  return (
                    <div key={sec.id} style={{ background: '#FAF8F5', borderRadius: 8, padding: 8, border: '1px solid #E8DDD2' }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: config.couleur_accent, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Video size={10} />
                        <span>Visites Virtuelles & Reels</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {[1, 2].map((i) => (
                          <div
                            key={i}
                            style={{
                              flex: 1,
                              height: 60,
                              borderRadius: 6,
                              background: '#0F172A',
                              position: 'relative',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#FFFFFF',
                            }}
                          >
                            <Play size={14} />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }

                if (sec.id === 'catalogue') {
                  return (
                    <div key={sec.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--navy, #1C2B4A)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Home size={10} />
                        <span>Biens Disponibles</span>
                      </div>
                      <div
                        style={{
                          background: '#FFFFFF',
                          borderRadius: 8,
                          border: '1px solid #E8DDD2',
                          padding: 8,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 4,
                        }}
                      >
                        <div style={{ height: 50, borderRadius: 4, background: '#CBD5E1' }} />
                        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                          Villa F5 Almadies
                        </div>
                        <div style={{ fontSize: 9.5, fontWeight: 900, color: config.couleur_accent }}>
                          1 200 000 FCFA / mois
                        </div>
                        <div
                          style={{
                            marginTop: 4,
                            padding: '4px',
                            borderRadius: btnRadius,
                            background: config.couleur_accent,
                            color: '#FFFFFF',
                            textAlign: 'center',
                            fontSize: 9,
                            fontWeight: 800,
                          }}
                        >
                          Demander une visite
                        </div>
                      </div>
                    </div>
                  );
                }

                if (sec.id === 'confiance') {
                  return (
                    <div
                      key={sec.id}
                      style={{
                        background: '#F0FDF4',
                        border: '1px solid #BBF7D0',
                        borderRadius: 8,
                        padding: 8,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <ShieldCheck size={14} style={{ color: '#166534', flexShrink: 0 }} />
                      <div style={{ fontSize: 9, color: '#166534', fontWeight: 700 }}>
                        Agence agréée & Transactions sécurisées
                      </div>
                    </div>
                  );
                }

                return null;
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
