'use client';

import React from 'react';
import Link from 'next/link';
import { Home, MapPin, MessageCircle } from 'lucide-react';
import { AgenceData } from './VitrineBanner';

export interface BienItem {
  id: string;
  reference: string;
  titre: string;
  type_bien: string;
  ville: string;
  quartier?: string;
  surface_m2?: number;
  nb_pieces?: number;
  nb_chambres?: number;
  prix_location?: number;
  prix_vente?: number;
  meuble: boolean;
  photos?: string[];
  annonce_publiee_id?: string;
}

interface VitrineBiensGridProps {
  biens: BienItem[];
  agence: AgenceData | null;
  waNum: string;
}

export default function VitrineBiensGrid({ biens, agence, waNum }: VitrineBiensGridProps) {
  if (biens.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', background: '#FFFFFF', borderRadius: 12, border: '1px solid var(--border, #E8DDD2)' }}>
        <Home size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
        <p style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)', fontSize: 16 }}>Aucun bien disponible pour ces critères</p>
        <p style={{ fontSize: 13.5, color: '#64748B' }}>Modifiez vos filtres ou contactez l&apos;agence directement pour une recherche sur mesure.</p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: 20,
      }}
    >
      {biens.map((b) => {
        const isLoc = !!b.prix_location;
        const prix = isLoc
          ? `${Number(b.prix_location).toLocaleString('fr-FR')} FCFA / mois`
          : `${Number(b.prix_vente || 0).toLocaleString('fr-FR')} FCFA`;

        return (
          <div
            key={b.id}
            style={{
              background: '#FFFFFF',
              borderRadius: 12,
              border: '1px solid var(--border, #E8DDD2)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    padding: '3px 8px',
                    borderRadius: 4,
                    background: isLoc ? '#E0F2FE' : '#FFEDD5',
                    color: isLoc ? '#0369A1' : '#9A3412',
                  }}
                >
                  {isLoc ? 'Location' : 'Vente'}
                </span>
                <span style={{ fontSize: 11.5, color: '#64748B', textTransform: 'capitalize' }}>
                  {b.type_bien}
                </span>
              </div>

              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: '0 0 8px', lineHeight: 1.4 }}>
                {b.titre}
              </h3>

              <div style={{ fontSize: 12.5, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12 }}>
                <MapPin size={13} />
                {b.quartier ? `${b.quartier}, ${b.ville}` : b.ville}
              </div>

              <div style={{ fontSize: 13, color: '#475569', display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                {b.surface_m2 && <span>{b.surface_m2} m²</span>}
                {b.nb_chambres && <span>{b.nb_chambres} ch.</span>}
                {b.meuble && <span style={{ color: 'var(--accent, #C75B00)', fontWeight: 600 }}>Meublé</span>}
              </div>

              <div style={{ fontSize: 17, fontWeight: 900, color: 'var(--accent, #C75B00)' }}>
                {prix}
              </div>
            </div>

            <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border, #E8DDD2)', background: '#FAF8F5', display: 'flex', gap: 8 }}>
              <Link
                href={`/immo/${b.annonce_publiee_id || b.id}`}
                target="_blank"
                style={{
                  flex: 1,
                  textAlign: 'center',
                  padding: '8px',
                  borderRadius: 6,
                  background: 'var(--navy, #1C2B4A)',
                  color: '#FFFFFF',
                  fontSize: 12.5,
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                Voir l&apos;annonce
              </Link>
              {waNum && (
                <a
                  href={`https://wa.me/${waNum}?text=${encodeURIComponent(
                    `Bonjour ${agence?.nom}, je suis intéressé(e) par votre bien : ${b.titre} (${prix}). Pouvons-nous échanger ?`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px 12px',
                    borderRadius: 6,
                    background: '#16a34a',
                    color: '#FFFFFF',
                  }}
                  title="Demande WhatsApp"
                >
                  <MessageCircle size={15} />
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
