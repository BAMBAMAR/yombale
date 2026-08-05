const fs = require('fs');
const path = require('path');

// Smart photo dictionary based on product keywords
function getPhotoForProduct(nom, cat) {
  const n = nom.toLowerCase();

  // INFORMATIQUE & CAISSE POS
  if (n.includes("routeur") || n.includes("wifi")) return "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400";
  if (n.includes("tapis") || n.includes("souris")) return "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=400";
  if (n.includes("webcam") || n.includes("camera")) return "https://images.unsplash.com/photo-1586105251261-72a756497a11?w=400";
  if (n.includes("casque") || n.includes("micro") || n.includes("jabra")) return "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400";
  if (n.includes("clavier")) return "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400";
  if (n.includes("imprimante") || n.includes("epson") || n.includes("deskjet") || n.includes("laser") || n.includes("canon")) return "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=400";
  if (n.includes("scanner") || n.includes("douchette") || n.includes("code-barres") || n.includes("tpv") || n.includes("tiroir") || n.includes("afficheur")) return "https://images.unsplash.com/photo-1556742049-0a67daf4005a?w=400";
  if (n.includes("écran") || n.includes("moniteur")) return "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400";
  if (n.includes("disque") || n.includes("ssd") || n.includes("clé usb") || n.includes("ram")) return "https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=400";
  if (n.includes("onduleur") || n.includes("apc")) return "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400";
  if (n.includes("sac à dos") || n.includes("sac pc")) return "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400";
  if (n.includes("macbook")) return "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400";
  if (cat === "informatique") return "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400";

  // SMARTPHONES & ACCESSORIES
  if (n.includes("iphone")) return "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=400";
  if (n.includes("samsung") || n.includes("galaxy")) return "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=400";
  if (n.includes("redmi") || n.includes("xiaomi") || n.includes("poco")) return "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400";
  if (n.includes("tecno") || n.includes("infinix") || n.includes("oppo") || n.includes("realme")) return "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=400";
  if (n.includes("airpods") || n.includes("buds") || n.includes("écouteur")) return "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400";
  if (n.includes("enceinte") || n.includes("jbl")) return "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400";
  if (n.includes("chargeur") || n.includes("câble")) return "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400";
  if (n.includes("power bank") || n.includes("batterie")) return "https://images.unsplash.com/photo-1609592807986-77e8a939f7d4?w=400";
  if (n.includes("montre") || n.includes("watch")) return "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400";
  if (n.includes("ring light") || n.includes("trépied") || n.includes("support")) return "https://images.unsplash.com/photo-1586105251261-72a756497a11?w=400";
  if (n.includes("carte mémoire") || n.includes("microsd")) return "https://images.unsplash.com/photo-1600541519443-96c14617b7ba?w=400";
  if (cat === "smartphones") return "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400";

  // TV & ÉLECTROMÉNAGER
  if (n.includes("tv") || n.includes("téléviseur")) return "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400";
  if (n.includes("climatiseur") || n.includes("split") || n.includes("armoire")) return "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400";
  if (n.includes("ventilateur")) return "https://images.unsplash.com/photo-1618941716939-553df3c6c276?w=400";
  if (n.includes("réfrigérateur") || n.includes("frigo")) return "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=400";
  if (n.includes("congélateur")) return "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=400";
  if (n.includes("micro-ondes") || n.includes("four") || n.includes("plaque") || n.includes("cuisinière") || n.includes("airfryer") || n.includes("friteuse")) return "https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=400";
  if (n.includes("blender") || n.includes("mixeur") || n.includes("robot") || n.includes("hachoir")) return "https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=400";
  if (n.includes("fer") || n.includes("centrale") || n.includes("defroisseur")) return "https://images.unsplash.com/photo-1544816155-12df9643f363?w=400";
  if (n.includes("machine à laver") || n.includes("lave-linge") || n.includes("sèche-linge")) return "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400";
  if (n.includes("bouilloire") || n.includes("cafetière") || n.includes("espresso")) return "https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=400";
  if (cat === "tv-electro") return "https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=400";

  // MODE
  if (n.includes("t-shirt")) return "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400";
  if (n.includes("polo")) return "https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=400";
  if (n.includes("chemise")) return "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400";
  if (n.includes("jean") || n.includes("pantalon") || n.includes("chino")) return "https://images.unsplash.com/photo-1542272604-780c36856842?w=400";
  if (n.includes("costume") || n.includes("blazer") || n.includes("veste")) return "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400";
  if (n.includes("bazin") || n.includes("djellaba") || n.includes("boubou") || n.includes("tissu") || n.includes("wax")) return "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400";
  if (n.includes("robe") || n.includes("jupe") || n.includes("blouse")) return "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400";
  if (n.includes("mocassins") || n.includes("richelieu") || n.includes("chaussures")) return "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400";
  if (n.includes("baskets") || n.includes("sneakers") || n.includes("jordan")) return "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=400";
  if (n.includes("escarpins") || n.includes("talons") || n.includes("sandales") || n.includes("claquettes")) return "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400";
  if (n.includes("sac à main") || n.includes("cabas") || n.includes("pochette") || n.includes("sac à dos femme") || n.includes("sac de voyage")) return "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400";
  if (n.includes("portefeuille") || n.includes("porte-cartes") || n.includes("ceinture")) return "https://images.unsplash.com/photo-1627123424574-724758594e93?w=400";
  if (n.includes("parfum")) return "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400";
  if (n.includes("lunettes")) return "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400";
  if (n.includes("montre")) return "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400";
  if (n.includes("casquette") || n.includes("chapeau")) return "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400";
  if (cat === "mode") return "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400";

  // ALIMENTATION
  if (n.includes("riz")) return "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400";
  if (n.includes("lait")) return "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400";
  if (n.includes("café") || n.includes("thé") || n.includes("infusion")) return "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400";
  if (n.includes("bouillon") || n.includes("jumbo") || n.includes("maggi") || n.includes("knorr") || n.includes("moutarde") || n.includes("mayonnaise") || n.includes("ketchup") || n.includes("piment") || n.includes("harissa") || n.includes("vinaigre")) return "https://images.unsplash.com/photo-1528751014936-863e6e7a319c?w=400";
  if (n.includes("huile") || n.includes("beurre") || n.includes("margarine")) return "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400";
  if (n.includes("sucre") || n.includes("miel") || n.includes("nutella") || n.includes("milo") || n.includes("nesquik") || n.includes("confiture")) return "https://images.unsplash.com/photo-1622484210800-885108920194?w=400";
  if (n.includes("jus") || n.includes("eau") || n.includes("canette") || n.includes("coca") || n.includes("fanta") || n.includes("sprite") || n.includes("energy")) return "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400";
  if (n.includes("pâtes") || n.includes("spaghetti") || n.includes("macaroni") || n.includes("coquillettes") || n.includes("vermicelles") || n.includes("couscous") || n.includes("farine")) return "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400";
  if (n.includes("oignon") || n.includes("pommes de terre") || n.includes("ail") || n.includes("gingembre") || n.includes("arachide")) return "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cf?w=400";
  if (n.includes("poisson") || n.includes("kethiakh") || n.includes("guedj") || n.includes("yeet") || n.includes("sardines") || n.includes("thon") || n.includes("beef")) return "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400";

  return "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400";
}

