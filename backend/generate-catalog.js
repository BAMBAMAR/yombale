const fs = require('fs');
const path = require('path');

// Helper to create category items easily
function createItems(cat, baseList) {
  return baseList.map((item, idx) => {
    let name = item.nom;
    let photo = item.photo;
    let desc = item.desc || `Produit authentique de qualité supérieure: ${name}`;
    return {
      nom: name,
      desc: desc,
      photo: photo
    };
  });
}

// 1. ALIMENTATION (100 Produits)
const alimentationBase = [
  // Riz (12)
  { nom: "Riz brisé Sadia 25kg", photo: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400" },
  { nom: "Riz parfumé Dinor 5kg", photo: "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=400" },
  { nom: "Riz brisé Royal 50kg", photo: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400" },
  { nom: "Riz local de la Vallée 25kg", photo: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400" },
  { nom: "Riz Parfumé Jasmine 25kg", photo: "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=400" },
  { nom: "Riz Basmati Indien 5kg", photo: "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=400" },
  { nom: "Riz Parfumé Lion 25kg", photo: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400" },
  { nom: "Riz Cargo Complet 5kg", photo: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400" },
  { nom: "Riz étuvé local 25kg", photo: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400" },
  { nom: "Sac de Riz Thaï 50kg", photo: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400" },
  { nom: "Riz Brisé 100% Parfum Elephant 25kg", photo: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400" },
  { nom: "Riz Long Grain Blanc 10kg", photo: "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=400" },

  // Laits & Laitiers (12)
  { nom: "Lait Nido 400g", photo: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400" },
  { nom: "Lait Nido 900g", photo: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400" },
  { nom: "Lait Nido 2.5kg (Format Familial)", photo: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400" },
  { nom: "Lait Gloria 160g", photo: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400" },
  { nom: "Lait Peak en Poudre 400g", photo: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400" },
  { nom: "Lait Peak 900g", photo: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400" },
  { nom: "Lait Concentré Sucré Nestlé 397g", photo: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400" },
  { nom: "Lait Caillé Naturel 1L", photo: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400" },
  { nom: "Lait UHT Candia 1L (Pack de 6)", photo: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400" },
  { nom: "Lait de Coco 400ml", photo: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400" },
  { nom: "Lait Bonnet Rouge 400g", photo: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400" },
  { nom: "Lait Vitalait UHT 1L", photo: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400" },

  // Cafés, Thés (12)
  { nom: "Café Touba Moulé 250g", photo: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400" },
  { nom: "Café Touba Moulé 500g", photo: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400" },
  { nom: "Café Nescafé Classic 200g", photo: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400" },
  { nom: "Café Nescafé 3 en 1 (Sachet de 10)", photo: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400" },
  { nom: "Café Carte Noire 250g Moulu", photo: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400" },
  { nom: "Café en Grains Espresso 1kg", photo: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400" },
  { nom: "Thé Lipton Yellow Label (100 sachets)", photo: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400" },
  { nom: "Thé Vert Flecha 8147 (250g)", photo: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=400" },
  { nom: "Thé Vert Achoura (250g)", photo: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=400" },
  { nom: "Thé Vert Lord (250g)", photo: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=400" },
  { nom: "Infusion Menthe Poivrée (20 sachets)", photo: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400" },
  { nom: "Infusion Verveine Bio (20 sachets)", photo: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400" },

  // Bouillons, Condiments, Sauces (18)
  { nom: "Bouillon Jumbo Poulet (60 cubes)", photo: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400" },
  { nom: "Bouillon Jumbo Crevette (60 cubes)", photo: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400" },
  { nom: "Bouillon Jumbo Oignon (60 cubes)", photo: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400" },
  { nom: "Bouillon Jumbo Bœuf (60 cubes)", photo: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400" },
  { nom: "Bouillon Maggi Arôme 200ml", photo: "https://images.unsplash.com/photo-1528751014936-863e6e7a319c?w=400" },
  { nom: "Bouillon Maggi Poulet (60 cubes)", photo: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400" },
  { nom: "Bouillon Knorr Bœuf (48 cubes)", photo: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400" },
  { nom: "Moutarde Amora 265g", photo: "https://images.unsplash.com/photo-1528751014936-863e6e7a319c?w=400" },
  { nom: "Moutarde Maille 200g", photo: "https://images.unsplash.com/photo-1528751014936-863e6e7a319c?w=400" },
  { nom: "Mayonnaise Lesieur 475g", photo: "https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=400" },
  { nom: "Mayonnaise Calvé 450g", photo: "https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=400" },
  { nom: "Ketchup Amora Flacon 500g", photo: "https://images.unsplash.com/photo-1528751014936-863e6e7a319c?w=400" },
  { nom: "Ketchup Heinz 400g", photo: "https://images.unsplash.com/photo-1528751014936-863e6e7a319c?w=400" },
  { nom: "Sauce Piment Extra Forte 200g", photo: "https://images.unsplash.com/photo-1528751014936-863e6e7a319c?w=400" },
  { nom: "Harissa en Tube 150g", photo: "https://images.unsplash.com/photo-1528751014936-863e6e7a319c?w=400" },
  { nom: "Vinaigre Blanc d'Alcool 1L", photo: "https://images.unsplash.com/photo-1528751014936-863e6e7a319c?w=400" },
  { nom: "Vinaigre de Cidre Bio 500ml", photo: "https://images.unsplash.com/photo-1528751014936-863e6e7a319c?w=400" },
  { nom: "Sauce Soja Claire 250ml", photo: "https://images.unsplash.com/photo-1528751014936-863e6e7a319c?w=400" },

  // Huiles (10)
  { nom: "Huile Dinor 5L", photo: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400" },
  { nom: "Huile Niani 1L", photo: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400" },
  { nom: "Huile Lesieur Tournesol 5L", photo: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400" },
  { nom: "Huile de Palme Rouge 1L", photo: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400" },
  { nom: "Huile d'Arachide Locale 1L", photo: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400" },
  { nom: "Huile d'Olive Extra Vierge 750ml", photo: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400" },
  { nom: "Beurre Président Plaquette 250g", photo: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400" },
  { nom: "Margarine Planta 500g", photo: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400" },
  { nom: "Huile de Sésame Pur 250ml", photo: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400" },
  { nom: "Huile de Mais 2L", photo: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400" },

  // Sucres & Produits Sucrés (10)
  { nom: "Sucre en Poudre Mimran 1kg", photo: "https://images.unsplash.com/photo-1622484210800-885108920194?w=400" },
  { nom: "Sucre en Morceaux CSS 1kg", photo: "https://images.unsplash.com/photo-1581006852262-e4307cf6283a?w=400" },
  { nom: "Sucre Roux Pur Canne 1kg", photo: "https://images.unsplash.com/photo-1622484210800-885108920194?w=400" },
  { nom: "Sucre Vanillé Alsa (Sachet de 10)", photo: "https://images.unsplash.com/photo-1622484210800-885108920194?w=400" },
  { nom: "Miel Pur Naturel 500g", photo: "https://images.unsplash.com/photo-1587049352847-4a222e784d38?w=400" },
  { nom: "Chocolat à tartiner Nutella 400g", photo: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400" },
  { nom: "Chocolat en Poudre Milo 400g", photo: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400" },
  { nom: "Chocolat en Poudre Nesquik 400g", photo: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400" },
  { nom: "Confiture de Fraise St Mamet 350g", photo: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400" },
  { nom: "Confiture d'Abricot 350g", photo: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400" },

  // Boissons & Jus (14)
  { nom: "Jus Pressea Mangue 1L", photo: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400" },
  { nom: "Jus Pressea Orange 1L", photo: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400" },
  { nom: "Jus Pressea Ananas-Gingembre 1L", photo: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400" },
  { nom: "Nectar de Bissap Kirène 1L", photo: "https://images.unsplash.com/photo-1556881286-fc6915169721?w=400" },
  { nom: "Eau Kirène 1.5L (Pack de 6)", photo: "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=400" },
  { nom: "Eau Kirène Bidon 5L", photo: "https://images.unsplash.com/photo-1560023907-5f313c875300?w=400" },
  { nom: "Eau Oulmès Pétillante 1L", photo: "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=400" },
  { nom: "Eau Casamançaise 1.5L (Pack de 6)", photo: "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=400" },
  { nom: "Canette Gazelle 33cl", photo: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400" },
  { nom: "Canette Coca-Cola 33cl (Pack de 6)", photo: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400" },
  { nom: "Canette Fanta Orange 33cl", photo: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400" },
  { nom: "Canette Sprite 33cl", photo: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400" },
  { nom: "Energy Drink Cody's 250ml", photo: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400" },
  { nom: "Energy Drink Monster 500ml", photo: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400" },

  // Céréales Locales & Desserts (9)
  { nom: "Thiakry Frais 500g", photo: "https://images.unsplash.com/photo-1541518763669-27fef04b14da?w=400" },
  { nom: "Araw de Petit Millet 1kg", photo: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400" },
  { nom: "Couscous de Millet (Souna) 1kg", photo: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400" },
  { nom: "Sankhal de Millet 1kg", photo: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400" },
  { nom: "Sirop de Bissap 1L", photo: "https://images.unsplash.com/photo-1556881286-fc6915169721?w=400" },
  { nom: "Sirop de Bouye 1L", photo: "https://images.unsplash.com/photo-1570831739435-660143a4e5d5?w=400" },
  { nom: "Sirop de Gingembre (Gnamakoudji) 1L", photo: "https://images.unsplash.com/photo-1556881286-fc6915169721?w=400" },
  { nom: "Fleurs de Bissap Séchées 500g", photo: "https://images.unsplash.com/photo-1556881286-fc6915169721?w=400" },
  { nom: "Poudre de Bouye (Baobab) 500g", photo: "https://images.unsplash.com/photo-1570831739435-660143a4e5d5?w=400" },

  // Conserves & Poissons (13)
  { nom: "Sac d'Oignons 25kg", photo: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cf?w=400" },
  { nom: "Sac d'Oignons Importés 25kg", photo: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cf?w=400" },
  { nom: "Sac de Pommes de Terre 25kg", photo: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400" },
  { nom: "Sac d'Ail Frais 5kg", photo: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cf?w=400" },
  { nom: "Sac de Gingembre Frais 5kg", photo: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cf?w=400" },
  { nom: "Pâte d'Arachide Mafé 1kg", photo: "https://images.unsplash.com/photo-1567894510008-724444444444?w=400" },
  { nom: "Kethiakh (Poisson Salé Séché) 1kg", photo: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400" },
  { nom: "Guedj (Poisson Séché Artisanal) 500g", photo: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400" },
  { nom: "Yeet (Mollusque Séché) 250g", photo: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400" },
  { nom: "Crevettes Séchées Moulières 200g", photo: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400" },
  { nom: "Sardines Titus à l'Huile (Boîte 125g)", photo: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400" },
  { nom: "Thon Entier au Naturel 160g", photo: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400" },
  { nom: "Corned Beef Hereford 340g", photo: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400" }
];

// 2. SMARTPHONES & ACCESSORIES (100 Produits)
const smartphonesNames = [
  "iPhone 8 64Go", "iPhone 8 Plus 64Go", "iPhone X 64Go", "iPhone XR 128Go", "iPhone XS Max 256Go",
  "iPhone 11 64Go", "iPhone 11 Pro 128Go", "iPhone 11 Pro Max 256Go", "iPhone 12 Mini 64Go", "iPhone 12 128Go",
  "iPhone 12 Pro 128Go", "iPhone 12 Pro Max 256Go", "iPhone 13 Mini 128Go", "iPhone 13 128Go", "iPhone 13 Pro 256Go",
  "iPhone 13 Pro Max 256Go", "iPhone 14 128Go", "iPhone 14 Plus 128Go", "iPhone 14 Pro 256Go", "iPhone 14 Pro Max 256Go",
  "iPhone 15 128Go", "iPhone 15 Plus 256Go", "iPhone 15 Pro 256Go", "iPhone 15 Pro Max 256Go", "iPhone 15 Pro Max 512Go",
  "Samsung Galaxy A03 32Go", "Samsung Galaxy A04 32Go", "Samsung Galaxy A05 64Go", "Samsung Galaxy A13 64Go", "Samsung Galaxy A14 64Go",
  "Samsung Galaxy A23 128Go", "Samsung Galaxy A24 128Go", "Samsung Galaxy A33 5G", "Samsung Galaxy A34 5G 128Go", "Samsung Galaxy A53 5G",
  "Samsung Galaxy A54 5G 128Go", "Samsung Galaxy A73 5G", "Samsung Galaxy S20 FE 128Go", "Samsung Galaxy S21 5G", "Samsung Galaxy S21 Ultra 256Go",
  "Samsung Galaxy S22 5G", "Samsung Galaxy S22+ 256Go", "Samsung Galaxy S22 Ultra 256Go", "Samsung Galaxy S23 128Go", "Samsung Galaxy S23 Ultra 256Go",
  "Samsung Galaxy S24 Ultra 512Go", "Samsung Galaxy Z Flip 4", "Samsung Galaxy Z Flip 5 256Go", "Samsung Galaxy Z Fold 5 512Go", "Redmi 10A 32Go",
  "Redmi 12C 64Go", "Redmi 12 128Go", "Redmi Note 11 128Go", "Redmi Note 12 128Go", "Redmi Note 12 Pro 128Go",
  "Redmi Note 13 256Go", "Redmi Note 13 Pro 5G", "Redmi Note 13 Pro+ 5G 512Go", "Poco X5 Pro 5G", "Xiaomi 13T Pro 512Go",
  "Tecno Pop 7 64Go", "Tecno Spark 9 64Go", "Tecno Spark 10 128Go", "Tecno Spark 10 Pro 256Go", "Tecno Camon 19 128Go",
  "Tecno Camon 20 256Go", "Tecno Camon 20 Pro 256Go", "Tecno Camon 20 Premier", "Tecno Pova 5 Pro", "Tecno Phantom X2 Pro 256Go",
  "Infinix Smart 7 64Go", "Infinix Smart 8 64Go", "Infinix Hot 20 128Go", "Infinix Hot 30 128Go", "Infinix Hot 30i 128Go",
  "Infinix Note 12 128Go", "Infinix Note 30 128Go", "Infinix Note 30 Pro 256Go", "Infinix Note 30 VIP", "Infinix Zero 30 5G",
  "Oppo A17 64Go", "Oppo A58 128Go", "Oppo A78 128Go", "Realme C33 64Go", "Realme C55 128Go",
  "Apple AirPods 2", "Apple AirPods 3", "Apple AirPods Pro (2ème Gén)", "Apple AirPods Max", "Samsung Galaxy Buds FE",
  "Samsung Galaxy Buds2 Pro", "JBL Tune 510BT Casque", "JBL Wave 200TWS Écouteurs", "Enceinte JBL GO 3", "Enceinte JBL Charge 5",
  "Chargeur Rapide USB-C 20W", "Chargeur Samsung 25W USB-C", "Power Bank Remax 20000mAh", "Support Téléphone Voiture MagSafe", "Carte Mémoire MicroSD Sandisk 128Go"
];

// 3. INFORMATIQUE & CAISSE POS (100 Produits)
const informatiqueNames = [
  "MacBook Air 13\" M1 256Go", "MacBook Air 13\" M2 256Go", "MacBook Air 15\" M2 512Go", "MacBook Pro 14\" M2 512Go", "MacBook Pro 16\" M3 Max 1To",
  "HP 250 G8 i3 8Go", "HP 255 G8 Ryzen 3", "HP Pavilion 15 i5 Touch", "HP ProBook 440 G9 i5", "HP ProBook 450 G9 i7",
  "HP EliteBook 830 G8 i5", "HP EliteBook 840 G8 i7", "HP EliteBook 850 G8 i7", "HP Envy x360 15", "HP Omen 16 Gamer RTX 4060",
  "Dell Vostro 3510 i3", "Dell Inspiron 3520 i5", "Dell Latitude 3420 i5", "Dell Latitude 5420 i5 256Go", "Dell Latitude 5530 i7",
  "Dell Latitude 7420 i7", "Dell XPS 13 i7 16Go", "Dell XPS 15 i9 32Go", "Dell G15 Gamer RTX 3050", "Lenovo V15 i3 8Go",
  "Lenovo IdeaPad 3 Ryzen 5", "Lenovo IdeaPad Slim 5 i7", "Lenovo ThinkPad L14 i5", "Lenovo ThinkPad T14 i7", "Lenovo ThinkPad X1 Carbon",
  "Lenovo Legion 5 Gamer RTX 4060", "Asus Vivobook 15 i5", "Asus ZenBook 14 OLED i7", "Asus ROG Strix G16 RTX 4070", "Acer Aspire 3 i3",
  "Acer Nitro 5 Gamer RTX 3060", "Imprimante Thermique Caisse 80mm USB/Ethernet", "Imprimante Thermique Caisse 58mm Bluetooth", "Tiroir Caisse Métallique Automatique", "Scanner Douchette Code-Barres 1D USB",
  "Scanner Douchette Code-Barres 2D QR USB", "Scanner Omnidirectionnel Fixe de Caisse 2D", "Écran TPV Tactile 15\" Caisse All-in-One", "Afficheur Client 2 Lignes VFD Caisse", "Imprimante HP DeskJet 2710",
  "Imprimante HP LaserJet M111w", "Imprimante HP Smart Tank 515", "Imprimante Epson EcoTank L3250", "Imprimante Epson EcoTank L4260", "Imprimante Canon PIXMA TS3340",
  "Imprimante Canon Laser LBP6030w", "Imprimante Brother Laser HL-L2350DW", "Scanner A4 Flatbed Canon CanoScan", "Écran PC Dell 22\" FHD", "Écran PC Dell 24\" IPS Full HD",
  "Écran PC Dell 27\" 4K", "Écran PC Samsung 24\" Incurvé", "Écran PC LG 27\" UltraFine", "Écran PC HP 24f FHD", "Écran PC Gamer Asus 24\" 165Hz",
  "Disque Dur Externe WD Elements 1To", "Disque Dur Externe WD My Passport 2To", "Disque Dur Externe Seagate 4To", "Disque SSD Externe Samsung T7 500Go", "Disque SSD Externe Samsung T7 1To",
  "Disque SSD Externe SanDisk Extreme 1To", "Clé USB SanDisk 32Go", "Clé USB SanDisk 64Go", "Clé USB SanDisk 128Go", "Clé USB SanDisk Dual Type-C 128Go",
  "Barrette RAM PC Portable DDR4 8Go", "Barrette RAM PC Portable DDR4 16Go", "Disque SSD NVMe M.2 512Go", "Disque SSD NVMe M.2 1To", "Clavier Filaire Logitech K120 USB",
  "Clavier Sans Fil Logitech K380", "Clavier Mécanique Gamer RGB", "Souris Filaire Logitech M90", "Souris Sans Fil Logitech M185", "Souris Bluetooth Logitech MX Master 3S",
  "Onduleur APC 650VA", "Onduleur APC 1000VA LCD", "Onduleur APC 1500VA LCD", "Routeur WiFi TP-Link N300", "Routeur 4G WiFi Huawei avec SIM",
  "Tapis de Souris Ergonomique repose-poignet", "Webcam Logitech C920 HD Pro 1080p", "Casque Micro USB Jabra Visioconférence", "Hub USB-C 7 en 1 Aluminium", "Sac à Dos PC Portable 15.6\" Imperméable"
];

// 4. TV & ÉLECTROMÉNAGER (100 Produits)
const electroNames = [
  "TV LED Samsung 32\" HD", "TV LED Samsung 43\" Smart Full HD", "TV LED Samsung 50\" 4K Crystal UHD", "TV LED Samsung 55\" 4K QLED", "TV LED Samsung 65\" 4K Neo QLED",
  "TV LED Samsung 75\" 4K UHD", "TV LED LG 32\" HD", "TV LED LG 43\" Smart Full HD", "TV LED LG 55\" 4K UHD Smart", "TV LED LG 65\" OLED 4K Smart",
  "TV Smart TCL 32\" Android HD", "TV Smart TCL 43\" Full HD", "TV Smart TCL 55\" 4K QLED", "TV Smart TCL 65\" 4K Google TV", "TV Hisense 32\" HD Smart",
  "TV Hisense 43\" Smart FHD", "TV Hisense 55\" 4K UHD", "TV Hisense 65\" 4K QLED", "TV Midea 32\" HD LED", "TV Nasco 43\" Smart FHD",
  "Climatiseur Split Midea 9000 BTU", "Climatiseur Split Midea 12000 BTU Inverter", "Climatiseur Split Midea 18000 BTU Inverter", "Climatiseur Split Midea 24000 BTU", "Climatiseur Split Samsung 12000 BTU",
  "Climatiseur Split LG Dual Inverter 12000 BTU", "Climatiseur Armoire 24000 BTU", "Climatiseur Armoire 48000 BTU", "Ventilateur sur Pied Orientable 16\"", "Ventilateur sur Pied Métallique 18\"",
  "Ventilateur Rechargeable 16\" avec Télécommande", "Ventilateur de Plafond 56\" 3 Pales", "Humidificateur d'air ultrasonique 4L", "Réfrigérateur Midea 150L 1 Porte", "Réfrigérateur Midea 250L 2 Portes",
  "Réfrigérateur Side-by-Side Midea 500L", "Réfrigérateur Samsung 200L Double Porte", "Réfrigérateur Samsung NoFrost 300L", "Réfrigérateur Side-by-Side Samsung 550L", "Réfrigérateur LG Combinaison NoFrost 340L",
  "Réfrigérateur Hisense 220L Double Porte", "Congélateur Horizontal Midea 100L", "Congélateur Horizontal Midea 200L", "Congélateur Horizontal Midea 300L", "Congélateur Coffre Midea 400L",
  "Congélateur Vertical 6 Tiroirs NoFrost", "Cave à Vin 18 Bouteilles", "Micro-ondes Moulinex 20L", "Micro-ondes Samsung 23L Grill", "Four Électrique Posable 35L",
  "Four Électrique 45L Tournebroche", "Four Encastrable Inox 60cm", "Plaque à Gaz 4 Feux Inox", "Plaque Mixte Gaz/Induction 4 Feux", "Plaque à Induction Portative 2000W",
  "Cuisinière à Gaz 50x50 4 Feux", "Cuisinière 60x60 avec Four Inox", "Friteuse Sans Huile AirFryer 4.5L", "Friteuse Sans Huile AirFryer XXL 7L", "Friteuse Électrique à Huile 3L",
  "Mixeur Blender Kenwood 1.5L", "Blender Moulinex Faciclic 1.75L", "Robot Pâtissier Moulinex 800W", "Robot Culinaire Multifonction Philips 750W", "Hachoir à Viande Électrique 1500W",
  "Presse-Agrumes Électrique 100W", "Centrifugeuse Fruits & Légumes 800W", "Extracteur de Jus à Froid", "Batteur Électrique 5 Vitesses", "Moulin à Café Électrique",
  "Fer à Repasser à Vapeur Calor 2000W", "Fer à Repasser Tefal 2400W", "Centrale à Vapeur Philips 2400W", "Defroisseur Vapeur Vertical", "Machine à Laver Frontale Midea 7kg",
  "Machine à Laver Frontale Midea 9kg", "Machine à Laver LG 8kg Inverter", "Machine à Laver Samsung 9kg AddWash", "Machine à Laver Semi-Automatique 8kg", "Machine Semi-Automatique Double Bac 12kg",
  "Sèche-Linge à Condensation 8kg", "Aspirateur Sans Sac Moulinex 1800W", "Aspirateur Balai Sans Fil 2 en 1", "Bouilloire Électrique Inox 1.8L", "Cafetière Électrique à Filtre 12 Tasses",
  "Machine à Café Espresso DeLonghi", "Grille-Pain 2 Fentes Inox", "Machine à Gaufres et Croque-Monsieur", "Chauffe-Eau Électrique 50L", "Chauffe-Eau Gaz 10L Instantané"
];

// 5. MODE & HABILLEMENT (100 Produits)
const modeNames = [
  "T-shirt Coton Noir Col Rond", "T-shirt Coton Blanc Uni", "Polo Homme Coton Piqué Noir", "Polo Homme Coton Piqué Bleu Marine", "Chemise Homme Blanche Slim Fit",
  "Chemise Homme Bleue Ciel Bureau", "Chemise Manches Courtes Motifs Wax", "Chemise Homme en Lin Beige", "Pantalon Jean Levi's 501 Straight", "Pantalon Jean Levi's 511 Slim",
  "Pantalon Chino Beige Homme", "Pantalon Chino Noir Homme", "Pantalon de Costume Noir", "Short Jean Homme Décontracté", "Short de Sport Respirant",
  "Costume Homme 2 Pièces Noir", "Costume Homme Bleu Nuit Ajusté", "Veste Blazer Homme Chic", "Veste en Cuir Noir Homme", "Veste en Jeans Levi's Classic",
  "Ensemble Survêtement Nike Tech Fleece", "Ensemble Survêtement Adidas 3 Bandes", "Ensemble Bazin Riche Getzner Homme", "Djellaba Brodée Traditionnelle Homme", "Boubou Traditionnel 3 Pièces Brodé",
  "Grand Boubou Bazin Cérémonie", "Robe de Soirée Élégante Longue", "Robe Courte Fleurie d'Été", "Robe Droite Professionnelle Chic", "Robe Wax Traditionnelle",
  "Tissu Wax Hollandais (6 Yards)", "Tissu Bazin Riche Gagné (5m)", "Ensemble Tailleur Pantalon Femme", "Blouse en Soie Blanche Col V", "Jupe Crayon Noire Bureau",
  "Jupe Longue Plissée Soleil", "Jean Femme Taille Haute Slim", "Legging Noir Opaque Confort", "Gilet Cardigan Maille Douce", "Manteau Court Laine Femme",
  "Ensemble Kimono Satin Imprimé", "Kaftan Marocain Brodé Or", "Tenue Traditionnelle Taille Basse", "Mocassins Cuir Marron Homme", "Mocassins Cuir Noir Cousus Main",
  "Chaussures Richelieu Cuir Noir", "Baskets Nike Air Force 1 Blanches", "Baskets Adidas Stan Smith Cuir", "Baskets Puma Suede Classic", "Baskets Air Jordan 1 Retro High",
  "Sandales Cuir Artisanales Homme", "Claquettes Nike Victori One", "Baskets Running Asics Gel", "Escarpins Cuir Noir Femme (Talon 8cm)", "Sandales à Talons Dorées Soirée",
  "Ballerines Cuir Souple Femme", "Baskets Compensées Femme Trendy", "Bottines en Cuir Marron Femme", "Sac à Main Cuir Véritable Femme Noir", "Sac Cabas Cuir Marron Grand Format",
  "Sac Bandoulière Compact Cuir", "Pochette de Soirée Dorée Chic", "Sac à Dos Femme Cuir Élégant", "Sac Banane Cuir Tendance", "Sac de Voyage Cuir 50cm",
  "Portefeuille Cuir Homme Multi-cartes", "Porte-Cartes Cuir Slim Minimaliste", "Ceinture Cuir Noir Homme", "Ceinture Cuir Marron Homme", "Ceinture Femme Boucle Dorée",
  "Parfum Sauvage Dior 100ml", "Parfum Bleu de Chanel 100ml", "Parfum Terre d'Hermès 100ml", "Parfum One Million Paco Rabanne 100ml", "Parfum La Vie Est Belle LANCOME 75ml",
  "Parfum Coco Mademoiselle Chanel 50ml", "Parfum Black Opium YSL 90ml", "Lunettes de Soleil Ray-Ban Aviator", "Lunettes de Soleil Ray-Ban Wayfarer", "Montre Homme Seiko Automatique Acier",
  "Montre Homme Fossil Cuir Marron", "Montre Femme Casio Vintage Dorée", "Montre Femme Michael Kors Dorée", "Casquette Nike Dri-FIT", "Chapeau Fedora Laine Noir",
  "Écharpe Cashmere Unissexe", "Foulard Soie Motifs Elegants", "Parure Bijoux Fantaisie Dorée", "Gants Cuir Homme Hiver", "Chaussettes Coton Sport (Pack de 3)"
];

// Helper to output json
const cataloguesOut = {
  alimentation: alimentationBase,
  smartphones: createItems("smartphones", smartphonesNames.map(n => ({ nom: n, photo: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=400" }))),
  informatique: createItems("informatique", informatiqueNames.map(n => ({ nom: n, photo: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400" }))),
  "tv-electro": createItems("tv-electro", electroNames.map(n => ({ nom: n, photo: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400" }))),
  mode: createItems("mode", modeNames.map(n => ({ nom: n, photo: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400" })))
};

const outputData = {};

Object.keys(cataloguesOut).forEach(cat => {
  const items = cataloguesOut[cat];
  outputData[cat] = items.map((base, i) => ({
    id: `${cat}-${i + 1}`,
    nom: base.nom,
    description: base.desc || `Produit authentique de qualité supérieure: ${base.nom}`,
    categorie: cat,
    photo_defaut: base.photo
  }));
});

const outputPath = path.join(__dirname, 'data', 'catalogues-standards.json');
fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf8');
console.log(`✅ Catalogue généré avec succès dans ${outputPath} (${Object.keys(outputData).length} catégories, ${Object.values(outputData).flat().length} produits au total).`);
