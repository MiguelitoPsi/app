'use client'

import type { ReactNode } from 'react'
import { SoundContext, useSound } from '@/hooks/useSound'

type SoundProviderProps = {
  children: ReactNode
}

export function SoundProvider({ children }: SoundProviderProps) {
  const soundState = useSound()

  return <SoundContext.Provider value={soundState}>{children}</SoundContext.Provider>
}
