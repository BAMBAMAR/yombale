// frontend-next/src/app/boutique/components/WebhooksManager.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Webhook, Key, Copy, Plus, Trash2, CheckCircle2, ShieldCheck, RefreshCw } from 'lucide-react';

interface WebhookItem {
  id: string;
  url: string;
  secret: string;
  events: string[];
  actif: boolean;
  created_at: string;
}

interface WebhooksManagerProps {
  boutiqueId: string;
}

export function WebhooksManager({ boutiqueId }: WebhooksManagerProps) {
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [url, setUrl] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('order.created');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchWebhooks();
  }, [boutiqueId]);

  const fetchWebhooks = async () => {
    try {
      const res = await fetch(`/api/boutiques/${boutiqueId}/webhooks`);
      if (res.ok) {
        const data = await res.json();
        if (data.webhooks) setWebhooks(data.webhooks);
      }
    } catch (err) {
      console.error('Erreur chargement webhooks:', err);
    }
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/boutiques/${boutiqueId}/webhooks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), events: [selectedEvent] })
      });
      if (res.ok) {
        setUrl('');
        fetchWebhooks();
      }
    } catch (err) {
      console.error('Erreur création webhook:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    try {
      const res = await fetch(`/api/boutiques/${boutiqueId}/webhooks/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchWebhooks();
      }
    } catch (err) {
      console.error('Erreur suppression webhook:', err);
    }
  };

  const handleCopySecret = (secret: string, id: string) => {
    navigator.clipboard.writeText(secret);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="webhooks-manager-card" style={{
      background: 'var(--card, #ffffff)',
      border: '1px solid var(--border, #E8DDD2)',
      borderRadius: '12px',
      padding: '24px',
      marginTop: '16px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <Webhook size={22} style={{ color: 'var(--accent, #C75B00)' }} />
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--navy, #1C2B4A)' }}>
            Gestionnaire de Webhooks & Notifications d'Événements
          </h3>
          <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
            Recevez des notifications HTTP POST en direct avec signature HMAC-SHA256
          </p>
        </div>
      </div>

      {/* Formulaire de création */}
      <form onSubmit={handleCreateWebhook} style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '12px', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--navy, #1C2B4A)', marginBottom: '4px' }}>
              URL d'Écoute Webhook (https://...)
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.votre-serveur.com/webhooks/nopalou"
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '13px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--navy, #1C2B4A)', marginBottom: '4px' }}>
              Événement Déclencheur
            </label>
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', fontSize: '13px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            >
              <option value="order.created">order.created (Nouvelle commande)</option>
              <option value="product.updated">product.updated (Modification produit)</option>
              <option value="stock.low">stock.low (Stock bas / Épuisé)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--accent, #C75B00)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '9px 16px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Plus size={15} />
            Ajouter Webhook
          </button>
        </div>
      </form>

      {/* Liste des webhooks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {webhooks.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '13px', background: '#f8fafc', borderRadius: '8px' }}>
            Aucun webhook enregistré. Ajoutez une URL pour recevoir des événements en direct.
          </div>
        ) : (
          webhooks.map((wh) => (
            <div key={wh.id} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#ffffff',
              border: '1px solid var(--border, #E8DDD2)',
              borderRadius: '8px',
              padding: '12px 16px'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy, #1C2B4A)', marginBottom: '4px' }}>
                  {wh.url}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: '#64748b' }}>
                  <span>Événements : <strong>{Array.isArray(wh.events) ? wh.events.join(', ') : wh.events}</strong></span>
                  <span>Secret : <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{wh.secret.substring(0, 10)}...</code></span>
                  <button
                    type="button"
                    onClick={() => handleCopySecret(wh.secret, wh.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--accent, #C75B00)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Copy size={12} />
                    {copiedId === wh.id ? 'Copié !' : 'Copier secret'}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDeleteWebhook(wh.id)}
                style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
