'use client';

// frontend-next/src/app/surga/components/SurgaDemarcheDetailModal.tsx
// Modale de consultation détaillée d'une démarche administrative officielle vérifiée
// Checklist des pièces, passerelles Notes / Sama Xaalis / Agenda, signalement d'erreur
// Modularité < 450 lignes, zéro émoji, tokens officiels, vouvoiement strict D19

import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Coins,
  Clock,
  MapPin,
  ExternalLink,
  Wallet,
  Calendar,
  AlertTriangle,
  BookmarkCheck,
  CheckCircle2,
} from 'lucide-react';
import type { DemarcheAdminData } from './SurgaDemarcheCard';
import SurgaDemarchePiecesSection from './SurgaDemarchePiecesSection';
import SurgaDemarcheSignalementForm from './SurgaDemarcheSignalementForm';

interface SurgaDemarcheDetailModalProps {
  demarche: DemarcheAdminData | null;
  isOpen: boolean;
  estSuivie?: boolean;
  onClose: () => void;
  onToggleSuivi: (demarcheId: string) => Promise<void>;
  onCreerNoteChecklist?: (titre: string, pieces: string[]) => void;
  onAjouterDepense?: (montant: number, description: string) => void;
  onAjouterAgenda?: (titre: string, date: string) => void;
  onOpenPremium?: () => void;
}

