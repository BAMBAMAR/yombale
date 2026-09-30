import { safeJsonLd } from '@/lib/jsonld';

export interface JsonLdProps {
  schema: Record<string, any>;
}

export default function JsonLd({ schema }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }}
      suppressHydrationWarning
    />
  );
}
