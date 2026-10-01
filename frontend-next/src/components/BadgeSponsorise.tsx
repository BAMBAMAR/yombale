import type { CSSProperties } from 'react'
import { LIBELLE_SPONSORISE } from '@/lib/sponsoring'

/** AUD-160 : étiquette d'un placement payant. N'affiche rien si le sponsoring n'est pas actif. */
export default function BadgeSponsorise({ actif, style }: { actif: boolean; style?: CSSProperties }) {
  if (!actif) return null
  return (
    <span
      style={{
        position: 'absolute', bottom: 6, left: 6, zIndex: 2,
        background: 'rgba(255, 255, 255, 0.94)', color: 'var(--navy, #1C2B4A)',
        padding: '2px 8px', borderRadius: 10, fontSize: 10.5, fontWeight: 800,
        border: '1px solid var(--border, #E8DDD2)',
        ...style,
      }}
    >
      {LIBELLE_SPONSORISE}
    </span>
  )
}
