'use client'

import {
  CheckCircle2,
  Search,
  X,
} from 'lucide-react'
import Link from 'next/link'
import React, { useState, useRef, useEffect } from 'react'
import { trpc } from '@/lib/trpc/client'
import { useSelectedPatient } from '@/context/SelectedPatientContext'

export const DashboardHeader: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)
  const { onPatientSelected } = useSelectedPatient()
  const searchRef = useRef<HTMLDivElement>(null)

  // Buscar lista de pacientes para busca
  const { data: patients } = trpc.patient.getAll.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  })

  // Filtrar pacientes pela busca
  const filteredPatients = patients?.filter((patient) =>
    patient.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectPatient = (patientId: string) => {
    onPatientSelected(patientId)
    setSearchQuery('')
    setShowSearchResults(false)
  }

  return (
    <header className='sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/80'>
      <div className='flex h-16 items-center justify-between px-4'>
        {/* Barra de Busca Global */}
        <div className='relative flex-1 max-w-xl' ref={searchRef}>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400' />
            <input
              className='w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500'
              placeholder='Buscar cliente...'
              type='text'
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setShowSearchResults(true)
              }}
              onFocus={() => setShowSearchResults(true)}
            />
            {searchQuery && (
              <button
                className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600'
                onClick={() => {
                  setSearchQuery('')
                  setShowSearchResults(false)
                }}
              >
                <X className='h-4 w-4' />
              </button>
            )}
          </div>

          {/* Dropdown de Resultados da Busca */}
          {showSearchResults && searchQuery && (
            <div className='absolute left-0 top-full mt-2 w-full max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800'>
              {filteredPatients && filteredPatients.length > 0 ? (
                <div className='p-2'>
                  {filteredPatients.map((patient) => (
                    <button
                      className='flex w-full items-center gap-3 rounded-lg p-2 text-left text-sm transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700'
                      key={patient.id}
                      onClick={() => handleSelectPatient(patient.id)}
                    >
                      <div className='flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-cyan-500 text-xs font-bold text-white'>
                        {patient.name?.charAt(0) ?? 'P'}
                      </div>
                      <div className='flex-1 min-w-0'>
                        <p className='truncate font-medium'>{patient.name}</p>
                        <p className='truncate text-xs text-slate-500 dark:text-slate-400'>
                          {patient.email}
                        </p>
                      </div>
                      <CheckCircle2 className='h-4 w-4 text-slate-300' />
                    </button>
                  ))}
                </div>
              ) : (
                <div className='p-4 text-center text-sm text-slate-500 dark:text-slate-400'>
                  Nenhum cliente encontrado
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default DashboardHeader
