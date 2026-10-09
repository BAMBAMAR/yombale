'use client'

import { useEffect } from 'react'
import { ORIGINE_SURGA, ORIGINE_NOPALOU, CHEMIN_REPRISE } from '@/lib/surga-adresse'
import { CLE_REPRISE, ESSAIS_MAX, TYPE_MESSAGE_REPRISE, CLE_AVIS_ADRESSE, CLE_AVIS_RAPPELS, EVENEMENT_AVIS_ADRESSE, donneesAReprendre, utilisaitAncienneAdresse } from '@/lib/surga-reprise'

// D83 : à la première ouverture de Surga à sa propre origine, reprend ce que l'appareil gardait à l'ancienne adresse.
// Sans effet tant que l'origine propre n'est pas réglée, ou ailleurs que sur elle.
export default function SurgaRepriseAppareil() {
  useEffect(() => {
    if (!ORIGINE_SURGA || window.location.origin !== ORIGINE_SURGA) return
    let etat = ''
    try { etat = localStorage.getItem(CLE_REPRISE) || '' } catch { return }
    const essais = parseInt(etat, 10) || 0
    if (etat === 'faite' || essais >= ESSAIS_MAX) return

    const cadre = document.createElement('iframe')
    cadre.src = `${ORIGINE_NOPALOU}${CHEMIN_REPRISE}`
    cadre.title = 'Reprise des données de Surga'
    cadre.setAttribute('aria-hidden', 'true')
    cadre.tabIndex = -1
    cadre.style.display = 'none'

    const finir = () => {
      window.removeEventListener('message', recevoir)
      clearTimeout(delai)
      cadre.remove()
    }
    const recevoir = (evenement: MessageEvent) => {
      if (evenement.origin !== ORIGINE_NOPALOU || evenement.data?.type !== TYPE_MESSAGE_REPRISE) return
      finir()
      try {
        const donnees = donneesAReprendre(evenement.data.donnees, (cle) => localStorage.getItem(cle))
        if (donnees) for (const [cle, valeur] of Object.entries(donnees)) localStorage.setItem(cle, valeur)
        localStorage.setItem(CLE_REPRISE, 'faite')
        // Qui utilisait Surga à l'ancienne adresse est prévenu du changement et invité à la réinstaller.
        if (utilisaitAncienneAdresse(evenement.data.donnees)) {
          localStorage.setItem(CLE_AVIS_ADRESSE, 'a_montrer')
          if (evenement.data.notifications === true) localStorage.setItem(CLE_AVIS_RAPPELS, '1')
          window.dispatchEvent(new CustomEvent(EVENEMENT_AVIS_ADRESSE))
        }
        // Les écrans ont déjà lu un appareil vide : la page est relue avec les données reprises.
        if (donnees) window.location.reload()
      } catch {}
    }
    // Pas de réponse (ancienne adresse injoignable, cadre refusé) : nouvel essai à la prochaine ouverture.
    const delai = setTimeout(() => {
      finir()
      try { localStorage.setItem(CLE_REPRISE, String(essais + 1)) } catch {}
    }, 10000)

    window.addEventListener('message', recevoir)
    document.body.appendChild(cadre)
    return finir
  }, [])

  return null
}
