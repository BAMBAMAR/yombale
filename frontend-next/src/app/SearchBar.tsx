'use client'
import { useRouter } from 'next/navigation'

export default function SearchBar({ defaultValue = '' }: { defaultValue?: string }) {
  const router = useRouter()

  return (
    <form 
      className="hero-search" 
      role="search" 
      onSubmit={(e) => {
        e.preventDefault()
        const q = (e.currentTarget.elements.namedItem('q') as HTMLInputElement).value
        if (q.trim()) {
          router.push(`/?q=${encodeURIComponent(q)}#resultats`)
        } else {
          router.push(`/#resultats`)
        }
      }}
    >
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="Ex: Samsung Galaxy A55, climatiseur 18000 BTU…"
        className="hero-search-input"
        aria-label="Rechercher un produit"
        autoComplete="off"
      />
      <button type="submit" className="hero-search-btn" aria-label="Rechercher">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </button>
    </form>
  )
}
