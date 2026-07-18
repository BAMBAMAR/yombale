// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CaracChips } from '../BoutiqueClient'

describe('CaracChips', () => {
  it('affiche les suggestions en boutons cliquables', () => {
    render(<CaracChips label="Marque" name="marque" value="" onChange={() => {}} suggestions={['Zara', 'Nike']} />)
    expect(screen.getByRole('button', { name: 'Zara' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nike' })).toBeInTheDocument()
  })

  it('appelle onChange avec la valeur cliquée', () => {
    const onChange = vi.fn()
    render(<CaracChips label="Marque" name="marque" value="" onChange={onChange} suggestions={['Zara', 'Nike']} />)
    fireEvent.click(screen.getByRole('button', { name: 'Zara' }))
    expect(onChange).toHaveBeenCalledWith('marque', 'Zara')
  })

  it('désélectionne en recliquant la valeur déjà active', () => {
    const onChange = vi.fn()
    render(<CaracChips label="Marque" name="marque" value="Zara" onChange={onChange} suggestions={['Zara', 'Nike']} />)
    fireEvent.click(screen.getByRole('button', { name: 'Zara' }))
    expect(onChange).toHaveBeenCalledWith('marque', '')
  })

  it('affiche un bouton Autre qui révèle un champ texte', () => {
    const onChange = vi.fn()
    render(<CaracChips label="Marque" name="marque" value="" onChange={onChange} suggestions={['Zara']} />)
    fireEvent.click(screen.getByRole('button', { name: 'Autre' }))
    const input = screen.getByPlaceholderText('Autre valeur…')
    fireEvent.change(input, { target: { value: 'Uniqlo' } })
    expect(onChange).toHaveBeenCalledWith('marque', 'Uniqlo')
  })

  it("active automatiquement le mode Autre si la valeur ne correspond à aucune suggestion", () => {
    render(<CaracChips label="Marque" name="marque" value="Uniqlo" onChange={() => {}} suggestions={['Zara', 'Nike']} />)
    expect(screen.getByDisplayValue('Uniqlo')).toBeInTheDocument()
  })

  it('ne propose pas de bouton Autre si allowAutre=false', () => {
    render(<CaracChips label="Genre" name="genre" value="" onChange={() => {}} suggestions={['Homme', 'Femme']} allowAutre={false} />)
    expect(screen.queryByRole('button', { name: 'Autre' })).not.toBeInTheDocument()
  })
})
