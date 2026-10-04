// AGENT 8 — test de rendu réel de DrawerCartSuccessModal (FIX-004 volet UI). Aucune modification du code du projet.
import React from 'react'
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import DrawerCartSuccessModal from '@/components/cart/DrawerCartSuccessModal'
import type { OrderSuccessData } from '@/components/cart/types'

const base: OrderSuccessData = {
  boutiqueNom: 'Boutique Audit', boutiqueId: 'b1', whatsapp: '221771234567', modeLivraison: 'livraison',
  reference: 'C-AUDIT8-0001', total: 2500, sousTotal: 2500, fraisLivraison: 0, reduction: 0, methodePaiement: 'wave',
  clientNom: 'Client', clientTel: '772345678', items: [{ nom: 'Savon', quantite: 1, prix: 2500 }],
} as OrderSuccessData

afterEach(() => cleanup())

describe('FIX-004 UI — DrawerCartSuccessModal', () => {
  it('UI-01 repli Wave : affiche le numéro 777202086, l\'opérateur Wave et la référence en motif', () => {
    const { container } = render(<DrawerCartSuccessModal orderSuccessData={{ ...base, fallbackManuel: true, numeroDepot: '777202086', operateurManuel: 'wave' }} onClose={() => {}} />)
    const txt = container.textContent || ''
    expect(txt).toContain('777202086')
    expect(txt).toMatch(/Paiement manuel requis/)
    expect(txt).toContain('C-AUDIT8-0001')
    expect(txt).toMatch(/wave/i)
  })
  it('UI-02 sans repli : aucun bloc de paiement manuel (pas de faux positif)', () => {
    const { container } = render(<DrawerCartSuccessModal orderSuccessData={{ ...base, fallbackManuel: false }} onClose={() => {}} />)
    const txt = container.textContent || ''
    expect(txt).not.toMatch(/Paiement manuel requis/)
    expect(txt).not.toContain('777202086')
  })
  it('UI-03 aucun émoji Unicode dans le rendu du repli (règle d\'or n°1)', () => {
    const { container } = render(<DrawerCartSuccessModal orderSuccessData={{ ...base, fallbackManuel: true, numeroDepot: '777202086', operateurManuel: 'wave' }} onClose={() => {}} />)
    expect(/\p{Extended_Pictographic}/u.test(container.textContent || '')).toBe(false)
  })
  it('UI-04 icônes SVG (lucide) présentes dans le bloc de repli', () => {
    const { container } = render(<DrawerCartSuccessModal orderSuccessData={{ ...base, fallbackManuel: true }} onClose={() => {}} />)
    expect(container.querySelectorAll('svg').length).toBeGreaterThanOrEqual(3)
  })
  it('UI-05 le lien WhatsApp marchand contient la mention de transfert manuel', () => {
    const { container } = render(<DrawerCartSuccessModal orderSuccessData={{ ...base, fallbackManuel: true, numeroDepot: '777202086', operateurManuel: 'wave' }} onClose={() => {}} />)
    const hrefs = Array.from(container.querySelectorAll('a')).map((a) => decodeURIComponent(a.getAttribute('href') || ''))
    expect(hrefs.some((h) => h.includes('transfert manuel') && h.includes('777202086'))).toBe(true)
  })
  it('UI-06 repli sans numeroDepot fourni : valeur par défaut 777202086 (robustesse)', () => {
    const { container } = render(<DrawerCartSuccessModal orderSuccessData={{ ...base, fallbackManuel: true }} onClose={() => {}} />)
    expect(container.textContent).toContain('777202086')
  })
  it('UI-07 couleurs : le bloc de repli n\'utilise aucune couleur hexadécimale ad hoc hors tokens (règle d\'or n°3)', () => {
    const { container } = render(<DrawerCartSuccessModal orderSuccessData={{ ...base, fallbackManuel: true }} onClose={() => {}} />)
    const html = container.innerHTML
    const hexHorsVar = (html.match(/(?<!var\([^)]*,\s*)#[0-9a-fA-F]{3,8}\b/g) || [])
    // informatif : on exige 0 hex nu (ex. #ffffff) dans le HTML rendu
    expect(hexHorsVar, `hex ad hoc trouvés : ${hexHorsVar.join(',')}`).toHaveLength(0)
  })
})
