'use client'

import { useEffect, useState } from 'react'

// SRG-A3-010 (suite du lot « fenêtres ») : champs sans étiquette, confirmations jamais annoncées, pas de lien d'évitement.
// Monté une fois, comme SurgaFenetresClavier, pour couvrir tous les écrans présents et à venir sans code par écran.
//   1. Chaque champ de saisie (texte, nombre, liste, case) reçoit un nom accessible. Avant : 1 champ sur 15 avait une
//      étiquette liée, les libellés visibles étaient de simples blocs de texte à côté du champ.
//      Le nom vient, dans l'ordre : du libellé natif (label/for, label englobant), du texte court qui précède le champ
//      (jusqu'à trois niveaux), du texte indicatif (placeholder), du titre. Un champ déjà nommé n'est pas touché.
//   2. Une zone d'annonce (role="status") présente dès le chargement répète les messages « surga-toast » : une zone
//      créée en même temps que son texte n'est pas annoncée par les lecteurs d'écran.
//   3. Un lien d'évitement mène au contenu principal.

const SELECTEUR_CHAMPS = 'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"]), textarea, select'
const MAX_NIVEAUX = 3
const MAX_NOM = 80

const estCommande = (el: Element) => !!el.querySelector('input, textarea, select, button, a[href]') || el.matches('input, textarea, select, button, a[href]')

function texteCourt(el: Element): string | null {
  if (estCommande(el)) return null
  const t = (el.textContent || '').replace(/\s+/g, ' ').trim()
  return t.length > 0 && t.length <= MAX_NOM ? t : null
}

// Le libellé visible d'un champ : le texte court qui le précède, au même niveau ou en remontant.
function libelleVoisin(champ: Element): string | null {
  let niveau: Element | null = champ
  for (let i = 0; i < MAX_NIVEAUX && niveau; i++) {
    for (let prev = niveau.previousElementSibling; prev; prev = prev.previousElementSibling) {
      const t = texteCourt(prev)
      if (t) return t
      if (estCommande(prev)) break // un autre champ ou bouton : ce qui est avant ne lui appartient plus
    }
    const parent: Element | null = niveau.parentElement
    if (!parent || parent.matches('form, [role="dialog"], .surga-root, body') || parent.querySelectorAll(SELECTEUR_CHAMPS).length > 1 && i > 0) break
    niveau = parent
  }
  return null
}

function nommer(champ: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): void {
  if (champ.dataset.surgaNom) return
  champ.dataset.surgaNom = 'natif'
  if (champ.hasAttribute('aria-label') || champ.hasAttribute('aria-labelledby')) return
  if (champ.labels && champ.labels.length > 0) return
  const nom = libelleVoisin(champ) || champ.getAttribute('placeholder') || champ.getAttribute('title')
  if (!nom) return
  champ.setAttribute('aria-label', nom.slice(0, MAX_NOM))
  champ.dataset.surgaNom = 'auto'
}

export default function SurgaAccessibiliteAuto() {
  const [annonce, setAnnonce] = useState('')

  useEffect(() => {
    let image = 0
    const balayer = () => {
      image = 0
      document.querySelectorAll<HTMLInputElement>(`.surga-root :is(${SELECTEUR_CHAMPS}):not([data-surga-nom])`).forEach(nommer)
    }
    const planifier = () => { if (!image) image = window.requestAnimationFrame(balayer) }
    const observateur = new MutationObserver(planifier)
    observateur.observe(document.body, { childList: true, subtree: true })
    planifier()

    let minuterie: ReturnType<typeof setTimeout> | undefined
    const surMessage = (e: Event) => {
      const message = (e as CustomEvent<{ message?: string }>).detail?.message
      if (!message) return
      // Vider puis écrire : deux messages identiques de suite sont annoncés deux fois.
      setAnnonce('')
      window.setTimeout(() => setAnnonce(message), 50)
      if (minuterie) clearTimeout(minuterie)
      minuterie = setTimeout(() => setAnnonce(''), 8000)
    }
    window.addEventListener('surga-toast', surMessage)

    return () => {
      observateur.disconnect()
      window.removeEventListener('surga-toast', surMessage)
      if (image) window.cancelAnimationFrame(image)
      if (minuterie) clearTimeout(minuterie)
    }
  }, [])

  return (
    <>
      <a
        href="#surga-contenu"
        className="surga-lien-evitement"
        onClick={(e) => {
          const cible = document.getElementById('surga-contenu')
          if (cible) { e.preventDefault(); cible.focus({ preventScroll: false }) }
        }}
      >
        Aller au contenu
      </a>
      <div role="status" aria-live="polite" aria-atomic="true" className="surga-sr-only" id="surga-annonces">{annonce}</div>
    </>
  )
}
