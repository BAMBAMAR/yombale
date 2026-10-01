'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Store,
  CreditCard,
  CheckCircle2,
  ShieldCheck,
  Phone,
  AlertCircle,
  ArrowRight,
  Receipt,
  RotateCcw
} from 'lucide-react'

interface DossierData {
  client: {
    id: string
    nom: string
    telephone: string
    solde: number
  }
  boutique: {
    id: string
    nom: string
    slug: string
    telephone: string
    adresse: string
    ville: string
    logo_url?: string
  }
  echeances?: Array<{
    id: string
    date_echeance: string
    montant_prevu: number
    montant_paye: number
    montant_restant: number
    statut: string
  }>
}

interface Props {
  token: string
  initialData: DossierData | null
  initialError: string | null
}

export default function PayerCreditClient({ token, initialData, initialError }: Props) {
  const [dossier] = useState<DossierData | null>(initialData)
  const [erreur, setErreur] = useState<string | null>(initialError)
  const soldeTotal = dossier?.client?.solde || 0

  const [montantChoisi, setMontantChoisi] = useState<number>(soldeTotal)
  const [typeMontant, setTypeMontant] = useState<'total' | 'partiel'>('total')
  const [methode, setMethode] = useState<'wave' | 'orange_money'>('wave')
  const [chargement, setChargement] = useState(false)
  const [succes, setSucces] = useState(soldeTotal === 0 && Boolean(initialData))
  const [recuInfo, setRecuInfo] = useState<{
    montant: number
    nouveauSolde: number
    reference: string
    date: string
  } | null>(null)

  const formatFCFA = (val: number) => {
    return new Intl.NumberFormat('fr-FR').format(Math.round(val)) + ' FCFA'
  }

  const handleTypeChange = (type: 'total' | 'partiel') => {
    setTypeMontant(type)
    if (type === 'total') {
      setMontantChoisi(soldeTotal)
    }
  }

  const handlePaiement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dossier || montantChoisi <= 0) return

    setChargement(true)
    setErreur(null)

    try {
      const res = await fetch(`/api/public-credit/${token}/confirmer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          montant: montantChoisi,
          mode_paiement: methode,
          reference_transaction: `PAY_CREDIT_${Date.now()}`
        })
      })

      const data = await res.json()
      if (data.success) {
        setRecuInfo({
          montant: data.montant_paye || montantChoisi,
          nouveauSolde: data.nouveau_solde ?? 0,
          reference: data.transaction?.reference || `REC-${Date.now().toString(36).toUpperCase()}`,
          date: new Date().toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        })
        setSucces(true)
      } else {
        setErreur(data.error || 'Erreur lors de la validation du règlement.')
      }
    } catch (err: any) {
      setErreur('Impossible de joindre le serveur. Veuillez vérifier votre connexion.')
    } finally {
      setChargement(false)
    }
  }

  if (erreur || !dossier) {
    return (
      <div
        style={{
          background: '#ffffff',
          borderRadius: 20,
          padding: 28,
          border: '1px solid var(--border, #E8DDD2)',
          textAlign: 'center',
          boxShadow: '0 8px 24px rgba(0,0,0,0.06)'
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'rgba(220, 38, 38, 0.1)',
            color: '#DC2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}
        >
          <AlertCircle size={24} />
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 8px', color: 'var(--navy, #1C2B4A)' }}>
          Dossier Indisponible
        </h2>
        <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.5, margin: '0 0 20px' }}>
          {erreur || 'Le lien de règlement est introuvable ou a déjà expiré.'}
        </p>
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 20px',
            background: 'var(--navy, #1C2B4A)',
            color: '#ffffff',
            borderRadius: 12,
            fontWeight: 700,
            textDecoration: 'none',
            fontSize: 14
          }}
        >
          Retour à l'accueil
        </Link>
      </div>
    )
  }

  // Écran de succès / Quittance
  if (succes && recuInfo) {
    return (
      <div
        style={{
          background: '#ffffff',
          borderRadius: 20,
          padding: 28,
          border: '1px solid var(--border, #E8DDD2)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.06)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(10, 92, 54, 0.1)',
              color: 'var(--price, #0A5C36)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}
          >
            <CheckCircle2 size={32} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--navy, #1C2B4A)', margin: '0 0 6px' }}>
            Règlement Validé avec Succès !
          </h2>
          <p style={{ margin: 0, fontSize: 13.5, color: '#64748B' }}>
            Votre versement a été déduit immédiatement du carnet de dettes.
          </p>
        </div>

        {/* Détails du reçu */}
        <div
          style={{
            background: 'var(--bg, #F8F5F0)',
            borderRadius: 16,
            padding: 20,
            marginBottom: 24,
            border: '1px solid var(--border, #E8DDD2)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid #E2E8F0', marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: '#64748B' }}>Boutique bénéficiaire</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>{dossier.boutique.nom}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid #E2E8F0', marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: '#64748B' }}>Client débiteur</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>{dossier.client.nom}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid #E2E8F0', marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: '#64748B' }}>Montant réglé</span>
            <span style={{ fontSize: 15, fontWeight: 900, color: 'var(--price, #0A5C36)' }}>{formatFCFA(recuInfo.montant)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid #E2E8F0', marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: '#64748B' }}>Nouveau solde restant</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: recuInfo.nouveauSolde === 0 ? 'var(--price, #0A5C36)' : 'var(--accent, #C75B00)' }}>
              {recuInfo.nouveauSolde === 0 ? '0 FCFA (Dette soldée)' : formatFCFA(recuInfo.nouveauSolde)}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: '#94A3B8' }}>Référence reçu</span>
            <span style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 600, color: '#64748B' }}>{recuInfo.reference}</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            type="button"
            onClick={() => window.print()}
            style={{
              width: '100%',
              padding: '13px 18px',
              borderRadius: 12,
              border: '1px solid var(--border, #E8DDD2)',
              background: '#ffffff',
              color: 'var(--navy, #1C2B4A)',
              fontWeight: 700,
              fontSize: 14,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: 'pointer'
            }}
          >
            <Receipt size={16} />
            Imprimer / Enregistrer le reçu
          </button>

          <Link
            href={`/boutiques/${dossier.boutique.slug || dossier.boutique.id}`}
            style={{
              width: '100%',
              padding: '13px 18px',
              borderRadius: 12,
              background: 'var(--navy, #1C2B4A)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: 14,
              textAlign: 'center',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxSizing: 'border-box'
            }}
          >
            <Store size={16} />
            Visiter la boutique
          </Link>
        </div>
      </div>
    )
  }

  // Écran de saisie / Paiement de la créance
  return (
    <form
      onSubmit={handlePaiement}
      style={{
        background: '#ffffff',
        borderRadius: 20,
        padding: 24,
        border: '1px solid var(--border, #E8DDD2)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.06)'
      }}
    >
      {/* Profil Boutique & Sécurité */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: 16,
          borderBottom: '1px solid #F1F5F9',
          marginBottom: 20
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(28, 43, 74, 0.08)',
              color: 'var(--navy, #1C2B4A)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Store size={22} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
              {dossier.boutique.nom}
            </div>
            <div style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Phone size={12} />
              {dossier.boutique.telephone || 'Boutique partenaire'}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 10px',
            borderRadius: 9999,
            background: 'rgba(10, 92, 54, 0.08)',
            color: 'var(--price, #0A5C36)',
            fontSize: 11,
            fontWeight: 700
          }}
        >
          <ShieldCheck size={14} />
          Certifié Nopalou
        </div>
      </div>

      {/* Carte Montant Dû */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(28, 43, 74, 0.04) 0%, rgba(199, 91, 0, 0.06) 100%)',
          borderRadius: 16,
          padding: 20,
          border: '1px solid var(--border, #E8DDD2)',
          marginBottom: 20,
          textAlign: 'center'
        }}
      >
        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
          Solde débiteur actuel
        </div>
        <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--accent, #C75B00)', letterSpacing: '-0.02em', marginBottom: 4 }}>
          {formatFCFA(soldeTotal)}
        </div>
        <div style={{ fontSize: 13, color: '#475569' }}>
          Titulaire du compte : <strong>{dossier.client.nom}</strong>
        </div>
      </div>

      {/* Choix du montant (Total ou Partiel) */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginBottom: 8 }}>
          Montant du règlement
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          <button
            type="button"
            onClick={() => handleTypeChange('total')}
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              border: typeMontant === 'total' ? '2px solid var(--navy, #1C2B4A)' : '1px solid var(--border, #E8DDD2)',
              background: typeMontant === 'total' ? 'rgba(28, 43, 74, 0.05)' : '#ffffff',
              color: 'var(--navy, #1C2B4A)',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer'
            }}
          >
            Régler la totalité ({formatFCFA(soldeTotal)})
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('partiel')}
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              border: typeMontant === 'partiel' ? '2px solid var(--navy, #1C2B4A)' : '1px solid var(--border, #E8DDD2)',
              background: typeMontant === 'partiel' ? 'rgba(28, 43, 74, 0.05)' : '#ffffff',
              color: 'var(--navy, #1C2B4A)',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer'
            }}
          >
            Montant libre / Avance
          </button>
        </div>

        {typeMontant === 'partiel' && (
          <div>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                min="100"
                max={soldeTotal}
                step="50"
                value={montantChoisi || ''}
                onChange={(e) => setMontantChoisi(Number(e.target.value) || 0)}
                placeholder="Ex: 5000"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: '1px solid #CBD5E1',
                  fontSize: 15,
                  fontWeight: 700,
                  color: 'var(--navy, #1C2B4A)',
                  boxSizing: 'border-box'
                }}
              />
              <span style={{ position: 'absolute', right: 14, top: 12, fontSize: 13, fontWeight: 700, color: '#94A3B8' }}>
                FCFA
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748B' }}>
              Solde restant après versement : <strong>{formatFCFA(Math.max(0, soldeTotal - montantChoisi))}</strong>
            </p>
          </div>
        )}
      </div>

      {/* Mode de Paiement */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginBottom: 8 }}>
          Moyen de paiement sécurisé (0% frais)
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <button
            type="button"
            onClick={() => setMethode('wave')}
            style={{
              padding: '12px 14px',
              borderRadius: 12,
              border: methode === 'wave' ? '2px solid #1E40AF' : '1px solid var(--border, #E8DDD2)',
              background: methode === 'wave' ? 'rgba(30, 64, 175, 0.05)' : '#ffffff',
              color: '#1E40AF',
              fontWeight: 800,
              fontSize: 13.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: 'pointer'
            }}
          >
            <CreditCard size={16} />
            Wave (1 Clic)
          </button>

          <button
            type="button"
            onClick={() => setMethode('orange_money')}
            style={{
              padding: '12px 14px',
              borderRadius: 12,
              border: methode === 'orange_money' ? '2px solid #C75B00' : '1px solid var(--border, #E8DDD2)',
              background: methode === 'orange_money' ? 'rgba(199, 91, 0, 0.05)' : '#ffffff',
              color: '#C75B00',
              fontWeight: 800,
              fontSize: 13.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: 'pointer'
            }}
          >
            <CreditCard size={16} />
            Orange Money
          </button>
        </div>
      </div>

      {/* Bouton de Validation */}
      <button
        type="submit"
        disabled={chargement || montantChoisi <= 0}
        style={{
          width: '100%',
          padding: '15px 20px',
          borderRadius: 14,
          background: 'var(--price, #0A5C36)',
          color: '#ffffff',
          fontWeight: 800,
          fontSize: 15,
          border: 'none',
          cursor: chargement || montantChoisi <= 0 ? 'not-allowed' : 'pointer',
          opacity: chargement || montantChoisi <= 0 ? 0.7 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          boxShadow: '0 4px 14px rgba(10, 92, 54, 0.25)',
          transition: 'all 0.15s ease'
        }}
      >
        {chargement ? (
          <>
            <RotateCcw size={18} className="animate-spin" />
            Traitement sécurisé en cours...
          </>
        ) : (
          <>
            Valider le règlement de {formatFCFA(montantChoisi)}
            <ArrowRight size={18} />
          </>
        )}
      </button>

      <div style={{ textAlign: 'center', marginTop: 14 }}>
        <span style={{ fontSize: 11.5, color: '#94A3B8' }}>
          Paiement chiffré TLS 256-bit • Reçu horodaté officiel et alerte marchand automatique
        </span>
      </div>
    </form>
  )
}
