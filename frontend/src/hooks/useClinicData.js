import { useContext } from 'react'

import { ClinicDataContext } from '../context/clinic-context'

export function useClinicData() {
  const context = useContext(ClinicDataContext)

  if (!context) {
    throw new Error('useClinicData must be used inside ClinicDataProvider')
  }

  return context
}
