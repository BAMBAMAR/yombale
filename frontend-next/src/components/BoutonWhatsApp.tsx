'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';

const ModalWhatsApp = dynamic(() => import('./ModalWhatsApp'), { ssr: false });

interface Props {
  type: 'annonce' | 'immo' | 'produit' | 'telecom';
  id: string;
  isConnecte: boolean;
}

export default function BoutonWhatsApp({ type, id, isConnecte }: Props) {
  const [showModal, setShowModal]   = useState(false);
  const [loading, setLoading]       = useState(false);
  const [sent, setSent]             = useState(false);

  async function handleClick() {
    if (sent) return;
    if (!isConnecte) {
      setShowModal(true);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/whatsapp/send`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ type, id }),
        }
      );
      const data = await res.json();
      if (data.success) setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading || sent}
        className="bouton-whatsapp-fiche"
        aria-label="Recevoir cette fiche par WhatsApp"
      >
        {sent ? '✅ Envoyé !' : loading ? 'Envoi…' : '📩 Recevoir par WhatsApp'}
      </button>
      {showModal && (
        <ModalWhatsApp type={type} id={id} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}
