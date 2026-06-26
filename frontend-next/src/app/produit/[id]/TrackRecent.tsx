'use client'

import { useEffect } from 'react'
import { saveRecent } from '@/app/RecentlyViewed'

interface Props {
  id: number
  nom: string
  prix_min: number | null
  image_url: string | null
}

export default function TrackRecent({ id, nom, prix_min, image_url }: Props) {
  useEffect(() => {
    saveRecent({ id, nom, prix_min, image_url })
  }, [id, nom, prix_min, image_url])

  return null
}
