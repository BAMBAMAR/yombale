'use client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface SearchWithAnchorProps {
  action: string
  defaultValue: string
  placeholder: string
  hiddenParams: Record<string, string>
  clearLink: string
}

export default function SearchWithAnchor({ action, defaultValue, placeholder, hiddenParams, clearLink }: SearchWithAnchorProps) {
  const router = useRouter()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const p = new URLSearchParams()
    
    Object.entries(hiddenParams).forEach(([k, v]) => {
      if (v) p.set(k, v)
    })
    
    const q = formData.get('q') as string
    if (q && q.trim()) p.set('q', q.trim())
    
    const qs = p.toString()
    router.push(`${action}${qs ? `?${qs}` : ''}#resultats`)
  }

  return (
    <form onSubmit={onSubmit} className="annonces-search">
      <input
        type="text"
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="annonces-search-input"
      />
      <button type="submit" className="annonces-search-btn">🔍 Rechercher</button>
      {defaultValue && (
        <Link href={clearLink} className="budget-pill budget-pill--reset">
          ✕ Recherche
        </Link>
      )}
    </form>
  )
}
