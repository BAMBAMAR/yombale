'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

export default function NavbarSearch() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = inputRef.current?.value.trim()
    if (q) {
      router.push(`/recherche?q=${encodeURIComponent(q)}`)
      setOpen(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <form className={`navbar-search${open ? ' navbar-search--open' : ''}`} onSubmit={handleSubmit} role="search">
      {open && (
        <input
          ref={inputRef}
          type="search"
          placeholder="Rechercher un produit…"
          className="navbar-search-input"
          autoFocus
          onBlur={() => setOpen(false)}
          aria-label="Recherche"
        />
      )}
      <button
        type={open ? 'submit' : 'button'}
        className="navbar-search-btn"
        aria-label="Ouvrir la recherche"
        onClick={() => !open && setOpen(true)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </button>
    </form>
  )
}
