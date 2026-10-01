'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  CheckCircle2,
  MessageCircle,
  ExternalLink,
  Phone,
  Eye,
  User,
  Calendar,
  Star
} from 'lucide-react';
import { fcfa } from '@/lib/format';
import ModalDemandeVisite from './ModalDemandeVisite';

function formaterNumeroMasque(tel: string): { masque: string; complet: string } {
  const digits = tel.replace(/\D/g, '');
  const net = digits.startsWith('221') ? digits.slice(3) : digits;

  if (net.length === 9) {
    const p1 = net.slice(0, 2);
    const p2 = net.slice(2, 5);
    const p3 = net.slice(5, 7);
    const p4 = net.slice(7, 9);
    return {
      masque: `${p1} ${p2} •• ••`,
      complet: `${p1} ${p2} ${p3} ${p4}`,
    };
  }

  if (digits.length >= 6) {
    return {
      masque: `${digits.slice(0, 4)} ••• ••`,
      complet: tel,
    };
  }

  return {
    masque: '•• •• •• ••',
    complet: tel,
  };
}

export interface AgenceInfo {
  id: string;
  nom: string;
  slug: string;
  logo_url?: string | null;
  description?: string | null;
  adresse?: string | null;
  ville?: string | null;
  quartier?: string | null;
  telephone?: string | null;
  whatsapp?: string | null;
  email_contact?: string | null;
  site_web?: string | null;
  numero_agrement?: string | null;
  sponsorise?: boolean;
}

export interface AgentInfo {
  id: string;
  nom: string;
  telephone?: string | null;
  email?: string | null;
}

interface BlocAgenceAnnonceProps {
  annonceId: string;
  titre: string;
  prix: number | null;
  transaction: string | null;
  quartier: string | null;
  ville: string | null;
  typeBien: string | null;
  contactTelMasque: string | null; // AUD-137 : le numéro d'un particulier n'est révélé qu'au clic (serveur)
  contactTelDisponible: boolean;
  contactNom: string | null;
  agence: AgenceInfo | null;
  agent: AgentInfo | null;
  urlSource?: string | null;
  source?: string | null;
}

