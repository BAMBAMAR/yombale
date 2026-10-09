'use client'

import { useEffect } from 'react'

// SRG-A3-010 : les fenêtres de Surga au clavier et aux lecteurs d'écran.
// Avant : le focus restait sur la page derrière la fenêtre, la tabulation en sortait, Échap ne fermait rien, et la
// plupart des fenêtres n'avaient ni rôle ni nom.
// Ce composant, monté une fois, s'en charge pour toutes les fenêtres, présentes et à venir, sans code par fenêtre.
// Il reconnaît une fenêtre à sa forme : une superposition fixe qui couvre l'écran (« position: fixed; inset: 0 »),
// ou tout élément marqué « data-surga-fenetre ». Pour chacune :
//   - le focus entre dans la fenêtre à l'ouverture et revient au bouton d'origine à la fermeture ;
//   - la tabulation reste dans la fenêtre du dessus ;
//   - Échap active son bouton de fermeture (« Fermer… » ou la croix) ;
//   - son cadre reçoit role="dialog", aria-modal et un nom tiré de son titre.
// Une fenêtre qui traite elle-même Échap (visionneuse du kiosque, code du portefeuille) le déclare par
// « data-surga-echap="propre" » sur un de ses éléments : ce composant ne ferme alors rien à sa place.

const FOCALISABLES =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function estFenetre(el: Element): el is HTMLElement {
  if (!(el instanceof HTMLElement)) return false
  if (el.getClientRects().length === 0) return false
  if (el.dataset.surgaFenetre !== undefined) return true
  const s = el.style
  if (s.position !== 'fixed' || s.pointerEvents === 'none') return false
  return s.inset === '0px' || s.inset === '0' || (s.top === '0px' && s.left === '0px' && (s.right === '0px' || s.width === '100%' || s.width === '100vw'))
}

function fenetresOuvertes(): HTMLElement[] {
  const candidates = Array.from(document.querySelectorAll('[data-surga-fenetre], [style*="position: fixed"], [style*="position:fixed"]')).filter(estFenetre)
  // Celle du dessus en dernier : par plan (z-index), puis par ordre dans la page.
  return candidates
    .map((el, rang) => ({ el, rang, plan: parseInt(el.style.zIndex || '0', 10) || 0 }))
    .sort((a, b) => a.plan - b.plan || a.rang - b.rang)
    .map((x) => x.el)
}

function cadreDe(fenetre: HTMLElement): HTMLElement {
  if (fenetre.matches('[role="dialog"]')) return fenetre
  return fenetre.querySelector<HTMLElement>('[role="dialog"]') || (fenetre.firstElementChild as HTMLElement | null) || fenetre
}

let compteurDeTitres = 0

// Certaines fenêtres écrivent leur titre dans un simple bloc en gras, sans balise de titre : le premier texte court
// et gras de la fenêtre en tient lieu.
function titreVisible(cadre: HTMLElement): HTMLElement | null {
  const blocs = Array.from(cadre.querySelectorAll<HTMLElement>('h4, div, span, strong, p')).slice(0, 60)
  for (const bloc of blocs) {
    const propre = Array.from(bloc.childNodes).filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.textContent || '').join(' ').trim()
    if (propre.length < 3 || propre.length > 70) continue
    if (parseInt(window.getComputedStyle(bloc).fontWeight, 10) >= 700) return bloc
  }
  return null
}

function decrire(fenetre: HTMLElement): HTMLElement {
  const cadre = cadreDe(fenetre)
  if (!cadre.hasAttribute('role')) cadre.setAttribute('role', 'dialog')
  cadre.setAttribute('aria-modal', 'true')
  if (!cadre.hasAttribute('aria-label') && !cadre.hasAttribute('aria-labelledby')) {
    const titre = cadre.querySelector('h1, h2, h3') || titreVisible(cadre)
    if (titre) {
      if (!titre.id) titre.id = `surga-fenetre-titre-${++compteurDeTitres}`
      cadre.setAttribute('aria-labelledby', titre.id)
    } else {
      cadre.setAttribute('aria-label', fenetre.dataset.surgaFenetre || 'Fenêtre de Surga')
    }
  }
  if (!cadre.hasAttribute('tabindex')) cadre.setAttribute('tabindex', '-1')
  return cadre
}

function focalisables(fenetre: HTMLElement): HTMLElement[] {
  return Array.from(fenetre.querySelectorAll<HTMLElement>(FOCALISABLES)).filter((el) => el.getClientRects().length > 0)
}

function boutonDeFermeture(fenetre: HTMLElement): HTMLElement | null {
  const nomme = fenetre.querySelector<HTMLElement>('[data-surga-fermer], button[aria-label^="Fermer" i], button[title^="Fermer" i]')
  if (nomme) return nomme
  return Array.from(fenetre.querySelectorAll<HTMLElement>('button')).find((b) => b.querySelector('svg.lucide-x')) || null
}

