'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  CheckCircle2,
  MessageCircle,
  ExternalLink,
  Phone,
  User,
  Calendar,
  Star
} from 'lucide-react';
import { fcfa } from '@/lib/format';
import ModalDemandeVisite from './ModalDemandeVisite';

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
  contactTel: string | null;
  contactNom: string | null;
  agence: AgenceInfo | null;
  agent: AgentInfo | null;
}

export default function BlocAgenceAnnonce({
  annonceId,
  titre,
  prix,
  transaction,
  quartier,
  ville,
  contactTel,
  contactNom,
  agence,
  agent,
}: BlocAgenceAnnonceProps) {
  const [showModalVisite, setShowModalVisite] = useState(false);

  // Numéro WhatsApp prioritaire : WhatsApp agence > WhatsApp agent > téléphone contact
  const rawWa = agence?.whatsapp || agence?.telephone || agent?.telephone || contactTel || '';
  const cleanWa = rawWa.replace(/\D/g, '');

  const waText = encodeURIComponent(
    `Bonjour ${agence?.nom ? agence.nom : ''},\n\nJe vous contacte au sujet du bien vu sur Nopalou :\n*${titre}*${prix ? ` — ${fcfa(prix)}` : ''}\n📍 ${[quartier, ville].filter(Boolean).join(', ')}\n🔗 https://nopalou.com/immo/${annonceId}\n\nEst-il toujours disponible ?`
  );

  const waUrl = `https://wa.me/${cleanWa}?text=${waText}`;

  // Ingestion automatique du prospect dans le CRM de l'agence lors du clic WhatsApp
  function handleWhatsAppClick() {
    if (agence?.id) {
      try {
        fetch('/api/crm-immo/public/lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            annonce_id: annonceId,
            agence_id: agence.id,
            telephone: cleanWa,
            nom: 'Prospect WhatsApp',
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
              <Building2 size={24} style={{ color: '#ffffff' }} />
            </div>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#ffffff', lineHeight: 1.2 }}>
                {agence ? agence.nom : (contactNom || 'Annonce Particulier')}
              </span>
              {agence?.sponsorise && (
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
              ) : agence ? (
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
                  Agence Immobilière Vérifiée
                </span>
              ) : (
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
                  Propriétaire Particulier
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Détail de l'Agent Responsable si renseigné */}
        {agent?.nom && (
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
        {/* Téléphone direct */}
        {cleanWa && (
          <a
            href={`tel:${cleanWa}`}
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
              textDecoration: 'none',
              background: '#ffffff',
            }}
          >
            <Phone size={16} style={{ color: 'var(--navy, #1C2B4A)' }} />
            <span>Appeler : {rawWa}</span>
          </a>
        )}

        {/* Bouton WhatsApp officiel avec capture automatique CRM */}
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

        {/* Bouton Demande de Visite Formelle */}
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

        {/* Lien direct vers la Vitrine Publique de l'Agence */}
        {agence?.slug && (
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

      {/* ── Modale Modulaire de Demande de Visite ── */}
      {showModalVisite && (
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
