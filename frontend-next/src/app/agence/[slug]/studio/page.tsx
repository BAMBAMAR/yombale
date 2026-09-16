'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  ExternalLink,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  Sliders
} from 'lucide-react';
import {
  THEMES_IMMO_PRESETS,
  BANNIERES_IMMO_PRESETS,
  SECTIONS_VITRINE_DEFAUT
} from './constants';
import type { AgenceStudioConfig, ThemeImmoPreset, SectionVitrineItem } from './types';
import StudioAgenceThemeSelector from './components/StudioAgenceThemeSelector';
import StudioAgenceBranding from './components/StudioAgenceBranding';
import StudioAgenceMarketingTexts from './components/StudioAgenceMarketingTexts';
import StudioAgenceDispositionSections from './components/StudioAgenceDispositionSections';
import StudioAgenceMockupPreview from './components/StudioAgenceMockupPreview';

export default function AgenceStudioPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [agenceNom, setAgenceNom] = useState('Mon Agence');
  const [agenceVille, setAgenceVille] = useState('Dakar');
  const [agenceQuartier, setAgenceQuartier] = useState<string | undefined>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'editeur' | 'apercu'>('editeur');

  const [config, setConfig] = useState<AgenceStudioConfig>({
    theme_id: 'institutionnel',
    couleur_accent: '#1C2B4A',
    couleur_fond: '#FFFFFF',
    forme_boutons: 'squircle',
    cover_url: BANNIERES_IMMO_PRESETS[0].url,
    logo_url: '',
    slogan: '',
    bandeau_annonce: '',
    bandeau_annonce_actif: false,
    message_accueil_wa: '',
    disposition_sections: [...SECTIONS_VITRINE_DEFAUT],
  });

  function getAuthToken(): string {
    if (typeof window === 'undefined') return '';
    return (
      localStorage.getItem('token') ||
      localStorage.getItem('nopalou_token') ||
      sessionStorage.getItem('token') ||
      ''
    );
  }

  async function chargerDonnees() {
    try {
      setLoading(true);
      const token = getAuthToken();
      const res = await fetch(`/api/agences/${slug}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();

      if (data.success && data.agence) {
        const ag = data.agence;
        setAgenceNom(ag.nom || 'Mon Agence');
        setAgenceVille(ag.ville || 'Dakar');
        setAgenceQuartier(ag.quartier || '');

        const studioSaved = ag.parametres?.studio || {};
        setConfig({
          theme_id: studioSaved.theme_id || 'institutionnel',
          couleur_accent: studioSaved.couleur_accent || '#1C2B4A',
          couleur_fond: studioSaved.couleur_fond || '#FFFFFF',
          forme_boutons: studioSaved.forme_boutons || 'squircle',
          cover_url: studioSaved.cover_url || BANNIERES_IMMO_PRESETS[0].url,
          logo_url: studioSaved.logo_url || ag.logo_url || '',
          slogan: studioSaved.slogan || '',
          bandeau_annonce: studioSaved.bandeau_annonce || '',
          bandeau_annonce_actif: !!studioSaved.bandeau_annonce_actif,
          message_accueil_wa:
            studioSaved.message_accueil_wa || ag.parametres?.message_accueil_wa || '',
          disposition_sections:
            studioSaved.disposition_sections && studioSaved.disposition_sections.length > 0
              ? studioSaved.disposition_sections
              : [...SECTIONS_VITRINE_DEFAUT],
        });
      }
    } catch (err) {
      console.error('[LOAD_STUDIO_ERR]', err);
      setErrorMsg('Erreur lors du chargement des préférences du studio');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (slug) chargerDonnees();
  }, [slug]);

  function handleSelectTheme(theme: ThemeImmoPreset) {
    setConfig((prev) => ({
      ...prev,
      theme_id: theme.id,
      couleur_accent: theme.couleurAccent,
      couleur_fond: theme.couleurFond,
      forme_boutons: theme.formeBoutons,
    }));
  }

  async function handleSave() {
    try {
      setSaving(true);
      setErrorMsg(null);
      const token = getAuthToken();
      const authHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const resGet = await fetch(`/api/agences/${slug}`, { headers: authHeaders });
      const dataGet = await resGet.json();
      const currentParametres = dataGet.agence?.parametres || {};

      const res = await fetch(`/api/agences/${slug}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          logo_url: config.logo_url,
          parametres: {
            ...currentParametres,
            studio: config,
            message_accueil_wa: config.message_accueil_wa,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setToastMsg('Vitrine personnalisée enregistrée avec succès !');
        setTimeout(() => setToastMsg(null), 3500);
      } else {
        setErrorMsg(data.error || 'Erreur lors de la sauvegarde');
      }
    } catch (err: any) {
      console.error('[SAVE_STUDIO_ERR]', err);
      setErrorMsg(err.message || 'Erreur réseau lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: '#64748B' }}>
        <p style={{ fontWeight: 600 }}>Chargement du Studio Agence Immo...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── En-tête Principal du Studio ── */}
      <div className="agence-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={20} style={{ color: 'var(--accent, #C75B00)' }} />
            <h1 className="agence-title" style={{ margin: 0 }}>
              Studio Vitrine Agence
            </h1>
          </div>
          <p className="agence-subtitle" style={{ margin: '4px 0 0' }}>
            Personnalisez l&apos;ambiance graphique, la bannière, les accroches et l&apos;ordre des sections de votre vitrine.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link
            href={`/agence/${slug}/vitrine`}
            target="_blank"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 16px',
              borderRadius: 8,
              background: '#FFFFFF',
              border: '1px solid var(--border, #E8DDD2)',
              color: 'var(--navy, #1C2B4A)',
              fontWeight: 750,
              fontSize: 13,
              textDecoration: 'none',
            }}
          >
            <ExternalLink size={14} />
            <span>Voir ma Vitrine</span>
          </Link>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              borderRadius: 8,
              background: 'var(--navy, #1C2B4A)',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 800,
              fontSize: 13.5,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
              boxShadow: '0 2px 8px rgba(28, 43, 74, 0.2)',
            }}
          >
            <Save size={15} />
            <span>{saving ? 'Enregistrement...' : 'Enregistrer les modifications'}</span>
          </button>
        </div>
      </div>

      {/* Notifications Toast */}
      {toastMsg && (
        <div style={{ padding: '12px 16px', background: '#DCFCE7', color: '#166534', borderRadius: 8, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={16} />
          {toastMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{ padding: '12px 16px', background: '#FEF2F2', color: '#991B1B', borderRadius: 8, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={16} />
          {errorMsg}
        </div>
      )}

      {/* ── Sélecteur d'écran sur mobile (< 900px) ── */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '2px solid var(--border, #E8DDD2)', paddingBottom: 6 }}>
        <button
          type="button"
          onClick={() => setActiveTab('editeur')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            border: 'none',
            background: activeTab === 'editeur' ? 'var(--navy, #1C2B4A)' : 'transparent',
            color: activeTab === 'editeur' ? '#FFFFFF' : '#64748B',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 750,
            cursor: 'pointer',
          }}
        >
          <Sliders size={14} />
          <span>Éditeur de Vitrine</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('apercu')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            border: 'none',
            background: activeTab === 'apercu' ? 'var(--navy, #1C2B4A)' : 'transparent',
            color: activeTab === 'apercu' ? '#FFFFFF' : '#64748B',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 750,
            cursor: 'pointer',
          }}
        >
          <Eye size={14} />
          <span>Aperçu Mobile</span>
        </button>
      </div>

      {/* ── Disposition 2 Colonnes (Éditeur + Simulateur) ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: activeTab === 'editeur' ? '1fr 340px' : '1fr',
          gap: 22,
          alignItems: 'start',
        }}
      >
        {/* Colonne Éditeur */}
        {(activeTab === 'editeur' || typeof window === 'undefined') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <StudioAgenceThemeSelector
              currentThemeId={config.theme_id}
              onSelectTheme={handleSelectTheme}
            />

            <StudioAgenceBranding
              logoUrl={config.logo_url}
              onChangeLogoUrl={(url) => setConfig((p) => ({ ...p, logo_url: url }))}
              coverUrl={config.cover_url}
              onChangeCoverUrl={(url) => setConfig((p) => ({ ...p, cover_url: url }))}
              couleurAccent={config.couleur_accent}
              onChangeCouleurAccent={(color) => setConfig((p) => ({ ...p, couleur_accent: color }))}
              formeBoutons={config.forme_boutons}
              onChangeFormeBoutons={(f) => setConfig((p) => ({ ...p, forme_boutons: f }))}
              agenceNom={agenceNom}
            />

            <StudioAgenceMarketingTexts
              slogan={config.slogan}
              onChangeSlogan={(txt) => setConfig((p) => ({ ...p, slogan: txt }))}
              bandeauAnnonce={config.bandeau_annonce}
              onChangeBandeauAnnonce={(txt) => setConfig((p) => ({ ...p, bandeau_annonce: txt }))}
              bandeauAnnonceActif={config.bandeau_annonce_actif}
              onChangeBandeauAnnonceActif={(act) => setConfig((p) => ({ ...p, bandeau_annonce_actif: act }))}
              messageAccueilWa={config.message_accueil_wa}
              onChangeMessageAccueilWa={(txt) => setConfig((p) => ({ ...p, message_accueil_wa: txt }))}
            />

            <StudioAgenceDispositionSections
              sections={config.disposition_sections}
              onChangeSections={(secs) => setConfig((p) => ({ ...p, disposition_sections: secs }))}
            />
          </div>
        )}

        {/* Colonne Simulateur Smartphone */}
        {(activeTab === 'apercu' || activeTab === 'editeur') && (
          <StudioAgenceMockupPreview
            config={config}
            agenceNom={agenceNom}
            agenceVille={agenceVille}
            agenceQuartier={agenceQuartier}
          />
        )}
      </div>
    </div>
  );
}