export default function SurgaFenetresClavier() {
  useEffect(() => {
    // Pour chaque fenêtre ouverte : l'élément qui avait le focus avant elle.
    const origines = new Map<HTMLElement, HTMLElement | null>()
    let image = 0
    // Historique : entrées posées pour des fenêtres encore ouvertes, retours lancés par ce composant et pas
    // encore reçus, fenêtres que le bouton retour vient de fermer.
    let entrees = 0
    let retoursInternes = 0
    const fermeesParRetour = new Set<HTMLElement>()

    const synchroniser = () => {
      image = 0
      const ouvertes = fenetresOuvertes()
      for (const fenetre of ouvertes) {
        if (origines.has(fenetre)) continue
        const actif = document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : null
        origines.set(fenetre, actif)
        // SRG-A3-007 : une entrée d'historique par fenêtre ouverte, à la même adresse : le bouton retour du
        // téléphone ferme la fenêtre au lieu de changer d'onglet ou de quitter Surga derrière elle.
        window.history.pushState({ surgaFenetre: true }, '')
        entrees += 1
        const cadre = decrire(fenetre)
        // Une fenêtre qui place elle-même le focus (champ de recherche, code) garde son choix.
        if (!fenetre.contains(document.activeElement)) cadre.focus({ preventScroll: true })
      }
      for (const [fenetre, origine] of Array.from(origines.entries())) {
        if (ouvertes.includes(fenetre)) continue
        origines.delete(fenetre)
        // Fenêtre fermée autrement que par le bouton retour : son entrée d'historique est retirée, si elle est
        // encore celle du dessus. Un changement d'onglet a pu passer devant : elle est alors laissée en place.
        if (fermeesParRetour.has(fenetre)) fermeesParRetour.delete(fenetre)
        else if (entrees > 0) {
          entrees -= 1
          if (window.history.state?.surgaFenetre) { retoursInternes += 1; window.history.back() }
        }
        const dessus = ouvertes[ouvertes.length - 1]
        const focusPerdu = !document.activeElement || document.activeElement === document.body || !document.activeElement.isConnected
        if (!focusPerdu) continue
        if (origine && origine.isConnected && (!dessus || dessus.contains(origine))) origine.focus({ preventScroll: true })
        else if (dessus) cadreDe(dessus).focus({ preventScroll: true })
      }
    }
    const planifier = () => { if (!image) image = window.requestAnimationFrame(synchroniser) }

    const auClavier = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return
      const ouvertes = fenetresOuvertes()
      const dessus = ouvertes[ouvertes.length - 1]
      if (!dessus) return

      if (e.key === 'Escape') {
        if (dessus.matches('[data-surga-echap="propre"]') || dessus.querySelector('[data-surga-echap="propre"]')) return
        const fermer = boutonDeFermeture(dessus)
        if (fermer) { e.preventDefault(); fermer.click() }
        return
      }

      if (e.key !== 'Tab') return
      const arrets = focalisables(dessus)
      if (arrets.length === 0) { e.preventDefault(); cadreDe(dessus).focus({ preventScroll: true }); return }
      const premier = arrets[0]
      const dernier = arrets[arrets.length - 1]
      const actif = document.activeElement as HTMLElement | null
      const dedans = Boolean(actif && dessus.contains(actif))
      if (e.shiftKey && (!dedans || actif === premier || actif === cadreDe(dessus))) { e.preventDefault(); dernier.focus() }
      else if (!e.shiftKey && (!dedans || actif === dernier)) { e.preventDefault(); premier.focus() }
    }

    const auRetour = () => {
      // Retour déclenché par ce composant pour retirer l'entrée d'une fenêtre déjà fermée : rien à faire.
      if (retoursInternes > 0) { retoursInternes -= 1; return }
      const ouvertes = fenetresOuvertes()
      const dessus = ouvertes[ouvertes.length - 1]
      if (!dessus || entrees === 0) return
      entrees -= 1
      const fermer = boutonDeFermeture(dessus)
      if (fermer) { fermeesParRetour.add(dessus); fermer.click() }
    }

    const observateur = new MutationObserver(planifier)
    observateur.observe(document.body, { childList: true, subtree: true })
    document.addEventListener('keydown', auClavier)
    window.addEventListener('popstate', auRetour)
    planifier()
    return () => {
      observateur.disconnect()
      document.removeEventListener('keydown', auClavier)
      window.removeEventListener('popstate', auRetour)
      if (image) window.cancelAnimationFrame(image)
    }
  }, [])

  return null
}
