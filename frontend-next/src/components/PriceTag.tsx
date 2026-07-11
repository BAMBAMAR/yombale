export interface PriceTagProps {
  price: number;
  currency?: string;
  verified?: boolean;
  timestamp?: string;
  className?: string;
}

export default function PriceTag({
  price,
  currency = 'FCFA',
  verified = false,
  timestamp,
  className = ''
}: PriceTagProps) {
  return (
    <div className={`price-tag ${className}`}>
      <span className="price-tag-value" style={{ fontFamily: 'var(--font-ibm-plex-mono, monospace)' }}>
        {price.toLocaleString('fr-SN')} {currency}
      </span>
      {verified && <span className="badge-verified">✓ VÉRIFIÉ</span>}
      {timestamp && <span className="price-tag-timestamp">{timestamp}</span>}
    </div>
  );
}
