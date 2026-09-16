'use client';

import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  Phone,
  MessageCircle,
  CheckCircle2,
  Home,
  MapPin,
  Send
} from 'lucide-react';
import { BienItem } from './VitrineBiensGrid';
import { AgenceData } from './VitrineBanner';

interface ModalDemandeVisiteVitrineProps {
  bien: BienItem | null;
  agence: AgenceData | null;
  waNum: string;
  onClose: () => void;
}

export default function ModalDemandeVisiteVitrine({
  bien,
  agence,
  waNum,
  onClose,
}: ModalDemandeVisiteVitrineProps) {
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [dateVisite, setDateVisite] = useState('');
  const [creneau, setCreneau] = useState<'matin' | 'apres_midi' | 'indifferent'>('apres_midi');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!bien) return null;

  const isLoc = !!bien.prix_location;
  const prix = isLoc
    ? `${Number(bien.prix_location).toLocaleString('fr-FR')} FCFA / mois`
    : `${Number(bien.prix_vente || 0).toLocaleString('fr-FR')} FCFA`;

  const cleanWaNum = waNum.replace(/\D/g, '');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!bien) return;
    if (!nom.trim() || !telephone.trim()) {
      setErrorMsg('Veuillez renseigner votre nom et votre numéro de téléphone.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

      const creneauLabel =
        creneau === 'matin'
          ? 'Matin (09h - 12h)'
          : creneau === 'apres_midi'
          ? 'Après-midi (14h - 18h)'
          : 'Créneau indifférent';

      const detailMessage = [
        dateVisite ? `Date de visite souhaitée : ${dateVisite} (${creneauLabel})` : 'Date de visite : à convenir',
        message.trim() ? `Message : ${message.trim()}` : '',
      ]
        .filter(Boolean)
        .join(' — ');

      // Envoi du lead au CRM Agence
      await fetch('/api/crm-immo/public/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bien_id: bien.id,
          agence_id: agence?.id || agence?.slug,
          nom: nom.trim(),
          telephone: telephone.trim(),
          whatsapp: telephone.trim(),
          type_action: 'demande_visite',
          message: detailMessage,
          type_operation: isLoc ? 'location' : 'vente',
          budget: bien.prix_location || bien.prix_vente || 0,
          quartier: bien.quartier,
          ville: bien.ville,
        }),
      });

      setSubmitted(true);
    } catch (err: any) {
      console.error('[DEMANDE_VISITE_ERR]', err);
      // Même en cas de coupure API, on permet au client de confirmer sur WhatsApp
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenWhatsAppConfirmation() {
    if (!bien) return;
    const creneauLabel =
      creneau === 'matin'
        ? 'Matin (09h - 12h)'
        : creneau === 'apres_midi'
        ? 'Après-midi (14h - 18h)'
        : 'Indifférent';

    const waText =
      `Bonjour ${agence?.nom || "l'agence"},\n` +
      `Je souhaite planifier une visite pour votre bien :\n` +
      `*${bien.titre}*\n` +
      `Prix : ${prix}\n` +
      `Localisation : ${bien.quartier ? `${bien.quartier}, ${bien.ville}` : bien.ville}\n` +
      (dateVisite ? `Date souhaitée : ${dateVisite} (${creneauLabel})\n` : '') +
      `Mon nom : ${nom}\n` +
      `Mon téléphone : ${telephone}\n` +
      (message.trim() ? `Note : ${message.trim()}\n` : '') +
      `\nMerci d'avance pour votre retour !`;

    const url = `https://wa.me/${cleanWaNum}?text=${encodeURIComponent(waText)}`;
    window.open(url, '_blank');
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 16,
          maxWidth: 520,
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid var(--border, #E8DDD2)',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── En-tête ── */}
        <div
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid var(--border, #E8DDD2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#FAF8F5',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'var(--navy, #1C2B4A)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Calendar size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
                {submitted ? 'Demande envoyée !' : 'Planifier une visite'}
              </h2>
              <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>
                {agence?.nom ? `Avec l'agence ${agence.nom}` : 'Visite accompagnée'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            style={{
              background: 'none',
              border: 'none',
              color: '#64748B',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Récapitulatif du Bien ── */}
        <div
          style={{
            padding: '14px 22px',
            borderBottom: '1px solid var(--border, #E8DDD2)',
            background: '#FFFFFF',
            display: 'flex',
            gap: 12,
            alignItems: 'center',
          }}
        >
          {bien.photos && bien.photos.length > 0 ? (
            <img
              src={bien.photos[0]}
              alt={bien.titre}
              style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
            />
          ) : (
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 8,
                background: '#F1F5F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94A3B8',
                flexShrink: 0,
              }}
            >
              <Home size={24} />
            </div>
          )}

          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent, #C75B00)' }}>
              {isLoc ? 'Location' : 'Vente'} • {bien.type_bien}
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: 'var(--navy, #1C2B4A)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {bien.titre}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B', marginTop: 2 }}>
              <MapPin size={12} />
              <span>{bien.quartier ? `${bien.quartier}, ${bien.ville}` : bien.ville}</span>
              <span>•</span>
              <span style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>{prix}</span>
            </div>
          </div>
        </div>

        {/* ── Écran de Succès ── */}
        {submitted ? (
          <div style={{ padding: '28px 22px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: '50%',
                background: '#DCFCE7',
                color: '#166534',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
              }}
            >
              <CheckCircle2 size={32} />
            </div>

            <div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: '0 0 6px' }}>
                Demande transmise avec succès !
              </h3>
              <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.5, margin: 0 }}>
                Votre demande de visite a été enregistrée auprès de <strong>{agence?.nom || "l'agence"}</strong>.
                Un conseiller vous contactera dans les plus brefs délais pour convenir de l'horaire.
              </p>
            </div>

            {cleanWaNum && (
              <div
                style={{
                  background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  borderRadius: 12,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  alignItems: 'center',
                }}
              >
                <div style={{ fontSize: 12.5, color: '#166534', fontWeight: 600 }}>
                  Accélérez la confirmation en contactant directement l'agent sur WhatsApp :
                </div>
                <button
                  type="button"
                  onClick={handleOpenWhatsAppConfirmation}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background: '#16a34a',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px 18px',
                    fontSize: 13.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)',
                  }}
                >
                  <MessageCircle size={16} />
                  <span>Confirmer instantanément sur WhatsApp</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#F1F5F9',
                border: 'none',
                color: '#475569',
                padding: '10px 20px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                marginTop: 8,
              }}
            >
              Fermer
            </button>
          </div>
        ) : (
          /* ── Formulaire de Contact & Visite ── */
          <form onSubmit={handleSubmit} style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {errorMsg && (
              <div
                style={{
                  padding: '10px 14px',
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: 8,
                  fontSize: 12.5,
                  color: '#991B1B',
                  fontWeight: 600,
                }}
              >
                {errorMsg}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginBottom: 6 }}>
                Votre nom complet *
              </label>
              <div style={{ position: 'relative' }}>
                <User size={15} style={{ position: 'absolute', left: 12, top: 12, color: '#94A3B8' }} />
                <input
                  type="text"
                  required
                  placeholder="Ex: Awa Diop"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    borderRadius: 8,
                    border: '1px solid var(--border, #E8DDD2)',
                    fontSize: 13,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginBottom: 6 }}>
                Numéro de téléphone / WhatsApp *
              </label>
              <div style={{ position: 'relative' }}>
                <Phone size={15} style={{ position: 'absolute', left: 12, top: 12, color: '#94A3B8' }} />
                <input
                  type="tel"
                  required
                  placeholder="+221 77 000 00 00"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    borderRadius: 8,
                    border: '1px solid var(--border, #E8DDD2)',
                    fontSize: 13,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginBottom: 6 }}>
                  Date souhaitée
                </label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={15} style={{ position: 'absolute', left: 12, top: 12, color: '#94A3B8' }} />
                  <input
                    type="date"
                    value={dateVisite}
                    onChange={(e) => setDateVisite(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      borderRadius: 8,
                      border: '1px solid var(--border, #E8DDD2)',
                      fontSize: 12.5,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginBottom: 6 }}>
                  Créneau préféré
                </label>
                <div style={{ position: 'relative' }}>
                  <Clock size={15} style={{ position: 'absolute', left: 12, top: 12, color: '#94A3B8' }} />
                  <select
                    value={creneau}
                    onChange={(e) => setCreneau(e.target.value as any)}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      borderRadius: 8,
                      border: '1px solid var(--border, #E8DDD2)',
                      fontSize: 12.5,
                      outline: 'none',
                      background: '#FFFFFF',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="apres_midi">Après-midi (14h-18h)</option>
                    <option value="matin">Matin (09h-12h)</option>
                    <option value="indifferent">Indifférent</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginBottom: 6 }}>
                Précisions ou question (facultatif)
              </label>
              <textarea
                rows={2}
                placeholder="Ex: Êtes-vous disponible ce samedi ? Le bien est-il négociable ?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                style={{
                  width: '100%',
                  padding: 10,
                  borderRadius: 8,
                  border: '1px solid var(--border, #E8DDD2)',
                  fontSize: 12.5,
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background: 'var(--navy, #1C2B4A)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 8,
                  padding: '11px 16px',
                  fontSize: 13.5,
                  fontWeight: 800,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                <Send size={15} />
                <span>{loading ? 'Envoi en cours...' : 'Envoyer ma demande'}</span>
              </button>

              {cleanWaNum && (
                <button
                  type="button"
                  onClick={handleOpenWhatsAppConfirmation}
                  title="Contacter sur WhatsApp directement"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: '#16a34a',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 8,
                    padding: '11px 16px',
                    fontSize: 13.5,
                    fontWeight: 750,
                    cursor: 'pointer',
                  }}
                >
                  <MessageCircle size={16} />
                  <span>WhatsApp</span>
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
