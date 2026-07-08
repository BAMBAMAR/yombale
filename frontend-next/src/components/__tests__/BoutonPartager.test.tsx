// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BoutonPartager from '../BoutonPartager'

describe('BoutonPartager', () => {
  beforeEach(() => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } })
  })

  it('ouvre le menu et affiche les 3 actions au clic sur le bouton principal', () => {
    render(
      <BoutonPartager
        lien="https://nopalou.com/boutiques/techdakar/produits/p1"
        message="iPhone 13 — 250 000 FCFA"
        lienVisuel="/assets/produit-boutique/p1/story"
      />
    )
    fireEvent.click(screen.getByText('📤 Partager'))
    expect(screen.getByText('📋 Copier le lien')).toBeInTheDocument()
    expect(screen.getByText('💬 Partager sur WhatsApp')).toBeInTheDocument()
    expect(screen.getByText('🖼 Télécharger le visuel')).toBeInTheDocument()
  })

  it('copie le lien dans le presse-papier au clic sur "Copier le lien"', async () => {
    render(
      <BoutonPartager
        lien="https://nopalou.com/boutiques/techdakar/produits/p1"
        message="iPhone 13 — 250 000 FCFA"
        lienVisuel="/assets/produit-boutique/p1/story"
      />
    )
    fireEvent.click(screen.getByText('📤 Partager'))
    fireEvent.click(screen.getByText('📋 Copier le lien'))
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://nopalou.com/boutiques/techdakar/produits/p1')
  })

  it('le lien WhatsApp inclut le message encodé', () => {
    render(
      <BoutonPartager
        lien="https://nopalou.com/boutiques/techdakar/produits/p1"
        message="iPhone 13 — 250 000 FCFA"
        lienVisuel="/assets/produit-boutique/p1/story"
      />
    )
    fireEvent.click(screen.getByText('📤 Partager'))
    const lienWa = screen.getByText('💬 Partager sur WhatsApp').closest('a')
    expect(lienWa?.getAttribute('href')).toBe(`https://wa.me/?text=${encodeURIComponent('iPhone 13 — 250 000 FCFA')}`)
  })

  it('le lien de téléchargement pointe vers lienVisuel', () => {
    render(
      <BoutonPartager
        lien="https://nopalou.com/boutiques/techdakar/produits/p1"
        message="iPhone 13 — 250 000 FCFA"
        lienVisuel="/assets/produit-boutique/p1/story"
      />
    )
    fireEvent.click(screen.getByText('📤 Partager'))
    const lienVisuelEl = screen.getByText('🖼 Télécharger le visuel').closest('a')
    expect(lienVisuelEl?.getAttribute('href')).toBe('/assets/produit-boutique/p1/story')
  })
})
