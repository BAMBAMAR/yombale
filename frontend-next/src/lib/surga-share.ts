// frontend-next/src/lib/surga-share.ts
// Moteur de partage et génération des liens WhatsApp pour Surga
// Web Share API, liens WhatsApp directs, zéro émoji, vouvoiement strict

import { ADRESSE_SURGA } from './surga-adresse';

// Adresse mise dans les messages partagés. « NEXT_PUBLIC_SURGA_URL » permet d'y mettre l'adresse courte
// « https://surga.nopalou.com » une fois le sous-domaine créé : il renvoie vers l'application (D77).
export const SURGA_BASE_URL = process.env.NEXT_PUBLIC_SURGA_URL || ADRESSE_SURGA;

export interface PartagePayload {
  titre: string;
  texte: string;
  url?: string;
}

/**
 * Génère le message WhatsApp pour une brève d'actualité
 */
export function formaterPartageBreve(opts: {
  titre: string;
  source: string;
  resume?: string;
  urlSource?: string;
}): string {
  let msg = `*Surga — Actualité*\n`;
  msg += `*${opts.titre}*\n\n`;
  if (opts.resume) {
    msg += `${opts.resume}\n\n`;
  }
  msg += `• Source : ${opts.source || 'Presse sénégalaise'}\n`;
  if (opts.urlSource) {
    msg += `• Article : ${opts.urlSource}\n`;
  }
  msg += `\nRetrouvez votre briefing quotidien sur Surga :\n${SURGA_BASE_URL}?utm_source=whatsapp_share`;
  return msg;
}

/**
 * Génère le message WhatsApp pour un événement sportif
 */
export function formaterPartageSport(opts: {
  competition: string;
  equipeDomicile: string;
  equipeExterieur: string;
  score?: string;
  heure?: string;
  statut?: string;
}): string {
  let msg = `*Surga — Sport & Résultats*\n`;
  msg += `*${opts.competition || 'Compétition'}*\n\n`;
  msg += `• Affiche : ${opts.equipeDomicile} vs ${opts.equipeExterieur}\n`;
  if (opts.score) {
    msg += `• Score : ${opts.score}\n`;
  } else if (opts.heure) {
    msg += `• Horaire : ${opts.heure}\n`;
  }
  if (opts.statut) {
    const statutLisible = opts.statut === 'TERMINE' ? 'Terminé' : opts.statut === 'EN_COURS' ? 'En direct' : 'À venir';
    msg += `• Statut : ${statutLisible}\n`;
  }
  msg += `\nSuivez le sport sénégalais et international sur Surga :\n${SURGA_BASE_URL}?utm_source=whatsapp_share`;
  return msg;
}

/**
 * Génère le message WhatsApp pour un calcul exact
 */
export function formaterPartageCalcul(opts: {
  expression: string;
  resultatFormate: string;
}): string {
  let msg = `*Surga — Calculatrice*\n\n`;
  msg += `• Calcul : ${opts.expression}\n`;
  msg += `• Résultat exact : ${opts.resultatFormate}\n\n`;
  msg += `Calculé avec le moteur déterministe Surga :\n${SURGA_BASE_URL}?utm_source=whatsapp_share`;
  return msg;
}

/**
 * Construit le lien d'ouverture WhatsApp direct
 */
export function genererLienWhatsApp(texte: string): string {
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(texte)}`;
}

/**
 * Exécute le partage avec l'API Web Share native, ou repli WhatsApp direct
 */
export async function executerPartage(payload: PartagePayload): Promise<'NATIVE' | 'WHATSAPP' | 'COPIE' | 'ANNULE'> {
  if (typeof window === 'undefined') return 'ANNULE';

  // 1. Essai de l'API standard Web Share (sur mobile ou PWA)
  if (navigator.share) {
    try {
      await navigator.share({
        title: payload.titre,
        text: payload.texte,
        url: payload.url || SURGA_BASE_URL,
      });
      return 'NATIVE';
    } catch (err: unknown) {
      // Si l'utilisateur a annulé, ne pas ouvrir de popup de repli
      if (err instanceof Error && err.name === 'AbortError') {
        return 'ANNULE';
      }
    }
  }

  // 2. Repli : ouverture directe de WhatsApp
  const urlWa = genererLienWhatsApp(payload.texte);
  window.open(urlWa, '_blank', 'noopener,noreferrer');
  return 'WHATSAPP';
}

/**
 * Copie un texte dans le presse-papier avec repli sécurisé
 */
export async function copierDansPressePapier(texte: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(texte);
      return true;
    }
    const textArea = document.createElement('textarea');
    textArea.value = texte;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  } catch {
    return false;
  }
}
