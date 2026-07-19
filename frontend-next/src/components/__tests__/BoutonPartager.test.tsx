// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import BoutonPartager from '../BoutonPartager'

describe('BoutonPartager', () => {
  beforeEach(() => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } })
    vi.spyOn(window, 'open').mockReturnValue(null)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('clic sur le bouton 💬 Partager appelle window.open avec l\'URL WhatsApp encodée', () => {
    const message = 'iPhone 13 — 250 000 FCFA'
    render(
      <BoutonPartager
        lien="https://nopalou.com/boutiques/techdakar/produits/p1"
        message={message}
        lienVisuel="/assets/produit-boutique/p1/story"
      />
    )
    fireEvent.click(screen.getByText('💬 Partager'))
    expect(window.open).toHaveBeenCalledWith(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener,noreferrer'
    )
  })

  it('clic sur ⋯ ouvre le menu avec 2 actions (copier le lien + télécharger le visuel)', () => {
    render(
      <BoutonPartager
        lien="https://nopalou.com/boutiques/techdakar/produits/p1"
        message="iPhone 13 — 250 000 FCFA"
        lienVisuel="/assets/produit-boutique/p1/story"
      />
    )
    // Menu fermé au départ, ces actions n'existent pas
    expect(screen.queryByText('📋 Copier le lien')).not.toBeInTheDocument()
    expect(screen.queryByText('🖼 Télécharger le visuel')).not.toBeInTheDocument()

    // Clic sur ⋯ ouvre le menu
    fireEvent.click(screen.getByLabelText('Plus d\'options de partage'))

    // Menu ouvert, les 2 actions sont visibles
    expect(screen.getByText('📋 Copier le lien')).toBeInTheDocument()
    expect(screen.getByText('🖼 Télécharger le visuel')).toBeInTheDocument()
    // WhatsApp n'est PAS dans le menu (il est le bouton principal)
    expect(screen.queryByText('💬 Partager sur WhatsApp')).not.toBeInTheDocument()
  })

  it('copie le lien dans le presse-papier au clic sur "Copier le lien"', async () => {
    const lien = 'https://nopalou.com/boutiques/techdakar/produits/p1'
    render(
      <BoutonPartager
        lien={lien}
        message="iPhone 13 — 250 000 FCFA"
        lienVisuel="/assets/produit-boutique/p1/story"
      />
    )
    fireEvent.click(screen.getByLabelText('Plus d\'options de partage'))
    fireEvent.click(screen.getByText('📋 Copier le lien'))
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(lien)
    })
  })

  it('le lien de téléchargement pointe vers lienVisuel', () => {
    render(
      <BoutonPartager
        lien="https://nopalou.com/boutiques/techdakar/produits/p1"
        message="iPhone 13 — 250 000 FCFA"
        lienVisuel="/assets/produit-boutique/p1/story"
      />
    )
    fireEvent.click(screen.getByLabelText('Plus d\'options de partage'))
    const lienVisuelEl = screen.getByText('🖼 Télécharger le visuel') as HTMLAnchorElement
    expect(lienVisuelEl.getAttribute('href')).toBe('/assets/produit-boutique/p1/story')
  })

  it('onPartage est appelé au clic sur le bouton WhatsApp', () => {
    const onPartage = vi.fn()
    render(
      <BoutonPartager
        lien="https://nopalou.com/boutiques/techdakar/produits/p1"
        message="iPhone 13 — 250 000 FCFA"
        lienVisuel="/assets/produit-boutique/p1/story"
        onPartage={onPartage}
      />
    )
    fireEvent.click(screen.getByText('💬 Partager'))
    expect(onPartage).toHaveBeenCalled()
  })

  it('onPartage est appelé au clic sur "Copier le lien"', async () => {
    const onPartage = vi.fn()
    render(
      <BoutonPartager
        lien="https://nopalou.com/boutiques/techdakar/produits/p1"
        message="iPhone 13 — 250 000 FCFA"
        lienVisuel="/assets/produit-boutique/p1/story"
        onPartage={onPartage}
      />
    )
    fireEvent.click(screen.getByLabelText('Plus d\'options de partage'))
    fireEvent.click(screen.getByText('📋 Copier le lien'))
    await waitFor(() => {
      expect(onPartage).toHaveBeenCalled()
    })
  })
})
