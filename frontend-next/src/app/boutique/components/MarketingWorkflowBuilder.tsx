// frontend-next/src/app/boutique/components/MarketingWorkflowBuilder.tsx
'use client';

import React, { useState } from 'react';
import { GitBranch, Clock, Send, Plus, Trash2, Play, CheckCircle2, Sparkles, MessageSquare, Smartphone } from 'lucide-react';

export interface WorkflowStep {
  id: string;
  canal: 'whatsapp' | 'sms';
  delai_minutes: number;
  message: string;
}

interface MarketingWorkflowBuilderProps {
  boutiqueId: string;
  boutiqueNom: string;
}

export function MarketingWorkflowBuilder({ boutiqueId, boutiqueNom }: MarketingWorkflowBuilderProps) {
  const [workflowNom, setWorkflowNom] = useState('Relance Séquentielle Panier Abandonné');
  const [declencheur, setDeclencheur] = useState('panier_abandonne');
  const [etapes, setEtapes] = useState<WorkflowStep[]>([
    {
      id: 'step_1',
      canal: 'whatsapp',
      delai_minutes: 60,
      message: `Bonjour ! Vous avez laissé des articles dans votre panier chez ${boutiqueNom}. Souhaitez-vous finaliser votre commande ?`
    },
    {
      id: 'step_2',
      canal: 'sms',
      delai_minutes: 1440, // 24h
      message: `Offre spéciale chez ${boutiqueNom} : Finalisez votre commande aujourd'hui et bénéficiez de la livraison prioritaire !`
    }
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleAddStep = () => {
    const newStep: WorkflowStep = {
      id: `step_${Date.now()}`,
      canal: etapes.length % 2 === 0 ? 'whatsapp' : 'sms',
      delai_minutes: 120,
      message: `Rappel de votre commande chez ${boutiqueNom}.`
    };
    setEtapes([...etapes, newStep]);
  };

  const handleRemoveStep = (id: string) => {
    setEtapes(etapes.filter((s) => s.id !== id));
  };

  const handleUpdateStep = (id: string, field: keyof WorkflowStep, val: any) => {
    setEtapes(
      etapes.map((s) => (s.id === id ? { ...s, [field]: val } : s))
    );
  };

  const handleSaveWorkflow = async () => {
    setIsSaving(true);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/boutiques/${boutiqueId}/marketing/workflows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: workflowNom,
          declencheur,
          etapes
        })
      });
      if (res.ok) {
        setSuccessMsg('Séquence marketing automatisée enregistrée avec succès.');
      }
    } catch (err) {
      console.error('Erreur enregistrement workflow:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="workflow-builder-card" style={{
      background: 'var(--card, #ffffff)',
      border: '1px solid var(--border, #E8DDD2)',
      borderRadius: '12px',
      padding: '24px',
      marginTop: '16px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <GitBranch size={22} style={{ color: 'var(--accent, #C75B00)' }} />
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--navy, #1C2B4A)' }}>
              Séquences Marketing & Automation Conditionnelle
            </h3>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
              Créez des relances automatiques multi-étapes sur WhatsApp et SMS
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSaveWorkflow}
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
          <Play size={15} />
          {isSaving ? 'Enregistrement...' : 'Activer le Workflow'}
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

      {/* Configuration Déclencheur */}
      <div style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '24px'
      }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--navy, #1C2B4A)', marginBottom: '8px' }}>
          Déclencheur Automatique (Trigger)
        </label>
        <select
          value={declencheur}
          onChange={(e) => setDeclencheur(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            fontSize: '13px',
            borderRadius: '6px',
            border: '1px solid var(--border, #E8DDD2)',
            background: '#ffffff'
          }}
        >
          <option value="panier_abandonne">🛒 Panier Abandonné (Client n'a pas finalisé)</option>
          <option value="nouvelle_commande">📦 Nouvelle Commande (Remerciement & Suivi)</option>
          <option value="client_inactif">💤 Client Inactif (Aucun achat depuis 30 jours)</option>
        </select>
      </div>

      {/* Séquence d'étapes */}
      <div style={{ position: 'relative', paddingLeft: '20px', borderLeft: '2px dashed var(--accent, #C75B00)' }}>
        {etapes.map((etape, idx) => (
          <div key={etape.id} style={{
            position: 'relative',
            background: '#ffffff',
            border: '1px solid var(--border, #E8DDD2)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  background: 'var(--navy, #1C2B4A)',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 700,
                  borderRadius: '50%',
                  width: '22px',
                  height: '22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {idx + 1}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy, #1C2B4A)' }}>
                  Étape {idx + 1} — Notification
                </span>
              </div>
              {etapes.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveStep(etape.id)}
                  style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
                  Canal d'Envoi
                </label>
                <select
                  value={etape.canal}
                  onChange={(e) => handleUpdateStep(etape.id, 'canal', e.target.value)}
                  style={{ width: '100%', padding: '8px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                >
                  <option value="whatsapp">WhatsApp Cloud API (avec SMS Fallback)</option>
                  <option value="sms">SMS Direct Orange Sénégal</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
                  Délai d'attente avant envoi
                </label>
                <select
                  value={etape.delai_minutes}
                  onChange={(e) => handleUpdateStep(etape.id, 'delai_minutes', Number(e.target.value))}
                  style={{ width: '100%', padding: '8px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                >
                  <option value={30}>30 minutes après l'événement</option>
                  <option value={60}>1 heure après l'événement</option>
                  <option value={120}>2 heures après l'événement</option>
                  <option value={1440}>24 heures (1 jour) après</option>
                  <option value={2880}>48 heures (2 jours) après</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
                Contenu du message
              </label>
              <textarea
                value={etape.message}
                onChange={(e) => handleUpdateStep(etape.id, 'message', e.target.value)}
                rows={2}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleAddStep}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: '#f1f5f9',
          color: 'var(--navy, #1C2B4A)',
          border: '1px dashed #cbd5e1',
          borderRadius: '8px',
          padding: '10px 16px',
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
          marginTop: '12px',
          width: '100%',
          justifyContent: 'center'
        }}
      >
        <Plus size={16} />
        Ajouter une étape à la séquence
      </button>
    </div>
  );
}