// 1. ALIMENTATION
const alimentationBase = [
  // Riz (12)
  { nom: "Riz brisé Sadia 25kg" },
  { nom: "Riz parfumé Dinor 5kg" },
  { nom: "Riz brisé Royal 50kg" },
  { nom: "Riz local de la Vallée 25kg" },
  { nom: "Riz Parfumé Jasmine 25kg" },
  { nom: "Riz Basmati Indien 5kg" },
  { nom: "Riz Parfumé Lion 25kg" },
  { nom: "Riz Cargo Complet 5kg" },
  { nom: "Riz étuvé local 25kg" },
  { nom: "Sac de Riz Thaï 50kg" },
  { nom: "Riz Brisé 100% Parfum Elephant 25kg" },
  { nom: "Riz Long Grain Blanc 10kg" },

  // Laits & Laitiers (12)
  { nom: "Lait Nido 400g" },
  { nom: "Lait Nido 900g" },
  { nom: "Lait Nido 2.5kg (Format Familial)" },
  { nom: "Lait Gloria 160g" },
  { nom: "Lait Peak en Poudre 400g" },
  { nom: "Lait Peak 900g" },
  { nom: "Lait Concentré Sucré Nestlé 397g" },
  { nom: "Lait Caillé Naturel 1L" },
  { nom: "Lait UHT Candia 1L (Pack de 6)" },
  { nom: "Lait de Coco 400ml" },
  { nom: "Lait Bonnet Rouge 400g" },
  { nom: "Lait Vitalait UHT 1L" },

  // Cafés, Thés (12)
  { nom: "Café Touba Moulé 250g" },
  { nom: "Café Touba Moulé 500g" },
  { nom: "Café Nescafé Classic 200g" },
  { nom: "Café Nescafé 3 en 1 (Sachet de 10)" },
  { nom: "Café Carte Noire 250g Moulu" },
  { nom: "Café en Grains Espresso 1kg" },
  { nom: "Thé Lipton Yellow Label (100 sachets)" },
  { nom: "Thé Vert Flecha 8147 (250g)" },
  { nom: "Thé Vert Achoura (250g)" },
  { nom: "Thé Vert Lord (250g)" },
  { nom: "Infusion Menthe Poivrée (20 sachets)" },
  { nom: "Infusion Verveine Bio (20 sachets)" },

  // Bouillons, Condiments, Sauces (18)
  { nom: "Bouillon Jumbo Poulet (60 cubes)" },
  { nom: "Bouillon Jumbo Crevette (60 cubes)" },
  { nom: "Bouillon Jumbo Oignon (60 cubes)" },
  { nom: "Bouillon Jumbo Bœuf (60 cubes)" },
  { nom: "Bouillon Maggi Arôme 200ml" },
  { nom: "Bouillon Maggi Poulet (60 cubes)" },
  { nom: "Bouillon Knorr Bœuf (48 cubes)" },
  { nom: "Moutarde Amora 265g" },
  { nom: "Moutarde Maille 200g" },
  { nom: "Mayonnaise Lesieur 475g" },
  { nom: "Mayonnaise Calvé 450g" },
  { nom: "Ketchup Amora Flacon 500g" },
  { nom: "Ketchup Heinz 400g" },
  { nom: "Sauce Piment Extra Forte 200g" },
  { nom: "Harissa en Tube 150g" },
  { nom: "Vinaigre Blanc d'Alcool 1L" },
  { nom: "Vinaigre de Cidre Bio 500ml" },
  { nom: "Sauce Soja Claire 250ml" },

  // Huiles (10)
  { nom: "Huile Dinor 5L" },
  { nom: "Huile Niani 1L" },
  { nom: "Huile Lesieur Tournesol 5L" },
  { nom: "Huile de Palme Rouge 1L" },
  { nom: "Huile d'Arachide Locale 1L" },
  { nom: "Huile d'Olive Extra Vierge 750ml" },
  { nom: "Beurre Président Plaquette 250g" },
  { nom: "Margarine Planta 500g" },
  { nom: "Huile de Sésame Pur 250ml" },
  { nom: "Huile de Mais 2L" },

  // Sucres & Produits Sucrés (10)
  { nom: "Sucre en Poudre Mimran 1kg" },
  { nom: "Sucre en Morceaux CSS 1kg" },
  { nom: "Sucre Roux Pur Canne 1kg" },
  { nom: "Sucre Vanillé Alsa (Sachet de 10)" },
  { nom: "Miel Pur Naturel 500g" },
  { nom: "Chocolat à tartiner Nutella 400g" },
  { nom: "Chocolat en Poudre Milo 400g" },
  { nom: "Chocolat en Poudre Nesquik 400g" },
  { nom: "Confiture de Fraise St Mamet 350g" },
  { nom: "Confiture d'Abricot 350g" },

  // Boissons & Jus (14)
  { nom: "Jus Pressea Mangue 1L" },
  { nom: "Jus Pressea Orange 1L" },
  { nom: "Jus Pressea Ananas-Gingembre 1L" },
  { nom: "Nectar de Bissap Kirène 1L" },
  { nom: "Eau Kirène 1.5L (Pack de 6)" },
  { nom: "Eau Kirène Bidon 5L" },
  { nom: "Eau Oulmès Pétillante 1L" },
  { nom: "Eau Casamançaise 1.5L (Pack de 6)" },
  { nom: "Canette Gazelle 33cl" },
  { nom: "Canette Coca-Cola 33cl (Pack de 6)" },
  { nom: "Canette Fanta Orange 33cl" },
  { nom: "Canette Sprite 33cl" },
  { nom: "Energy Drink Cody's 250ml" },
  { nom: "Energy Drink Monster 500ml" },

  // Céréales Locales & Desserts (9)
  { nom: "Thiakry Frais 500g" },
  { nom: "Araw de Petit Millet 1kg" },
  { nom: "Couscous de Millet (Souna) 1kg" },
  { nom: "Sankhal de Millet 1kg" },
  { nom: "Sirop de Bissap 1L" },
  { nom: "Sirop de Bouye 1L" },
  { nom: "Sirop de Gingembre (Gnamakoudji) 1L" },
  { nom: "Fleurs de Bissap Séchées 500g" },
  { nom: "Poudre de Bouye (Baobab) 500g" },

  // Conserves & Poissons (13)
  { nom: "Sac d'Oignons 25kg" },
  { nom: "Sac d'Oignons Importés 25kg" },
  { nom: "Sac de Pommes de Terre 25kg" },
  { nom: "Sac d'Ail Frais 5kg" },
  { nom: "Sac de Gingembre Frais 5kg" },
  { nom: "Pâte d'Arachide Mafé 1kg" },
  { nom: "Kethiakh (Poisson Salé Séché) 1kg" },
  { nom: "Guedj (Poisson Séché Artisanal) 500g" },
  { nom: "Yeet (Mollusque Séché) 250g" },
  { nom: "Crevettes Séchées Moulières 200g" },
  { nom: "Sardines Titus à l'Huile (Boîte 125g)" },
  { nom: "Thon Entier au Naturel 160g" },
  { nom: "Corned Beef Hereford 340g" }
];

