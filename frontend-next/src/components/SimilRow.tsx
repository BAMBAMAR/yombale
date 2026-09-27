'use client'

import { useRouter } from 'next/navigation'
import type { ReactNode, KeyboardEvent, MouseEvent } from 'react'

interface Props {
  id: string
  basePath: string
  courant: boolean
  children: ReactNode
}

export default function SimilRow({ id, basePath, courant, children }: Props) {
  const router = useRouter()

  if (courant) {
    return <tr className="simil-row simil-row--courant">{children}</tr>
  }

  const href = `${basePath}/${encodeURIComponent(id)}`

  const handleClick = (e: MouseEvent<HTMLTableRowElement>) => {
    const target = e.target as HTMLElement | null
    if (target?.closest('a, button, input, select, textarea')) {
      return
    }
    router.push(href)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTableRowElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const target = e.target as HTMLElement | null
      if (target?.closest('a, button, input, select, textarea')) {
        return
      }
      e.preventDefault()
      router.push(href)
    }
  }

  return (
    <tr
      className="simil-row simil-row--cliquable"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="link"
      style={{ cursor: 'pointer' }}
    >
      {children}
    </tr>
  )
}
