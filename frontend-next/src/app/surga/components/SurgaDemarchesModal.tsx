'use client';

// frontend-next/src/app/surga/components/SurgaDemarchesModal.tsx
// Modale principale des démarches administratives sénégalaises vérifiées (Tranche 20)
// Fiches officielles certifiées, zéro hallucination, recherche par mots-clés déterministe
// Modularité < 450 lignes, zéro émoji, tokens officiels, vouvoiement strict D19

import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  BookOpen,
  BookmarkCheck,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import SurgaChargementEchoue, { lireReponseSurga } from './SurgaChargementEchoue';
import SurgaDemarcheCard, { DemarcheAdminData } from './SurgaDemarcheCard';
import SurgaDemarcheDetailModal from './SurgaDemarcheDetailModal';
import SurgaDemarcheNonCouvertBanner from './SurgaDemarcheNonCouvertBanner';

interface SurgaDemarchesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPremium?: () => void;
  onCreerNoteChecklist?: (titre: string, pieces: string[]) => void;
  onAjouterDepense?: (montant: number, description: string) => void;
  onAjouterAgenda?: (titre: string, date: string) => void;
}

const CATEGORIES_FILTRE = [
  { id: 'tous', label: 'Toutes' },
  { id: 'identite_voyage', label: 'Identité' },
  { id: 'etat_civil', label: 'État Civil' },
  { id: 'justice', label: 'Justice' },
  { id: 'transport', label: 'Transports' },
  { id: 'logement', label: 'Logement' },
  { id: 'activite_pro', label: 'Entreprise' },
];

