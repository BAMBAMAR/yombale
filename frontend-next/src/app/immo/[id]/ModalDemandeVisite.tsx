'use client';

import React, { useState } from 'react';
import { CheckCircle2, Send, X } from 'lucide-react';
import { AgenceInfo } from './BlocAgenceAnnonce';

interface ModalDemandeVisiteProps {
  annonceId: string;
  prix: number | null;
  transaction: string | null;
  quartier: string | null;
  ville: string | null;
  agence: AgenceInfo | null;
  onClose: () => void;
}

export default function ModalDemandeVisite({
  annonceId,
  prix,
  transaction,
  quartier,
  ville,
  agence,
  onClose,
}: ModalDemandeVisiteProps) {
  const [nomVisiteur, setNomVisiteur] = useState('');
  const [telVisiteur, setTelVisiteur] = useState('');
  const [dateVisite, setDateVisite] = useState('');
  const [messageVisiteur, setMessageVisiteur] = useState('');
  const [loading, setLoading] = useState(false);
  const [visiteEnvoyee, setVisiteEnvoyee] = useState(false);
  const [erreur, setErreur] = useState('');

  async function handleSubmitVisite(e: React.FormEvent) {
    e.preventDefault();
    if (!telVisiteur || telVisiteur.trim().length < 6) {
      setErreur('Veuillez renseigner un numéro de téléphone valide.');
      return;
    }

    setLoading(true);
    setErreur('');
    try {
      const res = await fetch('/api/crm-immo/public/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          annonce_id: annonceId,
          agence_id: agence?.id,
          nom: nomVisiteur || 'Visiteur Site',
          telephone: telVisiteur,
          whatsapp: telVisiteur,
          date_visite: dateVisite || null,
          message: dateVisite ? `Date souhaitée : ${dateVisite} — ${messageVisiteur}` : messageVisiteur,
          type_action: 'demande_visite',
          type_operation: transaction || 'location',
          budget: prix,
          quartier,
          ville,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setVisiteEnvoyee(true);
      } else {
        setErreur(data.error || 'Erreur lors de l’envoi de votre demande.');
      }
    } catch (err) {
      console.warn('[SUBMIT_VISITE_ERR]', err);
      setErreur('Impossible de joindre le serveur. Réessayez via WhatsApp.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15,23,42,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 16,
          width: '100%',
          maxWidth: 420,
          padding: 22,
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
            Demander une visite
          </h3>
          <button
            onClick={onClose}
            aria-label="Fermer"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center' }}
          >
            <X size={20} />
          </button>
        </div>

        {visiteEnvoyee ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CheckCircle2 size={42} style={{ color: 'var(--price, #0A5C36)', margin: '0 auto 12px' }} />
            <h4 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
              Demande transmise avec succès !
            </h4>
            <p style={{ margin: 0, fontSize: 13, color: '#64748B' }}>
              {agence ? agence.nom : 'L’agence'} a bien reçu votre demande et vous recontactera rapidement par téléphone ou WhatsApp.
            </p>
            <button
              type="button"
              onClick={onClose}
              style={{
                marginTop: 16,
                padding: '8px 18px',
                borderRadius: 8,
                background: 'var(--navy, #1C2B4A)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Fermer
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmitVisite} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                Votre Nom complet *
              </label>
              <input
                type="text"
                required
                value={nomVisiteur}
                onChange={(e) => setNomVisiteur(e.target.value)}
                placeholder="Ex: Babacar Diop"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1.5px solid var(--border, #E8DDD2)',
                  fontSize: 13.5,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                Téléphone / WhatsApp *
              </label>
              <input
                type="tel"
                required
                value={telVisiteur}
                onChange={(e) => setTelVisiteur(e.target.value)}
                placeholder="Ex: 77 123 45 67"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1.5px solid var(--border, #E8DDD2)',
                  fontSize: 13.5,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                Date souhaitée pour la visite (optionnel)
              </label>
              <input
                type="date"
                value={dateVisite}
                onChange={(e) => setDateVisite(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1.5px solid var(--border, #E8DDD2)',
                  fontSize: 13.5,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                Disponibilités ou Message
              </label>
              <textarea
                rows={3}
                value={messageVisiteur}
                onChange={(e) => setMessageVisiteur(e.target.value)}
                placeholder="Ex: Je suis disponible ce samedi matin pour visiter..."
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1.5px solid var(--border, #E8DDD2)',
                  fontSize: 13,
                  boxSizing: 'border-box',
                  resize: 'none',
                }}
              />
            </div>

            {erreur && (
              <p style={{ margin: 0, fontSize: 12, color: '#DC2626', fontWeight: 600 }}>
                {erreur}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '11px',
                borderRadius: 10,
                background: 'var(--navy, #1C2B4A)',
                color: '#ffffff',
                fontSize: 14,
                fontWeight: 800,
                border: 'none',
                cursor: loading ? 'wait' : 'pointer',
                marginTop: 4,
              }}
            >
              <Send size={16} />
              <span>{loading ? 'Envoi en cours...' : 'Envoyer ma demande'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
