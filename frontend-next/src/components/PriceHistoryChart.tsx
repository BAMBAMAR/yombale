'use client';

interface HistoriqueData {
  jour: string;
  prix_min: number;
  prix_max: number;
  variation_pct: number;
}

interface PriceHistoryChartProps {
  data: HistoriqueData[];
  height?: number;
}

export default function PriceHistoryChart({ data, height = 200 }: PriceHistoryChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="chart-empty">
        Pas d'historique disponible pour ce produit.
      </div>
    );
  }

  // Trouver min/max pour normalisation
  const allPrices = data.flatMap((d) => [d.prix_min, d.prix_max]);
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const priceRange = maxPrice - minPrice || 1;

  // SVG dimensions
  const chartWidth = 600;
  const chartHeight = height;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Calcul positions des points
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * innerWidth;
    const yMin = innerHeight - ((d.prix_min - minPrice) / priceRange) * innerHeight;
    const yMax = innerHeight - ((d.prix_max - minPrice) / priceRange) * innerHeight;
    return { x, yMin, yMax, ...d };
  });

  // SVG path pour la zone entre min/max
  const areaPath = `M ${points.map((p) => `${p.x},${p.yMin}`).join(' L ')} L ${points
    .reverse()
    .map((p) => `${p.x},${p.yMax}`)
    .join(' L ')} Z`;

  // SVG path pour la ligne min
  const minLinePath = `M ${points.map((p) => `${p.x},${p.yMin}`).join(' L ')}`;

  return (
    <div className="chart-container">
      <svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
        {/* Grille Y */}
        {[0, 25, 50, 75, 100].map((pct) => {
          const y = padding.top + (innerHeight * (100 - pct)) / 100;
          const price = minPrice + (priceRange * pct) / 100;
          return (
            <g key={`grid-${pct}`}>
              <line x1={padding.left} y1={y} x2={chartWidth - padding.right} y2={y} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4" />
              <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#9ca3af">
                {Math.round(price)}
              </text>
            </g>
          );
        })}

        {/* Zone min/max */}
        <path d={areaPath} fill="rgba(199, 91, 0, 0.1)" />

        {/* Ligne min */}
        <path d={minLinePath} stroke="var(--accent)" strokeWidth="2" fill="none" />

        {/* Points */}
        {points.map((p, i) => (
          <circle key={`point-${i}`} cx={p.x} cy={p.yMin} r="3" fill="var(--accent)" />
        ))}

        {/* Étiquettes X (tous les 7 points) */}
        {points.map((p, i) => {
          if (i % Math.ceil(data.length / 6) !== 0 && i !== data.length - 1) return null;
          return (
            <g key={`label-${i}`}>
              <text x={p.x} y={chartHeight - padding.bottom + 20} textAnchor="middle" fontSize="11" fill="#6b7280">
                {p.jour}
              </text>
            </g>
          );
        })}

        {/* Axes */}
        <line x1={padding.left} y1={padding.top} x2={padding.left} y2={chartHeight - padding.bottom} stroke="#d1d5db" strokeWidth="1" />
        <line x1={padding.left} y1={chartHeight - padding.bottom} x2={chartWidth - padding.right} y2={chartHeight - padding.bottom} stroke="#d1d5db" strokeWidth="1" />
      </svg>

      {/* Légende */}
      <div className="chart-legend">
        <div className="chart-legend-item">
          <div className="chart-legend-color" style={{ background: 'var(--accent)' }}></div>
          <span>Prix minimum par jour</span>
        </div>
        <div className="chart-legend-item">
          <div className="chart-legend-color" style={{ background: 'rgba(199, 91, 0, 0.1)' }}></div>
          <span>Plage min-max</span>
        </div>
      </div>

      {/* Statistiques */}
      <div className="chart-stats">
        <div>
          <p className="chart-stats-label">Prix min (30j)</p>
          <p className="chart-stats-value">{Math.round(minPrice).toLocaleString('fr-SN')} FCFA</p>
        </div>
        <div>
          <p className="chart-stats-label">Prix max (30j)</p>
          <p className="chart-stats-value">{Math.round(maxPrice).toLocaleString('fr-SN')} FCFA</p>
        </div>
        <div>
          <p className="chart-stats-label">Variation</p>
          <p className="chart-stats-value" style={{ color: 'var(--price)' }}>
            {((1 - minPrice / maxPrice) * 100).toFixed(0)}% ↓
          </p>
        </div>
      </div>
    </div>
  );
}
