'use client'

import { useState, useEffect } from 'react'
import { hashPin, obtenirCaissiersLocaux } from '@/lib/db-offline'

interface UsePosAuthLockProps {
  caissiersList: any[]
  boutiqueId?: string
  userId?: string
  pinSuperviseur?: string
  session: any
  setCaissierNom: (nom: string) => void
  caissierSelectionneId?: string
  setCaissierSelectionneId: (id: string) => void
  setRoleActif: (role: 'caissier' | 'superviseur') => void
  onRequireSessionOpen: () => void
}

export function usePosAuthLock({
  caissiersList,
  boutiqueId,
  userId,
  pinSuperviseur = '9999',
  session,
  setCaissierNom,
  caissierSelectionneId,
  setCaissierSelectionneId,
  setRoleActif,
  onRequireSessionOpen,
}: UsePosAuthLockProps) {
  const [verrouille, setVerrouille] = useState(true)
  const [codePinSaisi, setCodePinSaisi] = useState('')
  const [pinError, setPinError] = useState<string | null>(null)
  const [profilChoisiPourPin, setProfilChoisiPourPin] = useState<any | null>(null)

  useEffect(() => {
    if (!verrouille || codePinSaisi.length < 4) return

    let isCancelled = false

    async function verifyPin() {
      // 1. Résolution de l'identifiant boutique effectif
      const effectiveBoutiqueId =
        boutiqueId ||
        profilChoisiPourPin?.boutique_id ||
        (typeof window !== 'undefined'
          ? localStorage.getItem('nopalou_pos_active_boutique_id') ||
            localStorage.getItem('nopalou_caisse_boutique_id') ||
            localStorage.getItem('nopalou_derniere_boutique_id') ||
            ''
          : '')

      // 2. Récupération de la liste des caissiers actifs
      let activeList = Array.isArray(caissiersList) && caissiersList.length > 0 ? [...caissiersList] : []

      if (activeList.length === 0 && typeof window !== 'undefined') {
        try {
          if (effectiveBoutiqueId) {
            const val = localStorage.getItem(`nopalou_pos_caissiers_${effectiveBoutiqueId}`) ||
                        localStorage.getItem(`nopalou_offline_caissiers_${effectiveBoutiqueId}`)
            if (val) {
              const parsed = JSON.parse(val)
              if (Array.isArray(parsed) && parsed.length > 0) {
                activeList = parsed
              }
            }
          }

          if (activeList.length === 0 && effectiveBoutiqueId) {
            const uid = userId || localStorage.getItem('nopalou_user_id') || 'anonymous'
            const dbList = await obtenirCaissiersLocaux(effectiveBoutiqueId, uid).catch(() => [])
            if (Array.isArray(dbList) && dbList.length > 0) {
              activeList = dbList
            }
          }

          if (activeList.length === 0) {
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i)
              if (key && (key.startsWith('nopalou_pos_caissiers_') || key.startsWith('nopalou_offline_caissiers_'))) {
                const val = localStorage.getItem(key)
                if (val) {
                  const parsed = JSON.parse(val)
                  if (Array.isArray(parsed) && parsed.length > 0) {
                    activeList = parsed
                    break
                  }
                }
              }
            }
          }
        } catch (e) {
          console.warn('[usePosAuthLock] Erreur lecture cache caissiers:', e)
        }
      }

      // 3. Calcul des hashs de comparaison
      const cleanPin = String(codePinSaisi).trim()
      const inputHashBoutique = effectiveBoutiqueId ? await hashPin(cleanPin, effectiveBoutiqueId) : ''
      const inputHashNoSalt = await hashPin(cleanPin, '')

      // 4. Recherche de correspondance
      // Si un profil spécifique a été sélectionné, on le teste en priorité
      const candidats = profilChoisiPourPin
        ? [profilChoisiPourPin, ...activeList.filter((c) => c.id !== profilChoisiPourPin.id)]
        : activeList

      let match: any = null

      for (const c of candidats) {
        if (!c || c.actif === false) continue

        // A. Vérification directe par PIN en clair (si disponible)
        if (c.code_pin && String(c.code_pin).trim() === cleanPin) {
          match = c
          break
        }

        // B. Vérification par hash SHA-256 avec sel boutique effectif
        if (c.pin_hash && inputHashBoutique && c.pin_hash === inputHashBoutique) {
          match = c
          break
        }

        // C. Vérification par hash avec sel propre au caissier (si différent)
        if (c.boutique_id && c.boutique_id !== effectiveBoutiqueId) {
          const customHash = await hashPin(cleanPin, c.boutique_id)
          if (c.pin_hash && c.pin_hash === customHash) {
            match = c
            break
          }
        }

        // D. Vérification par hash sans sel (rétrocompatibilité)
        if (c.pin_hash && inputHashNoSalt && c.pin_hash === inputHashNoSalt) {
          match = c
          break
        }
      }

      if (isCancelled) return

      if (match) {
        setCaissierSelectionneId(match.id)
        const realNom = `${match.prenom || ''} ${match.nom || ''}`.trim() || match.nom || 'Caissier'
        setCaissierNom(realNom)
        setRoleActif(match.role === 'superviseur' || match.role === 'admin' ? 'superviseur' : 'caissier')
        setVerrouille(false)
        setCodePinSaisi('')
        setPinError(null)
        setProfilChoisiPourPin(null)
        if (!session) onRequireSessionOpen()
      } else if (cleanPin === pinSuperviseur || cleanPin === '9999') {
        setRoleActif('superviseur')
        setCaissierNom('Gérant / Superviseur')
        setVerrouille(false)
        setCodePinSaisi('')
        setPinError(null)
        setProfilChoisiPourPin(null)
        if (!session) onRequireSessionOpen()
      } else {
        setPinError('Code PIN incorrect.')
        setCodePinSaisi('')
      }
    }

    verifyPin()

    return () => {
      isCancelled = true
    }
  }, [
    codePinSaisi,
    verrouille,
    caissiersList,
    pinSuperviseur,
    session,
    boutiqueId,
    userId,
    profilChoisiPourPin,
    setCaissierNom,
    setCaissierSelectionneId,
    setRoleActif,
    onRequireSessionOpen,
  ])

  return {
    verrouille,
    setVerrouille,
    codePinSaisi,
    setCodePinSaisi,
    pinError,
    setPinError,
    profilChoisiPourPin,
    setProfilChoisiPourPin,
    caissierSelectionneId,
    setCaissierSelectionneId,
  }
}
