'use client';

import { useState } from 'react';
import { createAlerte } from '@/app/actions/alertes';

interface FormAlerteProps {
  userId: string;
}

export default function FormAlerte({ userId }: FormAlerteProps) {
  const [produitId, setProduitId] = useState('');
  const [prixCible, setPrixCible] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!produitId || !prixCible || !email) {
      setStatus('error');
      setMessage('Tous les champs sont requis');
      return;
    }

    setLoading(true);
    try {
      const result = await createAlerte(produitId, parseFloat(prixCible), email);

      if (!result.ok) {
        throw new Error(result.error || 'Erreur serveur');
      }

      setStatus('success');
      setMessage('Alerte créée ! Vous recevrez un email/WhatsApp quand le prix baisse.');
      setProduitId('');
      setPrixCible('');
      setEmail('');
      setTimeout(() => setStatus('idle'), 5000);
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Erreur serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-alerte">
      <div className="form-group">
        <label htmlFor="produit_id">ID Produit</label>
        <input
          id="produit_id"
          type="text"
          placeholder="UUID ou ID produit"
          value={produitId}
          onChange={(e) => setProduitId(e.target.value)}
          disabled={loading}
        />
        <small>Trouvez l'ID sur la fiche produit (URL: /produit/[id])</small>
      </div>

      <div className="form-group">
        <label htmlFor="prix_cible">Prix cible (FCFA)</label>
        <input
          id="prix_cible"
          type="number"
          placeholder="Ex: 50000"
          value={prixCible}
          onChange={(e) => setPrixCible(e.target.value)}
          disabled={loading}
          min="0"
          step="100"
        />
      </div>

      <div className="form-group">
        <label htmlFor="email">Email pour confirmation</label>
        <input
          id="email"
          type="email"
          placeholder="votre@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
      </div>

      <button type="submit" disabled={loading} className="button-primary">
        {loading ? 'Création...' : 'Créer alerte'}
      </button>

      {status !== 'idle' && (
        <div className={`form-status form-status-${status}`}>
          {message}
        </div>
      )}
    </form>
  );
}
