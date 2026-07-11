export interface PartnerLogosProps {
  className?: string;
}

const PARTNERS = [
  { name: 'Jumia Senegal', emoji: '🛒' },
  { name: 'CoinAfrique', emoji: '🏪' },
  { name: 'Expat-Dakar', emoji: '📦' },
  { name: 'Dakar-Deal', emoji: '🛍' },
  { name: 'SenMarket', emoji: '🏬' },
];

export default function PartnerLogos({ className = '' }: PartnerLogosProps) {
  return (
    <div className={`partner-logos ${className}`}>
      <p className="partner-logos-titre">Nos partenaires de confiance</p>
      <div className="partner-logos-grid">
        {PARTNERS.map((p) => (
          <div key={p.name} className="partner-logo-item">
            <span className="partner-logo-emoji">{p.emoji}</span>
            <span className="partner-logo-name">{p.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
