'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SearchBar({ defaultValue = '' }: { defaultValue?: string }) {
  const router = useRouter()
  const [value, setValue] = useState(defaultValue)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = value.trim()
    router.push(q ? `/?q=${encodeURIComponent(q)}` : '/')
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
      <button type="submit" className="hero-search-btn">
        🔍 Rechercher
      </button>
    </form>
  )
}
