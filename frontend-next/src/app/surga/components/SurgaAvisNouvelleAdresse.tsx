'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Download, Bell, CheckCircle2, X } from 'lucide-react'
import { ORIGINE_SURGA } from '@/lib/surga-adresse'
import { CLE_AVIS_ADRESSE, CLE_AVIS_ECARTS, CLE_AVIS_RAPPELS, EVENEMENT_AVIS_ADRESSE, ESSAIS_AVIS_MAX } from '@/lib/surga-reprise'
import { demanderPermissionNotification, synchroniserAbonnementWebPush } from '@/lib/surga-reminders'

// D83 : avis montré, à la nouvelle adresse, à qui utilisait déjà Surga à l'ancienne. Un site ne peut pas installer
// l'application à la place de la personne : l'avis revient à chaque ouverture, bouton d'installation en main,
// jusqu'à ce qu'elle soit installée (ou écartée ESSAIS_AVIS_MAX fois).
export default function SurgaAvisNouvelleAdresse() {
  const [visible, setVisible] = useState(false)
  const [rappels, setRappels] = useState<'aucun' | 'a_reactiver' | 'reactives' | 'refuses'>('aucun')

  const lire = useCallback(() => {
    if (!ORIGINE_SURGA || window.location.origin !== ORIGINE_SURGA) return
    try {
      if (localStorage.getItem(CLE_AVIS_ADRESSE) !== 'a_montrer') return
      setRappels(localStorage.getItem(CLE_AVIS_RAPPELS) === '1' ? 'a_reactiver' : 'aucun')
      setVisible(true)
    } catch {}
  }, [])

  const terminer = useCallback(() => {
    try { localStorage.setItem(CLE_AVIS_ADRESSE, 'fait') } catch {}
    setVisible(false)
  }, [])

  useEffect(() => {
    lire()
    window.addEventListener(EVENEMENT_AVIS_ADRESSE, lire)
    // Le navigateur signale l'installation : l'avis n'a plus lieu d'être.
    window.addEventListener('appinstalled', terminer)
    return () => {
      window.removeEventListener(EVENEMENT_AVIS_ADRESSE, lire)
      window.removeEventListener('appinstalled', terminer)
    }
  }, [lire, terminer])

  const ecarter = () => {
    try {
      const ecarts = (parseInt(localStorage.getItem(CLE_AVIS_ECARTS) || '0', 10) || 0) + 1
      localStorage.setItem(CLE_AVIS_ECARTS, String(ecarts))
      if (ecarts >= ESSAIS_AVIS_MAX) localStorage.setItem(CLE_AVIS_ADRESSE, 'fait')
    } catch {}
    setVisible(false)
  }

  const reactiverRappels = async () => {
    const accorde = await demanderPermissionNotification()
    if (accorde) await synchroniserAbonnementWebPush()
    try { if (accorde) localStorage.removeItem(CLE_AVIS_RAPPELS) } catch {}
    setRappels(accorde ? 'reactives' : 'refuses')
  }

  if (!visible) return null

  const bouton: React.CSSProperties = { width: 'auto', minHeight: 40, padding: '10px 16px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', flexShrink: 0 }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(15, 23, 42, 0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 12 }}>
      <div role="dialog" aria-modal="true" aria-label="Surga a une nouvelle adresse" style={{ width: '100%', maxWidth: 460, background: 'var(--surga-surface, #FFFFFF)', borderRadius: 16, padding: '18px 18px 16px', boxShadow: '0 12px 40px rgba(15, 23, 42, 0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--surga-primary, #0F172A)' }}>Surga a une nouvelle adresse</h2>
          <button type="button" onClick={ecarter} aria-label="Fermer l’avis" style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid var(--surga-border, #E2E8F0)', background: 'var(--surga-surface, #FFFFFF)', color: 'var(--surga-text2, #475569)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <X size={16} />
          </button>
        </div>
        <p style={{ margin: '8px 0 14px', fontSize: 14, lineHeight: 1.5, color: 'var(--surga-text1, #0F172A)' }}>
          Vos réglages et vos données ont suivi. Si Surga était installée sur cet appareil, son icône ouvre encore l’ancienne adresse : installez-la de nouveau depuis celle-ci, puis retirez l’ancienne icône.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button type="button" onClick={() => { setVisible(false); window.dispatchEvent(new CustomEvent('surga-demande-installation-pwa')) }} style={{ ...bouton, border: 'none', background: 'var(--surga-primary, #0F172A)', color: '#FFFFFF' }}>
            <Download size={16} />
            <span>Installer Surga</span>
          </button>
          {rappels === 'a_reactiver' && (
            <button type="button" onClick={reactiverRappels} style={{ ...bouton, border: '1px solid var(--surga-border, #E2E8F0)', background: 'var(--surga-surface, #FFFFFF)', color: 'var(--surga-primary, #0F172A)' }}>
              <Bell size={16} />
              <span>Réactiver les rappels</span>
            </button>
          )}
          <button type="button" onClick={terminer} style={{ ...bouton, border: '1px solid var(--surga-border, #E2E8F0)', background: 'var(--surga-surface, #FFFFFF)', color: 'var(--surga-text2, #475569)' }}>
            <CheckCircle2 size={16} />
            <span>C’est fait</span>
          </button>
        </div>

        {rappels === 'reactives' && <p role="status" style={{ margin: '12px 0 0', fontSize: 13, color: 'var(--surga-emerald-ink, #047857)' }}>Les rappels sont réactivés sur cet appareil.</p>}
        {rappels === 'refuses' && <p role="status" style={{ margin: '12px 0 0', fontSize: 13, color: 'var(--surga-text2, #475569)' }}>Les notifications n’ont pas été autorisées. Vous pourrez les activer depuis l’Agenda.</p>}
      </div>
    </div>
  )
}