export default function BlocAgenceAnnonce({
  annonceId,
  titre,
  prix,
  transaction,
  quartier,
  ville,
  contactTelMasque,
  contactTelDisponible,
  contactNom,
  agence,
  agent,
  urlSource,
  source,
}: BlocAgenceAnnonceProps) {
  const [showModalVisite, setShowModalVisite] = useState(false);
  const [telRevealed, setTelRevealed] = useState(false);
  const [telPrive, setTelPrive] = useState<{ telephone: string; whatsapp: string } | null>(null);
  const [revelationErreur, setRevelationErreur] = useState<string | null>(null);
  const isAgence = Boolean(agence?.id);

  // Numéro officiel de l'agence (public) ; à défaut, numéro d'un particulier révélé au clic par le serveur (AUD-137)
  const officiel = agence?.whatsapp || agence?.telephone || agent?.telephone || '';
  const aTelPrive = !officiel && contactTelDisponible;
  const rawWa = officiel || telPrive?.whatsapp || '';
  const cleanWa = rawWa.replace(/\D/g, '');
  const telFormat = officiel
    ? formaterNumeroMasque(cleanWa || rawWa)
    : { masque: contactTelMasque || '•• ••• •• ••', complet: telPrive?.telephone || '' };

  async function revelerTelPrive() {
    setRevelationErreur(null);
    try {
      const res = await fetch(`/api/immo/${annonceId}/contact`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setRevelationErreur(data.error || 'Numéro indisponible pour le moment.');
        return;
      }
      setTelPrive({ telephone: data.telephone, whatsapp: data.whatsapp });
      setTelRevealed(true);
      try {
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'show_phone_number_immo', { event_category: 'ImmoContact', event_label: titre });
        }
      } catch (_) {}
    } catch {
      setRevelationErreur('Connexion impossible, réessayez.');
    }
  }

  const waText = encodeURIComponent(
    `Bonjour ${agence?.nom ? agence.nom : ''},\n\nJe vous contacte au sujet du bien vu sur Nopalou :\n*${titre}*${prix ? ` — ${fcfa(prix)}` : ''}\n📍 ${[quartier, ville].filter(Boolean).join(', ')}\n🔗 https://nopalou.com/immo/${annonceId}\n\nEst-il toujours disponible ?`
  );

  const waUrl = `https://wa.me/${cleanWa}?text=${waText}`;

  // Conciergerie Chasseur Immo Nopalou pour les annonces sans contact direct
  const chasseurTel = '221777202086';
  const chasseurText = encodeURIComponent(
    `Bonjour Nopalou Chasseur Immo,\n\nJe suis intéressé(e) par ce bien vu sur votre portail :\n*${titre}*${prix ? ` — ${fcfa(prix)}` : ''}\n📍 ${[quartier, ville].filter(Boolean).join(', ')}\n🔗 https://nopalou.com/immo/${annonceId}\n\nPouvez-vous vérifier la disponibilité de ce bien et m'aider à organiser une visite ?`
  );
  const chasseurWaUrl = `https://wa.me/${chasseurTel}?text=${chasseurText}`;

  function handleChasseurClick() {
    let visitorTel: string | null = null;
    let visitorNom = 'Prospect Chasseur Immo';
    try {
      const savedTel = localStorage.getItem('nopalou_client_tel');
      const savedNom = localStorage.getItem('nopalou_client_nom');
      if (savedTel?.trim()) visitorTel = savedTel.trim();
      if (savedNom?.trim()) visitorNom = savedNom.trim();
    } catch {}

    fetch('/api/crm-immo/public/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        annonce_id: annonceId,
        telephone: visitorTel || '221000000000',
        nom: visitorNom,
        type_action: 'chasseur_immo_click',
        type_operation: transaction || 'location',
        budget: prix,
        quartier,
        ville,
      }),
    }).catch(() => {});
  }

  // Ingestion automatique du prospect dans le CRM de l'agence lors du clic WhatsApp
  function handleWhatsAppClick() {
    if (agence?.id) {
      let visitorTel: string | null = null
      let visitorNom = 'Prospect WhatsApp (Clic)'
      try {
        const savedTel = localStorage.getItem('nopalou_client_tel')
        const savedNom = localStorage.getItem('nopalou_client_nom')
        if (savedTel?.trim()) visitorTel = savedTel.trim()
      } catch (e) {
        // Ignorer si localStorage inaccessible (ex: navigation privée restrictive)
      }

      try {
        fetch('/api/crm-immo/public/lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            annonce_id: annonceId,
            agence_id: agence.id,
            telephone: visitorTel,
            nom: visitorNom,
            type_action: 'whatsapp_click',
            type_operation: transaction || 'location',
            budget: prix,
            quartier,
            ville,
          }),
        }).catch((err) => console.warn('[CRM_LEAD_LOG_WARN]', err));
      } catch (err) {
        console.warn('[CRM_LEAD_ERR]', err);
      }
    }
  }

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: 14,
        border: '1.5px solid var(--border, #E8DDD2)',
        overflow: 'hidden',
        marginTop: 16,
        boxShadow: '0 4px 14px rgba(28,43,74,0.04)',
      }}
    >
      {/* ── En-tête Agence ou Particulier ── */}
      <div
        style={{
          background: 'var(--navy, #1C2B4A)',
          color: '#ffffff',
          padding: '16px 18px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {agence?.logo_url ? (
            <img
              src={agence.logo_url}
              alt={agence.nom}
              style={{
                width: 46,
                height: 46,
                borderRadius: 10,
                objectFit: 'cover',
                background: '#ffffff',
                border: '1.5px solid rgba(255,255,255,0.2)',
              }}
            />
          ) : (
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 10,
                background: 'rgba(255,255,255,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isAgence ? (
                <Building2 size={24} style={{ color: '#ffffff' }} />
              ) : (
                <User size={24} style={{ color: '#ffffff' }} />
              )}
            </div>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#ffffff', lineHeight: 1.2 }}>
                {isAgence
                  ? agence!.nom
                  : (contactNom || (source === 'coinafrique' ? 'Annonce CoinAfrique' : source === 'expat-dakar' ? 'Annonce Expat-Dakar' : 'Annonce Particulier'))}
              </span>
              {isAgence && agence?.sponsorise && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                    fontSize: 10.5,
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                    color: '#ffffff',
                    padding: '2px 7px',
                    borderRadius: 12,
                  }}
                >
                  <Star size={11} fill="#ffffff" />
                  <span>En Vedette</span>
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              {agence?.numero_agrement ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#93C5FD' }}>
                  <CheckCircle2 size={12} />
                  <span>Agréée N° {agence.numero_agrement}</span>
                </span>
              ) : isAgence ? (
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
                  Agence Immobilière Vérifiée
                </span>
              ) : (
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
                  {source === 'coinafrique'
                    ? 'Annonceur CoinAfrique'
                    : source === 'expat-dakar'
                    ? 'Annonceur Expat-Dakar'
                    : 'Propriétaire Particulier'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Détail de l'Agent Responsable si agence */}
        {isAgence && agent?.nom && (
          <div
            style={{
              marginTop: 12,
              paddingTop: 10,
              borderTop: '1px solid rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12,
              color: 'rgba(255,255,255,0.85)',
            }}
          >
            <User size={14} style={{ color: 'var(--accent, #C75B00)' }} />
            <span>Conseiller référent : <strong>{agent.nom}</strong></span>
          </div>
        )}
      </div>

      {/* ── Corps : Coordonnées & Actions ── */}
      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Téléphone direct masqué en partie par défaut avec révélation au clic */}
        {(cleanWa || aTelPrive) && (
          <button
            type="button"
            onClick={() => {
              if (!telRevealed && aTelPrive) {
                void revelerTelPrive();
              } else if (!telRevealed) {
                setTelRevealed(true);
                try {
                  if (typeof window !== 'undefined' && (window as any).gtag) {
                    (window as any).gtag('event', 'show_phone_number_immo', {
                      event_category: 'ImmoContact',
                      event_label: titre,
                    });
                  }
                } catch (_) {}
              } else {
                window.location.href = `tel:${cleanWa || (telPrive?.whatsapp ?? '')}`;
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '11px 14px',
              borderRadius: 10,
              border: '1.5px solid var(--border, #E8DDD2)',
              color: 'var(--navy, #1C2B4A)',
              fontSize: 13.5,
              fontWeight: 750,
              background: '#ffffff',
              cursor: 'pointer',
              width: '100%',
              transition: 'all 0.15s ease',
            }}
            title={telRevealed ? "Cliquez pour appeler directement" : "Cliquez pour afficher le numéro complet"}
          >
            <Phone size={16} style={{ color: 'var(--navy, #1C2B4A)' }} />
            <span>Appeler : {telRevealed ? telFormat.complet : telFormat.masque}</span>
            {!telRevealed && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11,
                  background: 'var(--bg, #F8F5F0)',
                  color: 'var(--accent, #C75B00)',
                  padding: '2px 8px',
                  borderRadius: 6,
                  fontWeight: 700,
                  border: '1px solid var(--border, #E8DDD2)',
                  marginLeft: 4,
                }}
              >
                <Eye size={12} />
                Afficher
              </span>
            )}
          </button>
        )}

        {/* Bouton WhatsApp avec capture lead CRM si agence */}
        {cleanWa && (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleWhatsAppClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '12px 14px',
              borderRadius: 10,
              background: '#25D366',
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 800,
              textDecoration: 'none',
              boxShadow: '0 3px 10px rgba(37,211,102,0.25)',
            }}
          >
            <MessageCircle size={18} />
            <span>Discuter sur WhatsApp</span>
          </a>
        )}

        {/* Conciergerie Chasseur Nopalou si aucun numéro direct disponible */}
        {revelationErreur && (
          <p role="alert" style={{ margin: 0, fontSize: 12, color: 'var(--danger, #B42318)' }}>{revelationErreur}</p>
        )}

        {!cleanWa && !aTelPrive && !isAgence && (
          <div
            style={{
              padding: '13px 14px',
              borderRadius: 12,
              background: 'var(--bg, #F8F5F0)',
              border: '1.5px solid var(--border, #E8DDD2)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ fontSize: '0.84rem', color: 'var(--navy, #1C2B4A)', fontWeight: 750, lineHeight: '1.35' }}>
              Coordonnées directes masquées sur la source
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B', lineHeight: '1.4' }}>
              Confiez ce bien au <strong>Chasseur Immo Nopalou</strong> : nous contactons le propriétaire et organisons votre visite sans frais.
            </p>
            <a
              href={chasseurWaUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleChasseurClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '11px 14px',
                borderRadius: 10,
                background: '#25D366',
                color: '#ffffff',
                fontSize: 13,
                fontWeight: 800,
                textDecoration: 'none',
                boxShadow: '0 3px 10px rgba(37,211,102,0.25)',
                marginTop: 4,
              }}
            >
              <MessageCircle size={16} />
              <span>Demander au Chasseur Nopalou</span>
            </a>
          </div>
        )}

        {/* Bouton Demande de Visite Formelle — STRICTEMENT RÉSERVÉ AUX AGENCES NOPALOU */}
        {isAgence && (
          <button
            type="button"
            onClick={() => setShowModalVisite(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '11px 14px',
              borderRadius: 10,
              background: 'var(--accent, #C75B00)',
              color: '#ffffff',
              fontSize: 13.5,
              fontWeight: 800,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(199,91,0,0.2)',
            }}
          >
            <Calendar size={16} />
            <span>Demander une visite</span>
          </button>
        )}

        {/* Lien direct vers la Vitrine Publique de l'Agence */}
        {isAgence && agence?.slug && (
          <Link
            href={`/agences/${agence.slug}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '10px 14px',
              borderRadius: 10,
              background: 'var(--bg, #F8F5F0)',
              color: 'var(--navy, #1C2B4A)',
              fontSize: 12.5,
              fontWeight: 750,
              textDecoration: 'none',
              marginTop: 4,
            }}
          >
            <span>Voir tous les biens de cette agence</span>
            <ExternalLink size={14} />
          </Link>
        )}
      </div>

      {/* ── Modale Modulaire de Demande de Visite — UNIQUEMENT pour agences ── */}
      {showModalVisite && isAgence && (
        <ModalDemandeVisite
          annonceId={annonceId}
          prix={prix}
          transaction={transaction}
          quartier={quartier}
          ville={ville}
          agence={agence}
          onClose={() => setShowModalVisite(false)}
        />
      )}
    </div>
  );
}
