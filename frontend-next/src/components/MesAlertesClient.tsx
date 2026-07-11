'use client';

import { useEffect, useState } from 'react';
import { backendAuthFetch } from '@/lib/backendFetch';

interface Alerte {
  id: string;
  produit_id: string;
  produit_nom: string;
  prix_cible: number;
  email: string;
  active: boolean;
  created_at: string;
}

interface MesAlertesClientProps {
  userId: string;
}

export default function MesAlertesClient({ userId }: MesAlertesClientProps) {
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlertes = async () => {
      try {
        const res = await backendAuthFetch(`/api/alertes/user/${userId}`);
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        const data = await res.json();
        setAlertes(Array.isArray(data) ? data : data.alertes || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur chargement');
      } finally {
        setLoading(false);
      }
    };

    fetchAlertes();
  }, [userId]);

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette alerte ?')) return;

    setDeletingId(id);
    try {
      const res = await backendAuthFetch(`/api/alertes/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      setAlertes((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur suppression');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error">{error}</div>;
  if (alertes.length === 0)
    return <div className="empty">Aucune alerte créée.</div>;

  return (
    <div className="alertes-list">
      <table className="table-alertes">
        <thead>
          <tr>
            <th>Produit</th>
            <th>Prix cible</th>
            <th>Email</th>
            <th>Créée</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {alertes.map((alerte) => (
            <tr key={alerte.id}>
              <td>
                <a href={`/produit/${alerte.produit_id}`} target="_blank" rel="noreferrer">
                  {alerte.produit_nom}
                </a>
              </td>
              <td className="price">
                {new Intl.NumberFormat('fr-SN').format(alerte.prix_cible)} FCFA
              </td>
              <td className="email-small">{alerte.email}</td>
              <td className="date-small">
                {new Date(alerte.created_at).toLocaleDateString('fr-FR')}
              </td>
              <td>
                <button
                  className="button-danger button-sm"
                  onClick={() => handleDelete(alerte.id)}
                  disabled={deletingId === alerte.id}
                >
                  {deletingId === alerte.id ? '...' : '✕'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
