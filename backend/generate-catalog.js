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

  // MAISON
  if (n.includes("drap") || n.includes("couverture") || n.includes("oreiller") || n.includes("taie") || n.includes("matelas")) return "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400";
  if (n.includes("tapis")) return "https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=400";
  if (n.includes("canapé") || n.includes("fauteuil") || n.includes("table") || n.includes("chaise")) return "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400";
  if (n.includes("poêle") || n.includes("marmite") || n.includes("casserole") || n.includes("faitout") || n.includes("assiette") || n.includes("verre") || n.includes("couvert")) return "https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=400";
  if (n.includes("seau") || n.includes("poubelle") || n.includes("balai") || n.includes("horloge") || n.includes("miroir")) return "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400";
  if (cat === "maison") return "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=400";

  // AUTO-MOTO
  if (n.includes("huile")) return "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=400";
  if (n.includes("batterie")) return "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400";
  if (n.includes("pneu")) return "https://images.unsplash.com/photo-1578844251758-2f71da64c96f?w=400";
  if (n.includes("casque") || n.includes("gants") || n.includes("moto")) return "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400";
  if (cat === "auto-moto") return "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=400";

  // JEUX & CONSOLES
  if (n.includes("ps5") || n.includes("ps4") || n.includes("switch") || n.includes("xbox") || n.includes("console")) return "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400";
  if (n.includes("manette")) return "https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=400";
  if (n.includes("jeu")) return "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400";
  if (cat === "jeux") return "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400";

  // BEAUTE
  if (n.includes("lotion") || n.includes("crème") || n.includes("lait") || n.includes("savon") || n.includes("gel douche")) return "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=400";
  if (n.includes("parfum")) return "https://images.unsplash.com/photo-1541643600914-78b084683601?w=400";
  if (n.includes("shampoing") || n.includes("huile") || n.includes("sérum")) return "https://images.unsplash.com/photo-1608248597309-843c08b8b09b?w=400";
  if (n.includes("rouge") || n.includes("mascara") || n.includes("fond de teint") || n.includes("vernis")) return "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400";
  if (n.includes("sèche-cheveux") || n.includes("lisseur") || n.includes("tondeuse")) return "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400";
  if (cat === "beaute") return "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=400";

  // SPORT
  if (n.includes("maillot")) return "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=400";
  if (n.includes("crampons")) return "https://images.unsplash.com/photo-1511886929837-354d827aae26?w=400";
  if (n.includes("ballon")) return "https://images.unsplash.com/photo-1614632537197-38a17061c2bd?w=400";
  if (cat === "sport") return "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400";

  // FOURNITURES
  if (n.includes("cahier")) return "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400";
  if (n.includes("stylo") || n.includes("crayon") || n.includes("tipp-ex") || n.includes("surligneur")) return "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400";
  if (n.includes("papier") || n.includes("rame")) return "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400";
  if (n.includes("calculatrice")) return "https://images.unsplash.com/photo-1611125832047-1d7ad1e8e48a?w=400";
  if (cat === "fournitures") return "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400";

  // QUINCAILLERIE & BTP
  if (n.includes("ciment") || n.includes("peinture")) return "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400";
  if (n.includes("perceuse") || n.includes("meuleuse") || n.includes("marteau") || n.includes("clé") || n.includes("tournevis")) return "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400";
  if (n.includes("ampoule") || n.includes("rallonge") || n.includes("prise")) return "https://images.unsplash.com/photo-1550985616-10810253b84d?w=400";
  if (cat === "quincaillerie") return "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400";

  // PIÈCES DE RECHANGE
  if (n.includes("plaquettes") || n.includes("disque") || n.includes("frein")) return "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=400";
  if (n.includes("filtre")) return "https://images.unsplash.com/photo-1607603750909-408e19413eaa?w=400";
  if (n.includes("batterie")) return "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400";
  if (cat === "pieces-rechange") return "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=400";

  // BIJOUTERIE
  if (n.includes("collier") || n.includes("pendentif")) return "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400";
  if (n.includes("bracelet") || n.includes("gourmette") || n.includes("chaîne")) return "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400";
  if (n.includes("bague") || n.includes("chevalière")) return "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400";
  if (n.includes("boucles")) return "https://images.unsplash.com/photo-1635767798638-3e25273a8236?w=400";
  if (n.includes("montre")) return "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400";
  if (cat === "bijouterie") return "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400";

  // MARAÎCHAGE & ÉLEVAGE & PRODUITS AGRICOLES
  if (n.includes("oignon") || n.includes("ail") || n.includes("carotte") || n.includes("tomate") || n.includes("diakhatou") || n.includes("piment") || n.includes("gombo") || n.includes("mangue") || n.includes("papaye") || n.includes("chou")) return "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cf?w=400";
  if (n.includes("mouton") || n.includes("bélier") || n.includes("chèvre") || n.includes("bœuf")) return "https://images.unsplash.com/photo-1484557052118-f32bd25b45b5?w=400";
  if (n.includes("aliment") || n.includes("tourteau") || n.includes("foin")) return "https://images.unsplash.com/photo-1536402443044-a0774a3f4e24?w=400";
  if (n.includes("poussin") || n.includes("poule")) return "https://images.unsplash.com/photo-1606857521015-7f9fcf423740?w=400";
  if (n.includes("engrais") || n.includes("urée") || n.includes("semence") || n.includes("pulvérisateur")) return "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400";
  if (cat === "maraichage" || cat === "elevage" || cat === "produits-agricoles") return "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cf?w=400";

  // SOLAIRE & ENERGIE
  if (n.includes("panneau")) return "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=400";
  if (n.includes("batterie")) return "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400";
  if (n.includes("projecteur") || n.includes("ampoule") || n.includes("lampe")) return "https://images.unsplash.com/photo-1550985616-10810253b84d?w=400";
  if (cat === "solaire-energie") return "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=400";

  // SANTE & PHARMA
  if (n.includes("paracétamol") || n.includes("vitamine") || n.includes("sirop")) return "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400";
  if (n.includes("thermomètre") || n.includes("tensiomètre")) return "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400";
  if (n.includes("masque") || n.includes("gel") || n.includes("alcool") || n.includes("pansement") || n.includes("compresse")) return "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=400";
  if (cat === "sante-pharma") return "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400";

  // BEBE & ENFANTS
  if (n.includes("couches") || n.includes("lingettes")) return "https://images.unsplash.com/photo-1544816155-12df9643f363?w=400";
  if (n.includes("biberon") || n.includes("sucette") || n.includes("poussette") || n.includes("lit") || n.includes("jouets")) return "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400";
  if (cat === "bebe-enfants") return "https://images.unsplash.com/photo-1544816155-12df9643f363?w=400";

  // ALIMENTATION DEFAULT
  if (n.includes("riz")) return "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400";
  if (n.includes("lait")) return "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400";
  if (n.includes("café") || n.includes("thé") || n.includes("infusion")) return "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400";
  if (n.includes("bouillon") || n.includes("jumbo") || n.includes("maggi") || n.includes("knorr") || n.includes("moutarde") || n.includes("mayonnaise") || n.includes("ketchup") || n.includes("piment") || n.includes("harissa") || n.includes("vinaigre")) return "https://images.unsplash.com/photo-1528751014936-863e6e7a319c?w=400";
  if (n.includes("huile") || n.includes("beurre") || n.includes("margarine")) return "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400";
  if (n.includes("sucre") || n.includes("miel") || n.includes("nutella") || n.includes("milo") || n.includes("nesquik") || n.includes("confiture")) return "https://images.unsplash.com/photo-1622484210800-885108920194?w=400";
  if (n.includes("jus") || n.includes("eau") || n.includes("canette") || n.includes("coca") || n.includes("fanta") || n.includes("sprite") || n.includes("energy")) return "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400";
  if (n.includes("pâtes") || n.includes("spaghetti") || n.includes("macaroni") || n.includes("coquillettes") || n.includes("vermicelles") || n.includes("couscous") || n.includes("farine")) return "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400";
  if (n.includes("oignon") || n.includes("pommes de terre") || n.includes("ail") || n.includes("gingembre") || n.includes("arachide")) return "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cf?w=400";

  return "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400";
}

