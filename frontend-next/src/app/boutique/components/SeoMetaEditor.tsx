// frontend-next/src/app/boutique/components/SeoMetaEditor.tsx
'use client';

import React, { useMemo } from 'react';
import { Search, Globe, Sparkles, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

interface SeoMetaEditorProps {
  metaTitle: string;
  setMetaTitle: (val: string) => void;
  metaDescription: string;
  setMetaDescription: (val: string) => void;
  slug: string;
  setSlug: (val: string) => void;
  nomProduit: string;
  descriptionProduit: string;
  nomBoutique: string;
}

export function SeoMetaEditor({
  metaTitle,
  setMetaTitle,
  metaDescription,
  setMetaDescription,
  slug,
  setSlug,
  nomProduit,
  descriptionProduit,
  nomBoutique,
}: SeoMetaEditorProps) {
  // Titre effectif pour l'aperçu Google
  const effectiveTitle = useMemo(() => {
    if (metaTitle.trim()) return metaTitle.trim();
    if (nomProduit.trim()) return `${nomProduit.trim()} — ${nomBoutique || 'Nopalou'}`;
    return 'Titre de la page produit';
  }, [metaTitle, nomProduit, nomBoutique]);

  // Description effective pour l'aperçu Google
  const effectiveDescription = useMemo(() => {
    if (metaDescription.trim()) return metaDescription.trim();
    if (descriptionProduit.trim()) {
      return descriptionProduit.trim().substring(0, 155) + (descriptionProduit.length > 155 ? '...' : '');
    }
    return 'Description de la page produit pour les moteurs de recherche Google, Bing et réseaux sociaux.';
  }, [metaDescription, descriptionProduit]);

  // Slug effectif
  const effectiveSlug = useMemo(() => {
    if (slug.trim()) return slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (nomProduit.trim()) {
      return nomProduit
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    }
    return 'nom-produit-exemple';
  }, [slug, nomProduit]);

  // Génération automatique optimisée SEO
  const handleAutoGenerate = () => {
    const cleanNom = nomProduit.trim();
    const cleanBoutique = nomBoutique.trim();
    if (cleanNom) {
      setMetaTitle(`${cleanNom} au meilleur prix | ${cleanBoutique || 'Sénégal'}`);
    }
    if (descriptionProduit.trim()) {
      const excerpt = descriptionProduit.trim().replace(/\s+/g, ' ').substring(0, 140);
      setMetaDescription(`Achetez ${cleanNom} sur WhatsApp et web. ${excerpt}... Livraison rapide à Dakar et dans tout le Sénégal.`);
    }
    if (cleanNom) {
      const generatedSlug = cleanNom
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      setSlug(generatedSlug);
    }
  };

  const titleLength = metaTitle.length;
  const descLength = metaDescription.length;

  return (
    <div className="seo-editor-container" style={{
      background: 'var(--card, #ffffff)',
      border: '1px solid var(--border, #E8DDD2)',
      borderRadius: '12px',
      padding: '20px',
      marginTop: '16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Search size={18} style={{ color: 'var(--accent, #C75B00)' }} />
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--navy, #1C2B4A)' }}>
            Référencement SEO & Optimisation Google
          </h3>
        </div>
        <button
          type="button"
          onClick={handleAutoGenerate}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--orange2, #fff7ed)',
            color: 'var(--accent, #C75B00)',
            border: '1px solid var(--accent, #C75B00)',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Sparkles size={14} />
          Générer avec l'IA SEO
        </button>
      </div>

      {/* Aperçu Google (Google SERP Card) */}
      <div style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '14px',
        marginBottom: '20px',
      }}>
        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Globe size={12} />
          https://nopalou.com/boutiques/{nomBoutique.toLowerCase() || 'boutique'}/{effectiveSlug}
        </div>
        <div style={{ fontSize: '16px', fontWeight: 600, color: '#1a0dab', lineHeight: '1.3', marginBottom: '4px' }}>
          {effectiveTitle}
        </div>
        <div style={{ fontSize: '13px', color: '#4d5156', lineHeight: '1.4' }}>
          {effectiveDescription}
        </div>
      </div>

      {/* Formulaire Meta Title */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--navy, #1C2B4A)' }}>
            Méta-Titre Google (Title Tag)
          </label>
          <span style={{
            fontSize: '11px',
            color: titleLength > 60 ? '#dc2626' : titleLength >= 40 ? '#16a34a' : '#64748b',
            fontWeight: 600
          }}>
            {titleLength} / 60 caractères
          </span>
        </div>
        <input
          type="text"
          value={metaTitle}
          onChange={(e) => setMetaTitle(e.target.value)}
          placeholder={`${nomProduit || 'Titre produit'} | ${nomBoutique || 'Nom Boutique'}`}
          maxLength={150}
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: '13px',
            borderRadius: '6px',
            border: '1px solid var(--border, #E8DDD2)',
            outline: 'none',
          }}
        />
      </div>

      {/* Formulaire Meta Description */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--navy, #1C2B4A)' }}>
            Méta-Description Google
          </label>
          <span style={{
            fontSize: '11px',
            color: descLength > 160 ? '#dc2626' : descLength >= 120 ? '#16a34a' : '#64748b',
            fontWeight: 600
          }}>
            {descLength} / 160 caractères
          </span>
        </div>
        <textarea
          value={metaDescription}
          onChange={(e) => setMetaDescription(e.target.value)}
          placeholder="Rédigez un résumé attrayant incitant au clic sur Google..."
          rows={3}
          maxLength={300}
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: '13px',
            borderRadius: '6px',
            border: '1px solid var(--border, #E8DDD2)',
            outline: 'none',
            resize: 'vertical',
          }}
        />
      </div>

      {/* Formulaire Slug URL */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--navy, #1C2B4A)' }}>
            Permalien / Slug URL
          </label>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#64748b' }}>/produits/</span>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
            placeholder={effectiveSlug}
            style={{
              flex: 1,
              padding: '8px 12px',
              fontSize: '13px',
              borderRadius: '6px',
              border: '1px solid var(--border, #E8DDD2)',
              outline: 'none',
            }}
          />
        </div>
      </div>
    </div>
  );
}