export default function SurgaDemarchesModal({
  isOpen,
  onClose,
  onOpenPremium,
  onCreerNoteChecklist,
  onAjouterDepense,
  onAjouterAgenda,
}: SurgaDemarchesModalProps) {
  const [ongletActif, setOngletActif] = useState<'catalogue' | 'suivis'>('catalogue');
  const [categorieFiltre, setCategorieFiltre] = useState('tous');
  const [recherche, setRecherche] = useState('');
  const [demarches, setDemarches] = useState<DemarcheAdminData[]>([]);
  const [suivis, setSuivis] = useState<any[]>([]);
  const [demarcheSelectionnee, setDemarcheSelectionnee] = useState<DemarcheAdminData | null>(null);
  const [chargement, setChargement] = useState(false);
  const [echec, setEchec] = useState(false);
  const [nonCouvert, setNonCouvert] = useState(false);
  const [erreurQuota, setErreurQuota] = useState<string | null>(null);

  // Charger les démarches
  const chargerDemarches = async (terme = '', cat = 'tous') => {
    setChargement(true);
    setEchec(false);
    try {
      const params = new URLSearchParams();
      if (terme.trim()) params.set('q', terme.trim());
      if (cat !== 'tous') params.set('categorie', cat);

      const data = await lireReponseSurga(await fetch(`/api/surga/demarches?${params.toString()}`));
      setDemarches(data.fiches || []);
      setNonCouvert(Boolean(data.non_couvert));
    } catch {
      setDemarches([]);
      setNonCouvert(false);
      setEchec(true);
    } finally {
      setChargement(false);
    }
  };

  // Charger les démarches suivies
  const chargerSuivis = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('surga_token');
      if (!token) return;
      const res = await fetch('/api/surga/demarches/suivis', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.suivis) {
        setSuivis(data.suivis);
      }
    } catch {
      // Ignorer
    }
  };

  useEffect(() => {
    if (isOpen) {
      chargerDemarches(recherche, categorieFiltre);
      chargerSuivis();
    }
  }, [isOpen, categorieFiltre]);

  const handleRechercheSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    chargerDemarches(recherche, categorieFiltre);
  };

  const handleToggleSuivi = async (demarcheId: string) => {
    setErreurQuota(null);
    const estDejaSuivi = suivis.some((s) => s.demarche_id === demarcheId);
    const token = localStorage.getItem('token') || localStorage.getItem('surga_token');

    if (!token) {
      setErreurQuota('Veuillez vous connecter pour enregistrer vos démarches suivies.');
      return;
    }

    try {
      if (estDejaSuivi) {
        const res = await fetch(`/api/surga/demarches/${demarcheId}/suivis`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setSuivis((prev) => prev.filter((s) => s.demarche_id !== demarcheId));
        }
      } else {
        const res = await fetch(`/api/surga/demarches/${demarcheId}/suivis`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        });
        const data = await res.json();
        if (data.success) {
          chargerSuivis();
        } else if (data.quota_atteint) {
          setErreurQuota(data.error);
        } else {
          setErreurQuota(data.error || 'Erreur lors de l\'enregistrement du suivi.');
        }
      }
    } catch {
      setErreurQuota('Erreur réseau. Veuillez réessayer.');
    }
  };

  if (!isOpen) return null;

  const demarchesAffichees =
    ongletActif === 'catalogue'
      ? demarches
      : demarches.filter((d) => suivis.some((s) => s.demarche_id === d.id));

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(11, 19, 43, 0.7)',
        zIndex: 9998,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        backdropFilter: 'blur(3px)',
      }}
    >
      <div
        className="surga-card"
        style={{
          width: '100%',
          maxWidth: 620,
          maxHeight: '92vh',
          backgroundColor: 'var(--surface, #FFFFFF)',
          borderRadius: 16,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
        }}
      >
        {/* En-tête */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border, #E8DDD2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
              Démarches Administratives
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text2, #5A4E42)', margin: '2px 0 0 0' }}>
              Fiches officielles vérifiées du Sénégal • Pièces, coûts FCFA &amp; délais réels
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text3, #73675E)',
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Message d'erreur de quota */}
        {erreurQuota && (
          <div
            style={{
              margin: '12px 16px 0 16px',
              padding: '10px 12px',
              borderRadius: 8,
              backgroundColor: 'rgba(199, 91, 0, 0.08)',
              border: '1px solid var(--accent, #C75B00)',
              color: 'var(--navy, #1C2B4A)',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertCircle size={16} color="var(--accent, #C75B00)" />
              <span>{erreurQuota}</span>
            </div>
            {onOpenPremium && (
              <button
                type="button"
                onClick={onOpenPremium}
                className="surga-btn-primary"
                style={{ fontSize: 11, padding: '4px 8px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <Sparkles size={11} />
                <span>Passer Premium</span>
              </button>
            )}
          </div>
        )}

        {/* Onglets navigation : Catalogue vs Mes Suivis */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border, #E8DDD2)',
            backgroundColor: 'var(--bg, #F8F5F0)',
          }}
        >
          <button
            type="button"
            onClick={() => setOngletActif('catalogue')}
            style={{
              flex: 1,
              padding: '12px 0',
              border: 'none',
              backgroundColor: 'transparent',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              color: ongletActif === 'catalogue' ? 'var(--navy, #1C2B4A)' : 'var(--text3, #73675E)',
              borderBottom:
                ongletActif === 'catalogue' ? '3px solid var(--accent, #C75B00)' : '3px solid transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <BookOpen size={15} />
            <span>Guide officiel ({demarches.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setOngletActif('suivis')}
            style={{
              flex: 1,
              padding: '12px 0',
              border: 'none',
              backgroundColor: 'transparent',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              color: ongletActif === 'suivis' ? 'var(--navy, #1C2B4A)' : 'var(--text3, #73675E)',
              borderBottom:
                ongletActif === 'suivis' ? '3px solid var(--accent, #C75B00)' : '3px solid transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <BookmarkCheck size={15} />
            <span>Mes démarches en cours ({suivis.length})</span>
          </button>
        </div>

        {/* Barre de recherche et Filtres par catégorie */}
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <form onSubmit={handleRechercheSubmit} style={{ display: 'flex', gap: 8 }}>
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                backgroundColor: 'var(--bg, #F8F5F0)',
                border: '1px solid var(--border, #E8DDD2)',
                borderRadius: 8,
                padding: '6px 10px',
              }}
            >
              <Search size={15} color="var(--text3, #73675E)" />
              <input
                type="text"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher une démarche (ex: Passeport, CNI, Casier...)"
                style={{
                  border: 'none',
                  background: 'none',
                  outline: 'none',
                  width: '100%',
                  fontSize: 13,
                  color: 'var(--navy, #1C2B4A)',
                }}
              />
              {recherche && (
                <button
                  type="button"
                  onClick={() => {
                    setRecherche('');
                    chargerDemarches('', categorieFiltre);
                  }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  <X size={14} color="var(--text3, #73675E)" />
                </button>
              )}
            </div>
            <button type="submit" className="surga-btn-primary" style={{ fontSize: 12, padding: '8px 14px' }}>
              Rechercher
            </button>
          </form>

          {/* Filtres par catégorie */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
            {CATEGORIES_FILTRE.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategorieFiltre(cat.id)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  border:
                    categorieFiltre === cat.id
                      ? '1px solid var(--navy, #1C2B4A)'
                      : '1px solid var(--border, #E8DDD2)',
                  backgroundColor:
                    categorieFiltre === cat.id ? 'var(--navy, #1C2B4A)' : 'var(--surface, #FFFFFF)',
                  color: categorieFiltre === cat.id ? '#FFFFFF' : 'var(--text2, #5A4E42)',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Corps de la modale / Liste */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {chargement ? (
            <div style={{ textAlign: 'center', padding: '30px 0', fontSize: 13, color: 'var(--text3, #73675E)' }}>
              Recherche dans le guide officiel...
            </div>
          ) : echec ? (
            <SurgaChargementEchoue message="Le guide des démarches n’a pas pu être chargé." onReessayer={() => chargerDemarches(recherche, categorieFiltre)} />
          ) : nonCouvert ? (
            <SurgaDemarcheNonCouvertBanner />
          ) : ongletActif === 'catalogue' && demarches.length === 0 ? (
            // Aucune fiche publiée (toutes en cours de vérification, ou aucune dans cette rubrique) : on le dit
            // et on renvoie au portail de l'État, plutôt que « aucun résultat ».
            <SurgaDemarcheNonCouvertBanner enVerification />
          ) : demarchesAffichees.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', fontSize: 13, color: 'var(--text3, #73675E)' }}>
              {ongletActif === 'suivis'
                ? 'Vous ne suivez encore aucune démarche administrative.'
                : 'Aucune démarche ne correspond à vos critères.'}
            </div>
          ) : (
            demarchesAffichees.map((dem) => {
              const estSuivie = suivis.some((s) => s.demarche_id === dem.id);
              return (
                <SurgaDemarcheCard
                  key={dem.id}
                  demarche={dem}
                  estSuivie={estSuivie}
                  onClick={() => setDemarcheSelectionnee(dem)}
                />
              );
            })
          )}
        </div>
      </div>

      {/* Détail complet d'une démarche */}
      {demarcheSelectionnee && (
        <SurgaDemarcheDetailModal
          isOpen={Boolean(demarcheSelectionnee)}
          demarche={demarcheSelectionnee}
          estSuivie={suivis.some((s) => s.demarche_id === demarcheSelectionnee.id)}
          onClose={() => setDemarcheSelectionnee(null)}
          onToggleSuivi={handleToggleSuivi}
          onCreerNoteChecklist={onCreerNoteChecklist}
          onAjouterDepense={onAjouterDepense}
          onAjouterAgenda={onAjouterAgenda}
          onOpenPremium={onOpenPremium}
        />
      )}
    </div>
  );
}
