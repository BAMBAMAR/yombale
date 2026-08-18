'use client';

import { useState } from 'react';
import { createAlerte } from '@/app/actions/alertes';
import { useTranslation } from '@/i18n/context';

interface FormAlerteProps {
  userId: string;
}

export default function FormAlerte({ userId }: FormAlerteProps) {
  const [produitId, setProduitId] = useState('');
  const [prixCible, setPrixCible] = useState('');
  const [canal, setCanal]         = useState<'whatsapp' | 'email' | 'les_deux'>('whatsapp');
  const [email, setEmail]         = useState('');
  const [telephone, setTelephone] = useState('');
  const [loading, setLoading]     = useState(false);
  const [status, setStatus]       = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage]     = useState('');
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pCible = parseFloat(prixCible);
    if (!produitId || !pCible || pCible <= 0) {
      setStatus('error');
      setMessage(t('errors.fieldRequired'));
      return;
    }

    const needEmail = canal === 'email' || canal === 'les_deux';
    const needTel   = canal === 'whatsapp' || canal === 'les_deux';

    if (needTel && (!telephone || telephone.trim().length < 6)) {
      setStatus('error');
      setMessage(t('auth.waInvalidPhone'));
      return;
    }
    if (needEmail && (!email || !email.includes('@'))) {
      setStatus('error');
      setMessage(t('errors.invalidEmail'));
      return;
    }

    setLoading(true);
    try {
      const result = await createAlerte(
        produitId,
        pCible,
        needEmail ? email.trim() : undefined,
        needTel ? telephone.trim() : undefined
      );

      if (!result.ok) {
        throw new Error(result.error || t('errors.serverError'));
      }

      setStatus('success');
      setMessage(t('account.alertCreatedSuccess'));
      setProduitId('');
      setPrixCible('');
      setEmail('');
      setTelephone('');
      setTimeout(() => setStatus('idle'), 5000);
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : t('errors.serverError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-alerte">
      <div className="form-group">
        <label htmlFor="produit_id">{t('account.productId')}</label>
        <input
          id="produit_id"
          type="text"
          placeholder="UUID ou ID produit"
          value={produitId}
          onChange={(e) => setProduitId(e.target.value)}
          disabled={loading}
          required
        />
        <small>Trouvez l&apos;ID sur la fiche produit (URL: /produit/[id])</small>
      </div>

      <div className="form-group">
        <label htmlFor="prix_cible">{t('account.targetPrice')}</label>
        <input
          id="prix_cible"
          type="number"
          placeholder="Ex: 50000"
          value={prixCible}
          onChange={(e) => setPrixCible(e.target.value)}
          disabled={loading}
          min="0"
          step="100"
          required
        />
      </div>

      <div className="form-group">
        <label>{t('account.notificationChannel')}</label>
        <div style={{ display: 'flex', gap: 6, margin: '4px 0 10px', background: '#f1f5f9', padding: 4, borderRadius: 10 }}>
          <button
            type="button"
            onClick={() => setCanal('whatsapp')}
            style={{
              flex: 1, padding: '8px', borderRadius: 8, border: 'none',
              fontSize: 12, fontWeight: 800, cursor: 'pointer',
              background: canal === 'whatsapp' ? '#25D366' : 'transparent',
              color: canal === 'whatsapp' ? '#ffffff' : '#475569',
            }}
          >
            💬 WhatsApp
          </button>
          <button
            type="button"
            onClick={() => setCanal('email')}
            style={{
              flex: 1, padding: '8px', borderRadius: 8, border: 'none',
              fontSize: 12, fontWeight: 800, cursor: 'pointer',
              background: canal === 'email' ? 'var(--navy)' : 'transparent',
              color: canal === 'email' ? '#ffffff' : '#475569',
            }}
          >
            📧 Email
          </button>
          <button
            type="button"
            onClick={() => setCanal('les_deux')}
            style={{
              flex: 1, padding: '8px', borderRadius: 8, border: 'none',
              fontSize: 12, fontWeight: 800, cursor: 'pointer',
              background: canal === 'les_deux' ? '#7c3aed' : 'transparent',
              color: canal === 'les_deux' ? '#ffffff' : '#475569',
            }}
          >
            {t('account.bothChannels')}
          </button>
        </div>
      </div>

      {(canal === 'whatsapp' || canal === 'les_deux') && (
        <div className="form-group">
          <label htmlFor="telephone">{t('account.phoneForWa')}</label>
          <input
            id="telephone"
            type="tel"
            placeholder="Ex: 77 123 45 67"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            disabled={loading}
            required={canal === 'whatsapp'}
          />
        </div>
      )}

      {(canal === 'email' || canal === 'les_deux') && (
        <div className="form-group">
          <label htmlFor="email">{t('account.emailForConfirmation')}</label>
          <input
            id="email"
            type="email"
            placeholder="votre@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required={canal === 'email'}
          />
        </div>
      )}

      <button type="submit" disabled={loading} className="button-primary">
        {loading ? t('account.submitting') : t('account.createAlertBtn')}
      </button>

      {status !== 'idle' && (
        <div className={`form-status form-status-${status}`}>
          {message}
        </div>
      )}
    </form>
  );
}
