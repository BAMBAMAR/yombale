'use client';

// frontend-next/src/app/admin/surga/components/AdminDemarchesTab.tsx
// Onglet d'administration des démarches administratives sénégalaises vérifiées (Tranche 20)
// File de re-vérification (cycle 90 jours), gestion des signalements, CRUD fiches
// Conformité Anti-AI-Slop : < 450 lignes, zéro émoji, tokens officiels

import React, { useState, useEffect } from 'react';
import {
  Plus,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileCheck,
  Edit2,
  Trash2,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import type { DemarcheAdminData } from '@/app/surga/components/SurgaDemarcheCard';
import AdminDemarcheModal from './AdminDemarcheModal';

interface SignalementAdminData {
  id: string;
  demarche_id: string;
  demarche_titre?: string;
  message: string;
  contact_email?: string;
  statut: 'EN_ATTENTE' | 'TRAITE' | 'REJETE';
  created_at: string;
}

export default function AdminDemarchesTab() {
  const [sousOnglet, setSousOnglet] = useState<'catalogue' | 'reverification' | 'signalements'>('catalogue');
  const [demarches, setDemarches] = useState<DemarcheAdminData[]>([]);
  const [signalements, setSignalements] = useState<SignalementAdminData[]>([]);
  const [chargement, setChargement] = useState(false);
  const [modalDemarcheOuverte, setModalDemarcheOuverte] = useState(false);
  const [demarcheEnEdition, setDemarcheEnEdition] = useState<DemarcheAdminData | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const chargerDonnees = async () => {
    setChargement(true);
    try {
      const [demRes, sigRes] = await Promise.all([
        fetch('/api/admin/surga/demarches'),
        fetch('/api/admin/surga/demarches/signalements/liste'),
      ]);
      const demData = await demRes.json();
      const sigData = await sigRes.json();

      if (demData.success) setDemarches(demData.demarches || []);
      if (sigData.success) setSignalements(sigData.signalements || []);
    } catch {
      // Ignorer
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    chargerDonnees();
  }, []);

  const demarchesAReverifier = demarches.filter((d) => {
    if (d.statut === 'A_REVERIFIER') return true;
    if (d.date_prochaine_verification) {
      return new Date(d.date_prochaine_verification) <= new Date();
    }
    return false;
  });

  const handleReverifierDemarche = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/surga/demarches/${id}/reverifier`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setNotification('Démarche re-vérifiée avec succès (Cycle réinitialisé pour 90 jours).');
        setTimeout(() => setNotification(null), 3500);
        chargerDonnees();
      }
    } catch {
      // Ignorer
    }
  };

  const handleSupprimerDemarche = async (id: string) => {
    if (!window.confirm('Confirmez-vous la suppression de cette démarche ?')) return;
    try {
      const res = await fetch(`/api/admin/surga/demarches/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setNotification('Démarche supprimée.');
        setTimeout(() => setNotification(null), 3000);
        chargerDonnees();
      }
    } catch {
      // Ignorer
    }
  };

  const handleSauvegarderDemarche = async (formData: any) => {
    const isEdit = Boolean(formData.id);
    const url = isEdit ? `/api/admin/surga/demarches/${formData.id}` : '/api/admin/surga/demarches';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Erreur lors de la sauvegarde.');
    }
    setNotification(isEdit ? 'Démarche mise à jour.' : 'Démarche créée avec succès.');
    setTimeout(() => setNotification(null), 3000);
    chargerDonnees();
  };

  const handleTraiterSignalement = async (id: string, nouveauStatut: 'TRAITE' | 'REJETE') => {
    try {
      const res = await fetch(`/api/admin/surga/demarches/signalements/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: nouveauStatut }),
      });
      const data = await res.json();
      if (data.success) {
        setNotification(`Signalement marqué comme ${nouveauStatut.toLowerCase()}.`);
        setTimeout(() => setNotification(null), 3000);
        chargerDonnees();
      }
    } catch {
      // Ignorer
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Barre de métriques et actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ padding: '8px 14px', borderRadius: 8, backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
            <span style={{ fontSize: 11, color: '#64748B', display: 'block' }}>Total Fiches</span>
            <strong style={{ fontSize: 16, color: '#0F172A' }}>{demarches.length}</strong>
          </div>
          <div style={{ padding: '8px 14px', borderRadius: 8, backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
            <span style={{ fontSize: 11, color: '#64748B', display: 'block' }}>À re-vérifier (90j)</span>
            <strong style={{ fontSize: 16, color: demarchesAReverifier.length > 0 ? '#EA580C' : '#10B981' }}>
              {demarchesAReverifier.length}
            </strong>
          </div>
          <div style={{ padding: '8px 14px', borderRadius: 8, backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
            <span style={{ fontSize: 11, color: '#64748B', display: 'block' }}>Signalements usagers</span>
            <strong style={{ fontSize: 16, color: signalements.filter((s) => s.statut === 'EN_ATTENTE').length > 0 ? '#EF4444' : '#64748B' }}>
              {signalements.filter((s) => s.statut === 'EN_ATTENTE').length}
            </strong>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={chargerDonnees}
            disabled={chargement}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
          >
            <RefreshCw size={14} className={chargement ? 'animate-spin' : ''} />
            <span>Actualiser</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setDemarcheEnEdition(null);
              setModalDemarcheOuverte(true);
            }}
            style={{ padding: '8px 14px', borderRadius: 8, border: 'none', backgroundColor: '#0B132B', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
          >
            <Plus size={15} />
            <span>Nouvelle démarche</span>
          </button>
        </div>
      </div>

      {notification && (
        <div style={{ padding: '10px 14px', borderRadius: 8, backgroundColor: '#ECFDF5', color: '#065F46', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={16} />
          <span>{notification}</span>
        </div>
      )}

      {/* Sous-onglets */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #E2E8F0' }}>
        <button
          type="button"
          onClick={() => setSousOnglet('catalogue')}
          style={{
            padding: '10px 16px',
            border: 'none',
            background: 'none',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            color: sousOnglet === 'catalogue' ? '#0F172A' : '#64748B',
            borderBottom: sousOnglet === 'catalogue' ? '2.5px solid #0F172A' : '2.5px solid transparent',
          }}
        >
          Catalogue des Démarches ({demarches.length})
        </button>
        <button
          type="button"
          onClick={() => setSousOnglet('reverification')}
          style={{
            padding: '10px 16px',
            border: 'none',
            background: 'none',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            color: sousOnglet === 'reverification' ? '#0F172A' : '#64748B',
            borderBottom: sousOnglet === 'reverification' ? '2.5px solid #0F172A' : '2.5px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span>File À Re-Vérifier (90j)</span>
          {demarchesAReverifier.length > 0 && (
            <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, backgroundColor: '#EA580C', color: '#FFFFFF' }}>
              {demarchesAReverifier.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setSousOnglet('signalements')}
          style={{
            padding: '10px 16px',
            border: 'none',
            background: 'none',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            color: sousOnglet === 'signalements' ? '#0F172A' : '#64748B',
            borderBottom: sousOnglet === 'signalements' ? '2.5px solid #0F172A' : '2.5px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span>Signalements Usagers</span>
          {signalements.filter((s) => s.statut === 'EN_ATTENTE').length > 0 && (
            <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, backgroundColor: '#EF4444', color: '#FFFFFF' }}>
              {signalements.filter((s) => s.statut === 'EN_ATTENTE').length}
            </span>
          )}
        </button>
      </div>

      {/* Contenu sous-onglets */}
      {sousOnglet === 'catalogue' && (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 10, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#64748B', fontSize: 11 }}>
                <th style={{ padding: '12px 16px' }}>Titre de la démarche</th>
                <th style={{ padding: '12px 16px' }}>Catégorie</th>
                <th style={{ padding: '12px 16px' }}>Coût FCFA</th>
                <th style={{ padding: '12px 16px' }}>Statut</th>
                <th style={{ padding: '12px 16px' }}>Vérification</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {demarches.map((dem) => (
                <tr key={dem.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0F172A' }}>
                    {dem.titre}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#64748B' }}>{dem.categorie}</td>
                  <td style={{ padding: '12px 16px' }}>
                    {dem.cout_xof === 0 ? 'Gratuit' : `${dem.cout_xof?.toLocaleString('fr-FR')} FCFA`}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 6,
                        backgroundColor:
                          dem.statut === 'PUBLIE'
                            ? '#ECFDF5'
                            : dem.statut === 'A_REVERIFIER'
                            ? '#FFF7ED'
                            : '#F1F5F9',
                        color:
                          dem.statut === 'PUBLIE'
                            ? '#065F46'
                            : dem.statut === 'A_REVERIFIER'
                            ? '#C2410C'
                            : '#64748B',
                      }}
                    >
                      {dem.statut}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 11, color: '#64748B' }}>
                    {dem.date_verification ? new Date(dem.date_verification).toLocaleDateString('fr-FR') : '-'}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setDemarcheEnEdition(dem);
                          setModalDemarcheOuverte(true);
                        }}
                        style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #E2E8F0', background: '#FFFFFF', cursor: 'pointer' }}
                      >
                        <Edit2 size={13} color="#0F172A" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSupprimerDemarche(dem.id)}
                        style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #FEE2E2', background: '#FFFFFF', cursor: 'pointer' }}
                      >
                        <Trash2 size={13} color="#EF4444" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {sousOnglet === 'reverification' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {demarchesAReverifier.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: 10, border: '1px solid #E2E8F0', color: '#10B981', fontWeight: 600 }}>
              Toutes les démarches publiées sont à jour du cycle de re-vérification de 90 jours.
            </div>
          ) : (
            demarchesAReverifier.map((dem) => (
              <div
                key={dem.id}
                style={{
                  padding: 16,
                  borderRadius: 10,
                  backgroundColor: '#FFFFFF',
                  border: '1.5px solid #FDBA74',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', margin: '0 0 4px 0' }}>
                    {dem.titre}
                  </h4>
                  <div style={{ fontSize: 12, color: '#64748B' }}>
                    Dernière vérification : {dem.date_verification ? new Date(dem.date_verification).toLocaleDateString('fr-FR') : 'Inconnue'} &bull; Source : {dem.source_officielle}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleReverifierDemarche(dem.id)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 6,
                    border: 'none',
                    backgroundColor: '#10B981',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <ShieldCheck size={14} />
                  <span>Re-vérifier (90 jours)</span>
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {sousOnglet === 'signalements' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {signalements.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: 10, border: '1px solid #E2E8F0', color: '#64748B' }}>
              Aucun signalement d usager pour le moment.
            </div>
          ) : (
            signalements.map((sig) => (
              <div
                key={sig.id}
                style={{
                  padding: 16,
                  borderRadius: 10,
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: 13, color: '#0F172A' }}>
                    {sig.demarche_titre || 'Démarche concernée'}
                  </strong>
                  <span style={{ fontSize: 11, color: '#64748B' }}>
                    {new Date(sig.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: '#334155', backgroundColor: '#F8FAFC', padding: 10, borderRadius: 6 }}>
                  {sig.message}
                </p>
                {sig.contact_email && (
                  <div style={{ fontSize: 11, color: '#64748B' }}>Contact : {sig.contact_email}</div>
                )}
                {sig.statut === 'EN_ATTENTE' && (
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                    <button
                      type="button"
                      onClick={() => handleTraiterSignalement(sig.id, 'REJETE')}
                      style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: 12, cursor: 'pointer' }}
                    >
                      Rejeter
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTraiterSignalement(sig.id, 'TRAITE')}
                      style={{ padding: '4px 10px', borderRadius: 4, border: 'none', background: '#10B981', color: '#FFFFFF', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                    >
                      Marquer Traité
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal d'édition */}
      <AdminDemarcheModal
        isOpen={modalDemarcheOuverte}
        demarche={demarcheEnEdition}
        onClose={() => {
          setModalDemarcheOuverte(false);
          setDemarcheEnEdition(null);
        }}
        onSave={handleSauvegarderDemarche}
      />
    </div>
  );
}
