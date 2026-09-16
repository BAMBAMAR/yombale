'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import VitrineBanner, { AgenceData } from './components/VitrineBanner';
import VitrineVideoReels from './components/VitrineVideoReels';
import VitrineBiensGrid, { BienItem } from './components/VitrineBiensGrid';

export default function AgenceVitrinePubliquePage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [agence, setAgence] = useState<AgenceData | null>(null);
  const [biens, setBiens] = useState<BienItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOp, setFilterOp] = useState<'tous' | 'location' | 'vente'>('tous');
  const [filterType, setFilterType] = useState('tous');

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

  const biensFiltres = biens.filter((b) => {
    if (filterOp === 'location' && !b.prix_location) return false;
    if (filterOp === 'vente' && !b.prix_vente) return false;
    if (filterType !== 'tous' && b.type_bien !== filterType) return false;
    return true;
  });

  const waNum = (agence?.whatsapp || agence?.telephone || '').replace(/[^0-9]/g, '');

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: '#64748B' }}>
        <p>Chargement de la vitrine de l&apos;agence...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1140, margin: '0 auto', padding: '20px 16px 60px' }}>
      {/* ── Bannière / Identité de l'Agence ── */}
      <VitrineBanner agence={agence} waNum={waNum} />

      {/* ── Section Visites Virtuelles & Reels ── */}
      <VitrineVideoReels agence={agence} />

      {/* ── Filtres de la Vitrine ── */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'center',
          marginBottom: 24,
          padding: '12px 16px',
          background: '#FFFFFF',
          borderRadius: 10,
          border: '1px solid var(--border, #E8DDD2)',
        }}
      >
        <div style={{ display: 'flex', gap: 8 }}>
          {(['tous', 'location', 'vente'] as const).map((op) => (
            <button
              key={op}
              type="button"
              onClick={() => setFilterOp(op)}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
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
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          aria-label="Filtrer par type de bien"
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px solid var(--border, #E8DDD2)',
            fontSize: 13,
            color: 'var(--navy, #1C2B4A)',
            marginLeft: 'auto',
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

      {/* ── Grille des Biens ── */}
      <VitrineBiensGrid biens={biensFiltres} agence={agence} waNum={waNum} />
    </div>
  );
}
