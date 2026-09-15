'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Share2,
  Copy,
  CheckCircle2,
  ExternalLink,
  MessageCircle,
  QrCode,
  Home,
  Building2,
  MapPin,
  Sparkles
} from 'lucide-react'

interface BienItem {
  id: string
  reference: string
  titre: string
  type_bien: string
  ville: string
  quartier?: string
  surface_m2?: number
  nb_pieces?: number
  nb_chambres?: number
  prix_location?: number
  prix_vente?: number
  meuble: boolean
  description?: string
  annonce_publiee_id?: string
}

interface AgenceItem {
  id: string
  nom: string
  slug: string
  telephone?: string
  whatsapp?: string
  ville: string
}

export default function SocialMarketingPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [agence, setAgence] = useState<AgenceItem | null>(null)
  const [biens, setBiens] = useState<BienItem[]>([])
  const [selectedBienId, setSelectedBienId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  async function chargerDonnees() {
    try {
      setLoading(true)
      const [resAgence, resBiens] = await Promise.all([
        fetch(`/api/agences/${slug}`),
        fetch(`/api/biens/agence/${slug}?statut=actif`),
      ])
      const dataAgence = await resAgence.json()
      const dataBiens = await resBiens.json()

      if (dataAgence.success) setAgence(dataAgence.agence)
      if (dataBiens.success && dataBiens.biens) {
        setBiens(dataBiens.biens)
        if (dataBiens.biens.length > 0) {
          setSelectedBienId(dataBiens.biens[0].id)
        }
      }
    } catch (err) {
      console.error('[LOAD_SOCIAL_ERR]', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (slug) chargerDonnees()
  }, [slug])

  const selectedBien = biens.find(b => b.id === selectedBienId)
  const waContact = agence?.whatsapp || agence?.telephone || '+221 77 000 00 00'

  function genererTextePost() {
    if (!selectedBien) return ''
    const isLoc = !!selectedBien.prix_location
    const prix = isLoc
      ? `${Number(selectedBien.prix_location).toLocaleString('fr-FR')} FCFA / mois`
      : `${Number(selectedBien.prix_vente || 0).toLocaleString('fr-FR')} FCFA`
    const typeLabel = selectedBien.type_bien.toUpperCase()
    const operation = isLoc ? 'À LOUER' : 'À VENDRE'
    const quartier = selectedBien.quartier ? `${selectedBien.quartier}, ${selectedBien.ville}` : selectedBien.ville

    return `*${operation} — ${typeLabel} D'EXCEPTION*\n\n` +
      `📍 *Localisation* : ${quartier}\n` +
      `💰 *Prix* : ${prix}\n` +
      `📐 *Caractéristiques* : ${selectedBien.nb_pieces || 1} pièces • ${selectedBien.nb_chambres || 1} chambres • ${selectedBien.surface_m2 ? `${selectedBien.surface_m2}m²` : 'Spacieux'}\n` +
      `${selectedBien.meuble ? '🛋️ *Meublé & Équipé*\n' : ''}` +
      `\n${selectedBien.description ? `${selectedBien.description.substring(0, 160)}...\n\n` : ''}` +
      `📲 *Contact & Visite WhatsApp* : https://wa.me/${waContact.replace(/[^0-9]/g, '')}\n` +
      `🏢 *Agence* : ${agence?.nom || 'Nopalou Immobilier'}\n` +
      `🔗 *Voir l'annonce complète* : https://nopalou.com/immo/${selectedBien.annonce_publiee_id || selectedBien.id}`
  }

  function handleCopier() {
    navigator.clipboard.writeText(genererTextePost())
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <div style={{ maxWidth: 880, margin: '0 auto' }}>
      {/* ── En-tête ── */}
      <div className="agence-header">
        <div>
          <h1 className="agence-title">Marketing & Réseaux Sociaux</h1>
          <p className="agence-subtitle">Générez et diffusez vos annonces en 1 clic sur WhatsApp, Facebook et Instagram.</p>
        </div>

        <Link
          href={`/agence/${slug}/vitrine`}
          target="_blank"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '9px 16px',
            borderRadius: 8,
            background: 'var(--navy, #1C2B4A)',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: 13,
            textDecoration: 'none',
          }}
        >
          <ExternalLink size={15} />
          Voir ma vitrine publique
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B' }}>
          <p>Chargement des outils marketing...</p>
        </div>
      ) : biens.length === 0 ? (
        <div className="agence-card" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
          <Home size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <p style={{ fontWeight: 700, color: 'var(--navy, #1C2B4A)', fontSize: 16 }}>Aucun bien dans votre portefeuille</p>
          <p style={{ fontSize: 13.5 }}>Ajoutez d'abord un bien pour générer des publications pour vos réseaux.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          {/* ── Sélecteur de bien & Options ── */}
          <div className="agence-card">
            <div className="agence-card-header">
              <div className="agence-card-title">
                <Share2 size={18} />
                Sélection du Bien à Diffuser
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Choisir un bien immobilier *</label>
              <select
                value={selectedBienId}
                onChange={e => setSelectedBienId(e.target.value)}
                className="form-select"
              >
                {biens.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.titre} — {b.quartier ? `${b.quartier}, ${b.ville}` : b.ville}
                  </option>
                ))}
              </select>
            </div>

            {selectedBien && (
              <div style={{ marginTop: 16, padding: 14, background: '#FAF8F5', borderRadius: 8, border: '1px solid var(--border, #E8DDD2)' }}>
                <div style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)', fontSize: 14 }}>{selectedBien.titre}</div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                  {selectedBien.type_bien} • {selectedBien.quartier || selectedBien.ville}
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--accent, #C75B00)', marginTop: 6 }}>
                  {selectedBien.prix_location
                    ? `${Number(selectedBien.prix_location).toLocaleString('fr-FR')} FCFA/mois`
                    : `${Number(selectedBien.prix_vente || 0).toLocaleString('fr-FR')} FCFA`}
                </div>
              </div>
            )}

            {/* Actions de Partage Direct */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(genererTextePost())}`}
                target="_blank"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '12px',
                  borderRadius: 8,
                  background: '#16a34a',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: 13.5,
                  textDecoration: 'none',
                }}
              >
                <MessageCircle size={18} />
                Partager sur WhatsApp (Groupe / Statut)
              </a>

              <button
                type="button"
                onClick={handleCopier}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '12px',
                  borderRadius: 8,
                  background: copied ? '#DCFCE7' : '#FFFFFF',
                  color: copied ? '#166534' : 'var(--navy, #1C2B4A)',
                  border: '1px solid var(--border, #E8DDD2)',
                  fontWeight: 700,
                  fontSize: 13.5,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                {copied ? 'Texte copié dans le presse-papier !' : 'Copier le texte (Facebook / Instagram)'}
              </button>
            </div>
          </div>

          {/* ── Aperçu en direct du Post Réseaux Sociaux ── */}
          <div className="agence-card">
            <div className="agence-card-header">
              <div className="agence-card-title">
                <Sparkles size={18} color="var(--accent, #C75B00)" />
                Aperçu de la Publication
              </div>
            </div>

            <div
              style={{
                background: '#FAF8F5',
                border: '1px solid var(--border, #E8DDD2)',
                borderRadius: 10,
                padding: 16,
                fontSize: 13,
                lineHeight: 1.6,
                color: 'var(--navy, #1C2B4A)',
                whiteSpace: 'pre-wrap',
                fontFamily: 'inherit',
                maxHeight: 380,
                overflowY: 'auto',
              }}
            >
              {genererTextePost()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
