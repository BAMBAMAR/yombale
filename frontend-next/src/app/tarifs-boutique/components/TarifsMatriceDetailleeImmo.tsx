'use client'

import React, { useState } from 'react'
import { Check, X, ChevronDown, Sparkles } from 'lucide-react'

interface FeatureRow {
  nom: string
  detail: string
  essentiel: boolean | string
  pro: boolean | string
  reseau: boolean | string
}

interface FeatureSection {
  categorie: string
  items: FeatureRow[]
}

const MATRICE_IMMO_SECTIONS: FeatureSection[] = [
  {
    categorie: 'Gestion des Mandats & Biens Immobiliers',
    items: [
      { nom: 'Portefeuille de biens en ligne', detail: 'Villas, appartements, studios, terrains, bureaux', essentiel: 'Illimité', pro: 'Illimité', reseau: 'Illimité' },
      { nom: 'Nombre d\'agents négociateurs', detail: 'Comptes collaborateurs avec accès personnalisés', essentiel: '5 agents', pro: '20 agents', reseau: 'Illimité' },
      { nom: 'Fiches biens géolocalisées avec commodités', detail: 'Écoles, commerces, transports et points d\'intérêt à Dakar', essentiel: true, pro: true, reseau: true },
      { nom: 'Photos HD & Visites Vidéo Reels', detail: 'Intégration vidéo TikTok/YouTube et galerie photos fluide', essentiel: true, pro: true, reseau: true },
      { nom: 'Gestion des mandats simples & exclusifs', detail: 'Suivi des dates d\'effet, reconductions et commissions', essentiel: true, pro: true, reseau: true },
      { nom: 'Vitrine web agence publique sur Nopalou', detail: 'Page dédiée nopalou.com/agences/[slug] avec coordonnées', essentiel: true, pro: true, reseau: true },
    ]
  },
  {
    categorie: 'Gestion Locative & Baux Juridiques OHADA',
    items: [
      { nom: 'Génération de baux conformes OHADA', detail: 'Clauses d\'habitation et commerciales légales sénégalaises', essentiel: true, pro: true, reseau: true },
      { nom: 'Émission de Quittances certifiées PDF', detail: 'Format officiel infalsifiable avec QR Code de contrôle', essentiel: true, pro: true, reseau: true },
      { nom: 'Calendrier des échéances de loyer', detail: 'Tableau de bord des loyers échus, en attente et réglés', essentiel: true, pro: true, reseau: true },
      { nom: 'Relances automatiques WhatsApp des impayés', detail: 'Alerte courtoise avec lien direct Wave envoyé au locataire', essentiel: false, pro: true, reseau: true },
      { nom: 'Redditions de comptes bailleurs mensuelles', detail: 'Relevé récapitulatif net après déduction des honoraires', essentiel: 'Basique', pro: 'Détaillé', reseau: 'Consolidé Groupe' },
      { nom: 'Suivi des cautions & états des lieux', detail: 'Archivage numérique des inventaires et dépôts de garantie', essentiel: true, pro: true, reseau: true },
    ]
  },
  {
    categorie: 'Encaissement des Loyers & Passerelle Financière',
    items: [
      { nom: 'Collecte 1-clic Wave & Orange Money', detail: 'Paiement sans déplacement via la page sécurisée /payer-loyer', essentiel: true, pro: true, reseau: true },
      { nom: 'Commission sur encaissements de loyer', detail: 'Aucun prélèvement de commission sur vos flux locatifs', essentiel: '0% Commission', pro: '0% Commission', reseau: '0% Commission' },
      { nom: 'Prélèvement automatique des honoraires', detail: 'Vos frais de gestion sont déduits à la source automatiquement', essentiel: true, pro: true, reseau: true },
      { nom: 'Reversements nets directs aux bailleurs', detail: 'Virement ou transfert direct sur le compte du propriétaire', essentiel: true, pro: true, reseau: true },
      { nom: 'Espace Locataire dédié (Mon Compte)', detail: 'Accès locataire pour télécharger l\'historique des quittances', essentiel: true, pro: true, reseau: true },
    ]
  },
  {
    categorie: 'CRM Acquéreurs, Matching & Prospection',
    items: [
      { nom: 'Fichier des acquéreurs & locataires en recherche', detail: 'Enregistrement des budgets, typologies et quartiers visés', essentiel: true, pro: true, reseau: true },
      { nom: 'Matching intelligent automatique par WhatsApp', detail: 'Alerte instantanée envoyée au prospect dès qu\'un bien correspond', essentiel: false, pro: 'Score ≥ 65%', reseau: 'Score ≥ 65%' },
      { nom: 'Suivi des visites & offres de négociation', detail: 'Historique des visites effectuées avec compte-rendu client', essentiel: true, pro: true, reseau: true },
      { nom: 'Référencement sur l\'annuaire public des agences', detail: 'Visibilité auprès des propriétaires cherchant un gestionnaire', essentiel: 'Standard', pro: 'Prioritaire', reseau: 'Tête de Liste' },
    ]
  },
  {
    categorie: 'Réseau, Multi-Succursales & Administration',
    items: [
      { nom: 'Gestion multi-succursales & filiales', detail: 'Supervision de plusieurs agences (Dakar, Saly, Thiès...)', essentiel: false, pro: false, reseau: true },
      { nom: 'Tableaux de bord consolidés groupe', detail: 'Vue d\'ensemble des chiffres d\'affaires, baux et royalties réseau', essentiel: false, pro: false, reseau: true },
      { nom: 'Export comptable des baux et états locatifs', detail: 'Export des données au format Excel, CSV et PDF certifié', essentiel: false, pro: true, reseau: true },
      { nom: 'Account Manager VIP dédié 7j/7', detail: 'Accompagnement prioritaire et assistance juridique baux OHADA', essentiel: false, pro: 'Support 7j/7', reseau: 'Dédié VIP 7j/7' },
    ]
  }
]

