'use client'

import { useRouter } from 'next/navigation'
import type { ReactNode, KeyboardEvent } from 'react'

interface Props {
  id: string
  courant: boolean
  children: ReactNode
}

export default function SimilRow({ id, courant, children }: Props) {
  const router = useRouter()

  if (courant) {
    return <tr className="simil-row simil-row--courant">{children}</tr>
  }

  function goTo() {
    router.push(`/produit/${id}`)
  }

  function onKeyDown(e: KeyboardEvent<HTMLTableRowElement>) {
    if (e.key === 'Enter') goTo()
  }

  return (
    <tr
      className="simil-row simil-row--cliquable"
      onClick={goTo}
      onKeyDown={onKeyDown}
      role="link"
      tabIndex={0}
    >
      {children}
    </tr>
  )
}
