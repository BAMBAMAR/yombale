'use client';

// frontend-next/src/app/surga/components/SurgaDemarcheSignalementForm.tsx
// Sous-composant modulaire : formulaire de signalement d'erreur ou d'inexactitude
// Modularité < 450 lignes, zéro émoji, tokens officiels, vouvoiement strict D19

import React, { useState } from 'react';
import { AlertTriangle, Send } from 'lucide-react';

interface SurgaDemarcheSignalementFormProps {
  demarcheId: string;
  onAnnuler: () => void;
  onErreur: (message: string) => void;
}

export default function SurgaDemarcheSignalementForm({
  demarcheId,
  onAnnuler,
  onErreur,
}: SurgaDemarcheSignalementFormProps) {
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [envoye, setEnvoye] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setEnvoiEnCours(true);
    try {
      const res = await fetch(`/api/surga/demarches/${demarcheId}/signalements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message.trim(),
          contact_email: email.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEnvoye(true);
        setMessage('');
      } else {
        onErreur(data.error || 'Impossible d\'enregistrer le signalement.');
      }
    } catch {
      onErreur('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setEnvoiEnCours(false);
    }
  };

  if (envoye) {
    return (
      <div style={{ fontSize: 12, color: 'var(--price, #0A5C36)', fontWeight: 600, padding: '6px 0' }}>
        Votre signalement a bien été transmis à la rédaction. Merci pour votre aide.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
        Signaler une erreur ou une mise à jour administrative
      </div>
      <textarea
        rows={2}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Précisez la pièce manquante, le tarif actualisé ou le nouveau lieu..."
        required
        style={{
          width: '100%',
          padding: 8,
          borderRadius: 6,
          border: '1px solid var(--border, #E8DDD2)',
          fontSize: 12,
          fontFamily: 'inherit',
          resize: 'none',
        }}
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Votre email (facultatif, pour confirmation)"
        style={{
          width: '100%',
          padding: 6,
          borderRadius: 6,
          border: '1px solid var(--border, #E8DDD2)',
          fontSize: 12,
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
        <button
          type="button"
          onClick={onAnnuler}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 12,
            color: 'var(--text3, #73675E)',
            cursor: 'pointer',
          }}
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={envoiEnCours}
          className="surga-btn-primary"
          style={{ fontSize: 12, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <Send size={11} />
          <span>{envoiEnCours ? 'Transmission...' : 'Transmettre'}</span>
        </button>
      </div>
    </form>
  );
}
