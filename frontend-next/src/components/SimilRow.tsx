'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { Children, isValidElement, cloneElement } from 'react'

interface Props {
  id: string
  basePath: string
  courant: boolean
  children: ReactNode
}

export default function SimilRow({ id, basePath, courant, children }: Props) {
  if (courant) {
    return <tr className="simil-row simil-row--courant">{children}</tr>
  }

  const href = `${basePath}/${encodeURIComponent(id)}`

  return (
    <tr className="simil-row simil-row--cliquable">
      {Children.map(children, (child) => {
        if (!isValidElement(child)) return child
        return cloneElement(child as React.ReactElement, {
          children: (
            <Link href={href} className="simil-td-link">
              {(child as React.ReactElement).props.children}
            </Link>
          ),
        })
      })}
    </tr>
  )
}
