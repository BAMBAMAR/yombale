'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal, Home } from 'lucide-react';
import VitrineBanner, { AgenceData } from './components/VitrineBanner';
import VitrineVideoReels from './components/VitrineVideoReels';
import VitrineBiensGrid, { BienItem } from './components/VitrineBiensGrid';
import ModalDemandeVisiteVitrine from './components/ModalDemandeVisiteVitrine';
import ModalLecteurVideoImmo from './components/ModalLecteurVideoImmo';

function VitrinePubliqueContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params?.slug as string;

  const [agence, setAgence] = useState<AgenceData | null>(null);
  const [biens, setBiens] = useState<BienItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtres
  const [filterOp, setFilterOp] = useState<'tous' | 'location' | 'vente'>('tous');
  const [filterType, setFilterType] = useState('tous');
  const [searchQuery, setSearchQuery] = useState('');

  // Modales interactives
  const [activeVideoPost, setActiveVideoPost] = useState<any | null>(null);
  const [activeBienForVisite, setActiveBienForVisite] = useState<BienItem | null>(null);

  async function chargerVitrine() {
    try {
      setLoading(true);
      const [resAgence, resBiens] = await Promise.all([
        fetch(`/api/agences/public/${slug}`),
        fetch(`/api/biens/public/agence/${slug}`),
      ]);
      const dataAgence = await resAgence.json();
      const dataBiens = await resBiens.json();

      if (dataAgence.success) setAgence(dataAgence.agence);
      if (dataBiens.success) setBiens(dataBiens.biens || []);
    } catch (err) {
      console.error('[LOAD_VITRINE_ERR]', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (slug) chargerVitrine();
  }, [slug]);

  const socialPosts = useMemo(() => {
    return (agence?.parametres as any)?.social_posts || [];
  }, [agence]);

  const visibleSocialPosts = useMemo(() => {
    return socialPosts.filter((p: any) => p.visible);
  }, [socialPosts]);

  // Gestion des Deep Links (?bien=ID ou ?video=ID / ?post=ID)
  useEffect(() => {
    if (!loading && biens.length > 0) {
      const bienIdParam = searchParams.get('bien');
      if (bienIdParam) {
        const found = biens.find((b) => b.id === bienIdParam || b.reference === bienIdParam);
        if (found) {
          setActiveBienForVisite(found);
        }
      }
    }

    if (!loading && visibleSocialPosts.length > 0) {
      const videoParam = searchParams.get('video') || searchParams.get('post');
      if (videoParam) {
        const foundPost = visibleSocialPosts.find(
          (p: any) => p.id === videoParam || p.external_post_id === videoParam
        );
        if (foundPost) {
          setActiveVideoPost(foundPost);
        }
      }
    }
  }, [loading, biens, visibleSocialPosts, searchParams]);

  // Filtrage des biens
  const biensFiltres = useMemo(() => {
    return biens.filter((b) => {
      if (filterOp === 'location' && !b.prix_location) return false;
      if (filterOp === 'vente' && !b.prix_vente) return false;
      if (filterType !== 'tous' && b.type_bien !== filterType) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitre = b.titre?.toLowerCase().includes(q);
        const inQuartier = b.quartier?.toLowerCase().includes(q);
        const inVille = b.ville?.toLowerCase().includes(q);
        const inRef = b.reference?.toLowerCase().includes(q);
        if (!inTitre && !inQuartier && !inVille && !inRef) return false;
      }
      return true;
    });
  }, [biens, filterOp, filterType, searchQuery]);

  const waNum = (agence?.whatsapp || agence?.telephone || '').replace(/[^0-9]/g, '');

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: '#64748B' }}>
        <p style={{ fontWeight: 600 }}>Chargement de la vitrine de l&apos;agence...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1140, margin: '0 auto', padding: '20px 16px 60px' }}>
      {/* ── Bannière / Identité de l'Agence ── */}
      <VitrineBanner agence={agence} waNum={waNum} />

      {/* ── Section Visites Virtuelles & Reels ── */}
      <VitrineVideoReels
        agence={agence}
        onOpenPost={(post) => setActiveVideoPost(post)}
      />

      {/* ── Barre de Filtres & Recherche Dynamique ── */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
          padding: '12px 16px',
          background: '#FFFFFF',
          borderRadius: 12,
          border: '1px solid var(--border, #E8DDD2)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {(['tous', 'location', 'vente'] as const).map((op) => (
            <button
              key={op}
              type="button"
              onClick={() => setFilterOp(op)}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                border: 'none',
                background: filterOp === op ? 'var(--navy, #1C2B4A)' : '#F1F5F9',
                color: filterOp === op ? '#FFFFFF' : '#475569',
                cursor: 'pointer',
              }}
            >
              {op === 'tous' ? 'Tous les biens' : op === 'location' ? 'Location' : 'Vente'}
            </button>
          ))}

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            aria-label="Filtrer par type de bien"
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid var(--border, #E8DDD2)',
              fontSize: 13,
              color: 'var(--navy, #1C2B4A)',
              background: '#FFFFFF',
              outline: 'none',
            }}
          >
            <option value="tous">Toutes les typologies</option>
            <option value="appartement">Appartements</option>
            <option value="villa">Villas</option>
            <option value="studio">Studios</option>
            <option value="terrain">Terrains</option>
            <option value="bureau">Bureaux</option>
          </select>
        </div>

        {/* Champ de recherche rapide */}
        <div style={{ position: 'relative', minWidth: 220, flex: '1 1 220px', maxWidth: 320 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Rechercher (quartier, titre...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '7px 12px 7px 32px',
              borderRadius: 8,
              border: '1px solid var(--border, #E8DDD2)',
              fontSize: 12.5,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* ── Grille des Biens ── */}
      <VitrineBiensGrid
        biens={biensFiltres}
        agence={agence}
        waNum={waNum}
        socialPosts={visibleSocialPosts}
        onRequestVisite={(bien) => setActiveBienForVisite(bien)}
        onOpenVideo={(post) => setActiveVideoPost(post)}
      />

      {/* ── Modale Lecteur Vidéo In-App ── */}
      {activeVideoPost && (
        <ModalLecteurVideoImmo
          post={activeVideoPost}
          posts={visibleSocialPosts}
          onClose={() => setActiveVideoPost(null)}
          onSelectPost={(p) => setActiveVideoPost(p)}
          onRequestVisite={(linkedBien) => {
            setActiveVideoPost(null);
            const found = biens.find((b) => b.id === linkedBien.id);
            if (found) {
              setActiveBienForVisite(found);
            } else {
              // Si le bien n'est pas directement dans le tableau biens, on adapte la structure
              setActiveBienForVisite({
                id: linkedBien.id,
                reference: '',
                titre: linkedBien.titre,
                type_bien: 'bien immobilier',
                ville: 'Dakar',
                quartier: linkedBien.quartier,
                prix_location: linkedBien.type_operation === 'location' ? linkedBien.prix : undefined,
                prix_vente: linkedBien.type_operation === 'vente' ? linkedBien.prix : undefined,
                meuble: false,
                photos: linkedBien.image_url ? [linkedBien.image_url] : [],
              });
            }
          }}
        />
      )}

      {/* ── Modale Demande de Visite & Contact CRM ── */}
      {activeBienForVisite && (
        <ModalDemandeVisiteVitrine
          bien={activeBienForVisite}
          agence={agence}
          waNum={waNum}
          onClose={() => setActiveBienForVisite(null)}
        />
      )}
    </div>
  );
}

export default function AgenceVitrinePubliquePage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: 80, color: '#64748B' }}>Chargement...</div>}>
      <VitrinePubliqueContent />
    </Suspense>
  );
}