export default function TarifsMatriceDetailleeImmo() {
  const [open, setOpen] = useState(true)

  function renderValue(val: boolean | string) {
    if (typeof val === 'string') {
      return (
        <span style={{ fontSize: 12.5, fontWeight: 800, color: '#1C2B4A' }}>
          {val}
        </span>
      )
    }
    if (val === true) {
      return (
        <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#ede9fe', color: '#7c3aed', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <Check size={14} strokeWidth={3} />
        </div>
      )
    }
    return (
      <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#F1F5F9', color: '#94A3B8', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <X size={14} strokeWidth={2.5} />
      </div>
    )
  }

  return (
    <div style={{ background: '#ffffff', borderRadius: 24, border: '1px solid #E2E8F0', boxShadow: '0 8px 30px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
      
      {/* Header dépliable */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          padding: '24px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          background: open ? '#faf5ff' : '#ffffff',
          borderBottom: open ? '1px solid #ede9fe' : 'none',
          transition: 'background 0.2s ease',
        }}
      >
        <div>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#7c3aed', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Pôle Immobilier Professionnel &amp; Gestion Locative
          </span>
          <h2 style={{ fontSize: 'clamp(18px, 3vw, 24px)', fontWeight: 900, color: '#1C2B4A', margin: '4px 0 0' }}>
            Tableau Comparatif Détaillé des Fonctionnalités Agences
          </h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>
            Transparence totale : comparez les quotas d&apos;agents, baux OHADA, quittances et gestion multi-succursales.
          </p>
        </div>
        <button
          type="button"
          style={{
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: 12,
            padding: '8px 14px',
            fontSize: 13,
            fontWeight: 700,
            color: '#334155',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            cursor: 'pointer',
          }}
        >
          <span>{open ? 'Masquer le tableau' : 'Afficher le comparatif'}</span>
          <ChevronDown size={16} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
        </button>
      </div>

      {/* Corps du tableau */}
      {open && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 700, borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '16px 24px', fontSize: 13, fontWeight: 800, color: '#475569', width: '40%' }}>
                  Fonctionnalités réelles Nopalou ERP Immo
                </th>
                <th style={{ padding: '16px 16px', fontSize: 13, fontWeight: 800, color: '#1C2B4A', textAlign: 'center', width: '20%' }}>
                  Plan Essentiel (0 FCFA)
                </th>
                <th style={{ padding: '16px 16px', fontSize: 13, fontWeight: 900, color: '#7c3aed', textAlign: 'center', width: '20%', background: '#faf5ff' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Sparkles size={13} />
                    Plan Agence Pro (10k)
                  </span>
                </th>
                <th style={{ padding: '16px 16px', fontSize: 13, fontWeight: 800, color: '#b45309', textAlign: 'center', width: '20%' }}>
                  Réseau Multi-Agences (15k)
                </th>
              </tr>
            </thead>
            <tbody>
              {MATRICE_IMMO_SECTIONS.map((sec, sIdx) => (
                <React.Fragment key={sIdx}>
                  {/* Titre de section */}
                  <tr style={{ background: '#f1f5f9', borderTop: sIdx > 0 ? '2px solid #e2e8f0' : 'none', borderBottom: '1px solid #cbd5e1' }}>
                    <td colSpan={4} style={{ padding: '10px 24px', fontSize: 12, fontWeight: 900, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {sec.categorie}
                    </td>
                  </tr>

                  {/* Lignes de fonctionnalités */}
                  {sec.items.map((item, iIdx) => (
                    <tr
                      key={iIdx}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        background: iIdx % 2 === 0 ? '#ffffff' : '#fcfcfd',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <td style={{ padding: '12px 24px' }}>
                        <div style={{ fontWeight: 700, fontSize: 13.5, color: '#0f172a' }}>{item.nom}</div>
                        <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>{item.detail}</div>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {renderValue(item.essentiel)}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', background: '#faf5ff' }}>
                        {renderValue(item.pro)}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {renderValue(item.reseau)}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
