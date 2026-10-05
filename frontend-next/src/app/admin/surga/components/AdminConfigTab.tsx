'use client'

import React, { useState } from 'react'
import {
  Sliders,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Key,
  Database,
  Lock,
  MessageSquare,
  Globe,
  Save,
} from 'lucide-react'

export default function AdminConfigTab() {
  const [quotaVocal, setQuotaVocal] = useState('20')
  const [sauvegardeEnCours, setSauvegardeEnCours] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleSauvegarder = () => {
    setSauvegardeEnCours(true)
    setTimeout(() => {
      setSauvegardeEnCours(false)
      setMessage('Configuration système synchronisée avec succès.')
      setTimeout(() => setMessage(null), 3000)
    }, 600)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {message && (
        <div style={{ padding: '12px 16px', borderRadius: 8, backgroundColor: 'rgba(10, 92, 54, 0.1)', color: 'var(--surga-price)', border: '1px solid rgba(10, 92, 54, 0.2)', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={16} />
          <span>{message}</span>
        </div>
      )}

      {/* Bloc 1 : Moteur d'IA & Persona */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 12, border: '1px solid var(--surga-border)', padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <Zap size={20} color="var(--surga-accent)" />
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--surga-navy)' }}>
            Persona &amp; Directives Fondamentales de l&apos;IA Surga
          </div>
        </div>
        <p style={{ fontSize: 13, color: 'var(--surga-text3)', margin: '0 0 16px' }}>
          Consignes appliquées par défaut à chaque requête utilisateur via WhatsApp ou Web.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ padding: '12px 16px', borderRadius: 8, backgroundColor: 'var(--surga-bg)', border: '1px solid var(--surga-border)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--surga-navy)' }}>
              1. Vouvoiement &amp; Posture de Majordome Local (D19)
            </div>
            <div style={{ fontSize: 12, color: 'var(--surga-text2)', marginTop: 2 }}>
              Vouvoiement systématique, ton respectueux, chaleureux et sobre. Zéro familiarité excessive, aucun tutoiement non sollicité.
            </div>
          </div>

          <div style={{ padding: '12px 16px', borderRadius: 8, backgroundColor: 'var(--surga-bg)', border: '1px solid var(--surga-border)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--surga-navy)' }}>
              2. Calculs &amp; Dépenses Déterministes (Zéro Hallucination)
            </div>
            <div style={{ fontSize: 12, color: 'var(--surga-text2)', marginTop: 2 }}>
              Tout calcul arithmétique ou conversion de devises est confié au parseur JavaScript déterministe, jamais à l&apos;extrapolation probabiliste du LLM.
            </div>
          </div>

          <div style={{ padding: '12px 16px', borderRadius: 8, backgroundColor: 'var(--surga-bg)', border: '1px solid var(--surga-border)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--surga-navy)' }}>
              3. Ancrage Territorial Sénégal (Dakar &amp; Régions)
            </div>
            <div style={{ fontSize: 12, color: 'var(--surga-text2)', marginTop: 2 }}>
              Monnaie par défaut en FCFA (XOF), compréhension des toponymes dakarois (VDN, Almadies, Médina, Liberté 6, Plateau) et des termes wolofs usuels.
            </div>
          </div>
        </div>
      </div>

      {/* Bloc 2 : Quotas & Seuils du Modèle Freemium */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 12, border: '1px solid var(--surga-border)', padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <MessageSquare size={20} color="var(--surga-navy)" />
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--surga-navy)' }}>
            Plafond Freemium &amp; Quotas Vocaux
          </div>
        </div>
        <p style={{ fontSize: 13, color: 'var(--surga-text3)', margin: '0 0 16px' }}>
          Nombre de commandes vocales gratuites autorisées par numéro WhatsApp / utilisateur par jour avant suggestion de passerelle Premium.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ width: 200 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--surga-navy)', display: 'block', marginBottom: 6 }}>
              Requêtes vocales / jour :
            </label>
            <input
              type="number"
              value={quotaVocal}
              onChange={(e) => setQuotaVocal(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--surga-border)',
                fontSize: 14,
                fontWeight: 700,
              }}
            />
          </div>
          <div style={{ fontSize: 12, color: 'var(--surga-text3)', maxWidth: 450, alignSelf: 'flex-end', paddingBottom: 6 }}>
            Les abonnés ayant souscrit au pack Surga Premium (1 500 FCFA/mois) bénéficient automatiquement du vocal illimité sans seuil.
          </div>
        </div>
      </div>

      {/* Bloc 3 : Passerelles & Fournisseurs Externes */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 12, border: '1px solid var(--surga-border)', padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <Key size={20} color="var(--surga-navy)" />
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--surga-navy)' }}>
            État des Clés API &amp; Fournisseurs
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          <div style={{ padding: '14px', borderRadius: 8, backgroundColor: 'var(--surga-bg)', border: '1px solid var(--surga-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--surga-navy)' }}>Passerelle Wave API</span>
              <CheckCircle2 size={16} color="var(--surga-price)" />
            </div>
            <div style={{ fontSize: 11, color: 'var(--surga-text3)', marginTop: 4 }}>
              Webhook actif &bull; Signature HMAC validée
            </div>
          </div>

          <div style={{ padding: '14px', borderRadius: 8, backgroundColor: 'var(--surga-bg)', border: '1px solid var(--surga-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--surga-navy)' }}>Orange Money</span>
              <CheckCircle2 size={16} color="var(--surga-price)" />
            </div>
            <div style={{ fontSize: 11, color: 'var(--surga-text3)', marginTop: 4 }}>
              Passerelle nationale opérationnelle
            </div>
          </div>

          <div style={{ padding: '14px', borderRadius: 8, backgroundColor: 'var(--surga-bg)', border: '1px solid var(--surga-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--surga-navy)' }}>TomTom Traffic API</span>
              <CheckCircle2 size={16} color="var(--surga-price)" />
            </div>
            <div style={{ fontSize: 11, color: 'var(--surga-text3)', marginTop: 4 }}>
              Flux temps réel Dakar et corridors autoroutiers
            </div>
          </div>

          <div style={{ padding: '14px', borderRadius: 8, backgroundColor: 'var(--surga-bg)', border: '1px solid var(--surga-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--surga-navy)' }}>Reconnaissance Vocale</span>
              <CheckCircle2 size={16} color="var(--surga-price)" />
            </div>
            <div style={{ fontSize: 11, color: 'var(--surga-text3)', marginTop: 4 }}>
              Whisper Web / Transcription locale Web Speech
            </div>
          </div>
        </div>
      </div>

      {/* Bouton d'enregistrement */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={handleSauvegarder}
          disabled={sauvegardeEnCours}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            border: 'none',
            backgroundColor: 'var(--surga-accent)',
            color: '#FFFFFF',
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Save size={16} />
          <span>{sauvegardeEnCours ? 'Enregistrement...' : 'Enregistrer les paramètres'}</span>
        </button>
      </div>
    </div>
  )
}
