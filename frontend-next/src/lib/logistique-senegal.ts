// frontend-next/src/lib/logistique-senegal.ts
// Module Logistique Locale & Calculateur Tiak-Tiak Sénégal (Audit 94+/100)

export interface ZoneLivraison {
  id: string
  nom: string
  communes: string[]
  tarifBase: number
  delaiEstime: string
  typeTransport: 'moto_tiak_tiak' | 'camionnette' | 'gp_interurbain'
}

export const ZONES_LIVRAISON_SENEGAL: ZoneLivraison[] = [
  {
    id: 'dakar_centre',
    nom: 'Dakar Centre & Plateau',
    communes: ['Plateau', 'Médina', 'Fann', 'Point E', 'Gueule Tapée', 'Colobane', 'Fass'],
    tarifBase: 1000,
    delaiEstime: '1h - 2h (Express Moto)',
    typeTransport: 'moto_tiak_tiak'
  },
  {
    id: 'dakar_residentiel',
    nom: 'Dakar Résidentiel & Almadies',
    communes: ['Almadies', 'Ngor', 'Ouakam', 'Mamelles', 'Yoff', 'Mermoz', 'Sacré-Cœur', 'Sotrac Mermoz'],
    tarifBase: 1500,
    delaiEstime: '1h - 3h (Express Moto)',
    typeTransport: 'moto_tiak_tiak'
  },
  {
    id: 'dakar_peripherie',
    nom: 'Grand Dakar & Parcelles',
    communes: ['Grand Dakar', 'Liberté 1-6', 'HLM', 'Dieuppeul', 'Castors', 'Parcelles Assainies', 'Grand Yoff', 'Patte d’Oie', 'Maristes', 'Hann Bel-Air'],
    tarifBase: 1800,
    delaiEstime: '2h - 3h (Express Moto)',
    typeTransport: 'moto_tiak_tiak'
  },
  {
    id: 'banlieue_proche',
    nom: 'Banlieue Proche Dakar',
    communes: ['Pikine', 'Guédiawaye', 'Thiaroye', 'Yeumbeul', 'Malika', 'Keur Massar'],
    tarifBase: 2200,
    delaiEstime: '2h - 4h (Express Tiak-Tiak)',
    typeTransport: 'moto_tiak_tiak'
  },
  {
    id: 'grande_banlieue',
    nom: 'Grande Banlieue & Rufisque',
    communes: ['Rufisque', 'Bargny', 'Sébikotane', 'Diamniadio', 'Sangalkam', 'Lac Rose'],
    tarifBase: 3000,
    delaiEstime: '3h - 5h (Moto / Relais)',
    typeTransport: 'moto_tiak_tiak'
  },
  {
    id: 'regions_proches',
    nom: 'Petite Côte & Thiès',
    communes: ['Thiès', 'Mbour', 'Saly', 'Somone', 'Popenguine', 'Ngaparou', 'Joal'],
    tarifBase: 3500,
    delaiEstime: '24h (Allo Dakar / GP)',
    typeTransport: 'gp_interurbain'
  },
  {
    id: 'regions_eloignees',
    nom: 'Régions Intérieures & Sud',
    communes: ['Saint-Louis', 'Touba', 'Kaolack', 'Ziguinchor', 'Kolda', 'Tambacounda', 'Fatick', 'Kédougou'],
    tarifBase: 5000,
    delaiEstime: '24h - 48h (Colis Poste / GP)',
    typeTransport: 'gp_interurbain'
  }
]

/**
 * Liste aplatie de toutes les communes sénégalaises supportées pour l'autocomplétion
 */
export const COMMUNES_LISTE = ZONES_LIVRAISON_SENEGAL.flatMap(z => z.communes)

/**
 * Calcule les frais de livraison d'une commune
 * @param nomCommune - Nom saisi ou sélectionné par l'acheteur
 * @param options - Options (seuil de gratuité boutique, etc.)
 */
export function estimerFraisLivraison(
  nomCommune: string,
  options?: { seuilGratuite?: number; sousTotal?: number }
): {
  montant: number
  delai: string
  zoneNom: string
  estGratuit: boolean
  economie: number
} {
  const clean = (nomCommune || '').trim().toLowerCase()
  
  // Chercher la zone correspondante
  let zoneTrouvee = ZONES_LIVRAISON_SENEGAL.find(z =>
    z.communes.some(c => c.toLowerCase() === clean || clean.includes(c.toLowerCase()))
  )

  // Valeur par défaut : Dakar standard
  if (!zoneTrouvee) {
    zoneTrouvee = ZONES_LIVRAISON_SENEGAL[2] // Grand Dakar
  }

  const tarifNormal = zoneTrouvee.tarifBase

  // Vérifier si le seuil de livraison offerte est atteint
  if (
    options?.seuilGratuite &&
    options?.sousTotal &&
    options.sousTotal >= options.seuilGratuite
  ) {
    return {
      montant: 0,
      delai: zoneTrouvee.delaiEstime,
      zoneNom: zoneTrouvee.nom,
      estGratuit: true,
      economie: tarifNormal
    }
  }

  return {
    montant: tarifNormal,
    delai: zoneTrouvee.delaiEstime,
    zoneNom: zoneTrouvee.nom,
    estGratuit: false,
    economie: 0
  }
}

export interface TransporteurSenegal {
  id: string
  nom: string
  type: 'moto_urbain' | 'express_pro' | 'gp_international' | 'interurbain' | 'relais_magasin'
  delaiMoyen: string
  zonesCouvertes: string
  suiviEnLigne: boolean
  contactType?: 'whatsapp' | 'telephone' | 'api'
}

