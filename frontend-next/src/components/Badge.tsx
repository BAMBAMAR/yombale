export type BadgeVariant = 'disc' | 'verified' | 'best-price';

export interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Badge({ variant, children, size = 'md', className = '' }: BadgeProps) {
  const variantClasses = {
    disc: 'badge-disc',
    verified: 'badge-verified',
    'best-price': 'badge-best-price',
  };

  return (
    <span className={`badge badge-${size} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}
