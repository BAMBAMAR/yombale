'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  MapPin,
  ArrowRight,
  Star,
  CheckCircle2,
  Home,
  Key,
  ShieldCheck
} from 'lucide-react';
import { fcfa } from '@/lib/format';

interface FeaturedImmo {
  id: string;
  titre: string;
  prix: number | null;
  ville: string | null;
  quartier: string | null;
  type_bien: string | null;
  transaction: string | null;
  surface_m2: number | null;
  nb_chambres: number | null;
  photos: string[] | null;
  agence_nom?: string | null;
  agence_slug?: string | null;
  agence_sponsorisee?: boolean;
}

export default function HomeImmoShowcase() {
  const [biens, setBiens] = useState<FeaturedImmo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tous' | 'location' | 'vente'>('tous');

  useEffect(() => {
    let isMounted = true;
    async function loadFeatured() {
      try {
        setLoading(true);
        const res = await fetch('/api/immo?limit=6&tri=recent');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data)) {
            setBiens(data.slice(0, 6));
          }
        }
      } catch (err) {
        console.warn('[HOME_IMMO_SHOWCASE_ERR]', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadFeatured();
    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = biens.filter((b) => {
    if (activeTab === 'tous') return true;
    return b.transaction === activeTab;
  });

  return (
    <section
      aria-label="Sélection Immobilière Nopalou"
      style={{
        margin: '32px 0 24px',
        padding: '24px 20px',
        borderRadius: 16,
        background: 'linear-gradient(180deg, #F8F5F0 0%, #FFFFFF 100%)',
        border: '1.5px solid var(--border, #E8DDD2)',
      }}
    >
      {/* ── En-tête de la Section ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                background: 'var(--navy, #1C2B4A)',
                color: '#ffffff',
                fontSize: 11,
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: 6,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              <Building2 size={13} />
              <span>Immobilier Certifié</span>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12, color: 'var(--price, #0A5C36)', fontWeight: 700 }}>
              <ShieldCheck size={14} />
              <span>Agences Agréées</span>
            </span>
          </div>

          <h2
            style={{
              margin: '6px 0 4px',
              fontSize: '1.35rem',
              fontWeight: 850,
              color: 'var(--navy, #1C2B4A)',
              letterSpacing: '-0.02em',
            }}
          >
            Opportunités Immobilières & Agences Pro
          </h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B', maxWidth: 620 }}>
            Appartements, villas et locaux commerciaux gérés par des agences et professionnels vérifiés au Sénégal.
          </p>
        </div>

        {/* Lien tout voir */}
        <Link
          href="/immo"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '9px 16px',
            borderRadius: 10,
            background: 'var(--navy, #1C2B4A)',
            color: '#ffffff',
            fontSize: '0.84rem',
            fontWeight: 800,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(28,43,74,0.15)',
          }}
        >
          <span>Accéder au portail Immobilier</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* ── Filtres Rapides ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, overflowX: 'auto', paddingBottom: 4 }}>
        <button
          type="button"
          onClick={() => setActiveTab('tous')}
          style={{
            padding: '6px 14px',
            borderRadius: 20,
            fontSize: '0.8rem',
            fontWeight: 750,
            border: activeTab === 'tous' ? '1.5px solid var(--navy, #1C2B4A)' : '1px solid var(--border, #E8DDD2)',
            background: activeTab === 'tous' ? 'var(--navy, #1C2B4A)' : '#ffffff',
            color: activeTab === 'tous' ? '#ffffff' : 'var(--navy, #1C2B4A)',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Toutes les opportunités
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('location')}
          style={{
            padding: '6px 14px',
            borderRadius: 20,
            fontSize: '0.8rem',
            fontWeight: 750,
            border: activeTab === 'location' ? '1.5px solid var(--navy, #1C2B4A)' : '1px solid var(--border, #E8DDD2)',
            background: activeTab === 'location' ? 'var(--navy, #1C2B4A)' : '#ffffff',
            color: activeTab === 'location' ? '#ffffff' : 'var(--navy, #1C2B4A)',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          À Louer
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('vente')}
          style={{
            padding: '6px 14px',
            borderRadius: 20,
            fontSize: '0.8rem',
            fontWeight: 750,
            border: activeTab === 'vente' ? '1.5px solid var(--navy, #1C2B4A)' : '1px solid var(--border, #E8DDD2)',
            background: activeTab === 'vente' ? 'var(--navy, #1C2B4A)' : '#ffffff',
            color: activeTab === 'vente' ? '#ffffff' : 'var(--navy, #1C2B4A)',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          À Vendre
        </button>
        <Link
          href="/agences"
          style={{
            padding: '6px 14px',
            borderRadius: 20,
            fontSize: '0.8rem',
            fontWeight: 750,
            border: '1px solid var(--border, #E8DDD2)',
            background: '#ffffff',
            color: 'var(--accent, #C75B00)',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          Annuaire des Agences →
        </Link>
      </div>

      {/* ── Grille des Biens En Vedette ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '30px 0', color: '#64748B', fontSize: '0.85rem' }}>
          Chargement des opportunités immobilières...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px 0', color: '#64748B', fontSize: '0.85rem' }}>
          Aucun bien actuellement disponible dans cette sélection.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(270px, 100%), 1fr))',
            gap: 16,
          }}
        >
          {filtered.map((bien) => {
            const photoUrl = bien.photos && bien.photos.length > 0 ? bien.photos[0] : null;
            return (
              <Link
                key={bien.id}
                href={`/immo/${bien.id}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  background: '#ffffff',
                  borderRadius: 12,
                  border: '1.5px solid var(--border, #E8DDD2)',
                  overflow: 'hidden',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                }}
              >
                {/* Photo de couverture */}
                <div style={{ position: 'relative', width: '100%', height: 165, background: 'var(--navy, #1C2B4A)' }}>
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={bien.titre}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      loading="lazy"
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, #1C2B4A 0%, #2A3F6D 100%)',
                      }}
                    >
                      <Home size={36} style={{ color: 'rgba(255,255,255,0.4)' }} />
                    </div>
                  )}

                  {/* Badge Transaction */}
                  <span
                    style={{
                      position: 'absolute',
                      top: 10,
                      left: 10,
                      background: bien.transaction === 'vente' ? 'var(--navy, #1C2B4A)' : 'var(--accent, #C75B00)',
                      color: '#ffffff',
                      fontSize: 10.5,
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: 6,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {bien.transaction === 'vente' ? 'Vente' : 'Location'}
                  </span>

                  {/* Badge Agence En Vedette si applicable */}
                  {bien.agence_sponsorisee && (
                    <span
                      style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        background: '#F59E0B',
                        color: '#ffffff',
                        fontSize: 10,
                        fontWeight: 800,
                        padding: '3px 7px',
                        borderRadius: 6,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                      }}
                    >
                      <Star size={11} fill="#ffffff" />
                      <span>Pro</span>
                    </span>
                  )}
                </div>

                {/* Contenu de la Carte */}
                <div style={{ padding: '14px 14px 12px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  {/* Agence Émettrice */}
                  {bien.agence_nom && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                      <Building2 size={12} style={{ color: 'var(--accent, #C75B00)', flexShrink: 0 }} />
                      <span style={{ fontSize: 11, fontWeight: 750, color: 'var(--navy, #1C2B4A)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {bien.agence_nom}
                      </span>
                    </div>
                  )}

                  {/* Prix */}
                  <div style={{ fontSize: '1.05rem', fontWeight: 850, color: 'var(--price, #0A5C36)', marginBottom: 6 }}>
                    {fcfa(bien.prix)}
                    {bien.transaction === 'location' && <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}> /mois</span>}
                  </div>

                  {/* Titre */}
                  <h3
                    style={{
                      margin: '0 0 8px',
                      fontSize: '0.88rem',
                      fontWeight: 750,
                      color: 'var(--navy, #1C2B4A)',
                      lineHeight: 1.35,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      flex: 1,
                    }}
                  >
                    {bien.titre}
                  </h3>

                  {/* Localisation & Caractéristiques */}
                  <div
                    style={{
                      marginTop: 'auto',
                      paddingTop: 8,
                      borderTop: '1px solid #F1F5F9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: 11.5,
                      color: '#64748B',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <MapPin size={12} style={{ color: 'var(--accent, #C75B00)', flexShrink: 0 }} />
                      <span>{[bien.quartier, bien.ville].filter(Boolean).join(', ') || 'Sénégal'}</span>
                    </span>

                    {bien.surface_m2 && (
                      <span style={{ fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
                        {Math.round(bien.surface_m2)} m²
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
