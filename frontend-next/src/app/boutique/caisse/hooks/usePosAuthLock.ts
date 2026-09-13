'use client'

import { useState, useEffect } from 'react'

interface UsePosAuthLockProps {
  caissiersList: any[]
  pinSuperviseur?: string
  session: any
  setCaissierNom: (nom: string) => void
  setCaissierSelectionneId: (id: string) => void
  setRoleActif: (role: 'caissier' | 'superviseur') => void
  onRequireSessionOpen: () => void
}

export function usePosAuthLock({
  caissiersList,
  pinSuperviseur = '9999',
  session,
  setCaissierNom,
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
    const match = caissiersList.find((c) => c.actif !== false && c.code_pin === codePinSaisi)
    if (match) {
      setCaissierSelectionneId(match.id)
      const realNom = `${match.prenom || ''} ${match.nom || ''}`.trim() || match.nom
      setCaissierNom(realNom)
      setRoleActif(match.role === 'superviseur' || match.role === 'admin' ? 'superviseur' : 'caissier')
      setVerrouille(false)
      setCodePinSaisi('')
      setPinError(null)
      if (!session) onRequireSessionOpen()
    } else if (codePinSaisi === pinSuperviseur) {
      setRoleActif('superviseur')
      setCaissierNom('Gérant / Superviseur')
      setVerrouille(false)
      setCodePinSaisi('')
      setPinError(null)
      if (!session) onRequireSessionOpen()
    } else {
      setPinError('Code PIN incorrect.')
      setCodePinSaisi('')
    }
  }, [codePinSaisi, verrouille, caissiersList, pinSuperviseur, session, setCaissierNom, setCaissierSelectionneId, setRoleActif, onRequireSessionOpen])

  return {
    verrouille,
    setVerrouille,
    codePinSaisi,
    setCodePinSaisi,
    pinError,
    setPinError,
    profilChoisiPourPin,
    setProfilChoisiPourPin,
  }
}
