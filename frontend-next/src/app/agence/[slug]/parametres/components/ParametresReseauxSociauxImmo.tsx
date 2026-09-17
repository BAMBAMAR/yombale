'use client';

import React from 'react';
import { Share2, Globe, Link2 } from 'lucide-react';

export interface ReseauxSociauxMap {
  instagram?: string;
  tiktok?: string;
  facebook?: string;
  whatsapp?: string;
  linkedin?: string;
  youtube?: string;
  twitter?: string;
  site_web?: string;
}

interface ParametresReseauxSociauxImmoProps {
  reseaux?: ReseauxSociauxMap;
  onChange: (reseaux: ReseauxSociauxMap) => void;
}

export default function ParametresReseauxSociauxImmo({
  reseaux = {},
  onChange,
}: ParametresReseauxSociauxImmoProps) {
  const handleChange = (key: keyof ReseauxSociauxMap, value: string) => {
    onChange({
      ...reseaux,
      [key]: value,
    });
  };

  return (
    <div className="agence-card">
      <div className="agence-card-header">
        <div className="agence-card-title">
          <Share2 size={18} />
          Réseaux Sociaux &amp; Liens Officiels
        </div>
      </div>

      <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 16px' }}>
        Ces liens s&apos;affichent fièrement sur votre vitrine publique pour permettre à vos clients de suivre vos actualités, visites vidéo et annonces.
      </p>

      <div className="form-grid-2">
        <div className="form-group">
          <label className="form-label">Instagram (@pseudo ou lien)</label>
          <input
            type="text"
            placeholder="Ex: @mon_agence ou https://instagram.com/..."
            value={reseaux.instagram || ''}
            onChange={(e) => handleChange('instagram', e.target.value)}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Facebook (Lien de la page)</label>
          <input
            type="text"
            placeholder="Ex: https://facebook.com/monagence"
            value={reseaux.facebook || ''}
            onChange={(e) => handleChange('facebook', e.target.value)}
            className="form-input"
          />
        </div>
      </div>

      <div className="form-grid-2">
        <div className="form-group">
          <label className="form-label">TikTok (@pseudo ou lien)</label>
          <input
            type="text"
            placeholder="Ex: @mon_agence ou https://tiktok.com/@..."
            value={reseaux.tiktok || ''}
            onChange={(e) => handleChange('tiktok', e.target.value)}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">LinkedIn (Page entreprise ou profil)</label>
          <input
            type="text"
            placeholder="Ex: https://linkedin.com/company/..."
            value={reseaux.linkedin || ''}
            onChange={(e) => handleChange('linkedin', e.target.value)}
            className="form-input"
          />
        </div>
      </div>

      <div className="form-grid-2">
        <div className="form-group">
          <label className="form-label">Chaîne YouTube</label>
          <input
            type="text"
            placeholder="Ex: @mon_agence ou https://youtube.com/..."
            value={reseaux.youtube || ''}
            onChange={(e) => handleChange('youtube', e.target.value)}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Twitter / X (@pseudo ou lien)</label>
          <input
            type="text"
            placeholder="Ex: @mon_agence"
            value={reseaux.twitter || ''}
            onChange={(e) => handleChange('twitter', e.target.value)}
            className="form-input"
          />
        </div>
      </div>
    </div>
  );
}
