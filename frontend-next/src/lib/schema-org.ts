// ── Builders pour schémas Schema.org réutilisables

export function productSchema(props: {
  id: string;
  name: string;
  description?: string;
  image?: string;
  brand?: string;
  sku?: string;
  priceMin?: number;
  priceMax?: number;
  priceCurrency?: string;
  offerCount?: number;
  url?: string;
}) {
  const offers =
    props.priceMin && props.priceMax
      ? {
          '@type': 'AggregateOffer',
          priceCurrency: props.priceCurrency || 'XOF',
          lowPrice: props.priceMin,
          highPrice: props.priceMax,
          offerCount: props.offerCount || 1,
        }
      : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `https://nopalou.com/produit/${props.id}`,
    name: props.name,
    ...(props.description ? { description: props.description } : {}),
    ...(props.image ? { image: props.image } : {}),
    ...(props.brand ? { brand: { '@type': 'Brand', name: props.brand } } : {}),
    ...(props.sku ? { sku: props.sku, mpn: props.sku } : {}),
    ...(offers ? { offers } : {}),
    ...(props.url ? { url: props.url } : {}),
  };
}

export function breadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `https://nopalou.com${item.url}`,
    })),
  };
}

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Nopalou',
    url: 'https://nopalou.com',
    logo: 'https://nopalou.com/icons/icon-512.svg',
    description: 'Comparateur de prix N°1 au Sénégal',
    sameAs: [
      'https://www.facebook.com/profile.php?id=61591675701726',
      'https://twitter.com/nopalou_sn',
      'https://www.instagram.com/nopalousn/',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      telephone: '+221708717942',
      email: 'contact@nopalou.com',
    },
  };
}

export function faqSchema(items: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export function aggregateRatingSchema(props: {
  ratingValue: number;
  ratingCount: number;
  reviewCount?: number;
}) {
  return {
    '@type': 'AggregateRating',
    ratingValue: props.ratingValue,
    ratingCount: props.ratingCount,
    ...(props.reviewCount ? { reviewCount: props.reviewCount } : {}),
  };
}
