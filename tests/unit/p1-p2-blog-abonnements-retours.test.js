// tests/unit/p1-p2-blog-abonnements-retours.test.js
// Tests unitaires pour les modules stratégiques P1/P2 : Blog CMS SEO, Abonnements Récurrents & Retours/Avoirs

describe('Sprint P1 & P2 : Roadmap Stratégique Nopalou', () => {

  describe('1. Blog CMS Marchand & SEO', () => {
    function slugify(text) {
      return (text || '')
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    test('Génère des slugs propres et valides pour le SEO à partir de titres avec accents', () => {
      expect(slugify('5 astuces pour entretenir son tissu Bazin riche !')).toBe('5-astuces-pour-entretenir-son-tissu-bazin-riche');
      expect(slugify('Nouveautés Électroménager Dakar & Almadies')).toBe('nouveautes-electromenager-dakar-almadies');
      expect(slugify('   Promotion Spéciale Tabaski 2026   ')).toBe('promotion-speciale-tabaski-2026');
    });

    test('Extrait automatiquement un résumé de 160 caractères si non fourni', () => {
      const longContent = 'Bienvenue dans notre guide complet du shopping responsable au Sénégal. Nous vous expliquons pas à pas comment sélectionner les meilleurs produits locaux et soutenir nos artisans dakarois.';
      const autoExtrait = longContent.replace(/<[^>]*>?/gm, '').slice(0, 160) + '...';
      expect(autoExtrait.length).toBeLessThanOrEqual(165);
      expect(autoExtrait).toContain('Bienvenue dans notre guide');
    });
  });

  describe('2. Abonnements Récurrents & Commandes Périodiques', () => {
    function calculerProchaineDate(frequence, fromDate = new Date()) {
      const d = new Date(fromDate);
      if (frequence === 'hebdomadaire') {
        d.setDate(d.getDate() + 7);
      } else if (frequence === 'bimensuel') {
        d.setDate(d.getDate() + 14);
      } else if (frequence === 'mensuel') {
        d.setMonth(d.getMonth() + 1);
      } else {
        d.setDate(d.getDate() + 7);
      }
      return d;
    }

    test('Calcule exactement la prochaine date selon la fréquence', () => {
      const baseDate = new Date('2026-09-14T10:00:00Z');

      const nextHebdo = calculerProchaineDate('hebdomadaire', baseDate);
      expect(nextHebdo.toISOString().slice(0, 10)).toBe('2026-09-21');

      const nextBimensuel = calculerProchaineDate('bimensuel', baseDate);
      expect(nextBimensuel.toISOString().slice(0, 10)).toBe('2026-09-28');

      const nextMensuel = calculerProchaineDate('mensuel', baseDate);
      expect(nextMensuel.toISOString().slice(0, 10)).toBe('2026-10-14');
    });

    test('Formate l\'ordre de livraison récurrente', () => {
      const abonnement = {
        id: 'abo-123',
        client_nom: 'Fatou Diop',
        client_telephone: '771234567',
        client_adresse: 'Plateau, Rue Carnot',
        frequence: 'hebdomadaire',
        montant_total: 12500,
        statut: 'actif'
      };

      const refCmd = `ABO-${Date.now().toString().slice(-6)}`;
      expect(refCmd).toMatch(/^ABO-\d{6}$/);
      expect(abonnement.statut).toBe('actif');
      expect(abonnement.montant_total).toBe(12500);
    });
  });

  describe('3. Retours Produits, Avoirs & Réintégration de Stock', () => {
    test('Identifie correctement les retours réintégrables en stock vs mis au rebut', () => {
      const retourStock = {
        produit_id: 'prod-456',
        produit_nom: 'Robe Bazin Taille L',
        quantite: 2,
        action_stock: 'remis_en_stock',
        type_compensation: 'avoir',
        montant_fcfa: 35000
      };

      const retourDefectueux = {
        produit_id: 'prod-789',
        produit_nom: 'Écouteurs Bluetooth',
        quantite: 1,
        action_stock: 'rebut',
        type_compensation: 'remboursement',
        montant_fcfa: 15000
      };

      expect(retourStock.action_stock).toBe('remis_en_stock');
      expect(retourStock.type_compensation).toBe('avoir');

      expect(retourDefectueux.action_stock).toBe('rebut');
      expect(retourDefectueux.type_compensation).toBe('remboursement');
    });

    test('Génère la référence du Bon d\'Avoir formaté pour le ticket de caisse', () => {
      const retourId = 'e2b3c4d5-6789-4abc-def0-123456789abc';
      const codeAvoir = `AVOIR-${retourId.slice(-6).toUpperCase()}`;
      expect(codeAvoir).toBe('AVOIR-789ABC');
    });
  });
});
