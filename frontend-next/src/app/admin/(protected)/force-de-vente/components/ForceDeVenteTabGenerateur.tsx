import React from 'react'
import { Link2, MessageSquare, Copy } from 'lucide-react'

interface ForceDeVenteTabGenerateurProps {
  agentNom: string
  onAgentNomChange: (nom: string) => void
  agentPhone: string
  onAgentPhoneChange: (phone: string) => void
  agentCode: string
  onAgentCodeChange: (code: string) => void
  onCopy: (txt: string, label: string) => void
}

export default function ForceDeVenteTabGenerateur({
  agentNom,
  onAgentNomChange,
  agentPhone,
  onAgentPhoneChange,
  agentCode,
  onAgentCodeChange,
  onCopy,
}: ForceDeVenteTabGenerateurProps) {
  const affiliateUrl = `https://nopalou.com/creer-boutique?ref=${agentCode}`
  const whatsappMessage = `Bonjour ! C'est ${agentNom}, conseiller Nopalou. Digitalisez votre boutique à Dakar avec notre Caisse POS tactile hors-ligne, carnet de dettes WhatsApp et factures OHADA. 1er mois 100% offert : ${affiliateUrl}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ background: '#fff', border: '1px solid var(--border, #E2E8F0)', borderRadius: 16, padding: '24px' }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--navy, #1C2B4A)', margin: '0 0 6px' }}>
          Générateur de Kit Commercial Sur-Mesure
        </h2>
        <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 20px' }}>
          Saisissez les coordonnées d&apos;un commercial pour lui générer instantanément sa boîte à outils complète avec ses
          liens de parrainage et ses supports personnalisés.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy, #1C2B4A)', display: 'block', marginBottom: 6 }}>
              Prénom &amp; Nom du Commercial :
            </label>
            <input
              type="text"
              value={agentNom}
              onChange={e => onAgentNomChange(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 14 }}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy, #1C2B4A)', display: 'block', marginBottom: 6 }}>
              Numéro WhatsApp (sans indicatif) :
            </label>
            <input
              type="text"
              value={agentPhone}
              onChange={e => onAgentPhoneChange(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 14 }}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy, #1C2B4A)', display: 'block', marginBottom: 6 }}>
              Code Apporteur Unique :
            </label>
            <input
              type="text"
              value={agentCode}
              onChange={e => onAgentCodeChange(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 14 }}
            />
          </div>
        </div>

        {/* Liens & Messages Générés */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: '#F8FAFC', border: '1px solid var(--border, #E2E8F0)', borderRadius: 12, padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy, #1C2B4A)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Link2 size={16} color="var(--accent, #C75B00)" />
                Lien d&apos;Affiliation Direct Création Boutique :
              </span>
              <button
                type="button"
                onClick={() => onCopy(affiliateUrl, 'Lien')}
                style={{
                  padding: '4px 10px',
                  background: 'var(--accent, #C75B00)',
                  color: '#fff',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Copy size={12} /> Copier
              </button>
            </div>
            <code style={{ fontSize: 13, color: 'var(--accent, #C75B00)', fontWeight: 700 }}>{affiliateUrl}</code>
          </div>

          <div style={{ background: '#F8FAFC', border: '1px solid var(--border, #E2E8F0)', borderRadius: 12, padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy, #1C2B4A)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <MessageSquare size={16} color="#25D366" />
                Message d&apos;Accroche WhatsApp Personnalisé :
              </span>
              <button
                type="button"
                onClick={() => onCopy(whatsappMessage, 'Message')}
                style={{
                  padding: '4px 10px',
                  background: '#25D366',
                  color: '#fff',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Copy size={12} /> Copier Message
              </button>
            </div>
            <p style={{ fontSize: 13, color: '#475569', margin: 0, lineHeight: 1.5 }}>« {whatsappMessage} »</p>
          </div>
        </div>
      </div>
    </div>
  )
}
