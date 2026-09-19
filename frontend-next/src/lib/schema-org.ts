// ── Builders pour schémas Schema.org réutilisables

export function productSchema(props: {
  id: string;
  name: string;
  description?: string;
  image?: string;
  brand?: string;
  sku?: string;
  price?: number;
  priceMin?: number;
  priceMax?: number;
  priceCurrency?: string;
  offerCount?: number;
  url?: string;
  availability?: string;
}) {
  const currency = props.priceCurrency || 'XOF';
  const url = props.url || `https://nopalou.com/produit/${props.id}`;
  const availability = props.availability || 'https://schema.org/InStock';

  let offers: any = undefined;

  if (props.price != null && props.price > 0) {
    offers = {
      '@type': 'Offer',
      price: props.price,
      priceCurrency: currency,
      availability,
      url,
    };
  } else if (props.priceMin != null && props.priceMax != null && props.priceMin !== props.priceMax) {
    offers = {
      '@type': 'AggregateOffer',
      priceCurrency: currency,
      lowPrice: props.priceMin,
      highPrice: props.priceMax,
      offerCount: props.offerCount || 1,
      url,
    };
  } else if (props.priceMin != null && props.priceMin > 0) {
    offers = {
      '@type': 'Offer',
      price: props.priceMin,
      priceCurrency: currency,
      availability,
      url,
    };
  }

  const sku = props.sku || props.id;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': url,
    name: props.name,
    sku,
    mpn: sku,
    ...(props.description ? { description: props.description } : {}),
    ...(props.image ? { image: props.image } : {}),
    ...(props.brand ? { brand: { '@type': 'Brand', name: props.brand } } : {}),
    ...(offers ? { offers } : {}),
    url,
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
    description: 'Plateforme de commerce digital, comparateur de prix et solutions marchandes au Sénégal',
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

export function itemListSchema(
  items: Array<{ name: string; url: string; image?: string; description?: string }>,
  name?: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    ...(name ? { name } : {}),
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: item.url.startsWith('http') ? item.url : `https://nopalou.com${item.url}`,
      ...(item.image ? { image: item.image } : {}),
      ...(item.description ? { description: item.description } : {}),
    })),
  };
}

export function localBusinessSchema(props: {
  id: string;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  telephone?: string;
  image?: string;
  url?: string;
  priceRange?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Store',
    '@id': props.url || `https://nopalou.com/boutiques/${props.id}`,
    name: props.name,
    ...(props.description ? { description: props.description } : {}),
    ...(props.image ? { image: props.image } : {}),
    ...(props.telephone ? { telephone: props.telephone } : {}),
    priceRange: props.priceRange || 'FCFA',
    address: {
      '@type': 'PostalAddress',
      addressLocality: props.city || 'Dakar',
      addressCountry: 'SN',
      ...(props.address ? { streetAddress: props.address } : {}),
    },
  };
}

