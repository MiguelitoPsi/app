'use client'

import { createContext, type ReactNode, useContext, useState, useCallback } from 'react'

type SelectedPatientContextType = {
  selectedPatientId: string | null
  setSelectedPatientId: (id: string | null) => void
  onPatientSelected: (id: string | null) => void
  isPatientViewActive: boolean
}

const SelectedPatientContext = createContext<SelectedPatientContextType | undefined>(undefined)

export function SelectedPatientProvider({ children }: { children: ReactNode }) {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)

  const onPatientSelected = useCallback((id: string | null) => {
    setSelectedPatientId(id)
  }, [])

  const isPatientViewActive = selectedPatientId !== null

  return (
    <SelectedPatientContext.Provider
      value={{ selectedPatientId, setSelectedPatientId, onPatientSelected, isPatientViewActive }}
    >
      {children}
    </SelectedPatientContext.Provider>
  )
}

export function useSelectedPatient() {
  const context = useContext(SelectedPatientContext)
  if (context === undefined) {
    throw new Error('useSelectedPatient must be used within a SelectedPatientProvider')
  }
  return context
}
