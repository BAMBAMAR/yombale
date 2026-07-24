const fs = require("fs");

const generateItems = (cat, items, count, imageUrl) => {
  let result = [];
  for (let i = 0; i < count; i++) {
    const base = items[i % items.length];
    result.push({
      id: `${cat}-${i + 1}`,
      nom: `${base} ${Math.floor(i / items.length) + 1}`,
      description: `Produit de qualité supérieure: ${base}`,
      categorie: cat,
      photo_defaut: imageUrl
    });
  }
  return result;
};

const baseAlimentation = ["Riz brisé", "Riz parfumé", "Lait Nido", "Lait Gloria", "Café Touba", "Bouillon Jumbo", "Bouillon Maggi", "Huile Niani", "Sucre en poudre", "Thé Lipton", "Thé Flecha", "Jus Pressea", "Eau Tangui", "Eau Kirène", "Gazelle", "Thiakry", "Araw", "Bissap", "Bouye", "Gingembre", "Moutarde", "Vinaigre", "Mayonnaise", "Ketchup", "Pâtes", "Farine", "Lait concentré", "Chocolat tartine", "Corn Flakes", "Oignons", "Pommes de terre", "Ail"];
const baseSmartphones = ["iPhone 13", "iPhone 14", "iPhone 15", "Samsung Galaxy S22", "Samsung Galaxy S23", "Samsung A54", "Redmi Note 12", "Tecno Spark", "Infinix Hot", "Itel", "AirPods", "Galaxy Buds", "Chargeur Rapide", "Câble Type-C", "Power Bank", "Verre Trempé", "Coque Silicone", "Support Voiture", "Écouteurs filaires", "Montre Connectée"];
const baseInformatique = ["MacBook Pro", "MacBook Air", "HP EliteBook", "Dell Latitude", "Lenovo ThinkPad", "Clavier sans fil", "Souris Bluetooth", "Disque Dur Externe", "Clé USB", "Écran PC", "Câble HDMI", "Onduleur", "Imprimante", "Cartouche d'encre", "Routeur WiFi", "Répéteur WiFi", "Sacoche PC", "Casque Micro"];
const baseTvElectro = ["TV LED", "TV Smart", "Climatiseur", "Réfrigérateur", "Congélateur", "Micro-ondes", "Four électrique", "Mixeur", "Blender", "Fer à repasser", "Machine à laver", "Ventilateur sur pied", "Ventilateur plafond", "Chauffe-eau", "Plaque de cuisson", "Cuisinière", "Extracteur de jus"];
const baseMode = ["T-shirt", "Chemise", "Pantalon Jean", "Robe de soirée", "Bazin riche", "Wax complet", "Chaussures en cuir", "Baskets", "Sandales", "Montre homme", "Montre femme", "Sac à main", "Sac à dos", "Ceinture", "Casquette", "Lunettes de soleil", "Parfum", "Bijoux", "Veste", "Costume"];
const baseMaison = ["Drap de lit", "Taie d'oreiller", "Couverture", "Tapis de salon", "Rideau", "Matelas orthopédique", "Lit en bois", "Armoire", "Canapé", "Table à manger", "Chaise", "Casserole", "Poêle", "Assiettes", "Verres", "Couverts", "Bassine", "Seau", "Balai", "Serpillière"];
const baseAutoMoto = ["Huile moteur", "Liquide de frein", "Batterie voiture", "Pneus", "Plaquettes de frein", "Filtre à huile", "Filtre à air", "Bougies", "Essuie-glace", "Tapis voiture", "Housse de siège", "Casque moto", "Gants moto", "Antivol", "Cric", "Triangle", "Extincteur"];
const baseJeux = ["PS5 Console", "PS4 Console", "Manette PS5", "Manette PS4", "Xbox Series X", "Nintendo Switch", "FIFA", "GTA V", "Call of Duty", "Mortal Kombat", "Casque Gamer", "Chaise Gamer", "Clavier Gamer", "Souris Gamer", "Tapis de souris", "Volant PC"];
const baseBeaute = ["Lotion pour le corps", "Savon", "Gel douche", "Shampoing", "Après-shampoing", "Crème de visage", "Déodorant", "Parfum femme", "Parfum homme", "Rouge à lèvres", "Fond de teint", "Mascara", "Poudre", "Pinceaux", "Faux cils", "Vernis à ongles", "Limes", "Sèche-cheveux", "Lisseur"];
const baseSport = ["Maillot de foot", "Crampons", "Ballon de foot", "Ballon de basket", "Gants de gardien", "Protège-tibias", "Haltères", "Tapis de yoga", "Corde à sauter", "Bande de résistance", "Sac de sport", "Gourde", "Vélos", "Trottinette", "Jogging", "Baskets running"];
const baseFournitures = ["Cahier 200 pages", "Cahier 100 pages", "Stylo bleu", "Stylo rouge", "Crayon", "Gomme", "Taille-crayon", "Règle", "Compas", "Classeur", "Pochettes", "Feuilles A4", "Calculatrice", "Sac d'école", "Trousse", "Scotch", "Colle", "Ciseaux", "Marqueur", "Surligneur"];
const baseQuincaillerie = ["Ciment", "Fer à béton", "Peinture", "Pinceau", "Rouleau", "Clous", "Vis", "Tournevis", "Marteau", "Pince", "Scie", "Perceuse", "Meuleuse", "Cadenas", "Serrure", "Ampoule LED", "Prise", "Interrupteur", "Câble électrique", "Tuyau", "Robinet"];

let data = {
  alimentation: generateItems("alimentation", baseAlimentation, 100, "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400"),
  smartphones: generateItems("smartphones", baseSmartphones, 100, "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400"),
  informatique: generateItems("informatique", baseInformatique, 80, "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400"),
  "tv-electro": generateItems("tv-electro", baseTvElectro, 80, "https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=400"),
  mode: generateItems("mode", baseMode, 100, "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400"),
  maison: generateItems("maison", baseMaison, 100, "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400"),
  "auto-moto": generateItems("auto-moto", baseAutoMoto, 60, "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=400"),
  jeux: generateItems("jeux", baseJeux, 60, "https://images.unsplash.com/photo-1486401899868-0e435ed85128?w=400"),
  beaute: generateItems("beaute", baseBeaute, 80, "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400"),
  sport: generateItems("sport", baseSport, 60, "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=400"),
  fournitures: generateItems("fournitures", baseFournitures, 80, "https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?w=400"),
  quincaillerie: generateItems("quincaillerie", baseQuincaillerie, 80, "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=400")
};

fs.writeFileSync("data/catalogues-standards.json", JSON.stringify(data, null, 2), "utf8");
console.log("Catalog generated successfully with proper images and UTF-8 encoding.");
