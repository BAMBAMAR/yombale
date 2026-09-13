// tests/unit/analytics-funnel.test.js
// Tests unitaires pour l'entonnoir de conversion et analytics (Phase 10 — P2)

describe('Entonnoir de Conversion & Analytics (Phase 10 — P2)', () => {
  function calculerMetriquesFunnel(vuesBoutique, vuesProduit, ajoutsPanier, checkoutsInities, commandesPayees) {
    const tauxVisiteProduit = vuesBoutique > 0 ? parseFloat(((vuesProduit / vuesBoutique) * 100).toFixed(1)) : 0;
    const tauxProduitPanier = vuesProduit > 0 ? parseFloat(((ajoutsPanier / vuesProduit) * 100).toFixed(1)) : 0;
    const tauxPanierCheckout = ajoutsPanier > 0 ? parseFloat(((checkoutsInities / ajoutsPanier) * 100).toFixed(1)) : 0;
    const tauxCheckoutCommande = checkoutsInities > 0 ? parseFloat(((commandesPayees / checkoutsInities) * 100).toFixed(1)) : 0;
    const tauxConversionGlobal = vuesBoutique > 0 ? parseFloat(((commandesPayees / vuesBoutique) * 100).toFixed(2)) : 0;
    const tauxAbandonPanier = ajoutsPanier > 0 ? parseFloat((((ajoutsPanier - commandesPayees) / ajoutsPanier) * 100).toFixed(1)) : 0;

    return {
      tauxVisiteProduit,
      tauxProduitPanier,
      tauxPanierCheckout,
      tauxCheckoutCommande,
      tauxConversionGlobal,
      tauxAbandonPanier: Math.max(0, tauxAbandonPanier),
    };
  }

  test('calcule correctement les taux de transformation par étape', () => {
    const metrics = calculerMetriquesFunnel(1000, 500, 100, 50, 25);

    expect(metrics.tauxVisiteProduit).toBe(50.0);
    expect(metrics.tauxProduitPanier).toBe(20.0);
    expect(metrics.tauxPanierCheckout).toBe(50.0);
    expect(metrics.tauxCheckoutCommande).toBe(50.0);
    expect(metrics.tauxConversionGlobal).toBe(2.5);
    expect(metrics.tauxAbandonPanier).toBe(75.0);
  });

  test('gère gracieusement les zéros sans division par zéro ni NaN', () => {
    const metrics = calculerMetriquesFunnel(0, 0, 0, 0, 0);

    expect(metrics.tauxVisiteProduit).toBe(0);
    expect(metrics.tauxProduitPanier).toBe(0);
    expect(metrics.tauxPanierCheckout).toBe(0);
    expect(metrics.tauxCheckoutCommande).toBe(0);
    expect(metrics.tauxConversionGlobal).toBe(0);
    expect(metrics.tauxAbandonPanier).toBe(0);
  });

  test('mappe correctement les intervalles temporels selon la période demandée', () => {
    const getIntervalSql = (periode) =>
      periode === '7j' ? "INTERVAL '7 days'" : periode === '90j' ? "INTERVAL '90 days'" : "INTERVAL '30 days'";

    expect(getIntervalSql('7j')).toBe("INTERVAL '7 days'");
    expect(getIntervalSql('30j')).toBe("INTERVAL '30 days'");
    expect(getIntervalSql('90j')).toBe("INTERVAL '90 days'");
    expect(getIntervalSql('inconnu')).toBe("INTERVAL '30 days'");
  });
});
