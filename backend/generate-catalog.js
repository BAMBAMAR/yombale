const fs = require('fs');
const path = require('path');

const catalogues = {
  alimentation: [
    { nom: "Riz brisé Sadia 25kg", desc: "Riz brisé de qualité supérieure, idéal pour le Ceebu Jën", photo: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400" },
    { nom: "Riz parfumé Dinor 5kg", desc: "Riz parfumé grain long, arôme naturel intense", photo: "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=400" },
    { nom: "Lait Nido 400g", desc: "Lait entier en poudre enrichi en vitamines et minéraux", photo: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400" },
    { nom: "Lait Nido 900g", desc: "Grand format de lait entier en poudre Nido", photo: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400" },
    { nom: "Lait Gloria 160g", desc: "Lait concentré non sucré onctueux pour le café ou thé", photo: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400" },
    { nom: "Café Touba Moulé 250g", desc: "Café moulu traditionnel sénégalais épicé au piment noir (Jar)", photo: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400" },
    { nom: "Café Touba Moulé 500g", desc: "Grand format de café Touba moulu traditionnel", photo: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400" },
    { nom: "Bouillon Jumbo Poulet (60 cubes)", desc: "Boîte de 60 cubes d'assaisonnement saveur poulet", photo: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400" },
    { nom: "Bouillon Jumbo Crevette (60 cubes)", desc: "Boîte de 60 cubes d'assaisonnement saveur crevette", photo: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400" },
    { nom: "Bouillon Maggi Arôme 200ml", desc: "Flacon d'arôme liquide Maggi pour assaisonner tous vos plats", photo: "https://images.unsplash.com/photo-1528751014936-863e6e7a319c?w=400" },
    { nom: "Huile Dinor 5L", desc: "Huile végétale raffinée 100% pure pour friture et cuisson", photo: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400" },
    { nom: "Huile Niani 1L", desc: "Bouteille 1L d'huile de tournesol raffinée", photo: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400" },
    { nom: "Sucre en Poudre Mimran 1kg", desc: "Sucre blanc raffiné pur canne en sachet 1kg", photo: "https://images.unsplash.com/photo-1622484210800-885108920194?w=400" },
    { nom: "Sucre en Morceaux CSS 1kg", desc: "Boîte de 1kg de sucre blanc en morceaux", photo: "https://images.unsplash.com/photo-1581006852262-e4307cf6283a?w=400" },
    { nom: "Thé Lipton Yellow Label (100 sachets)", desc: "Boîte de 100 sachets de thé noir intense", photo: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400" },
    { nom: "Thé Vert Flecha 8147 (250g)", desc: "Véritable thé vert de Chine pour la préparation de l'Ataya", photo: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=400" },
    { nom: "Jus Pressea Mangue 1L", desc: "Brique 1L de jus de mangue sénégalais rafraîchissant", photo: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400" },
    { nom: "Jus Pressea Orange 1L", desc: "Jus d'orange en brique 1L d'origine naturelle", photo: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400" },
    { nom: "Eau Kirène 1.5L (Pack de 6)", desc: "Pack de 6 bouteilles d'eau minérale naturelle Kirène", photo: "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=400" },
    { nom: "Eau Kirène Bidon 5L", desc: "Grand bidon 5L d'eau minérale naturelle", photo: "https://images.unsplash.com/photo-1560023907-5f313c875300?w=400" },
    { nom: "Canette Gazelle 33cl", desc: "Boisson rafraîchissante locale 33cl", photo: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400" },
    { nom: "Thiakry Frais 500g", desc: "Dessert traditionnel à base de couscous de millet et lait caillé", photo: "https://images.unsplash.com/photo-1541518763669-27fef04b14da?w=400" },
    { nom: "Araw de Petit Millet 1kg", desc: "Granulés de millet traditionnel pour préparation de Lakh ou Ngalakh", photo: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400" },
    { nom: "Sirop de Bissap 1L", desc: "Concentré naturel d'hibiscus fait maison", photo: "https://images.unsplash.com/photo-1556881286-fc6915169721?w=400" },
    { nom: "Sirop de Bouye 1L", desc: "Concentré de pain de singe (fruit du baobab)", photo: "https://images.unsplash.com/photo-1570831739435-660143a4e5d5?w=400" },
    { nom: "Moutarde Amora 265g", desc: "Pot de moutarde forte de Dijon", photo: "https://images.unsplash.com/photo-1528751014936-863e6e7a319c?w=400" },
    { nom: "Mayonnaise Lesieur 475g", desc: "Bocal de mayonnaise onctueuse aux œufs frais", photo: "https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=400" },
    { nom: "Pâtes Spaghetti Panzani 500g", desc: "Pâtes de qualité 100% blé dur", photo: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400" },
    { nom: "Farine de Blé 1kg", desc: "Farine type 55 idéale pour pâtisseries et beignets", photo: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400" },
    { nom: "Chocolat à tartiner Nutella 400g", desc: "Pâte à tartiner aux noisettes et au cacao", photo: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400" },
    { nom: "Sac d'Oignons 25kg", desc: "Sac d'oignons locaux frais de la vallée", photo: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cf?w=400" },
    { nom: "Sac de Pommes de Terre 25kg", desc: "Sac de pommes de terre de qualité supérieure", photo: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400" }
  ],

  smartphones: [
    { nom: "iPhone 13 128Go", desc: "Apple iPhone 13 avec écran Super Retina XDR 6.1 pouces et puce A15 Bionic", photo: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=400" },
    { nom: "iPhone 14 128Go", desc: "Apple iPhone 14 avec détection des accidents et autonomie renforcée", photo: "https://images.unsplash.com/photo-1663499482523-1c0c1bae4ce1?w=400" },
    { nom: "iPhone 15 Pro Max 256Go", desc: "Design en titane, puce A17 Pro, bouton Action et appareil photo 48 Mpx", photo: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400" },
    { nom: "Samsung Galaxy S23 Ultra 256Go", desc: "Capteur 200 Mpx, S-Pen intégré et processeur Snapdragon 8 Gen 2", photo: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400" },
    { nom: "Samsung Galaxy A54 5G 128Go", desc: "Écran Super AMOLED 120Hz, triple capteur photo et résistance IP67", photo: "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=400" },
    { nom: "Redmi Note 12 Pro 128Go", desc: "Écran AMOLED 120Hz, charge rapide 67W et appareil photo 50 Mpx", photo: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400" },
    { nom: "Tecno Spark 10 Pro 256Go", desc: "Caméra selfie 32 Mpx avec flash ajustable et 16Go de RAM extension", photo: "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=400" },
    { nom: "Infinix Hot 30 128Go", desc: "Écran 90Hz FHD+, batterie 5000mAh et processeur Gaming", photo: "https://images.unsplash.com/photo-1546054454-aa26e2b734c7?w=400" },
    { nom: "Apple AirPods Pro (2ème Gén)", desc: "Écouteurs sans fil avec Réduction Active du Bruit et audio spatial", photo: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400" },
    { nom: "Samsung Galaxy Buds2 Pro", desc: "Écouteurs sans fil Hi-Fi 24 bits et réduction de bruit active", photo: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400" },
    { nom: "Chargeur Rapide USB-C 20W", desc: "Adaptateur secteur rapide compatible iPhone et Android", photo: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400" },
    { nom: "Power Bank Remax 20000mAh", desc: "Batterie externe haute capacité avec double sortie USB", photo: "https://images.unsplash.com/photo-1609592807986-77e8a939f7d4?w=400" },
    { nom: "Support Téléphone Voiture", desc: "Support voiture magnétique avec fixation grille d'aération", photo: "https://images.unsplash.com/photo-1586105251261-72a756497a11?w=400" },
    { nom: "Montre Connectée Apple Watch S9", desc: "Boîtier en aluminium avec nouveau geste Toucher deux fois", photo: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400" }
  ],

  informatique: [
    { nom: "MacBook Pro 14\" M2 512Go", desc: "Puce M2 Pro, 16Go RAM, écran Liquid Retina XDR exceptionnel", photo: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400" },
    { nom: "MacBook Air 13\" M1 256Go", desc: "Superpuissant, ultramobile et autonomie jusqu'à 18 heures", photo: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=400" },
    { nom: "HP EliteBook 840 G8 i7", desc: "Intel Core i7, 16Go RAM, 512Go SSD, châssis aluminium robuste", photo: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400" },
    { nom: "Dell Latitude 5420 i5", desc: "Intel Core i5, 8Go RAM, 256Go SSD, écran 14 pouces FHD", photo: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400" },
    { nom: "Lenovo ThinkPad T14 i7", desc: "Performance professionnelle éprouvée avec clavier étanche ergonomique", photo: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400" },
    { nom: "Clavier Sans Fil Logitech K380", desc: "Clavier Bluetooth multi-dispositif ultra-compact", photo: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400" },
    { nom: "Souris Bluetooth Logitech MX Master 3S", desc: "Souris ergonomique haute précision avec défilement ultra-rapide", photo: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=400" },
    { nom: "Disque Dur Externe WD 1To", desc: "Stockage portable USB 3.0 sécurisé et rapide", photo: "https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=400" },
    { nom: "Clé USB SanDisk 64Go", desc: "Clé USB 3.0 rétractable haute vitesse", photo: "https://images.unsplash.com/photo-1600541519443-96c14617b7ba?w=400" },
    { nom: "Écran PC Dell 24\" Full HD", desc: "Moniteur IPS 1080p réglable en hauteur avec antireflet", photo: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400" },
    { nom: "Onduleur APC 650VA", desc: "Protection contre les coupures et surtensions électriques", photo: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400" },
    { nom: "Imprimante HP DeskJet 2710", desc: "Imprimante multifonction WiFi impression, numérisation et copie", photo: "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=400" },
    { nom: "Routeur WiFi TP-Link N300", desc: "Routeur sans fil 300 Mbps avec antennes à haut gain", photo: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400" }
  ],

  "tv-electro": [
    { nom: "TV LED Samsung 43\" Smart Full HD", desc: "Smart TV avec HDR, Wi-Fi intégré et applications Netflix/YouTube", photo: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400" },
    { nom: "TV LG 55\" 4K UHD Smart", desc: "Écran 4K avec processeur α5 AI et Thinq AI", photo: "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=400" },
    { nom: "Climatiseur Split 9000 BTU", desc: "Climatiseur silencieux à haute efficacité énergétique", photo: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400" },
    { nom: "Réfrigérateur Midea 250L", desc: "Réfrigérateur double porte avec compartiment congélateur rapide", photo: "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=400" },
    { nom: "Congélateur Horizontal 200L", desc: "Congélateur coffre à faible consommation d'énergie", photo: "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=400" },
    { nom: "Micro-ondes Moulinex 20L", desc: "Four à micro-ondes compact 700W avec fonction décongélation", photo: "https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=400" },
    { nom: "Mixeur Blender Kenwood 1.5L", desc: "Bol en verre incassable avec moulin à épices inclus", photo: "https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=400" },
    { nom: "Fer à Repasser à Vapeur Calor", desc: "Semelle en céramique anti-adhésive avec système anti-calcaire", photo: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=400" },
    { nom: "Machine à Laver Frontale 8kg", desc: "Lave-linge automatique avec programme lavage rapide 15 min", photo: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400" },
    { nom: "Ventilateur sur Pied Orientable", desc: "Ventilateur silencieux 3 vitesses avec oscillation automatique", photo: "https://images.unsplash.com/photo-1618941716939-553df3c6c276?w=400" }
  ],

  mode: [
    { nom: "T-shirt Coton Noir Col Rond", desc: "T-shirt 100% coton peigné doux et respirant", photo: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400" },
    { nom: "Chemise Homme Blanche Slim Fit", desc: "Chemise élégante coupe ajustée idéale pour le bureau ou cérémonies", photo: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400" },
    { nom: "Pantalon Jean Levi's 501", desc: "Jean classique coupe droite indémodable", photo: "https://images.unsplash.com/photo-1542272604-780c36856842?w=400" },
    { nom: "Robe de Soirée Élégante", desc: "Robe longue chic pour événements et fêtes", photo: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400" },
    { nom: "Ensemble Bazin Riche Getzner", desc: "Bazin de qualité supérieure teinté artisanalement", photo: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400" },
    { nom: "Tissu Wax Hollandais (6 Yards)", desc: "Véritable pagne Wax aux motifs colorés traditionnels", photo: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400" },
    { nom: "Chaussures en Cuir Marron Homme", desc: "Mocassins en cuir véritable cousus main", photo: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400" },
    { nom: "Baskets Nike Air Force 1", desc: "Sneakers iconiques blanches confortables au quotidien", photo: "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=400" },
    { nom: "Sac à Main Cuir Véritable Femme", desc: "Sac élégant avec bandoulière amovible et finitions dorées", photo: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400" },
    { nom: "Parfum Sauvage Dior 100ml", desc: "Eau de parfum fraîche et boisée pour homme", photo: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400" }
  ],

  maison: [
    { nom: "Drap de Lit 2 Places + 2 Taies", desc: "Parure de lit 100% coton doux 160x200cm", photo: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400" },
    { nom: "Taie d'Oreiller Orthopédique", desc: "Oreiller à mémoire de forme pour un soutien cervical parfait", photo: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=400" },
    { nom: "Couverture Douillette 200x240cm", desc: "Couverture polaire ultra-douce et chaude", photo: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=400" },
    { nom: "Tapis de Salon Moderne 160x230cm", desc: "Tapis moelleux antidérapant aux couleurs chaleureuses", photo: "https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=400" },
    { nom: "Matelas Orthopédique 2 Places", desc: "Matelas ferme à ressorts ensachés 160x200cm", photo: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400" },
    { nom: "Canapé Angle Convertible 5 Places", desc: "Grand canapé d'angle avec coffre de rangement intégré", photo: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400" },
    { nom: "Poêle Antiadhésive Tefal 28cm", desc: "Poêle avec revêtement titane et indicateur Thermo-Signal", photo: "https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=400" },
    { nom: "Service d'Assiettes Porcelaine (18 Pcs)", desc: "Ensemble complet comprenant assiettes creuses, plates et dessert", photo: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400" }
  ],

  "auto-moto": [
    { nom: "Huile Moteur Total 5W40 5L", desc: "Huile synthétique haute performance pour moteur essence et diesel", photo: "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=400" },
    { nom: "Batterie Voiture Varta 12V 70Ah", desc: "Batterie sans entretien à fort pouvoir de démarrage", photo: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400" },
    { nom: "Pneu Michelin 205/55 R16", desc: "Pneu été offrant une excellente adhérence et longévité", photo: "https://images.unsplash.com/photo-1578844251758-2f71da64c96f?w=400" },
    { nom: "Casque Moto Intégral Homologué", desc: "Casque avec visière anti-rayures et ventilation dynamique", photo: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400" }
  ],

  jeux: [
    { nom: "Console Sony PlayStation 5 Standard", desc: "Console PS5 avec lecteur de disque et manette DualSense", photo: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400" },
    { nom: "Manette Sans Fil DualSense PS5", desc: "Manette officielle avec retour haptique et gâchettes adaptatives", photo: "https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=400" },
    { nom: "Console Nintendo Switch OLED", desc: "Console avec écran OLED 7 pouces et support ajustable", photo: "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=400" },
    { nom: "Jeu PS5 EA Sports FC 24", desc: "Le jeu de simulation de football ultime avec HyperMotionV", photo: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400" }
  ],

  beaute: [
    { nom: "Lotion Corporelle Nivea 400ml", desc: "Lait hydratant soin intense pour peaux sèches", photo: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=400" },
    { nom: "Savon Noir Africain Artisanal", desc: "Savon purifiant 100% naturel enrichi au beurre de karité", photo: "https://images.unsplash.com/photo-1607006482602-76ca97ac73d5?w=400" },
    { nom: "Gel Douche Refreshing Dove 500ml", desc: "Gel douche nourrissant au concombre et thé vert", photo: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400" },
    { nom: "Parfum Chanel Coco Mademoiselle 50ml", desc: "Eau de parfum élégante et moderne pour femme", photo: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=400" }
  ],

  sport: [
    { nom: "Maillot Sénégal Domicile Puma", desc: "Maillot officiel de l'équipe nationale du Sénégal", photo: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=400" },
    { nom: "Crampons Nike Mercurial", desc: "Chaussures de football pour terrain sec offrant vitesse et contrôle", photo: "https://images.unsplash.com/photo-1511886929837-354d827aae26?w=400" },
    { nom: "Ballon de Football Size 5", desc: "Ballon de match résistant cousu à la main", photo: "https://images.unsplash.com/photo-1614632537197-38a17061c2bd?w=400" },
    { nom: "Tapis de Yoga Antidérapant 6mm", desc: "Tapis de gym et yoga avec sangle de transport incluse", photo: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400" }
  ],

  fournitures: [
    { nom: "Cahier Grand Format 200 Pages", desc: "Cahier Séyès grands carreaux 21x29.7cm", photo: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400" },
    { nom: "Boîte de 50 Stylos BIC Bleu", desc: "Stylos bille pointe moyenne 1.0mm écriture fluide", photo: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400" },
    { nom: "Rame de Papier A4 80g (500 Feuilles)", desc: "Papier blanc haute blancheur pour impression laser et jet d'encre", photo: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400" },
    { nom: "Calculatrice Casio fx-991ES Plus", desc: "Calculatrice scientifique 417 fonctions avec écran naturel", photo: "https://images.unsplash.com/photo-1611125832047-1d7ad1e8e48a?w=400" }
  ],

  quincaillerie: [
    { nom: "Sac de Ciment Sococim 50kg", desc: "Ciment gris de haute résistance pour tous travaux de maçonnerie", photo: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400" },
    { nom: "Peinture Emulsion Blanche 20L", desc: "Peinture murale lavable haute couvrance pour intérieur et extérieur", photo: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400" },
    { nom: "Perceuse Percuteuse 750W", desc: "Perceuse filaire avec variateur de vitesse et poignée ergonomique", photo: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400" },
    { nom: "Ampoule LED E27 12W (Pack de 3)", desc: "Ampoules économiques longue durée lumière du jour", photo: "https://images.unsplash.com/photo-1550985616-10810253b84d?w=400" }
  ],

  "pieces-rechange": [
    { nom: "Plaquettes de frein avant", desc: "Jeu de 4 plaquettes de frein de qualité d'origine", photo: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=400" },
    { nom: "Filtre à huile universel", desc: "Filtre à huile haute capacité pour moteurs essence et diesel", photo: "https://images.unsplash.com/photo-1607603750909-408e19413eaa?w=400" },
    { nom: "Filtre à air moteur", desc: "Filtre à air haute performance protégeant le moteur des poussières", photo: "https://images.unsplash.com/photo-1607603750909-408e19413eaa?w=400" },
    { nom: "Bougie d'allumage NGK (x4)", desc: "Lot de 4 bougies d'allumage pour allumage optimal et économie d'énergie", photo: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400" },
    { nom: "Disque de frein avant (x2)", desc: "Paire de disques de frein ventilés haute performance", photo: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=400" },
    { nom: "Courroie de distribution", desc: "Courroie crantée haute résistance pour synchronisation moteur", photo: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=400" },
    { nom: "Batterie Auto 12V 75Ah", desc: "Batterie de démarrage sans entretien avec indicateur de charge", photo: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400" },
    { nom: "Balai d'essuie-glace (Paire)", desc: "Balais d'essuie-glace flexibles pour visibilité optimale par tout temps", photo: "https://images.unsplash.com/photo-1607603750909-408e19413eaa?w=400" },
    { nom: "Kit d'embrayage complet", desc: "Kit comprenant disque, mécanisme et butée d'embrayage", photo: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=400" },
    { nom: "Alternateur 12V", desc: "Alternateur de rechange standard pour recharge batterie", photo: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=400" },
    { nom: "Démarreur électrique", desc: "Démarreur robuste pour démarrage rapide à froid", photo: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=400" },
    { nom: "Amortisseur avant (x2)", desc: "Jeu de 2 amortisseurs hydrauliques pour confort de conduite", photo: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=400" }
  ]
};

const outputData = {};
const targetCounts = {
  alimentation: 150,
  smartphones: 120
};

Object.keys(catalogues).forEach(cat => {
  const items = catalogues[cat];
  const target = targetCounts[cat] || 100;
  
  const generated = [];
  for (let i = 0; i < target; i++) {
    const base = items[i % items.length];
    const index = Math.floor(i / items.length) + 1;
    generated.push({
      id: `${cat}-${i + 1}`,
      nom: index === 1 ? base.nom : `${base.nom} (${index})`,
      description: base.desc || base.description || `Produit de qualité supérieure: ${base.nom}`,
      categorie: cat,
      photo_defaut: base.photo || base.photo_defaut
    });
  }
  outputData[cat] = generated;
});

const outputPath = path.join(__dirname, 'data', 'catalogues-standards.json');
fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf8');
console.log(`✅ Catalogue généré avec succès dans ${outputPath} (${Object.keys(outputData).length} catégories).`);
