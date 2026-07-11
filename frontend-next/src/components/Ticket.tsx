'use client';

export interface TicketProps {
  children: React.ReactNode;
  tilt?: number;
  className?: string;
}

export default function Ticket({ children, tilt = -2, className = '' }: TicketProps) {
  return (
    <div
      className={`ticket ${className}`}
      style={{
        transform: `rotate(${tilt}deg)`,
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
      }}
    >
      {children}
    </div>
  );
}
