'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Search,
  Phone,
  ArrowRight,
  AlertCircle,
  FileCheck2,
  CheckCircle2,
  Building2,
  ShieldCheck,
  UserCheck,
  RefreshCw
} from 'lucide-react'
import BailLocataireCard, { type BailLocataireItem } from './BailLocataireCard'

export default function PortailLocataireClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTel = searchParams.get('tel') || ''

  const [inputVal, setInputVal] = useState(initialTel)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [locataireInfo, setLocataireInfo] = useState<{
    nom: string
    prenom: string
    telephone: string
    whatsapp?: string
  } | null>(null)
  const [baux, setBaux] = useState<BailLocataireItem[]>([])
  const [hasSearched, setHasSearched] = useState(false)

  const handleLookup = async (telToSearch: string) => {
    const cleanPh = telToSearch.replace(/\D/g, '')
    if (cleanPh.length < 8) {
      setError('Veuillez saisir un numéro de téléphone valide (ex : 77 123 45 67).')
      return
    }

    setLoading(true)
    setError(null)
    setHasSearched(true)

    try {
      const res = await fetch(`/api/locatif-immo/public/locataire-lookup?tel=${encodeURIComponent(cleanPh)}`)
      const data = await res.json()

      if (data.success && data.baux) {
        setLocataireInfo(data.locataire)
        setBaux(data.baux)
      } else {
        setError(data.error || 'Aucun contrat de bail actif trouvé pour ce numéro.')
        setBaux([])
        setLocataireInfo(null)
      }
    } catch {
      setError('Impossible de joindre le serveur. Veuillez vérifier votre connexion.')
      setBaux([])
    } finally {
      setLoading(false)
    }
  }

  // Auto-recherche si un numéro est transmis dans l'URL (ex: lien WhatsApp)
  useEffect(() => {
    if (initialTel && initialTel.trim().length >= 8) {
      handleLookup(initialTel.trim())
    }
  }, [initialTel])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const clean = inputVal.trim()
    if (!clean) {
      setError('Veuillez saisir votre numéro de téléphone ou votre code échéance.')
      return
    }

    // Si c'est un format de code / UUID / ECH (contient lettres ou tirets avec non-chiffres)
    const onlyDigits = clean.replace(/\D/g, '')
    const isPhone = onlyDigits.length >= 8 && (clean.startsWith('+') || clean.startsWith('7') || clean.startsWith('221') || clean.startsWith('33'))

    if (!isPhone && (clean.includes('-') || clean.length > 15 || /[a-zA-Z]/.test(clean))) {
      router.push(`/payer-loyer/${encodeURIComponent(clean)}`)
      return
    }

    handleLookup(clean)
  }

  return (
    <div>
      {/* Formulaire de recherche interactif */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 18,
          padding: '24px 20px',
          border: '1px solid var(--border, #E8DDD2)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          marginBottom: 24
        }}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
            <label
              htmlFor="locataire-input"
              style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}
            >
              Votre numéro de téléphone (ou référence de loyer) :
            </label>
            <span style={{ fontSize: 11.5, color: '#64748b' }}>
              Sans création de compte ni mot de passe
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 240px' }}>
              <Phone
                size={16}
                color="var(--text-subtle, #5A4E42)"
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                id="locataire-input"
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Ex : 77 123 45 67 ou 78 169 03 79"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '12px 14px 12px 38px',
                  borderRadius: 10,
                  border: '1.5px solid var(--border, #E8DDD2)',
                  fontSize: 14,
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                background: 'var(--price, #0A5C36)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 10,
                padding: '12px 22px',
                fontSize: 14,
                fontWeight: 800,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(10, 92, 54, 0.25)'
              }}
            >
              {loading ? (
                <>
                  <RefreshCw size={15} className="spin-animate" />
                  <span>Recherche...</span>
                </>
              ) : (
                <>
                  <span>Consulter mes baux</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </div>

          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: '#b91c1c',
                fontSize: 13,
                background: '#FEF2F2',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #FECACA'
              }}
            >
              <AlertCircle size={16} color="#b91c1c" style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <p style={{ fontSize: 12, color: 'var(--text-subtle, #5A4E42)', margin: '4px 0 0', lineHeight: 1.4 }}>
            Saisissez le numéro communiqué à votre agence immobilière lors de la signature ou de la remise des clés.
          </p>
        </form>
      </div>

      {/* Résultats de recherche : Fiche locataire & baux */}
      {hasSearched && locataireInfo && baux.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          {/* Bandeau Locataire Reconnu */}
          <div
            style={{
              background: '#F0FDF4',
              border: '1px solid #BBF7D0',
              borderRadius: 14,
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 18,
              flexWrap: 'wrap',
              gap: 10
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'var(--price, #0A5C36)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <UserCheck size={18} />
              </div>
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--price, #0A5C36)', textTransform: 'uppercase' }}>
                  Locataire Identifié
                </span>
                <div style={{ fontSize: 14.5, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
                  {locataireInfo.prenom ? `${locataireInfo.prenom} ` : ''}{locataireInfo.nom}
                </div>
              </div>
            </div>

            <div style={{ fontSize: 12, color: '#166534', fontWeight: 700 }}>
              {baux.length} contrat(s) de location trouvé(s)
            </div>
          </div>

          {/* Cartes des baux */}
          {baux.map(bail => (
            <BailLocataireCard key={bail.id} bail={bail} />
          ))}
        </div>
      )}
    </div>
  )
}
