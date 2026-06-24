export default function Loading() {
  return (
    <div className="skeleton-page" aria-busy="true" aria-label="Chargement…">
      <div className="skeleton-header">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-subtitle" />
      </div>
      <div className="skeleton-grid skeleton-grid--immo">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="skeleton-card skeleton-card--immo">
            <div className="skeleton skeleton-img skeleton-img--tall" />
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-line skeleton-line--short" />
            <div className="skeleton skeleton-price" />
          </div>
        ))}
      </div>
    </div>
  )
}
