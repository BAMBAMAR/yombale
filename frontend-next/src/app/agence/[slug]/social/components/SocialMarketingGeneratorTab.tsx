'use client'

import React, { useState } from 'react'
import {
  Sparkles,
  Copy,
  Check,
  Share2,
  MessageCircle,
  Camera,
  Globe,
  Home
} from 'lucide-react'
import { BienItem, SocialAccountsConfig } from '../types'

interface SocialMarketingGeneratorTabProps {
  biens: BienItem[]
  agenceNom: string
  agenceSlug: string
  socialAccounts: SocialAccountsConfig
  telephoneContact: string
}

export function SocialMarketingGeneratorTab({
  biens,
  agenceNom,
  agenceSlug,
  socialAccounts,
  telephoneContact,
}: SocialMarketingGeneratorTabProps) {
  const [selectedBienId, setSelectedBienId] = useState<string>(biens[0]?.id || '')
  const [targetChannel, setTargetChannel] = useState<'whatsapp' | 'instagram' | 'facebook' | 'linkedin'>('whatsapp')
  const [copied, setCopied] = useState(false)

  const selectedBien = biens.find(b => b.id === selectedBienId)
  const waNumber = (socialAccounts.whatsapp || telephoneContact || '+221 77 000 00 00').replace(/[^0-9]/g, '')

  function generateText(): string {
    if (!selectedBien) return "Veuillez sélectionner un bien immobilier dans la liste pour générer l'annonce."

    const isLoc = !!selectedBien.prix_location
    const prix = isLoc
      ? `${Number(selectedBien.prix_location).toLocaleString('fr-FR')} FCFA / mois`
      : `${Number(selectedBien.prix_vente || 0).toLocaleString('fr-FR')} FCFA`
    const typeLabel = selectedBien.type_bien.toUpperCase()
    const operation = isLoc ? 'À LOUER' : 'À VENDRE'
    const quartier = selectedBien.quartier ? `${selectedBien.quartier}, ${selectedBien.ville}` : selectedBien.ville

    if (targetChannel === 'whatsapp') {
      return (
        `*${operation} — ${typeLabel} D'EXCEPTION*\n\n` +
        `📍 *Localisation* : ${quartier}\n` +
        `💰 *Prix* : ${prix}\n` +
        `📐 *Surface & Pièces* : ${selectedBien.nb_pieces || 1} pièces • ${selectedBien.nb_chambres || 1} chambres • ${selectedBien.surface_m2 ? `${selectedBien.surface_m2}m²` : 'Spacieux'}\n` +
        `${selectedBien.meuble ? '🛋️ *Meublé & Haut Standing*\n' : ''}` +
        `\n${selectedBien.description ? `${selectedBien.description.substring(0, 160)}...\n\n` : ''}` +
        `📲 *Contact & Rendez-vous Visite* : https://wa.me/${waNumber}\n` +
        `🏢 *Agence* : ${agenceNom}\n` +
        `🔗 *Voir la vitrine complète* : https://nopalou.com/agence/${agenceSlug}/vitrine`
      )
    }

    if (targetChannel === 'instagram') {
      return (
        `✨ NOUVEAUTÉ IMMOBILIÈRE — ${operation} ✨\n\n` +
        `Découvrez ce superbe ${selectedBien.type_bien} situé à ${quartier}.\n\n` +
        `▫️ Surface : ${selectedBien.surface_m2 ? `${selectedBien.surface_m2} m²` : 'Grande surface'}\n` +
        `▫️ Pièces : ${selectedBien.nb_pieces || 1} | Chambres : ${selectedBien.nb_chambres || 1}\n` +
        `▫️ Tarif : ${prix}\n\n` +
        `📩 Écrivez-nous en DM ou sur WhatsApp pour programmer votre visite !\n` +
        `🔗 Lien dans notre bio.\n\n` +
        `#ImmobilierDakar #SenegalImmo #LocationDakar #VenteDakar #NopalouImmo #VillaDakar #AppartementDakar #${selectedBien.ville.replace(/\s+/g, '')}`
      )
    }

    if (targetChannel === 'facebook') {
      return (
        `🏡 Opportunité Immobilière Exclusive : ${selectedBien.titre}\n\n` +
        `Votre agence ${agenceNom} vous propose ce magnifique bien idéalement situé à ${quartier}.\n\n` +
        `🔹 Type : ${selectedBien.type_bien}\n` +
        `🔹 Prix : ${prix}\n` +
        `🔹 Composition : ${selectedBien.nb_pieces || 1} pièces (${selectedBien.nb_chambres || 1} chambres)\n\n` +
        `📞 Pour toute information complémentaire ou visite sur site, contactez-nous au ${telephoneContact || '+221 77 000 00 00'} ou directement par WhatsApp : https://wa.me/${waNumber}\n\n` +
        `Visitez notre catalogue en ligne : https://nopalou.com/agence/${agenceSlug}/vitrine`
      )
    }

    return (
      `Opportunité d'investissement immobilier à ${quartier} (${selectedBien.ville})\n\n` +
      `L'agence ${agenceNom} présente ce bien immobilier (${typeLabel}) proposé ${operation.toLowerCase()}.\n\n` +
      `Caractéristiques principales :\n` +
      `- Superficie : ${selectedBien.surface_m2 ? `${selectedBien.surface_m2} m²` : 'Non précisée'}\n` +
      `- Prix : ${prix}\n\n` +
      `Dossier technique et visites disponibles sur demande.\n` +
      `Contact professionnel : ${telephoneContact || '+221 77 000 00 00'}`
    )
  }

  function handleCopy() {
    navigator.clipboard.writeText(generateText())
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid var(--border, #E8DDD2)',
          borderRadius: 12,
          padding: 20,
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy, #1C2B4A)', marginBottom: 4 }}>
          Générateur de Publications Marketing 1-Clic
        </div>
        <p style={{ fontSize: 12.5, color: '#64748B', margin: '0 0 16px' }}>
          Générez instantanément des descriptions percutantes adaptées à chaque réseau pour promouvoir vos biens.
        </p>

        <div className="form-grid-2">
          <div>
            <label className="form-label">Sélectionner un bien à promouvoir</label>
            <select
              value={selectedBienId}
              onChange={e => setSelectedBienId(e.target.value)}
              className="form-select"
            >
              {biens.map(b => (
                <option key={b.id} value={b.id}>
                  {b.titre} — {b.prix_location ? `${Number(b.prix_location).toLocaleString('fr-FR')} FCFA/mois` : `${Number(b.prix_vente || 0).toLocaleString('fr-FR')} FCFA`} ({b.quartier || b.ville})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Format de canal cible</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                { key: 'whatsapp' as const, label: 'WhatsApp', icon: MessageCircle, color: '#25D366' },
                { key: 'instagram' as const, label: 'Instagram', icon: Camera, color: '#E1306C' },
                { key: 'facebook' as const, label: 'Facebook', icon: Share2, color: '#1877F2' },
                { key: 'linkedin' as const, label: 'LinkedIn', icon: Globe, color: '#0A66C2' },
              ].map(c => {
                const Icon = c.icon
                const active = targetChannel === c.key
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setTargetChannel(c.key)}
                    style={{
                      flex: 1,
                      padding: '9px 6px',
                      borderRadius: 8,
                      border: `1px solid ${active ? c.color : 'var(--border, #E8DDD2)'}`,
                      background: active ? `${c.color}15` : '#FFFFFF',
                      color: active ? c.color : 'var(--navy, #1C2B4A)',
                      fontWeight: 750,
                      fontSize: 12,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                    }}
                  >
                    <Icon size={14} />
                    <span>{c.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Aperçu du texte généré */}
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
              Texte formaté prêt à copier :
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="btn-npl"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 6,
                background: copied ? '#166534' : 'var(--accent, #C75B00)',
                color: '#FFFFFF',
                fontWeight: 750,
                fontSize: 12,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copié !' : 'Copier le texte'}
            </button>
          </div>

          <textarea
            rows={10}
            readOnly
            value={generateText()}
            className="form-textarea"
            style={{
              fontFamily: 'monospace',
              fontSize: 12.5,
              background: '#FAF8F5',
              lineHeight: 1.5,
            }}
          />
        </div>
      </div>
    </div>
  )
}
