import React from 'react'
import { Copy, Phone } from 'lucide-react'
import { CategorieCommerce, StatutEquipement, MatriceCommerce } from './types'

interface ForceDeVenteTabPitchsProps {
  matriceData: Record<CategorieCommerce, MatriceCommerce>
  selectedCat: CategorieCommerce
  onSelectCat: (cat: CategorieCommerce) => void
  selectedEquip: StatutEquipement
  onSelectEquip: (equip: StatutEquipement) => void
  onCopy: (txt: string, label: string) => void
}

export default function ForceDeVenteTabPitchs({
  matriceData,
  selectedCat,
  onSelectCat,
  selectedEquip,
  onSelectEquip,
  onCopy,
}: ForceDeVenteTabPitchsProps) {
  const currentCommerce = matriceData[selectedCat]
  const currentProfile = currentCommerce[selectedEquip]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Sélecteurs Catégorie & Statut */}
      <div
        style={{
          background: '#fff',
          border: '1px solid var(--border, #E2E8F0)',
          borderRadius: 16,
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div>
          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: '#64748B',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: 8,
            }}
          >
            1. Choisissez la Catégorie du Commerce Prospecté :
          </span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(Object.keys(matriceData) as CategorieCommerce[]).map(catKey => {
              const c = matriceData[catKey]
              const isSel = selectedCat === catKey
              return (
                <button
                  key={catKey}
                  type="button"
                  onClick={() => onSelectCat(catKey)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 10,
                    border: isSel ? '2px solid var(--accent, #C75B00)' : '1px solid #CBD5E1',
                    background: isSel ? '#FFF7ED' : '#F8FAFC',
                    color: isSel ? 'var(--accent, #C75B00)' : 'var(--navy, #1C2B4A)',
                    fontWeight: isSel ? 800 : 600,
                    fontSize: 13,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span>{c.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: '#64748B',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: 8,
            }}
          >
            2. Niveau d&apos;Équipement du Commerçant :
          </span>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => onSelectEquip('sans_app')}
              style={{
                flex: 1,
                minWidth: 240,
                padding: '12px 16px',
                borderRadius: 10,
                border: selectedEquip === 'sans_app' ? '2px solid #16A34A' : '1px solid var(--border, #E2E8F0)',
                background: selectedEquip === 'sans_app' ? '#F0FDF4' : '#fff',
                color: selectedEquip === 'sans_app' ? '#166534' : '#64748B',
                fontWeight: 800,
                fontSize: 14,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              N&apos;a PAS d&apos;application (Carnet papier / Mémoire)
            </button>

            <button
              type="button"
              onClick={() => onSelectEquip('avec_app')}
              style={{
                flex: 1,
                minWidth: 240,
                padding: '12px 16px',
                borderRadius: 10,
                border: selectedEquip === 'avec_app' ? '2px solid #2563EB' : '1px solid var(--border, #E2E8F0)',
                background: selectedEquip === 'avec_app' ? '#EFF6FF' : '#fff',
                color: selectedEquip === 'avec_app' ? '#1E40AF' : '#64748B',
                fontWeight: 800,
                fontSize: 14,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              A DÉJÀ une application / logiciel (Excel / Desktop)
            </button>
          </div>
        </div>
      </div>

      {/* Fiche d'Argumentaire Personnalisée */}
      <div
        style={{
          background: '#fff',
          border: '2px solid var(--accent, #C75B00)',
          borderRadius: 16,
          padding: '28px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {/* Header Fiche */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <span
              style={{
                fontSize: 13,
                fontWeight: 900,
                color: 'var(--accent, #C75B00)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              FICHE D&apos;ARGUMENTAIRE TERRAIN ADAPTÉE
            </span>
            <h3 style={{ fontSize: 22, fontWeight: 900, color: 'var(--navy, #1C2B4A)', margin: '4px 0 0' }}>
              {currentCommerce.label} —{' '}
              {selectedEquip === 'sans_app' ? 'Sans Application' : 'Avec Application Existante'}
            </h3>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => onCopy(currentProfile.pitch, 'Pitch')}
              style={{
                padding: '8px 14px',
                background: 'var(--navy, #1C2B4A)',
                color: '#fff',
                borderRadius: 8,
                border: 'none',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Copy size={15} /> Copier le Pitch
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(currentProfile.pitch)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '8px 14px',
                background: '#25D366',
                color: '#fff',
                borderRadius: 8,
                border: 'none',
                fontSize: 13,
                fontWeight: 700,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Phone size={15} /> WhatsApp
            </a>
          </div>
        </div>

        {/* Pitch */}
        <div style={{ background: '#FFF7ED', border: '1.5px solid #FFEDD5', borderRadius: 12, padding: '16px 20px' }}>
          <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--accent, #C75B00)', display: 'block', marginBottom: 6 }}>
            PITCH D&apos;ACCROCHE (À RÉCITER OU ENVOYER) :
          </span>
          <p style={{ fontSize: 15, color: 'var(--navy, #1C2B4A)', lineHeight: 1.6, margin: 0, fontWeight: 600 }}>
            {currentProfile.pitch}
          </p>
        </div>

        {/* 3 Questions Diagnostic */}
        <div style={{ background: '#F8FAFC', border: '1px solid var(--border, #E2E8F0)', borderRadius: 12, padding: '16px 20px' }}>
          <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--navy, #1C2B4A)', display: 'block', marginBottom: 8 }}>
            LES 3 QUESTIONS DE DIAGNOSTIC À POSER :
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {currentProfile.diagnostic.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#334155' }}>
                <span style={{ color: 'var(--accent, #C75B00)', fontWeight: 900 }}>•</span>
                <span>{d}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Démo Live Recommandée */}
        <div style={{ background: '#EFF6FF', border: '1.5px solid #BFDBFE', borderRadius: 12, padding: '16px 20px' }}>
          <span style={{ fontSize: 13, fontWeight: 900, color: '#1E40AF', display: 'block', marginBottom: 6 }}>
            DÉMO LIVE À EXÉCUTER SUR PLACE (60 SECONDES) :
          </span>
          <p style={{ fontSize: 14, color: '#1E3A8A', margin: 0, lineHeight: 1.5 }}>{currentProfile.demo}</p>
        </div>

        {/* Objection & Parade */}
        <div style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: 12, padding: '16px 20px' }}>
          <span style={{ fontSize: 13, fontWeight: 900, color: '#DC2626', display: 'block', marginBottom: 6 }}>
            L&apos;OBJECTION CLÉ DE CE PROFIL &amp; SA PARADE :
          </span>
          <p style={{ fontSize: 14, color: '#991B1B', fontWeight: 800, margin: '0 0 6px' }}>
            Objection : {currentProfile.objection.q}
          </p>
          <p style={{ fontSize: 14, color: '#15803D', fontWeight: 700, margin: 0 }}>
            Réponse percutante : {currentProfile.objection.r}
          </p>
        </div>

        {/* Closing */}
        <div style={{ background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: 12, padding: '16px 20px' }}>
          <span style={{ fontSize: 13, fontWeight: 900, color: '#166534', display: 'block', marginBottom: 6 }}>
            PHRASE DE CLOSING POUR DÉCLENCHER L&apos;INSCRIPTION :
          </span>
          <p style={{ fontSize: 15, color: '#14532D', fontWeight: 800, margin: 0 }}>{currentProfile.closing}</p>
        </div>
      </div>
    </div>
  )
}
