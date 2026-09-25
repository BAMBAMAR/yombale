'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Home,
  FileText,
  Download,
  Calendar,
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  CreditCard,
  ExternalLink,
  MessageCircle,
  Loader2,
  UserCheck,
} from 'lucide-react'
import { getImmoAuthHeaders } from '@/lib/immo-auth'

interface Echeance {
  id: string
  periode: string
  date_echeance: string
  montant_du: number
  montant_paye: number
  date_paiement: string | null
  statut: 'paye' | 'en_attente' | 'retard' | 'impaye'
  mode_paiement: string | null
  quittance_url: string | null
}

interface LocationItem {
  bail_id: string
  role_vue?: 'bailleur' | 'locataire'
  date_debut: string
  date_fin: string | null
  loyer_mensuel: number
  charges: number
  depot_garantie: number
  statut_bail: string
  bien: {
    id: string
    titre: string
    adresse: string | null
    quartier: string | null
    ville: string | null
    type_bien: string | null
    photos: string[] | null
  }
  agence: {
    id: string
    nom: string
    slug: string
    telephone: string | null
    whatsapp: string | null
    email: string | null
  }
  locataire?: {
    nom: string
    prenom?: string | null
    telephone?: string | null
    email?: string | null
  }
  proprietaire?: {
    nom: string
    prenom?: string | null
    telephone?: string | null
  }
  echeances: Echeance[]
}

const fmt = (n: number) => Math.round(n).toLocaleString('fr-FR')

