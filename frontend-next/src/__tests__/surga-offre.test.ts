// @vitest-environment node
// L'offre côté écran : les textes se construisent sur les chiffres reçus de la console, jamais sur des valeurs supposées.
import { describe, it, expect } from 'vitest'
import { etatDroit, libelleAbonnement, nomOffre, phraseGratuite, planParticulier, prixDepuis, reductionAnnuelle, resumeGratuit, type Offre } from '../lib/surga-offre'

const offre: Offre = {
  ventes_ouvertes: true,
  gratuit: { cv: 1, lettres_par_mois: 2, simulations_par_semaine: 1, suivis_demarche: 3 },
  plans: [
    {
      id: 'b2c_premium', nom: 'Surga Plus', type: 'b2c', description: '', avantages: ['CV sans limite'],
      cycles: [
        { cycle: 'hebdomadaire', jours: 7, libelle: '7 jours', montant: 500 },
        { cycle: 'mensuel', jours: 30, libelle: '30 jours', montant: 1500 },
        { cycle: 'annuel', jours: 365, libelle: '12 mois', montant: 15000 },
      ],
    },
  ],
}

describe('formule et prix', () => {
  it('lit le nom, le libellé du bouton et le plus petit prix dans l’offre reçue', () => {
    expect(planParticulier(offre)?.id).toBe('b2c_premium')
    expect(nomOffre(offre)).toBe('Surga Plus')
    expect(libelleAbonnement(offre)).toBe('Passer à Surga Plus')
    expect(prixDepuis(offre)).toMatch(/^dès 500\sFCFA$/)
  })

  it('un nom changé dans la console se retrouve partout', () => {
    const autre: Offre = { ...offre, plans: [{ ...offre.plans[0], nom: 'Surga Pass' }] }
    expect(libelleAbonnement(autre)).toBe('Passer à Surga Pass')
    expect(etatDroit('cv', { estPremium: true, limite: 1, utilises: 0 }, autre).titre).toContain('Surga Pass')
  })

  it('sans offre connue : formulations neutres, aucun prix inventé', () => {
    expect(nomOffre(null)).toBe('l’abonnement Surga')
    expect(libelleAbonnement(null)).toBe('S’abonner')
    expect(prixDepuis(null)).toBeNull()
    expect(resumeGratuit(null)).toBe('')
  })

  it('une formule sans aucun cycle proposé n’est pas une offre', () => {
    const vide: Offre = { ...offre, plans: [{ ...offre.plans[0], cycles: [] }] }
    expect(planParticulier(vide)).toBeNull()
  })

  it('la réduction annuelle se calcule, et n’existe pas quand l’annuel ne fait pas économiser', () => {
    expect(reductionAnnuelle(offre.plans[0])).toBe(17)
    const cher = { ...offre.plans[0], cycles: [{ cycle: 'mensuel' as const, jours: 30, libelle: '30 jours', montant: 1000 }, { cycle: 'annuel' as const, jours: 365, libelle: '12 mois', montant: 12000 }] }
    expect(reductionAnnuelle(cher)).toBeNull()
    expect(reductionAnnuelle(null)).toBeNull()
  })
})

describe('quotas gratuits', () => {
  it('accorde le singulier et le pluriel sur la valeur réglée', () => {
    expect(phraseGratuite('lettres', 1)).toBe('1 lettre gratuite par mois')
    expect(phraseGratuite('lettres', 3)).toBe('3 lettres gratuites par mois')
    expect(phraseGratuite('cv', 2)).toBe('2 CV gratuits avec la mention « Surga »')
    expect(phraseGratuite('simulations', 1)).toBe('1 simulation gratuite par semaine')
    expect(phraseGratuite('suivis', 4)).toBe('4 démarches suivies gratuitement')
  })

  it('0 se dit « réservé aux abonnés » ; une valeur absente ne dit rien', () => {
    expect(phraseGratuite('cv', 0)).toBe('CV réservés aux abonnés')
    expect(phraseGratuite('suivis', 0)).toBe('Suivi de démarches réservé aux abonnés')
    expect(phraseGratuite('cv', null)).toBe('')
    expect(phraseGratuite('cv', undefined)).toBe('')
  })

  it('résume le gratuit pour l’écran d’abonnement', () => {
    expect(resumeGratuit(offre.gratuit)).toBe('1 CV gratuit avec la mention « Surga » · 2 lettres gratuites par mois · 1 simulation gratuite par semaine · 3 démarches suivies gratuitement')
  })
})

describe('bandeaux de droits', () => {
  it('abonné : sans limite', () => {
    expect(etatDroit('lettres', { estPremium: true, limite: 1, utilises: 5 }, offre)).toMatchObject({ titre: 'Surga Plus : lettres sans limite', atteint: false })
  })

  it('gratuit : disponible, entamé, atteint, réservé', () => {
    expect(etatDroit('lettres', { estPremium: false, limite: 2, utilises: 0 }, offre)).toMatchObject({ titre: '2 lettres gratuites par mois', detail: 'Disponible dès maintenant.', atteint: false })
    expect(etatDroit('lettres', { estPremium: false, limite: 2, utilises: 1 }, offre)).toMatchObject({ detail: 'Il vous en reste 1.', atteint: false })
    const atteint = etatDroit('cv', { estPremium: false, limite: 1, utilises: 1 }, offre)
    expect(atteint.atteint).toBe(true)
    expect(atteint.titre).toContain('Plafond gratuit atteint')
    expect(atteint.detail).toBe('Passez à Surga Plus pour continuer sans limite.')
    expect(etatDroit('simulations', { estPremium: false, limite: 0, utilises: 0 }, offre)).toMatchObject({ titre: 'Simulations réservées aux abonnés', atteint: true })
  })

  it('limite inconnue : bandeau neutre', () => {
    expect(etatDroit('cv', { estPremium: false, limite: null, utilises: null }, offre)).toMatchObject({ titre: 'Droits gratuits', atteint: false })
  })
})