export default function SurgaDemarcheDetailModal({
  demarche,
  isOpen,
  estSuivie = false,
  onClose,
  onToggleSuivi,
  onCreerNoteChecklist,
  onAjouterDepense,
  onAjouterAgenda,
}: SurgaDemarcheDetailModalProps) {
  const [piecesCochees, setPiecesCochees] = useState<Record<number, boolean>>({});
  const [afficherSignalement, setAfficherSignalement] = useState(false);
  const [erreurAction, setErreurAction] = useState<string | null>(null);
  const [actionSucces, setActionSucces] = useState<string | null>(null);

  if (!isOpen || !demarche) return null;

  const cout = demarche.cout_xof || 0;
  const pieces = demarche.pieces || [];
  const etapes = demarche.etapes || [];

  const togglePiece = (index: number) => {
    setPiecesCochees((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const formaterDateVerif = (dateIso?: string) => {
    if (!dateIso) return 'Récemment';
    try {
      const d = new Date(dateIso);
      return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch {
      return 'Récemment';
    }
  };

  const handleCreerChecklistNote = () => {
    if (!onCreerNoteChecklist) return;
    const items = pieces.map(
      (p) => `${p.intitule}${p.precision ? ` (${p.precision})` : ''} - ${p.obligatoire ? 'Obligatoire' : 'Facultatif'}`
    );
    onCreerNoteChecklist(`Dossier : ${demarche.titre}`, items);
    setActionSucces('Checklist exportée dans vos Notes personnelles Surga.');
    setTimeout(() => setActionSucces(null), 3500);
  };

  const handleAjouterDepenseKalpe = () => {
    if (!onAjouterDepense || cout <= 0) return;
    onAjouterDepense(cout, `Frais dossier : ${demarche.titre}`);
    setActionSucces('Frais de dossier enregistrés dans Sama Xaalis.');
    setTimeout(() => setActionSucces(null), 3500);
  };

  const handleAjouterAgenda = () => {
    if (!onAjouterAgenda) return;
    const dateDemain = new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0];
    onAjouterAgenda(`Démarche : ${demarche.titre}`, dateDemain);
    setActionSucces('Rappel programmé dans votre Agenda Surga.');
    setTimeout(() => setActionSucces(null), 3500);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(11, 19, 43, 0.7)',
        zIndex: 9999,
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
          maxWidth: 540,
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: 'var(--surface, #FFFFFF)',
          borderRadius: 16,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--price, #0A5C36)',
                  backgroundColor: 'rgba(10, 92, 54, 0.08)',
                  padding: '3px 8px',
                  borderRadius: 6,
                }}
              >
                <ShieldCheck size={13} />
                <span>Vérifié le {formaterDateVerif(demarche.date_verification)}</span>
              </span>
            </div>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0, lineHeight: 1.3 }}>
              {demarche.titre}
            </h2>
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

        {/* Message de succès ou d'erreur */}
        {actionSucces && (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              backgroundColor: 'rgba(10, 92, 54, 0.1)',
              color: 'var(--price, #0A5C36)',
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <CheckCircle2 size={16} />
            <span>{actionSucces}</span>
          </div>
        )}
        {erreurAction && (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              backgroundColor: 'rgba(199, 91, 0, 0.1)',
              color: 'var(--accent, #C75B00)',
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <AlertTriangle size={16} />
            <span>{erreurAction}</span>
          </div>
        )}

        {/* Cartouches d'informations clés */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          <div
            style={{
              padding: 10,
              borderRadius: 8,
              backgroundColor: 'var(--bg, #F8F5F0)',
              border: '1px solid var(--border, #E8DDD2)',
            }}
          >
            <div style={{ fontSize: 11, color: 'var(--text3, #73675E)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Coins size={12} />
              <span>Coût officiel</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, color: cout === 0 ? 'var(--price, #0A5C36)' : 'var(--navy, #1C2B4A)', marginTop: 2 }}>
              {cout === 0 ? 'Délivrance gratuite' : `${cout.toLocaleString('fr-FR')} FCFA`}
            </div>
          </div>

          <div
            style={{
              padding: 10,
              borderRadius: 8,
              backgroundColor: 'var(--bg, #F8F5F0)',
              border: '1px solid var(--border, #E8DDD2)',
            }}
          >
            <div style={{ fontSize: 11, color: 'var(--text3, #73675E)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Clock size={12} />
              <span>Délai estimé</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy, #1C2B4A)', marginTop: 2 }}>
              {demarche.delai || 'Variable'}
            </div>
          </div>
        </div>

        {/* Public concerné et Lieux */}
        {demarche.public_concerne && (
          <div style={{ fontSize: 12, color: 'var(--text2, #5A4E42)', lineHeight: 1.4 }}>
            <strong>Public concerné :</strong> {demarche.public_concerne}
          </div>
        )}

        {demarche.lieux && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              padding: '10px 12px',
              borderRadius: 8,
              backgroundColor: 'rgba(28, 43, 74, 0.04)',
              fontSize: 12,
              color: 'var(--navy, #1C2B4A)',
            }}
          >
            <MapPin size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong style={{ display: 'block', marginBottom: 2 }}>Lieux de dépôt &amp; de retrait :</strong>
              <span>{demarche.lieux}</span>
            </div>
          </div>
        )}

        {/* Pièces à fournir (Checklist interactive) */}
        <SurgaDemarchePiecesSection
          pieces={pieces}
          piecesCochees={piecesCochees}
          onTogglePiece={togglePiece}
          onExporterNote={handleCreerChecklistNote}
        />

        {/* Étapes de la démarche */}
        {etapes.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <h4 style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
              Étapes officielles
            </h4>
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'var(--text2, #5A4E42)', lineHeight: 1.5 }}>
              {etapes.map((etape, i) => (
                <li key={i} style={{ marginBottom: 4 }}>
                  {etape}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Passerelles Transversales */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            padding: 10,
            borderRadius: 8,
            backgroundColor: 'var(--bg, #F8F5F0)',
            border: '1px solid var(--border, #E8DDD2)',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
            Passerelles Surga pour cette démarche
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {cout > 0 && (
              <button
                type="button"
                onClick={handleAjouterDepenseKalpe}
                className="surga-btn-secondary"
                style={{ fontSize: 11, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 5 }}
              >
                <Wallet size={13} color="var(--price, #0A5C36)" />
                <span>Prévoir {cout.toLocaleString('fr-FR')} FCFA</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleAjouterAgenda}
              className="surga-btn-secondary"
              style={{ fontSize: 11, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 5 }}
            >
              <Calendar size={13} color="var(--accent, #C75B00)" />
              <span>Rappel dans l Agenda</span>
            </button>
          </div>
        </div>

        {/* Actions principales : Suivre & Source */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => onToggleSuivi(demarche.id)}
            className={estSuivie ? 'surga-btn-secondary' : 'surga-btn-primary'}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '10px 14px',
              fontSize: 13,
            }}
          >
            <BookmarkCheck size={16} />
            <span>{estSuivie ? 'Ne plus suivre cette démarche' : 'Suivre cette démarche'}</span>
          </button>

          {demarche.source_officielle && (
            <a
              href={demarche.source_officielle}
              target="_blank"
              rel="noopener noreferrer"
              className="surga-btn-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '10px 12px',
                fontSize: 12,
                textDecoration: 'none',
              }}
            >
              <span>Source officielle</span>
              <ExternalLink size={13} />
            </a>
          )}
        </div>

        {/* Section Signalement d'erreur */}
        <div style={{ borderTop: '1px solid var(--border, #E8DDD2)', paddingTop: 10 }}>
          {!afficherSignalement ? (
            <button
              type="button"
              onClick={() => setAfficherSignalement(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text3, #73675E)',
                fontSize: 11,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: 0,
              }}
            >
              <AlertTriangle size={12} />
              <span>Signaler une inexactitude sur cette fiche</span>
            </button>
          ) : (
            <SurgaDemarcheSignalementForm
              demarcheId={demarche.id}
              onAnnuler={() => setAfficherSignalement(false)}
              onErreur={(msg) => setErreurAction(msg)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