export default function MesLocationsClient() {
  const [locations, setLocations] = useState<LocationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [payingId, setPayingId] = useState<string | null>(null)
  const [paySuccessMsg, setPaySuccessMsg] = useState<string | null>(null)

  async function chargerLocations() {
    try {
      setLoading(true)
      const res = await fetch('/api/locatif-immo/mes-locations', {
        headers: getImmoAuthHeaders(),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setLocations(data.locations || [])
        }
      }
    } catch (err) {
      console.warn('[MesLocationsClient] Erreur chargement locations :', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    chargerLocations()
  }, [])

  async function handlePayerLoyer(echeanceId: string) {
    try {
      setPayingId(echeanceId)
      const res = await fetch(`/api/locatif-immo/public/payer-loyer/${echeanceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          methode_paiement: 'Wave',
          reference_paiement: `WAVE-${Date.now()}`
        })
      })
      const data = await res.json()
      if (data.success) {
        setPaySuccessMsg('Règlement validé avec succès ! Votre quittance officielle a été émise.')
        await chargerLocations()
        setTimeout(() => setPaySuccessMsg(null), 5000)
      }
    } catch (err) {
      console.error('[PayerLoyerErr]', err)
    } finally {
      setPayingId(null)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', background: '#ffffff', borderRadius: 16, border: '1px solid var(--border, #E8DDD2)' }}>
        <Loader2 size={28} className="animate-spin" style={{ color: 'var(--accent, #C75B00)', margin: '0 auto 12px' }} />
        <p style={{ margin: 0, fontWeight: 700, color: 'var(--navy, #1C2B4A)', fontSize: 14 }}>
          Recherche de vos contrats de location et quittances...
        </p>
      </div>
    )
  }

  // État vide
  if (locations.length === 0) {
    return (
      <div style={{ background: '#ffffff', borderRadius: 16, border: '1px solid var(--border, #E8DDD2)', padding: '48px 24px', textAlign: 'center' }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #FAF8F5 0%, #FFF3E8 100%)',
            color: 'var(--navy, #1C2B4A)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            border: '1.5px solid var(--border, #E8DDD2)',
          }}
        >
          <Home size={26} style={{ color: 'var(--accent, #C75B00)' }} />
        </div>
        <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
          Aucun contrat de location actif
        </h3>
        <p style={{ margin: '0 auto 24px', maxWidth: 460, fontSize: 13.5, color: '#64748B', lineHeight: 1.5 }}>
          Vos contrats de bail et quittances officielles certifiées émis par des agences partenaires Nopalou s&apos;afficheront automatiquement ici dès que votre dossier sera validé.
        </p>
        <Link
          href="/immo"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 10,
            background: 'var(--navy, #1C2B4A)',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: 13,
            textDecoration: 'none',
          }}
        >
          <Building2 size={15} style={{ color: 'var(--accent, #C75B00)' }} />
          <span>Explorer les logements à louer à Dakar</span>
        </Link>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {paySuccessMsg && (
        <div style={{ padding: '12px 16px', borderRadius: 12, background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 700 }}>
          <CheckCircle2 size={18} style={{ color: '#059669', flexShrink: 0 }} />
          <span>{paySuccessMsg}</span>
        </div>
      )}

      {locations.map((loc) => {
        const isBailleur = loc.role_vue === 'bailleur'
        const agenceWa = loc.agence.whatsapp || loc.agence.telephone
        return (
          <div
            key={loc.bail_id}
            style={{
              background: '#ffffff',
              borderRadius: 16,
              border: '1px solid var(--border, #E8DDD2)',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(28,43,74,0.05)',
            }}
          >
            {/* Header Bail */}
            <div
              style={{
                padding: '16px 20px',
                background: 'linear-gradient(135deg, #FAF8F5 0%, #FFF3E8 100%)',
                borderBottom: '1px solid var(--border, #E8DDD2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: isBailleur ? 'var(--navy, #1C2B4A)' : 'var(--accent, #C75B00)' }}>
                    {isBailleur ? 'Mandat de Gestion Bailleur' : 'Bail Locatif Conforme'}
                  </span>
                  <span style={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 10,
                    background: isBailleur ? '#E0E7FF' : '#DCFCE7',
                    color: isBailleur ? '#3730A3' : '#166534',
                  }}>
                    {isBailleur ? 'Espace Propriétaire' : (loc.statut_bail === 'actif' ? 'En cours' : loc.statut_bail)}
                  </span>
                </div>
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
                  {loc.bien.titre}
                </h4>
                <p style={{ margin: '4px 0 0', fontSize: 12.5, color: '#64748B' }}>
                  {[loc.bien.adresse, loc.bien.quartier, loc.bien.ville].filter(Boolean).join(', ')}
                </p>
                {isBailleur && loc.locataire && (
                  <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--price, #0A5C36)', fontWeight: 700 }}>
                    Locataire en place : {loc.locataire.prenom ? `${loc.locataire.prenom} ` : ''}{loc.locataire.nom}
                    {loc.locataire.telephone ? ` (${loc.locataire.telephone})` : ''}
                  </p>
                )}
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Loyer Mensuel</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--price, #0A5C36)' }}>
                  {fmt(loc.loyer_mensuel)} FCFA
                </div>
                {loc.charges > 0 && (
                  <div style={{ fontSize: 11, color: '#64748B' }}>
                    + {fmt(loc.charges)} FCFA charges
                  </div>
                )}
              </div>
            </div>

            {/* Agence Info & Contact */}
            <div
              style={{
                padding: '12px 20px',
                borderBottom: '1px solid var(--border, #E8DDD2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 10,
                fontSize: 12.5,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Building2 size={15} style={{ color: 'var(--navy, #1C2B4A)' }} />
                <span style={{ fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
                  Gestionnaire : {loc.agence.nom}
                </span>
              </div>

              {agenceWa && (
                <a
                  href={`https://wa.me/${agenceWa.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour ${loc.agence.nom}, je vous contacte au sujet de ${isBailleur ? 'mon bien' : 'mon bail'} (${loc.bien.titre}).`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '4px 10px',
                    borderRadius: 6,
                    background: '#25D366',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: 11.5,
                    textDecoration: 'none',
                  }}
                >
                  <MessageCircle size={13} />
                  <span>Contacter l&apos;agence</span>
                </a>
              )}
            </div>

            {/* Tableau des Quittances & Échéances */}
            <div style={{ padding: '16px 20px' }}>
              <h5 style={{ margin: '0 0 12px', fontSize: 13.5, fontWeight: 800, color: 'var(--navy, #1C2B4A)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <FileText size={15} style={{ color: 'var(--accent, #C75B00)' }} />
                <span>{isBailleur ? 'Suivi des Encaissements & Quittances' : 'Historique des Loyers & Quittances Officielles'}</span>
              </h5>

              {loc.echeances.length === 0 ? (
                <p style={{ margin: 0, fontSize: 12.5, color: '#64748B', fontStyle: 'italic' }}>
                  Aucune échéance enregistrée pour ce bail.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {loc.echeances.map((ech) => {
                    const isPaye = ech.statut === 'paye'
                    const isEnRetard = ech.statut === 'retard' || ech.statut === 'impaye'
                    return (
                      <div
                        key={ech.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: 10,
                          background: isPaye ? '#F8FAFC' : isEnRetard ? '#FEF2F2' : '#FFFBEB',
                          border: `1px solid ${isPaye ? '#E2E8F0' : isEnRetard ? '#FECACA' : '#FDE68A'}`,
                          flexWrap: 'wrap',
                          gap: 10,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              background: isPaye ? '#DCFCE7' : isEnRetard ? '#FEE2E2' : '#FEF3C7',
                              color: isPaye ? '#166534' : isEnRetard ? '#991B1B' : '#92400E',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {isPaye ? <CheckCircle2 size={16} /> : isEnRetard ? <AlertCircle size={16} /> : <Clock size={16} />}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                              Période : {ech.periode}
                            </div>
                            <div style={{ fontSize: 11, color: '#64748B' }}>
                              Échéance : {new Date(ech.date_echeance).toLocaleDateString('fr-FR')} &bull; Montant : {fmt(ech.montant_du)} FCFA
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {isPaye && ech.quittance_url ? (
                            <a
                              href={ech.quittance_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={`quittance_${ech.periode}.pdf`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '6px 12px',
                                borderRadius: 8,
                                background: 'var(--navy, #1C2B4A)',
                                color: '#ffffff',
                                fontSize: 11.5,
                                fontWeight: 800,
                                textDecoration: 'none',
                              }}
                            >
                              <Download size={13} />
                              <span>Quittance PDF</span>
                            </a>
                          ) : isBailleur ? (
                            <span
                              style={{
                                padding: '5px 10px',
                                borderRadius: 6,
                                fontSize: 11.5,
                                fontWeight: 700,
                                background: isEnRetard ? '#FEE2E2' : '#FEF3C7',
                                color: isEnRetard ? '#991B1B' : '#92400E',
                              }}
                            >
                              {isEnRetard ? 'Loyer Impayé' : 'En attente d\'encaissement'}
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handlePayerLoyer(ech.id)}
                              disabled={payingId === ech.id}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '6px 12px',
                                borderRadius: 8,
                                background: '#1D4ED8',
                                color: '#ffffff',
                                border: 'none',
                                fontSize: 11.5,
                                fontWeight: 800,
                                cursor: 'pointer',
                              }}
                            >
                              <CreditCard size={13} />
                              <span>{payingId === ech.id ? 'Paiement en cours...' : 'Régler par Wave'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
