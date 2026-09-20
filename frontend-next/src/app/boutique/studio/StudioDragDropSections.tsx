// frontend-next/src/app/boutique/studio/StudioDragDropSections.tsx
'use client';

import React, { useState } from 'react';
import { Layout, MoveUp, MoveDown, Eye, EyeOff, Save, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import type { ShopLayoutSection } from '@/components/shop-builder/ShopSectionRenderer';

interface StudioDragDropSectionsProps {
  boutiqueId: string;
  initialSections?: ShopLayoutSection[];
  onSave?: (sections: ShopLayoutSection[]) => void;
}

export function StudioDragDropSections({ boutiqueId, initialSections, onSave }: StudioDragDropSectionsProps) {
  const [sections, setSections] = useState<ShopLayoutSection[]>(
    (initialSections && initialSections.length > 0)
      ? initialSections
      : [
          { id: 'sec_1', type: 'banner', title: 'Bannière Principale', active: true },
          { id: 'sec_2', type: 'featured_products', title: 'Produits Phares', active: true },
          { id: 'sec_3', type: 'categories_grid', title: 'Nos Catégories', active: true },
          { id: 'sec_4', type: 'testimonials', title: 'Avis Clients', active: true }
        ]
  );
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= sections.length) return;

    const copy = [...sections];
    const [moved] = copy.splice(index, 1);
    copy.splice(newIdx, 0, moved);
    setSections(copy);
  };

  const handleToggleActive = (index: number) => {
    setSections(
      sections.map((s, i) => (i === index ? { ...s, active: !s.active } : s))
    );
  };

  const handleUpdateTitle = (index: number, title: string) => {
    setSections(
      sections.map((s, i) => (i === index ? { ...s, title } : s))
    );
  };

  const handleUpdateContent = (index: number, content: string) => {
    setSections(
      sections.map((s, i) => (i === index ? { ...s, content } : s))
    );
  };

  const handleRemove = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const handleAddSection = (type: ShopLayoutSection['type']) => {
    const labels: Record<string, string> = {
      banner: 'Bannière Spéciale',
      featured_products: 'Sélection Exclusive',
      categories_grid: 'Nos Familles',
      testimonials: 'Témoignages Clients',
      rich_text: 'Présentation de la Marque'
    };
    const newSec: ShopLayoutSection = {
      id: `sec_${Date.now()}`,
      type,
      title: labels[type] || 'Nouvelle Section',
      active: true
    };
    setSections([...sections, newSec]);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/boutiques/${boutiqueId}/layout-sections`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layout_sections: sections })
      });
      if (res.ok) {
        setSuccessMsg('Disposition des sections de la boutique enregistrée.');
        if (onSave) onSave(sections);
      }
    } catch (err) {
      console.error('Erreur enregistrement disposition:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="studio-sections-builder" style={{
      background: 'var(--card, #ffffff)',
      border: '1px solid var(--border, #E8DDD2)',
      borderRadius: '12px',
      padding: '24px',
      marginTop: '16px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Layout size={22} style={{ color: 'var(--accent, #C75B00)' }} />
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--navy, #1C2B4A)' }}>
              Éditeur de Sections & Agencement Visuel
            </h3>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
              Réorganisez l'ordre des modules de votre boutique en direct
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--accent, #C75B00)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <Save size={15} />
          {isSaving ? 'Enregistrement...' : 'Sauvegarder l\'agencement'}
        </button>
      </div>

      {successMsg && (
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          color: '#166534',
          padding: '10px 14px',
          borderRadius: '8px',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '20px'
        }}>
          <CheckCircle2 size={16} />
          {successMsg}
        </div>
      )}

      {/* Liste des sections réordonnables */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
        {sections.map((sec, idx) => (
          <div key={sec.id} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: sec.active ? '#ffffff' : '#f8fafc',
            border: '1px solid var(--border, #E8DDD2)',
            borderRadius: '8px',
            padding: '12px 16px',
            opacity: sec.active ? 1 : 0.6
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => handleMove(idx, 'up')}
                  disabled={idx === 0}
                  style={{ background: 'none', border: 'none', cursor: idx === 0 ? 'default' : 'pointer', color: idx === 0 ? '#cbd5e1' : '#64748b' }}
                >
                  <MoveUp size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleMove(idx, 'down')}
                  disabled={idx === sections.length - 1}
                  style={{ background: 'none', border: 'none', cursor: idx === sections.length - 1 ? 'default' : 'pointer', color: idx === sections.length - 1 ? '#cbd5e1' : '#64748b' }}
                >
                  <MoveDown size={14} />
                </button>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="text"
                    value={sec.title || ''}
                    onChange={(e) => handleUpdateTitle(idx, e.target.value)}
                    placeholder="Titre de la section"
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--navy, #1C2B4A)',
                      border: '1px solid #e2e8f0',
                      background: '#ffffff',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      width: '100%',
                      maxWidth: '280px'
                    }}
                  />
                  <span style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap' }}>
                    Type : {sec.type}
                  </span>
                </div>

                {['banner', 'testimonials', 'rich_text'].includes(sec.type) && (
                  <div style={{ marginTop: '6px' }}>
                    <input
                      type="text"
                      value={sec.content || ''}
                      onChange={(e) => handleUpdateContent(idx, e.target.value)}
                      placeholder={
                        sec.type === 'banner'
                          ? 'Texte d\'accroche (ex: Livraison gratuite dès 25 000 FCFA)'
                          : sec.type === 'testimonials'
                          ? 'Citation client (ex: Service rapide et soigné)'
                          : 'Contenu du paragraphe ou présentation'
                      }
                      style={{
                        fontSize: '12px',
                        color: '#475569',
                        border: '1px solid #e2e8f0',
                        background: '#ffffff',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        width: '100%',
                        maxWidth: '420px'
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                type="button"
                onClick={() => handleToggleActive(idx)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: sec.active ? '#f0fdf4' : '#f1f5f9',
                  color: sec.active ? '#166534' : '#64748b',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {sec.active ? <Eye size={14} /> : <EyeOff size={14} />}
                {sec.active ? 'Visible' : 'Masqué'}
              </button>

              {sections.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '4px' }}
                  title="Supprimer la section"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Boutons d'ajout de section */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => handleAddSection('banner')}
          style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
        >
          <Plus size={14} /> Bannière
        </button>
        <button
          type="button"
          onClick={() => handleAddSection('featured_products')}
          style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
        >
          <Plus size={14} /> Produits Phares
        </button>
        <button
          type="button"
          onClick={() => handleAddSection('categories_grid')}
          style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
        >
          <Plus size={14} /> Grille Catégories
        </button>
        <button
          type="button"
          onClick={() => handleAddSection('testimonials')}
          style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
        >
          <Plus size={14} /> Avis Clients
        </button>
        <button
          type="button"
          onClick={() => handleAddSection('rich_text')}
          style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
        >
          <Plus size={14} /> Bloc Texte Libre
        </button>
      </div>
    </div>
  );
}
