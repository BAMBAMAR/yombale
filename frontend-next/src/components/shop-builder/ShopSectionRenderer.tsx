// frontend-next/src/components/shop-builder/ShopSectionRenderer.tsx
'use client';

import React from 'react';
import { ShoppingBag, Star, LayoutGrid, Sparkles, MessageCircle } from 'lucide-react';

export interface ShopLayoutSection {
  id: string;
  type: 'banner' | 'featured_products' | 'categories_grid' | 'testimonials' | 'rich_text';
  title?: string;
  content?: string;
  active: boolean;
}

interface ShopSectionRendererProps {
  sections?: ShopLayoutSection[];
  boutiqueNom: string;
  slogan?: string;
  bandeauPromo?: string;
  categories?: string[];
  produits?: any[];
  onSelectProduit?: (prod: any) => void;
}

export function ShopSectionRenderer({
  sections,
  boutiqueNom,
  slogan,
  bandeauPromo,
  categories = [],
  produits = [],
  onSelectProduit
}: ShopSectionRendererProps) {
  // Liste par défaut si aucune section personnalisée définie
  const defaultSections: ShopLayoutSection[] = [
    { id: 'sec_hero', type: 'banner', active: true },
    { id: 'sec_prods', type: 'featured_products', active: true },
    { id: 'sec_cats', type: 'categories_grid', active: true }
  ];
  const activeSections: ShopLayoutSection[] = (sections && sections.length > 0)
    ? sections.filter(s => s.active)
    : defaultSections;


  return (
    <div className="shop-dynamic-builder" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {activeSections.map((section) => {
        switch (section.type) {
          case 'banner':
            return (
              <div key={section.id} className="shop-banner-section" style={{
                background: 'linear-gradient(135deg, var(--navy, #1C2B4A) 0%, #29354d 100%)',
                color: '#ffffff',
                padding: '32px 24px',
                borderRadius: '16px',
                textAlign: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
              }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 8px 0', color: '#ffffff' }}>
                  {section.title || boutiqueNom}
                </h1>
                <p style={{ fontSize: '14px', margin: 0, opacity: 0.9, color: 'var(--border, #E8DDD2)' }}>
                  {section.content || slogan || 'Achetez au meilleur prix au Sénégal. Commandez sur WhatsApp.'}
                </p>
                {bandeauPromo && (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'var(--accent, #C75B00)',
                    color: '#ffffff',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 600,
                    marginTop: '16px'
                  }}>
                    <Sparkles size={14} />
                    {bandeauPromo}
                  </div>
                )}
              </div>
            );

          case 'featured_products':
            return (
              <div key={section.id} className="shop-products-section">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShoppingBag size={20} style={{ color: 'var(--accent, #C75B00)' }} />
                    <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--navy, #1C2B4A)' }}>
                      {section.title || 'Nos Produits Phares'}
                    </h2>
                  </div>
                </div>
                {produits.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13px', background: '#f8fafc', borderRadius: '12px' }}>
                    Aucun produit disponible pour le moment.
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                    gap: '16px'
                  }}>
                    {produits.slice(0, 8).map((prod) => (
                      <div
                        key={prod.id}
                        onClick={() => onSelectProduit && onSelectProduit(prod)}
                        style={{
                          background: '#ffffff',
                          border: '1px solid var(--border, #E8DDD2)',
                          borderRadius: '12px',
                          padding: '12px',
                          cursor: 'pointer',
                          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                        }}
                      >
                        <div style={{ width: '100%', height: '130px', borderRadius: '8px', overflow: 'hidden', background: '#f1f5f9', marginBottom: '8px' }}>
                          <img
                            src={prod.images?.[0] || prod.image_url || '/placeholder.png'}
                            alt={prod.nom}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy, #1C2B4A)', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {prod.nom}
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--price, #0A5C36)' }}>
                          {Number(prod.prix).toLocaleString('fr-FR')} FCFA
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );

          case 'categories_grid':
            return (
              <div key={section.id} className="shop-categories-section">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <LayoutGrid size={20} style={{ color: 'var(--accent, #C75B00)' }} />
                  <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--navy, #1C2B4A)' }}>
                    {section.title || 'Catégories Populaires'}
                  </h2>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {categories.map((cat, i) => (
                    <span key={i} style={{
                      background: 'var(--bg, #F8F5F0)',
                      border: '1px solid var(--border, #E8DDD2)',
                      color: 'var(--navy, #1C2B4A)',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      fontSize: '13px',
                      fontWeight: 600
                    }}>
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            );

          case 'testimonials':
            return (
              <div key={section.id} className="shop-testimonials-section" style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Star size={18} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
                  <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0, color: 'var(--navy, #1C2B4A)' }}>
                    {section.title || 'Avis Clients Vérifiés'}
                  </h3>
                </div>
                <p style={{ fontSize: '13px', color: '#475569', fontStyle: 'italic', margin: 0 }}>
                  "{section.content || 'Service rapide, livraison soignée et produits authentiques. Je recommande vivement cette boutique !'}"
                </p>
              </div>
            );

          case 'rich_text':
            return (
              <div key={section.id} className="shop-rich-text-section" style={{
                background: '#ffffff',
                border: '1px solid var(--border, #E8DDD2)',
                borderRadius: '12px',
                padding: '20px'
              }}>
                {section.title && (
                  <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 8px 0', color: 'var(--navy, #1C2B4A)' }}>
                    {section.title}
                  </h3>
                )}
                <div style={{ fontSize: '13px', color: '#334155', lineHeight: '1.6' }}>
                  {section.content || 'Présentation de notre boutique et de nos engagements envers nos clients.'}
                </div>
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
