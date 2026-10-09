'use client';

// frontend-next/src/app/admin/surga/components/AdminDemarcheModal.tsx
// Modale d'administration : création et édition d'une démarche administrative vérifiée
// Conformité Anti-AI-Slop : < 450 lignes, zéro émoji, tokens officiels

import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2 } from 'lucide-react';
import type { DemarcheAdminData, DemarchePiece } from '@/app/surga/components/SurgaDemarcheCard';

interface AdminDemarcheModalProps {
  isOpen: boolean;
  demarche: DemarcheAdminData | null;
  onClose: () => void;
  onSave: (demarcheData: any) => Promise<void>;
}

const CATEGORIES_OPTIONS = [
  { id: 'identite_voyage', label: 'Identité & Voyage' },
  { id: 'etat_civil', label: 'État Civil & Famille' },
  { id: 'justice', label: 'Justice & Casier' },
  { id: 'transport', label: 'Transports & Permis' },
  { id: 'logement', label: 'Logement & Résidence' },
  { id: 'activite_pro', label: 'Entreprise & Activité Pro' },
];

export default function AdminDemarcheModal({
  isOpen,
  demarche,
  onClose,
  onSave,
}: AdminDemarcheModalProps) {
  const [titre, setTitre] = useState('');
  const [slug, setSlug] = useState('');
  const [categorie, setCategorie] = useState('identite_voyage');
  const [publicConcerne, setPublicConcerne] = useState('');
  const [coutXof, setCoutXof] = useState(0);
  const [delai, setDelai] = useState('');
  const [lieux, setLieux] = useState('');
  const [sourceOfficielle, setSourceOfficielle] = useState('');
  const [statut, setStatut] = useState<'BROUILLON' | 'PUBLIE' | 'A_REVERIFIER'>('BROUILLON');
  const [pieces, setPieces] = useState<DemarchePiece[]>([]);
  const [nouvellePieceIntitule, setNouvellePieceIntitule] = useState('');
  const [nouvellePieceObligatoire, setNouvellePieceObligatoire] = useState(true);
  const [etapes, setEtapes] = useState<string[]>([]);
  const [nouvelleEtape, setNouvelleEtape] = useState('');
  const [motsClesStr, setMotsClesStr] = useState('');
  const [sauvegardeEnCours, setSauvegardeEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (demarche) {
      setTitre(demarche.titre || '');
      setSlug(demarche.slug || '');
      setCategorie(demarche.categorie || 'identite_voyage');
      setPublicConcerne(demarche.public_concerne || '');
      setCoutXof(demarche.cout_xof || 0);
      setDelai(demarche.delai || '');
      setLieux(demarche.lieux || '');
      setSourceOfficielle(demarche.source_officielle || '');
      setStatut(demarche.statut || 'BROUILLON');
      setPieces(demarche.pieces || []);
      setEtapes(demarche.etapes || []);
      setMotsClesStr((demarche.mots_cles || []).join(', '));
    } else {
      setTitre('');
      setSlug('');
      setCategorie('identite_voyage');
      setPublicConcerne('');
      setCoutXof(0);
      setDelai('');
      setLieux('');
      setSourceOfficielle('https://e-senegal.sn/#/home/demarches');
      setStatut('BROUILLON');
      setPieces([]);
      setEtapes([]);
      setMotsClesStr('');
    }
    setErreur(null);
  }, [demarche, isOpen]);

  if (!isOpen) return null;

  const handleAjouterPiece = () => {
    if (!nouvellePieceIntitule.trim()) return;
    setPieces([
      ...pieces,
      { intitule: nouvellePieceIntitule.trim(), obligatoire: nouvellePieceObligatoire },
    ]);
    setNouvellePieceIntitule('');
    setNouvellePieceObligatoire(true);
  };

  const handleSupprimerPiece = (idx: number) => {
    setPieces(pieces.filter((_, i) => i !== idx));
  };

  const handleAjouterEtape = () => {
    if (!nouvelleEtape.trim()) return;
    setEtapes([...etapes, nouvelleEtape.trim()]);
    setNouvelleEtape('');
  };

  const handleSupprimerEtape = (idx: number) => {
    setEtapes(etapes.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titre.trim()) {
      setErreur('Le titre est requis.');
      return;
    }

    setSauvegardeEnCours(true);
    setErreur(null);
    try {
      const motsCles = motsClesStr
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);

      await onSave({
        id: demarche?.id,
        titre: titre.trim(),
        slug: slug.trim() || undefined,
        categorie,
        public_concerne: publicConcerne.trim(),
        cout_xof: coutXof,
        delai: delai.trim(),
        lieux: lieux.trim(),
        source_officielle: sourceOfficielle.trim(),
        statut,
        pieces,
        etapes,
        mots_cles: motsCles,
      });
      onClose();
    } catch (err: any) {
      setErreur(err.message || 'Erreur lors de l\'enregistrement.');
    } finally {
      setSauvegardeEnCours(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 680,
          maxHeight: '92vh',
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
            {demarche ? 'Modifier la démarche' : 'Nouvelle démarche administrative'}
          </h2>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
            <X size={20} />
          </button>
        </div>

        {erreur && (
          <div style={{ padding: '8px 12px', borderRadius: 6, backgroundColor: '#FEE2E2', color: '#DC2626', fontSize: 13 }}>
            {erreur}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
              Titre de la démarche *
            </label>
            <input
              type="text"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              required
              placeholder="Ex : Carte Nationale d'Identité CEDEAO"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                Catégorie *
              </label>
              <select
                value={categorie}
                onChange={(e) => setCategorie(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
              >
                {CATEGORIES_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                Statut éditorial *
              </label>
              <select
                value={statut}
                onChange={(e) => setStatut(e.target.value as any)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
              >
                <option value="BROUILLON">BROUILLON (Contenu en attente)</option>
                <option value="PUBLIE">PUBLIE (Officiel en ligne)</option>
                <option value="A_REVERIFIER">A_REVERIFIER (Cycle 90 jours échu)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                Coût officiel (FCFA)
              </label>
              <input
                type="number"
                min="0"
                value={coutXof}
                onChange={(e) => setCoutXof(parseInt(e.target.value, 10) || 0)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                Délai moyen estimé
              </label>
              <input
                type="text"
                value={delai}
                onChange={(e) => setDelai(e.target.value)}
                placeholder="Ex : 48 à 72 heures"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
              Public concerné
            </label>
            <input
              type="text"
              value={publicConcerne}
              onChange={(e) => setPublicConcerne(e.target.value)}
              placeholder="Ex : Tout citoyen de nationalité sénégalaise..."
              style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
              Lieux de dépôt et retrait
            </label>
            <textarea
              rows={2}
              value={lieux}
              onChange={(e) => setLieux(e.target.value)}
              placeholder="Ex : Commissariats de police, brigade de gendarmerie..."
              style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
              Pièces à fournir ({pieces.length})
            </label>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <input
                type="text"
                value={nouvellePieceIntitule}
                onChange={(e) => setNouvellePieceIntitule(e.target.value)}
                placeholder="Intitulé de la pièce..."
                style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12 }}
              />
              <button
                type="button"
                onClick={handleAjouterPiece}
                style={{ padding: '6px 12px', borderRadius: 6, backgroundColor: '#0B132B', color: '#FFFFFF', border: 'none', cursor: 'pointer', fontSize: 12 }}
              >
                <Plus size={14} />
              </button>
            </div>
            {pieces.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px', borderRadius: 4, backgroundColor: '#F8FAFC', marginBottom: 4, fontSize: 12 }}>
                <span>{p.intitule}</span>
                <button type="button" onClick={() => handleSupprimerPiece(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
              Étapes officielles ({etapes.length})
            </label>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <input
                type="text"
                value={nouvelleEtape}
                onChange={(e) => setNouvelleEtape(e.target.value)}
                placeholder="Description de l'étape..."
                style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12 }}
              />
              <button
                type="button"
                onClick={handleAjouterEtape}
                style={{ padding: '6px 12px', borderRadius: 6, backgroundColor: '#0B132B', color: '#FFFFFF', border: 'none', cursor: 'pointer', fontSize: 12 }}
              >
                <Plus size={14} />
              </button>
            </div>
            {etapes.map((et, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px', borderRadius: 4, backgroundColor: '#F8FAFC', marginBottom: 4, fontSize: 12 }}>
                <span>{i + 1}. {et}</span>
                <button type="button" onClick={() => handleSupprimerEtape(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
              Source officielle
            </label>
            <input
              type="url"
              value={sourceOfficielle}
              onChange={(e) => setSourceOfficielle(e.target.value)}
              placeholder="https://e-senegal.sn/#/home/demarches"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12, borderTop: '1px solid #E2E8F0', paddingTop: 12 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', fontSize: 13, cursor: 'pointer' }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={sauvegardeEnCours}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 18px',
                borderRadius: 6,
                backgroundColor: '#0B132B',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              <Save size={15} />
              <span>{sauvegardeEnCours ? 'Enregistrement...' : 'Enregistrer la fiche'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
