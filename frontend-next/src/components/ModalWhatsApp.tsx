'use client';
import { useState } from 'react';

interface Props {
  type: string;
  id: string;
  onClose: () => void;
}

export default function ModalWhatsApp({ type, id, onClose }: Props) {
  const [phone, setPhone]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');

  const phoneRegex = /^(\+221|221)?[0-9]{9}$/;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      setError('Numéro invalide (ex: 771234567)');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/whatsapp/send`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, id, phone: phone.replace(/\s/g, '') }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setSent(true);
        setTimeout(onClose, 2000);
      } else {
        setError(data.error || 'Erreur envoi');
      }
    } catch {
      setError('Impossible de contacter le serveur');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-whatsapp-overlay" onClick={onClose}>
      <div className="modal-whatsapp-box" onClick={(e) => e.stopPropagation()}>
        <button className="modal-whatsapp-close" onClick={onClose} aria-label="Fermer">✕</button>
        <h3>Recevoir par WhatsApp</h3>
        {sent ? (
          <p className="modal-whatsapp-success">✅ Fiche envoyée sur WhatsApp !</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <label htmlFor="wa-phone">Votre numéro WhatsApp</label>
            <input
              id="wa-phone"
              type="tel"
              placeholder="77 123 45 67"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading}
              autoFocus
            />
            {error && <p className="modal-whatsapp-error">{error}</p>}
            <button type="submit" disabled={loading || !phone}>
              {loading ? 'Envoi…' : 'Envoyer'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
