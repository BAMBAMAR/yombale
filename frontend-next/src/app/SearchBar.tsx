'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SearchBar({ defaultValue = '' }: { defaultValue?: string }) {
  const router = useRouter()
  const [value, setValue] = useState(defaultValue)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = value.trim()
    const url = q ? `/?q=${encodeURIComponent(q)}` : '/'
    router.push(url)
    router.refresh()
  }

  return (
    <form className="hero-search" onSubmit={handleSubmit} role="search">
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
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
