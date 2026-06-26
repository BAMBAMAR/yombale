'use client'
import CompareBar from './CompareBar'
import FavBar from './FavBar'

export default function BottomBars() {
  return (
    <div className="bottom-bars-wrap">
      <FavBar />
      <CompareBar />
    </div>
  )
}