// 20 ALL CATEGORIES POPULATED WITH RICH ENRICHMENT
const cataloguesRaw = {
  alimentation: [
    "Riz brisé Sadia 25kg", "Riz parfumé Dinor 5kg", "Riz brisé Royal 50kg", "Riz local de la Vallée 25kg", "Riz Parfumé Jasmine 25kg", "Riz Basmati Indien 5kg", "Riz Parfumé Lion 25kg", "Riz Cargo Complet 5kg", "Riz étuvé local 25kg", "Sac de Riz Thaï 50kg", "Riz Brisé 100% Parfum Elephant 25kg", "Riz Long Grain Blanc 10kg",
    "Lait Nido 400g", "Lait Nido 900g", "Lait Nido 2.5kg (Format Familial)", "Lait Gloria 160g", "Lait Peak en Poudre 400g", "Lait Peak 900g", "Lait Concentré Sucré Nestlé 397g", "Lait Caillé Naturel 1L", "Lait UHT Candia 1L (Pack de 6)", "Lait de Coco 400ml", "Lait Bonnet Rouge 400g", "Lait Vitalait UHT 1L",
    "Café Touba Moulé 250g", "Café Touba Moulé 500g", "Café Nescafé Classic 200g", "Café Nescafé 3 en 1 (Sachet de 10)", "Café Carte Noire 250g Moulu", "Café en Grains Espresso 1kg", "Thé Lipton Yellow Label (100 sachets)", "Thé Vert Flecha 8147 (250g)", "Thé Vert Achoura (250g)", "Thé Vert Lord (250g)", "Infusion Menthe Poivrée (20 sachets)", "Infusion Verveine Bio (20 sachets)",
    "Bouillon Jumbo Poulet (60 cubes)", "Bouillon Jumbo Crevette (60 cubes)", "Bouillon Jumbo Oignon (60 cubes)", "Bouillon Jumbo Bœuf (60 cubes)", "Bouillon Maggi Arôme 200ml", "Bouillon Maggi Poulet (60 cubes)", "Bouillon Knorr Bœuf (48 cubes)", "Moutarde Amora 265g", "Moutarde Maille 200g", "Mayonnaise Lesieur 475g", "Mayonnaise Calvé 450g", "Ketchup Amora Flacon 500g", "Ketchup Heinz 400g", "Sauce Piment Extra Forte 200g", "Harissa en Tube 150g", "Vinaigre Blanc d'Alcool 1L", "Vinaigre de Cidre Bio 500ml", "Sauce Soja Claire 250ml",
    "Huile Dinor 5L", "Huile Niani 1L", "Huile Lesieur Tournesol 5L", "Huile de Palme Rouge 1L", "Huile d'Arachide Locale 1L", "Huile d'Olive Extra Vierge 750ml", "Beurre Président Plaquette 250g", "Margarine Planta 500g", "Huile de Sésame Pur 250ml", "Huile de Mais 2L",
    "Sucre en Poudre Mimran 1kg", "Sucre en Morceaux CSS 1kg", "Sucre Roux Pur Canne 1kg", "Sucre Vanillé Alsa (Sachet de 10)", "Miel Pur Naturel 500g", "Chocolat à tartiner Nutella 400g", "Chocolat en Poudre Milo 400g", "Chocolat en Poudre Nesquik 400g", "Confiture de Fraise St Mamet 350g", "Confiture d'Abricot 350g",
    "Jus Pressea Mangue 1L", "Jus Pressea Orange 1L", "Jus Pressea Ananas-Gingembre 1L", "Nectar de Bissap Kirène 1L", "Eau Kirène 1.5L (Pack de 6)", "Eau Kirène Bidon 5L", "Eau Oulmès Pétillante 1L", "Eau Casamançaise 1.5L (Pack de 6)", "Canette Gazelle 33cl", "Canette Coca-Cola 33cl (Pack de 6)", "Canette Fanta Orange 33cl", "Canette Sprite 33cl", "Energy Drink Cody's 250ml", "Energy Drink Monster 500ml",
    "Thiakry Frais 500g", "Araw de Petit Millet 1kg", "Couscous de Millet (Souna) 1kg", "Sankhal de Millet 1kg", "Sirop de Bissap 1L", "Sirop de Bouye 1L", "Sirop de Gingembre (Gnamakoudji) 1L", "Fleurs de Bissap Séchées 500g", "Poudre de Bouye (Baobab) 500g",
    "Sac d'Oignons 25kg", "Sac d'Oignons Importés 25kg", "Sac de Pommes de Terre 25kg", "Sac d'Ail Frais 5kg", "Sac de Gingembre Frais 5kg", "Pâte d'Arachide Mafé 1kg", "Kethiakh (Poisson Salé Séché) 1kg", "Guedj (Poisson Séché Artisanal) 500g", "Yeet (Mollusque Séché) 250g", "Crevettes Séchées Moulières 200g", "Sardines Titus à l'Huile (Boîte 125g)", "Thon Entier au Naturel 160g", "Corned Beef Hereford 340g"
  ],

  smartphones: [
    "iPhone 8 64Go", "iPhone 8 Plus 64Go", "iPhone X 64Go", "iPhone XR 128Go", "iPhone XS Max 256Go", "iPhone 11 64Go", "iPhone 11 Pro 128Go", "iPhone 11 Pro Max 256Go", "iPhone 12 Mini 64Go", "iPhone 12 128Go", "iPhone 12 Pro 128Go", "iPhone 12 Pro Max 256Go", "iPhone 13 Mini 128Go", "iPhone 13 128Go", "iPhone 13 Pro 256Go", "iPhone 13 Pro Max 256Go", "iPhone 14 128Go", "iPhone 14 Plus 128Go", "iPhone 14 Pro 256Go", "iPhone 14 Pro Max 256Go", "iPhone 15 128Go", "iPhone 15 Plus 256Go", "iPhone 15 Pro 256Go", "iPhone 15 Pro Max 256Go", "iPhone 15 Pro Max 512Go",
    "Samsung Galaxy A03 32Go", "Samsung Galaxy A04 32Go", "Samsung Galaxy A05 64Go", "Samsung Galaxy A13 64Go", "Samsung Galaxy A14 64Go", "Samsung Galaxy A23 128Go", "Samsung Galaxy A24 128Go", "Samsung Galaxy A33 5G", "Samsung Galaxy A34 5G 128Go", "Samsung Galaxy A53 5G", "Samsung Galaxy A54 5G 128Go", "Samsung Galaxy A73 5G", "Samsung Galaxy S20 FE 128Go", "Samsung Galaxy S21 5G", "Samsung Galaxy S21 Ultra 256Go", "Samsung Galaxy S22 5G", "Samsung Galaxy S22+ 256Go", "Samsung Galaxy S22 Ultra 256Go", "Samsung Galaxy S23 128Go", "Samsung Galaxy S23 Ultra 256Go", "Samsung Galaxy S24 Ultra 512Go", "Samsung Galaxy Z Flip 4", "Samsung Galaxy Z Flip 5 256Go", "Samsung Galaxy Z Fold 5 512Go",
    "Redmi 10A 32Go", "Redmi 12C 64Go", "Redmi 12 128Go", "Redmi Note 11 128Go", "Redmi Note 12 128Go", "Redmi Note 12 Pro 128Go", "Redmi Note 13 256Go", "Redmi Note 13 Pro 5G", "Redmi Note 13 Pro+ 5G 512Go", "Poco X5 Pro 5G", "Xiaomi 13T Pro 512Go",
    "Tecno Pop 7 64Go", "Tecno Spark 9 64Go", "Tecno Spark 10 128Go", "Tecno Spark 10 Pro 256Go", "Tecno Camon 19 128Go", "Tecno Camon 20 256Go", "Tecno Camon 20 Pro 256Go", "Tecno Camon 20 Premier", "Tecno Pova 5 Pro", "Tecno Phantom X2 Pro 256Go",
    "Infinix Smart 7 64Go", "Infinix Smart 8 64Go", "Infinix Hot 20 128Go", "Infinix Hot 30 128Go", "Infinix Hot 30i 128Go", "Infinix Note 12 128Go", "Infinix Note 30 128Go", "Infinix Note 30 Pro 256Go", "Infinix Note 30 VIP", "Infinix Zero 30 5G",
    "Oppo A17 64Go", "Oppo A58 128Go", "Oppo A78 128Go", "Realme C33 64Go", "Realme C55 128Go",
    "Apple AirPods 2", "Apple AirPods 3", "Apple AirPods Pro (2ème Gén)", "Apple AirPods Max", "Samsung Galaxy Buds FE", "Samsung Galaxy Buds2 Pro", "JBL Tune 510BT Casque", "JBL Wave 200TWS Écouteurs", "Enceinte JBL GO 3", "Enceinte JBL Charge 5", "Chargeur Rapide USB-C 20W", "Chargeur Samsung 25W USB-C", "Power Bank Remax 20000mAh", "Support Téléphone Voiture MagSafe", "Carte Mémoire MicroSD Sandisk 128Go"
  ],

  informatique: [
    "MacBook Air 13\" M1 256Go", "MacBook Air 13\" M2 256Go", "MacBook Air 15\" M2 512Go", "MacBook Pro 14\" M2 512Go", "MacBook Pro 16\" M3 Max 1To",
    "HP 250 G8 i3 8Go", "HP 255 G8 Ryzen 3", "HP Pavilion 15 i5 Touch", "HP ProBook 440 G9 i5", "HP ProBook 450 G9 i7", "HP EliteBook 830 G8 i5", "HP EliteBook 840 G8 i7", "HP EliteBook 850 G8 i7", "HP Envy x360 15", "HP Omen 16 Gamer RTX 4060",
    "Dell Vostro 3510 i3", "Dell Inspiron 3520 i5", "Dell Latitude 3420 i5", "Dell Latitude 5420 i5 256Go", "Dell Latitude 5530 i7", "Dell Latitude 7420 i7", "Dell XPS 13 i7 16Go", "Dell XPS 15 i9 32Go", "Dell G15 Gamer RTX 3050",
    "Lenovo V15 i3 8Go", "Lenovo IdeaPad 3 Ryzen 5", "Lenovo IdeaPad Slim 5 i7", "Lenovo ThinkPad L14 i5", "Lenovo ThinkPad T14 i7", "Lenovo ThinkPad X1 Carbon", "Lenovo Legion 5 Gamer RTX 4060",
    "Asus Vivobook 15 i5", "Asus ZenBook 14 OLED i7", "Asus ROG Strix G16 RTX 4070", "Acer Aspire 3 i3", "Acer Nitro 5 Gamer RTX 3060",
    "Imprimante Thermique Caisse 80mm USB/Ethernet", "Imprimante Thermique Caisse 58mm Bluetooth", "Tiroir Caisse Métallique Automatique", "Scanner Douchette Code-Barres 1D USB", "Scanner Douchette Code-Barres 2D QR USB", "Scanner Omnidirectionnel Fixe de Caisse 2D", "Écran TPV Tactile 15\" Caisse All-in-One", "Afficheur Client 2 Lignes VFD Caisse",
    "Imprimante HP DeskJet 2710", "Imprimante HP LaserJet M111w", "Imprimante HP Smart Tank 515", "Imprimante Epson EcoTank L3250", "Imprimante Epson EcoTank L4260", "Imprimante Canon PIXMA TS3340", "Imprimante Canon Laser LBP6030w", "Imprimante Brother Laser HL-L2350DW", "Scanner A4 Flatbed Canon CanoScan",
    "Écran PC Dell 22\" FHD", "Écran PC Dell 24\" IPS Full HD", "Écran PC Dell 27\" 4K", "Écran PC Samsung 24\" Incurvé", "Écran PC LG 27\" UltraFine", "Écran PC HP 24f FHD", "Écran PC Gamer Asus 24\" 165Hz",
    "Disque Dur Externe WD Elements 1To", "Disque Dur Externe WD My Passport 2To", "Disque Dur Externe Seagate 4To", "Disque SSD Externe Samsung T7 500Go", "Disque SSD Externe Samsung T7 1To", "Disque SSD Externe SanDisk Extreme 1To", "Clé USB SanDisk 32Go", "Clé USB SanDisk 64Go", "Clé USB SanDisk 128Go", "Clé USB SanDisk Dual Type-C 128Go",
    "Barrette RAM PC Portable DDR4 8Go", "Barrette RAM PC Portable DDR4 16Go", "Disque SSD NVMe M.2 512Go", "Disque SSD NVMe M.2 1To", "Clavier Filaire Logitech K120 USB", "Clavier Sans Fil Logitech K380", "Clavier Mécanique Gamer RGB", "Souris Filaire Logitech M90", "Souris Sans Fil Logitech M185", "Souris Bluetooth Logitech MX Master 3S",
    "Onduleur APC 650VA", "Onduleur APC 1000VA LCD", "Onduleur APC 1500VA LCD", "Routeur WiFi TP-Link N300", "Routeur 4G WiFi Huawei avec SIM", "Tapis de Souris Ergonomique repose-poignet", "Webcam Logitech C920 HD Pro 1080p", "Casque Micro USB Jabra Visioconférence", "Hub USB-C 7 en 1 Aluminium", "Sac à Dos PC Portable 15.6\" Imperméable"
  ],

  "tv-electro": [
    "TV LED Samsung 32\" HD", "TV LED Samsung 43\" Smart Full HD", "TV LED Samsung 50\" 4K Crystal UHD", "TV LED Samsung 55\" 4K QLED", "TV LED Samsung 65\" 4K Neo QLED", "TV LED Samsung 75\" 4K UHD", "TV LED LG 32\" HD", "TV LED LG 43\" Smart Full HD", "TV LED LG 55\" 4K UHD Smart", "TV LED LG 65\" OLED 4K Smart", "TV Smart TCL 32\" Android HD", "TV Smart TCL 43\" Full HD", "TV Smart TCL 55\" 4K QLED", "TV Smart TCL 65\" 4K Google TV", "TV Hisense 32\" HD Smart", "TV Hisense 43\" Smart FHD", "TV Hisense 55\" 4K UHD", "TV Hisense 65\" 4K QLED", "TV Midea 32\" HD LED", "TV Nasco 43\" Smart FHD",
    "Climatiseur Split Midea 9000 BTU", "Climatiseur Split Midea 12000 BTU Inverter", "Climatiseur Split Midea 18000 BTU Inverter", "Climatiseur Split Midea 24000 BTU", "Climatiseur Split Samsung 12000 BTU", "Climatiseur Split LG Dual Inverter 12000 BTU", "Climatiseur Armoire 24000 BTU", "Climatiseur Armoire 48000 BTU", "Ventilateur sur Pied Orientable 16\"", "Ventilateur sur Pied Métallique 18\"", "Ventilateur Rechargeable 16\" avec Télécommande", "Ventilateur de Plafond 56\" 3 Pales", "Humidificateur d'air ultrasonique 4L",
    "Réfrigérateur Midea 150L 1 Porte", "Réfrigérateur Midea 250L 2 Portes", "Réfrigérateur Side-by-Side Midea 500L", "Réfrigérateur Samsung 200L Double Porte", "Réfrigérateur Samsung NoFrost 300L", "Réfrigérateur Side-by-Side Samsung 550L", "Réfrigérateur LG Combinaison NoFrost 340L", "Réfrigérateur Hisense 220L Double Porte", "Congélateur Horizontal Midea 100L", "Congélateur Horizontal Midea 200L", "Congélateur Horizontal Midea 300L", "Congélateur Coffre Midea 400L", "Congélateur Vertical 6 Tiroirs NoFrost", "Cave à Vin 18 Bouteilles",
    "Micro-ondes Moulinex 20L", "Micro-ondes Samsung 23L Grill", "Four Électrique Posable 35L", "Four Électrique 45L Tournebroche", "Four Encastrable Inox 60cm", "Plaque à Gaz 4 Feux Inox", "Plaque Mixte Gaz/Induction 4 Feux", "Plaque à Induction Portative 2000W", "Cuisinière à Gaz 50x50 4 Feux", "Cuisinière 60x60 avec Four Inox", "Friteuse Sans Huile AirFryer 4.5L", "Friteuse Sans Huile AirFryer XXL 7L", "Friteuse Électrique à Huile 3L",
    "Mixeur Blender Kenwood 1.5L", "Blender Moulinex Faciclic 1.75L", "Robot Pâtissier Moulinex 800W", "Robot Culinaire Multifonction Philips 750W", "Hachoir à Viande Électrique 1500W", "Presse-Agrumes Électrique 100W", "Centrifugeuse Fruits & Légumes 800W", "Extracteur de Jus à Froid", "Batteur Électrique 5 Vitesses", "Moulin à Café Électrique",
    "Fer à Repasser à Vapeur Calor 2000W", "Fer à Repasser Tefal 2400W", "Centrale à Vapeur Philips 2400W", "Defroisseur Vapeur Vertical", "Machine à Laver Frontale Midea 7kg", "Machine à Laver Frontale Midea 9kg", "Machine à Laver LG 8kg Inverter", "Machine à Laver Samsung 9kg AddWash", "Machine à Laver Semi-Automatique 8kg", "Machine Semi-Automatique Double Bac 12kg", "Sèche-Linge à Condensation 8kg", "Aspirateur Sans Sac Moulinex 1800W", "Aspirateur Balai Sans Fil 2 en 1", "Bouilloire Électrique Inox 1.8L", "Cafetière Électrique à Filtre 12 Tasses", "Machine à Café Espresso DeLonghi", "Grille-Pain 2 Fentes Inox", "Machine à Gaufres et Croque-Monsieur", "Chauffe-Eau Électrique 50L", "Chauffe-Eau Gaz 10L Instantané"
  ],

  mode: [
    "T-shirt Coton Noir Col Rond", "T-shirt Coton Blanc Uni", "Polo Homme Coton Piqué Noir", "Polo Homme Coton Piqué Bleu Marine", "Chemise Homme Blanche Slim Fit", "Chemise Homme Bleue Ciel Bureau", "Chemise Manches Courtes Motifs Wax", "Chemise Homme en Lin Beige", "Pantalon Jean Levi's 501 Straight", "Pantalon Jean Levi's 511 Slim", "Pantalon Chino Beige Homme", "Pantalon Chino Noir Homme", "Pantalon de Costume Noir", "Short Jean Homme Décontracté", "Short de Sport Respirant", "Costume Homme 2 Pièces Noir", "Costume Homme Bleu Nuit Ajusté", "Veste Blazer Homme Chic", "Veste en Cuir Noir Homme", "Veste en Jeans Levi's Classic", "Ensemble Survêtement Nike Tech Fleece", "Ensemble Survêtement Adidas 3 Bandes", "Ensemble Bazin Riche Getzner Homme", "Djellaba Brodée Traditionnelle Homme", "Boubou Traditionnel 3 Pièces Brodé", "Grand Boubou Bazin Cérémonie",
    "Robe de Soirée Élégante Longue", "Robe Courte Fleurie d'Été", "Robe Droite Professionnelle Chic", "Robe Wax Traditionnelle", "Tissu Wax Hollandais (6 Yards)", "Tissu Bazin Riche Gagné (5m)", "Ensemble Tailleur Pantalon Femme", "Blouse en Soie Blanche Col V", "Jupe Crayon Noire Bureau", "Jupe Longue Plissée Soleil", "Jean Femme Taille Haute Slim", "Legging Noir Opaque Confort", "Gilet Cardigan Maille Douce", "Manteau Court Laine Femme", "Ensemble Kimono Satin Imprimé", "Kaftan Marocain Brodé Or", "Tenue Traditionnelle Taille Basse",
    "Mocassins Cuir Marron Homme", "Mocassins Cuir Noir Cousus Main", "Chaussures Richelieu Cuir Noir", "Baskets Nike Air Force 1 Blanches", "Baskets Adidas Stan Smith Cuir", "Baskets Puma Suede Classic", "Baskets Air Jordan 1 Retro High", "Sandales Cuir Artisanales Homme", "Claquettes Nike Victori One", "Baskets Running Asics Gel", "Escarpins Cuir Noir Femme (Talon 8cm)", "Sandales à Talons Dorées Soirée", "Ballerines Cuir Souple Femme", "Baskets Compensées Femme Trendy", "Bottines en Cuir Marron Femme",
    "Sac à Main Cuir Véritable Femme Noir", "Sac Cabas Cuir Marron Grand Format", "Sac Bandoulière Compact Cuir", "Pochette de Soirée Dorée Chic", "Sac à Dos Femme Cuir Élégant", "Sac Banane Cuir Tendance", "Sac de Voyage Cuir 50cm", "Portefeuille Cuir Homme Multi-cartes", "Porte-Cartes Cuir Slim Minimaliste", "Ceinture Cuir Noir Homme", "Ceinture Cuir Marron Homme", "Ceinture Femme Boucle Dorée",
    "Parfum Sauvage Dior 100ml", "Parfum Bleu de Chanel 100ml", "Parfum Terre d'Hermès 100ml", "Parfum One Million Paco Rabanne 100ml", "Parfum La Vie Est Belle LANCOME 75ml", "Parfum Coco Mademoiselle Chanel 50ml", "Parfum Black Opium YSL 90ml", "Lunettes de Soleil Ray-Ban Aviator", "Lunettes de Soleil Ray-Ban Wayfarer", "Montre Homme Seiko Automatique Acier", "Montre Homme Fossil Cuir Marron", "Montre Femme Casio Vintage Dorée", "Montre Femme Michael Kors Dorée", "Casquette Nike Dri-FIT", "Chapeau Fedora Laine Noir", "Écharpe Cashmere Unissexe", "Foulard Soie Motifs Elegants", "Parure Bijoux Fantaisie Dorée", "Gants Cuir Homme Hiver", "Chaussettes Coton Sport (Pack de 3)"
  ],

  maison: [
    "Drap de Lit 2 Places + 2 Taies", "Drap de Lit 1 Place Coton", "Taie d'Oreiller Orthopédique", "Couverture Douillette 200x240cm", "Couette Imprimée 2 Places 220x240", "Tapis de Salon Moderne 160x230cm", "Tapis de Couloir 80x300cm", "Matelas Orthopédique 2 Places 160x200", "Matelas Mousse 1 Place 90x190", "Canapé Angle Convertible 5 Places", "Canapé 3 Places Tissu Gris", "Fauteuil Relax Inclinable", "Table à Manger 6 Places avec Chaises", "Poêle Antiadhésive Tefal 28cm", "Poêle Tefal 24cm", "Marmite à Pression Inox 8L", "Marmite Inox 12L Grande Capacité", "Faitout Inox 5 Pièces", "Service d'Assiettes Porcelaine (18 Pcs)", "Service à Café Porcelaine (12 Tasses)", "Pack de 6 Verres à Eau en Cristal", "Ménagère Couverts 24 Pièces Inox", "Seau de Ménage avec Balai Serpillière Essoreuse 360", "Poubelle à Pédale Inox 30L", "Horloge Murale Géante Silencieuse 40cm", "Miroir Rétro-éclairé LED Salle de Bain", "Casserole Inox 20cm avec Couvercle", "Portant à Vêtements Métallique Double", "Rangement Chaussures 5 Niveaux", "Égouttoir à Vaisselle Inox 2 Étages"
  ],

  "auto-moto": [
    "Huile Moteur Total 5W40 5L", "Huile Moteur Total 10W40 5L", "Huile Moteur Shell Helix 15W40 5L", "Huile Moteur Mobil 1 5W30 5L", "Huile de Frein Dot4 500ml", "Liquide de Refroidissement Radiateur 5L", "Batterie Voiture Varta 12V 70Ah", "Batterie Voiture Fulmen 12V 60Ah", "Batterie Auto 12V 90Ah", "Pneu Michelin 205/55 R16", "Pneu Bridgestone 195/65 R15", "Pneu Goodyear 175/70 R13", "Pneu Continental 225/45 R17", "Casque Moto Intégral Homologué", "Casque Moto Jet Visière", "Gants de Moto en Cuir Renforcé", "Blouson Moto de Protection", "Compresseur d'Air 12V Portable Auto", "Cric Hydraulique 2 Tonnes", "Cric Bouteille 3 Tonnes", "Extincteur Auto Poudre 1kg", "Support Téléphone Voiture MagSafe", "Housse de Siège Universelle Auto (Set complet)", "Nettoyant Injecteurs Moteur 500ml", "Polish Rénovateur Carrosserie 500ml", "Ampoules LED Auto H7 (Paire)", "Tapis de Sol Universels Caoutchouc (4Pcs)"
  ],

  jeux: [
    "Console Sony PlayStation 5 Standard", "Console Sony PlayStation 5 Digital Edition", "Console PS4 Slim 1To", "Console PS3 Super Slim 500Go", "Console Nintendo Switch OLED", "Console Nintendo Switch Lite", "Console Xbox Series X 1To", "Console Xbox Series S 512Go", "Manette Sans Fil DualSense PS5", "Manette DualShock 4 PS4", "Manette Sans Fil Xbox Series", "Jeu PS5 EA Sports FC 24", "Jeu PS5 Marvel's Spider-Man 2", "Jeu PS5 God of War Ragnarök", "Jeu PS5 GTA V Expanded", "Jeu PS5 Call of Duty Modern Warfare III", "Jeu Nintendo Switch Mario Kart 8 Deluxe", "Jeu Nintendo Switch Zelda Tears of the Kingdom", "Casque Gamer HyperX Cloud II", "Chaise Gamer Ergonomique RGB", "Volant de Course Logitech G29 avec Pédalier"
  ],

  beaute: [
    "Lotion Corporelle Nivea 400ml", "Lait Hydratant Mixa 400ml", "Lait Corporel Dove 400ml", "Savon Noir Africain Artisanal 250g", "Savon Dettol Antiseptique 100g", "Gel Douche Refreshing Dove 500ml", "Gel Douche Palmolive 500ml", "Parfum Chanel Coco Mademoiselle 50ml", "Parfum Sauvage Dior 100ml", "Parfum La Vie Est Belle LANCOME", "Beurre de Karité Pur 100% Bio 250g", "Huile d'Argan Pure du Maroc 100ml", "Shampoing Sans Sulfate Cantu 400ml", "Shampoing Shea Moisture 384ml", "Shampoing Garnier Ultra Doux 400ml", "Sérum Visage Vitamine C 30ml", "Sérum Acide Hyaluronique 30ml", "Rouge à Lèvres Matte Maybelline Superstay", "Fond de Teint Maybelline Fit Me", "Mascara Lash Sensational Maybelline", "Vernis à Ongles OPI Rouge", "Sèche-Cheveux Professionnel 2200W", "Fer à Lisser BaByliss Titan Ceramic", "Tondeuse à Barbe Panasonic Rechargeable", "Tondeuse Wahl Super Taper Pro", "Perruque Brésilienne Lace Frontal 20 pouces", "Huile Capillaire de Ricin 100ml"
  ],

  sport: [
    "Maillot Sénégal Domicile Puma", "Maillot Sénégal Extérieur Vert Puma", "Maillot Real Madrid Domicile Adidas", "Maillot FC Barcelone Nike", "Crampons Nike Mercurial Vapor", "Crampons Adidas Predator", "Ballon de Football Size 5 FIFA Quality", "Ballon de Basketball Spalding Size 7", "Tapis de Yoga Antidérapant 6mm", "Paire d'Haltères en Fonte 5kg", "Paire d'Haltères 10kg", "Kit 5 Élastiques de Musculation Fitness", "Gourde Inox Isotherme 750ml", "Protège-Tibias Nike Football", "Corde à Sauter Rapide avec Roulements", "Gants de Boxe 12oz", "Survêtement de Sport Homme", "Sac de Sport Polochon 45L"
  ],

  fournitures: [
    "Cahier Grand Format 200 Pages", "Cahier Grand Format 300 Pages", "Cahier Petit Format 96 Pages", "Boîte de 50 Stylos BIC Bleu", "Boîte de 50 Stylos BIC Noir", "Boîte de 50 Stylos BIC Rouge", "Rame de Papier A4 80g (500 Feuilles)", "Calculatrice Casio fx-991ES Plus", "Calculatrice Scientifique Casio fx-92", "Sac à Dos Scolaire Ergonomique", "Boîte Crayons de Couleur Maped (24 Pcs)", "Correcteur Blanc Tipp-Ex Flacon 20ml", "Surligneurs Stabilo Boss (Pack de 4)", "Classeur A4 à Levier 80mm", "Chemises Plastifiées A4 (Lot de 10)", "Boîte de 12 Marqueurs Effaçables à Sec", "Règle Graduée 30cm Inox"
  ],

  quincaillerie: [
    "Sac de Ciment Sococim 50kg", "Sac de Ciment Dangote 50kg 42.5N", "Sac de Ciment Sahel 50kg", "Peinture Emulsion Blanche 20L", "Peinture Glycéro Laque 5L", "Vernis Bois Brillant 2.5L", "Perceuse Percuteuse Bosch 750W", "Meuleuse d'Angle Makute 115mm 850W", "Meuleuse DeWalt 230mm 2000W", "Coffret Clés à Douille 94 Pièces", "Marteau d'Arpenteur 500g Manche Fibre", "Ampoule LED E27 12W (Pack de 3)", "Ampoule LED E27 18W Haute Puissance", "Rallonge Électrique 10m 4 Prises", "Rallonge Chantiers 25m sur Enrouleur", "Prise Électrique Encastrable Legrand", "Serrure de Sûreté Vachette 3 Clés", "Cadenas Inox 50mm", "Brouette de Chantier 90L Métal", "Pelle Ronde Emmanchée", "Pioche de Maçon"
  ],

  "pieces-rechange": [
    "Plaquettes de frein avant (Jeu de 4)", "Plaquettes de frein arrière", "Filtre à huile universel", "Filtre à air moteur", "Filtre à Carburant Gazole", "Filtre d'Habitacle Climatisation", "Bougie d'allumage NGK (x4)", "Bougie de Préchauffage Diesel (x4)", "Disque de frein avant (x2)", "Courroie de distribution", "Courroie d'Alternateur Accessoires", "Batterie Auto 12V 75Ah", "Balais d'essuie-glace (Paire)", "Kit d'embrayage complet", "Alternateur 12V", "Démarreur électrique", "Amortisseur avant (x2)", "Amortisseur arrière (x2)", "Radiateur Moteur Eau", "Pompe à Eau Refroidissement"
  ],

  bijouterie: [
    "Collier en Or 18K", "Bracelet en Argent Filigrane", "Bague Solitaire Or & Diamant", "Boucles d'Oreilles Or Traditionnelles", "Montre Homme Seiko Automatique", "Montre Homme Rolex Style Submariner", "Montre Homme Tissot PRX", "Montre Femme Casio Classique Dorée", "Gourmette en Argent pour Homme", "Pendentif Carte du Sénégal Or", "Bague Chevalière Argent Homme", "Chaîne de Cheville en Or 18K", "Ensemble Parure Mariage Or 18K"
  ],

  maraichage: [
    "Sac d'Oignons Locaux Mbane 25kg", "Sac d'Oignons Importés 25kg", "Sac de Pommes de Terre Locaux Niayes 25kg", "Sac de Pommes de Terre Import 25kg", "Caisse de Tomates Cerises 10kg", "Caisse de Tomates Fraîches 20kg", "Sac de Carottes Locales 20kg", "Caisse d'Aubergines Amères (Diakhatou) 10kg", "Panier de Piments Verts 5kg", "Panier de Piments Rouges 5kg", "Panier de Gombos Frais 5kg", "Caisse de Mangues Kent (Casamance) 15kg", "Caisse de Papayes Locales 10kg", "Sac de Choux Pommés 25kg", "Citrons Verts Frais 5kg", "Pastèque Sucrée Locale (Unité 8kg)", "Concombres Frais 5kg", "Poivrons Verts 5kg", "Botte de Persil Frais", "Botte de Menthe Fraîche", "Salade Laitue Fraîche (Douzaine)"
  ],

  elevage: [
    "Mouton Bélier de race Ladoum", "Mouton Bélier Touabire (Tabaski)", "Mouton Bélier Bali-Bali", "Chèvre Locale (Génisse)", "Taureau d'Engraissement", "Vache Laitière Locale", "Sac d'Aliment Bétail (Rumi) 50kg", "Sac Aliment Pondeuse 50kg", "Sac Aliment Poulet de Chair Démarrage 50kg", "Sac Aliment Finition 50kg", "Sac de Tourteau d'Arachide 25kg", "Botte de Foin de Luzerne Séchée", "Botte de Paille de Riz 15kg", "Abreuvoir Automatique Volaille 5L", "Abreuvoir Volaille 10L", "Mangeoire Métallique pour Moutons 1.5m", "Lot de 50 Poussins d'un jour (Chair)", "Lot de 50 Poussins Pondeuse Isa Brown", "Poule Pondeuse Isa Brown (Adulte)"
  ],

  "produits-agricoles": [
    "Sac de Riz Paddy Local 50kg", "Sac de Mil Grain (Millet) Souna 50kg", "Sac de Maïs Grain Jaune 50kg", "Sac d'Arachides Décortiquées 40kg", "Sac de Sorgho Local 50kg", "Sac de Niébé Blanc 50kg", "Sac d'Engrais NPK (15-15-15) 50kg", "Sac d'Engrais Urée 46% 50kg", "Sac d'Engrais Phosphate 50kg", "Semences de Riz Certifiées 20kg", "Semences de Maïs Hybride 10kg", "Semences d'Oignon Certifiées 1kg", "Pulvérisateur Agricole à Dos 16L", "Pulvérisateur Manuel 20L", "Semoir Manuel Monorang", "Motopompe Essence 3 Pouces Irrigation", "Bâche Agricole Imperméable 6x8m"
  ],

  "solaire-energie": [
    "Panneau Solaire Monocristallin 50W", "Panneau Solaire Monocristallin 100W", "Panneau Solaire Monocristallin 150W", "Panneau Solaire Monocristallin 200W", "Panneau Solaire Monocristallin 300W", "Panneau Solaire 450W Jinko Solar", "Batterie Solaire Gel 12V 50Ah", "Batterie Solaire Gel 12V 100Ah", "Batterie Solaire Gel 12V 150Ah", "Batterie Solaire Gel 12V 200Ah", "Batterie Lithium LiFePO4 12V 100Ah", "Batterie Lithium LiFePO4 48V 100Ah Felicity", "Régulateur de Charge PWM 10A", "Régulateur de Charge PWM 30A 12V/24V", "Régulateur MPPT 60A Epever", "Convertisseur Pur Sinus 12V-220V 500W", "Convertisseur Pur Sinus 12V-220V 1000W", "Convertisseur Pur Sinus 24V-220V 2000W", "Convertisseur Pur Sinus 3000W Must", "Onduleur Hybride Solaire 3KW Must", "Projecteur Solaire LED 50W", "Projecteur Solaire LED 100W", "Projecteur Solaire LED 200W", "Lampadaire Solaire Tout-en-Un 100W", "Kit Solaire Domestique 3 Ampoules", "Ampoule LED DC 12V 9W", "Câble Solaire Double Isolation 4mm² (10m)", "Connecteurs MC4 (Paire)", "Ventilateur Rechargeable Solaire DC 12V", "Lampe Solaire de Poche Rechargeable", "Pompe à Eau Solaire Immergée 12V"
  ],

  "sante-pharma": [
    "Boîte de Paracétamol 500mg (16 comprimés)", "Doliprane 1000mg (Boîte de 8 comprimés)", "Efferalgan 1g Éfervescent", "Spasfon Lyoc (Boîte de 10)", "Smecta Sachet Anti-diarrhéique (Box 30)", "Motilium 10mg Comprimés", "Maalox Maux d'Estomac Suspension", "Ibuprofène Advil 400mg", "Aspirine UPSA 500mg", "Thermomètre Médical Digital", "Thermomètre Infrarouge Frontal Sans Contact", "Boîte de 50 Masques Chirurgicaux 3 Pli", "Masques FFP2 de Protection (Pack de 10)", "Gel Hydroalcoolique 100ml", "Gel Hydroalcoolique 500ml Pompe", "Tensiomètre Électronique Bras Omron M3", "Tensiomètre Électronique Poignet", "Oxymètre de Pouls Digital Saturation O2", "Lecteur de Glycémie Accu-Chek Instant", "Boîte de 50 Bandelettes Glycémie Accu-Chek", "Boîte de 100 Pansements Adhésifs Assortis", "Sparadrap Médical Rouleau 5m", "Alcool Chirurgical 70% 250ml", "Alcool Chirurgical 70% 500ml", "Eau Oxygénée 10 volumes 250ml", "Bétadine Solution Antiseptique 125ml", "Boîte de 10 Compresses Stériles 10x10cm", "Vitamine C 1000mg Éfervescente", "Complément Alimentaire Multivitamines Supradyn", "Magnésium B6 Anti-fatigue (Boîte 60)", "Sirop Toux Sèche Polery 150ml", "Sirop Toux Grasse Carbocistéine 150ml", "Préservatifs Durex Confort (Boîte de 12)", "Test de Grossesse Clearblue Digital"
  ],

  "bebe-enfants": [
    "Paquet de Couches Bébé (T1 - Nouveau-né)", "Paquet de Couches Bébé (T2 - Mini)", "Paquet de Couches Bébé (T3 - Midi)", "Paquet de Couches Bébé (T4 - Maxi)", "Paquet de Couches Bébé (T5 - Junior)", "Paquet de Couches Bébé (T6 - Extra Large)", "Couches Pampers Premium Care T3 (56P)", "Couches Pampers Premium Care T4 (52P)", "Couches Molfix T4 Maxi (50P)", "Couches Molfix T5 Junior (44P)", "Couches Huggies Extra Care T4 (50P)", "Lait Infantile Guigoz 1er Âge 400g", "Lait Infantile Guigoz 2ème Âge 800g", "Lait de Croissance Guigoz 3ème Âge 800g", "Lait Gallia Calisma 1er Âge 800g", "Lait Gallia Calisma 2ème Âge 800g", "Lait Gallia Calisma 3ème Âge 800g", "Lait Modilac Expert Riz 1er Âge 800g", "Lait Modilac Expert Riz 2ème Âge 800g", "Lait Novalac Anti-Régurgitation (AR) 800g", "Lait Novalac Anti-Colique (AC) 800g", "Lait de Croissance Nido Fortigrow 800g", "Céréales Bébé Nestlé Cerelac Blé 400g", "Céréales Bébé Nestlé Cerelac Miel 400g", "Céréales Bébé Nestlé Cerelac Fruits 400g", "Petits Pots Blédina Pomme (Pack 2x130g)", "Petits Pots Blédina Carotte (Pack 2x130g)", "Petits Pots Blédina Légumes Verts (Pack 2x130g)", "Lingettes Nettoyantes Bébé Pampers Sensitive (80P)", "Lingettes Nettoyantes Bébé Molfix (72P)", "Lingettes Nettoyantes Bébé Nivea Baby (63P)", "Biberon Chicco 150ml Tétine Silicone", "Biberon Anti-Colique en Verre Philips Avent 240ml", "Biberon Dodie 330ml 3 Vitesses", "Chauffe-Biberon Électrique Philips Avent", "Stérilisateur Biberon Micro-ondes Chicco", "Poussette Canne Ultra-Légère Pliable", "Poussette Duo Trio avec Siège Cosse Auto", "Shampoing Doux Bébé Mustela 500ml", "Shampoing Mixa Bébé 250ml", "Gel Lavant Doux Mustela 500ml", "Savon Doux Bébé Cadum 100g", "Sucette Silicone Philips Avent (0-6m)", "Sucette Chicco PhysioSoft (6-18m)", "Attache-Sucette Tissu Lavable", "Set de Jouets d'Éveil Bébé (Hochets & Dentition)", "Tapis d'Éveil Musical Bébé avec Arceau", "Poudre de Toilette Bébé Johnson's 200g", "Huile de Massage Bébé Mustela 100ml", "Lit Parapluie Pliable avec Sac de Transport", "Transat Bébé Ajustable 3 Positions", "Siège Auto Bébé Groupe 0+/1 (0-18kg)"
  ]
};

const outputData = {};

Object.keys(cataloguesRaw).forEach(cat => {
  const items = cataloguesRaw[cat];
  outputData[cat] = items.map((nom, i) => ({
    id: `${cat}-${i + 1}`,
    nom: nom,
    description: `Produit authentique de qualité supérieure: ${nom}`,
    categorie: cat,
    photo_defaut: getPhotoForProduct(nom, cat)
  }));
});

const outputPath = path.join(__dirname, 'data', 'catalogues-standards.json');
fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf8');
console.log(`✅ Catalogue généré avec succès dans ${outputPath} (${Object.keys(outputData).length} catégories, ${Object.values(outputData).flat().length} produits au total).`);