// 2. SMARTPHONES & ACCESSORIES
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

// 3. INFORMATIQUE & CAISSE POS
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

// 4. TV & ÉLECTROMÉNAGER
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

// 5. MODE & HABILLEMENT
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

const cataloguesRaw = {
  alimentation: alimentationBase.map(item => ({ nom: item.nom, cat: "alimentation" })),
  smartphones: smartphonesNames.map(nom => ({ nom: nom, cat: "smartphones" })),
  informatique: informatiqueNames.map(nom => ({ nom: nom, cat: "informatique" })),
  "tv-electro": electroNames.map(nom => ({ nom: nom, cat: "tv-electro" })),
  mode: modeNames.map(nom => ({ nom: nom, cat: "mode" }))
};

const outputData = {};

Object.keys(cataloguesRaw).forEach(cat => {
  const items = cataloguesRaw[cat];
  outputData[cat] = items.map((base, i) => ({
    id: `${cat}-${i + 1}`,
    nom: base.nom,
    description: `Produit authentique de qualité supérieure: ${base.nom}`,
    categorie: cat,
    photo_defaut: getPhotoForProduct(base.nom, cat)
  }));
});

const outputPath = path.join(__dirname, 'data', 'catalogues-standards.json');
fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf8');
console.log(`✅ Catalogue généré avec succès dans ${outputPath} (${Object.keys(outputData).length} catégories, ${Object.values(outputData).flat().length} produits au total).`);
