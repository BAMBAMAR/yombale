'use client';

import { useEffect, useState } from 'react';
import { deleteAlerte, fetchUserAlertes } from '@/app/actions/alertes';
import { useTranslation } from '@/i18n/context';
import { fcfa } from '@/lib/format';

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
  const { t } = useTranslation();

  useEffect(() => {
    const fetchAlertes = async () => {
      try {
        const result = await fetchUserAlertes(userId);
        if (!result.ok) {
          throw new Error(result.error || t('errors.serverError'));
        }
        setAlertes(result.alertes || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('errors.serverError'));
      } finally {
        setLoading(false);
      }
    };

    fetchAlertes();
  }, [userId, t]);

  const handleDelete = async (id: string) => {
    if (!confirm(t('account.confirmDeleteAlert'))) return;

    setDeletingId(id);
    try {
      const result = await deleteAlerte(id);
      if (!result.ok) {
        throw new Error(result.error || t('errors.serverError'));
      }
      setAlertes((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : t('errors.serverError'));
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <div className="loading">{t('common.loading')}</div>;
  if (error) return <div className="error">{error}</div>;
  if (alertes.length === 0)
    return <div className="empty">{t('account.noAlertsCreated')}</div>;

  return (
    <div className="alertes-list table-alertes-wrap">
      <table className="table-alertes">
        <thead>
          <tr>
            <th>{t('account.colProduct')}</th>
            <th>{t('account.colTargetPrice')}</th>
            <th>{t('account.colEmail')}</th>
            <th>{t('account.colCreated')}</th>
            <th>{t('account.colAction')}</th>
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
                {fcfa(alerte.prix_cible)}
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
                  aria-label={t('account.adActionDelete')}
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
