'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Building2,
  Calendar,
  CreditCard,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Phone,
  AlertCircle,
  Download,
  ArrowRight,
  ExternalLink
} from 'lucide-react'
import { fcfa } from '@/lib/format'
import BadgePaySafe from '@/components/BadgePaySafe'
import PayerLoyerContratCard from './components/PayerLoyerContratCard'
import PayerLoyerSuccesCard from './components/PayerLoyerSuccesCard'

interface EcheanceInfo {
  id: string
  periode: string
  date_echeance: string
  montant_du: number
  montant_paye: number
  montant_restant: number
  statut: string
  quittance_url: string | null
  loyer_mensuel: number
  charges: number
  bien: {
    titre: string
    adresse: string
    quartier: string
    ville: string
  }
  locataire: {
    nom: string
    prenom: string
    telephone: string
  }
  agence: {
    nom: string
    telephone: string
    whatsapp: string
    slug: string
    logo_url?: string
  }
  bail?: {
    id: string
    pdf_url: string
    conditions?: string
    depot_garantie?: number
    jour_echeance?: number
    date_debut?: string
    date_fin?: string
  }
}

interface Props {
  echeanceId: string
  initialData: EcheanceInfo | null
  initialError: string | null
}

export default function PayerLoyerClient({ echeanceId, initialData, initialError }: Props) {
  const [echeance, setEcheance] = useState<EcheanceInfo | null>(initialData)
  const [erreur, setErreur] = useState<string | null>(initialError)
  const [methode, setMethode] = useState<'Wave' | 'Orange Money'>('Wave')
  const [telephone, setTelephone] = useState<string>(initialData?.locataire?.telephone || '')
  const [enPaiement, setEnPaiement] = useState(false)
  const [payeSucces, setPayeSucces] = useState(initialData?.statut === 'paye')
  const [quittancePdfUrl, setQuittancePdfUrl] = useState<string | null>(
    initialData?.quittance_url || `/api/locatif-immo/public/quittance/${echeanceId}.pdf`
  )

  if (erreur || !echeance) {
    return (
      <div
        style={{
          background: '#ffffff',
          borderRadius: 20,
          padding: 28,
          border: '1px solid #E8DDD2',
          textAlign: 'center',
          boxShadow: '0 8px 24px rgba(0,0,0,0.06)'
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: '#FEE2E2',
            color: '#DC2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px'
          }}
        >
          <AlertCircle size={24} />
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: '#1C2B4A', margin: '0 0 6px' }}>
          Lien de Paiement Invalide
        </h2>
        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px' }}>
          {erreur || 'Cette échéance de loyer n’a pas été trouvée ou a expiré.'}
        </p>
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--navy, #1C2B4A)',
            color: '#ffffff',
            padding: '10px 18px',
            borderRadius: 10,
            textDecoration: 'none',
            fontSize: 13,
            fontWeight: 800
          }}
        >
          <span>Retourner à l&apos;accueil</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    )
  }

  const montantTotal = echeance.montant_du || echeance.loyer_mensuel + (echeance.charges || 0)

  const handlePayer = async (e: React.FormEvent) => {
    e.preventDefault()
    setEnPaiement(true)
    setErreur(null)

    try {
      const res = await fetch(`/api/locatif-immo/public/payer-loyer/${echeanceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          methode_paiement: methode,
          telephone_payeur: telephone,
          reference_paiement: `LOYER-${Date.now().toString(36).toUpperCase()}`
        })
      })

      const json = await res.json()
      if (json.success) {
        if (json.wave_url) {
          window.location.href = json.wave_url
          return
        }
        setPayeSucces(true)
        setQuittancePdfUrl(json.quittance_url || `/api/locatif-immo/public/quittance/${echeanceId}.pdf`)
      } else {
        setErreur(json.error || 'Erreur lors de la validation du paiement.')
      }
    } catch {
      setErreur('Problème réseau lors du règlement.')
    } finally {
      setEnPaiement(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Carte principale */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 20,
          padding: 24,
          border: '1px solid #E8DDD2',
          boxShadow: '0 10px 30px rgba(0,0,0,0.06)'
        }}
      >
        {/* Agence Émettrice */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #E8DDD2',
            paddingBottom: 14,
            marginBottom: 16
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'rgba(28, 43, 74, 0.08)',
                color: 'var(--navy, #1C2B4A)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Building2 size={20} />
            </div>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Gestion Immobilière
              </span>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
                {echeance.agence.nom}
              </h3>
            </div>
          </div>

          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              padding: '4px 10px',
              borderRadius: 20,
              background: payeSucces ? '#DCFCE7' : '#FEF3C7',
              color: payeSucces ? '#15803D' : '#B45309'
            }}
          >
            {payeSucces ? 'Loyer Acquitté' : 'En Attente'}
          </span>
        </div>

        {/* Détails du Bien & Période */}
        <div
          style={{
            background: '#F8F5F0',
            border: '1px solid #E8DDD2',
            borderRadius: 14,
            padding: 16,
            marginBottom: 18,
            display: 'flex',
            flexDirection: 'column',
            gap: 10
          }}
        >
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>Logement :</span>
            <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
              {echeance.bien.titre}
            </div>
            <div style={{ fontSize: 12, color: '#475569' }}>
              {echeance.bien.adresse ? `${echeance.bien.adresse}, ` : ''}
              {echeance.bien.quartier ? `${echeance.bien.quartier} - ` : ''}
              {echeance.bien.ville}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #E8DDD2', paddingTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={14} color="#64748b" />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>
                Période : {echeance.periode}
              </span>
            </div>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              Locataire : <strong>{echeance.locataire.prenom ? `${echeance.locataire.prenom} ` : ''}{echeance.locataire.nom}</strong>
            </span>
          </div>
        </div>

        {/* Accès direct & Téléchargement Contrat de Bail Officiel */}
        <PayerLoyerContratCard
          echeanceId={echeanceId}
          bienTitre={echeance.bien.titre}
          pdfUrl={echeance.bail?.pdf_url}
        />

        {/* Récapitulatif Financier */}
        <div style={{ marginBottom: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#475569' }}>
            <span>Loyer mensuel :</span>
            <strong style={{ color: '#1C2B4A' }}>{fcfa(echeance.loyer_mensuel)}</strong>
          </div>
          {Boolean(echeance.charges) && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#475569' }}>
              <span>Charges locatives :</span>
              <strong style={{ color: '#1C2B4A' }}>{fcfa(echeance.charges)}</strong>
            </div>
          )}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              borderTop: '1.5px solid #E8DDD2',
              paddingTop: 10,
              marginTop: 4
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
              Total à régler :
            </span>
            <span
              style={{
                fontSize: 22,
                fontWeight: 900,
                color: payeSucces ? '#0A5C36' : 'var(--accent, #C75B00)',
                letterSpacing: '-0.02em'
              }}
            >
              {fcfa(montantTotal)}
            </span>
          </div>
        </div>

        {/* ÉTAT 1 : DÉJÀ PAYÉ / PAIEMENT CONFIRMÉ */}
        {payeSucces ? (
          <PayerLoyerSuccesCard
            periode={echeance.periode}
            echeanceId={echeanceId}
            quittancePdfUrl={quittancePdfUrl}
          />
        ) : (
          /* ÉTAT 2 : FORMULAIRE DE PAIEMENT SÉCURISÉ */
          <form onSubmit={handlePayer} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Choix de méthode */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--navy, #1C2B4A)', display: 'block', marginBottom: 8 }}>
                Sélectionnez votre moyen de paiement :
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setMethode('Wave')}
                  style={{
                    padding: '10px',
                    borderRadius: 12,
                    border: methode === 'Wave' ? '2px solid #1D4ED8' : '1px solid #CBD5E1',
                    background: methode === 'Wave' ? '#EFF6FF' : '#ffffff',
                    fontWeight: 800,
                    fontSize: 13,
                    color: methode === 'Wave' ? '#1D4ED8' : '#475569',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  <CreditCard size={16} />
                  <span>Wave (1-Clic)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMethode('Orange Money')}
                  style={{
                    padding: '10px',
                    borderRadius: 12,
                    border: methode === 'Orange Money' ? '2px solid #EA580C' : '1px solid #CBD5E1',
                    background: methode === 'Orange Money' ? '#FFF7ED' : '#ffffff',
                    fontWeight: 800,
                    fontSize: 13,
                    color: methode === 'Orange Money' ? '#EA580C' : '#475569',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  <CreditCard size={16} />
                  <span>Orange Money</span>
                </button>
              </div>
            </div>

            {/* Téléphone payeur */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--navy, #1C2B4A)', display: 'block', marginBottom: 6 }}>
                Numéro de compte Mobile Money :
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 12, top: 12, color: '#94a3b8' }}>
                  <Phone size={16} />
                </div>
                <input
                  type="tel"
                  required
                  placeholder="77 123 45 67"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 38px',
                    borderRadius: 10,
                    border: '1.5px solid #CBD5E1',
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#1C2B4A',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Bouton de confirmation */}
            <button
              type="submit"
              disabled={enPaiement}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 12,
                border: 'none',
                background: methode === 'Wave' ? '#1D4ED8' : '#EA580C',
                color: '#ffffff',
                fontSize: 14,
                fontWeight: 900,
                cursor: enPaiement ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
            >
              <ShieldCheck size={18} />
              <span>
                {enPaiement ? 'Validation en cours...' : `Payer ${fcfa(montantTotal)} par ${methode}`}
              </span>
            </button>
          </form>
        )}
      </div>

      {/* Sceau de Confiance Nopalou Pay Safe */}
      <BadgePaySafe type="immo" />

      {/* Raccourci vers le portail global sans compte */}
      {echeance.locataire.telephone && (
        <div style={{ textAlign: 'center', marginTop: 4 }}>
          <Link
            href={`/payer-loyer?tel=${encodeURIComponent(echeance.locataire.telephone)}`}
            style={{
              fontSize: 12.5,
              fontWeight: 700,
              color: 'var(--accent, #C75B00)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <span>Consulter tous mes baux, loyers &amp; quittances sans mot de passe</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Contact Agence */}
      <div style={{ textAlign: 'center', fontSize: 12, color: '#64748b' }}>
        Besoin d&apos;aide ? Contactez l&apos;agence {echeance.agence.nom} au{' '}
        <a
          href={`tel:${echeance.agence.telephone}`}
          style={{ color: 'var(--navy, #1C2B4A)', fontWeight: 800, textDecoration: 'none' }}
        >
          {echeance.agence.telephone}
        </a>
      </div>
    </div>
  )
}