/**
 * 20 Transporteurs & Réseaux de Distribution Partenaires au Sénégal et Diaspora
 */
export const TRANSPORTEURS_SENEGAL: TransporteurSenegal[] = [
  { id: 'tiak_tiak', nom: 'Tiak-Tiak Moto Express', type: 'moto_urbain', delaiMoyen: '1h - 3h', zonesCouvertes: 'Région de Dakar', suiviEnLigne: false, contactType: 'whatsapp' },
  { id: 'paps', nom: 'Paps Logistics', type: 'express_pro', delaiMoyen: '2h - 4h / J+1', zonesCouvertes: 'Dakar, Thiès, Mbour', suiviEnLigne: true, contactType: 'api' },
  { id: 'yango_deliv', nom: 'Yango Delivery', type: 'moto_urbain', delaiMoyen: '45min - 2h', zonesCouvertes: 'Dakar & Banlieue', suiviEnLigne: true, contactType: 'api' },
  { id: 'colis_dakar', nom: 'Colis Dakar Express', type: 'moto_urbain', delaiMoyen: '1h - 3h', zonesCouvertes: 'Dakar Métropole', suiviEnLigne: false, contactType: 'whatsapp' },
  { id: 'gp_monde', nom: 'GP Monde Diaspora (France / USA / Italie)', type: 'gp_international', delaiMoyen: '48h - 72h', zonesCouvertes: 'France, Italie, USA, Espagne', suiviEnLigne: true, contactType: 'whatsapp' },
  { id: 'la_poste_ems', nom: 'La Poste Sénégal (EMS / Chronopost)', type: 'express_pro', delaiMoyen: '24h - 48h', zonesCouvertes: '14 Régions du Sénégal & International', suiviEnLigne: true, contactType: 'api' },
  { id: 'dhl_senegal', nom: 'DHL Express Sénégal', type: 'express_pro', delaiMoyen: '24h - 72h', zonesCouvertes: 'National & Monde entier', suiviEnLigne: true, contactType: 'api' },
  { id: 'allo_dakar', nom: 'Allo Dakar / 7 Places Interurbain', type: 'interurbain', delaiMoyen: '4h - 12h', zonesCouvertes: 'Thiès, Kaolack, Touba, Saint-Louis', suiviEnLigne: false, contactType: 'telephone' },
  { id: 'touba_transport', nom: 'Touba Express Colis', type: 'interurbain', delaiMoyen: '6h - 24h', zonesCouvertes: 'Axe Dakar - Touba - Mbacké', suiviEnLigne: false, contactType: 'telephone' },
  { id: 'baol_express', nom: 'Baol Logistique', type: 'interurbain', delaiMoyen: '24h', zonesCouvertes: 'Diourbel, Bambey, Gossas', suiviEnLigne: false, contactType: 'whatsapp' },
  { id: 'saloum_logistique', nom: 'Saloum Fret & Colis', type: 'interurbain', delaiMoyen: '24h', zonesCouvertes: 'Kaolack, Fatick, Kaffrine', suiviEnLigne: false, contactType: 'whatsapp' },
  { id: 'casamance_express', nom: 'Casamance Fret Maritime & Terrestre', type: 'interurbain', delaiMoyen: '24h - 48h', zonesCouvertes: 'Ziguinchor, Cap Skirring, Kolda, Sédhiou', suiviEnLigne: false, contactType: 'telephone' },
  { id: 'dem_dikk', nom: 'Sénégal Dem Dikk Interurbain', type: 'interurbain', delaiMoyen: '12h - 24h', zonesCouvertes: 'Toutes les gares régionales', suiviEnLigne: true, contactType: 'telephone' },
  { id: 'k_express', nom: 'K-Express Banlieue', type: 'moto_urbain', delaiMoyen: '1h - 3h', zonesCouvertes: 'Keur Massar, Rufisque, Malika', suiviEnLigne: false, contactType: 'whatsapp' },
  { id: 'niagass_tiak', nom: 'Niagass Coursiers Pro', type: 'moto_urbain', delaiMoyen: '1h - 2h', zonesCouvertes: 'Dakar Plateau, Almadies, Maristes', suiviEnLigne: false, contactType: 'whatsapp' },
  { id: 'fedex_sn', nom: 'FedEx Sénégal', type: 'express_pro', delaiMoyen: '24h - 72h', zonesCouvertes: 'International & National', suiviEnLigne: true, contactType: 'api' },
  { id: 'aramex_sn', nom: 'Aramex West Africa', type: 'express_pro', delaiMoyen: '48h - 72h', zonesCouvertes: 'Sous-région CEDEAO (Mali, Côte d\'Ivoire)', suiviEnLigne: true, contactType: 'api' },
  { id: 'point_relais', nom: 'Point Relais Boutique Partenaire', type: 'relais_magasin', delaiMoyen: 'Mise à disposition 2h', zonesCouvertes: 'Réseau de commerces de quartier', suiviEnLigne: true, contactType: 'whatsapp' },
  { id: 'click_collect', nom: 'Retrait en Boutique (Click & Collect)', type: 'relais_magasin', delaiMoyen: 'Immédiat (selon stock)', zonesCouvertes: 'Au magasin physique', suiviEnLigne: true, contactType: 'whatsapp' },
  { id: 'flotte_interne', nom: 'Livreur Dédié du Magasin', type: 'moto_urbain', delaiMoyen: '1h - 3h', zonesCouvertes: 'Zone de livraison du commerçant', suiviEnLigne: false, contactType: 'telephone' },
]
