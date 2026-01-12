'use client'

import { Edit2, Mail, MapPin, Phone, Shield, User, Building, FileText } from 'lucide-react'
import Image from 'next/image'
import { useAuth } from '@/lib/hooks/useAuth'
import { useState } from 'react'

export const TherapistProfileView: React.FC = () => {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)

  // Fallback para iniciais
  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '?'

  // Dados mockados para demonstração - depois virão do banco
  const therapistData = {
    name: user?.name || 'João Miguel',
    phone: '(11) 99999-9999',
    birthdate: '15/03/1990',
    email: user?.email || 'joao.miguel@email.com',
    clinic: {
      name: 'Clínica Nepsis',
      cnpj: '12.345.678/0001-90',
      address: 'Av. Paulista, 1000 - Bela Vista',
      city: 'São Paulo - SP',
      cep: '01310-100',
    },
  }

  return (
    <div className='h-full overflow-y-auto p-6'>
      <div className='mx-auto max-w-6xl'>
        {/* Título */}
        <div className='mb-6'>
          <h1 className='text-2xl font-bold text-slate-900 dark:text-white'>Perfil</h1>
          <p className='text-sm text-slate-500 dark:text-slate-400'>
            Gerencie suas informações pessoais e dados da clínica
          </p>
        </div>

        {/* Grid Layout */}
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
          {/* Coluna Esquerda - Perfil e Conta */}
          <div className='space-y-6'>
            {/* Card: Perfil do Profissional */}
            <div className='rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'>
              <div className='flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-700'>
                <h2 className='flex items-center gap-2 font-semibold text-slate-900 dark:text-white'>
                  <User className='h-5 w-5 text-sky-500' />
                  Perfil do profissional
                </h2>
                <button
                  className='flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-sky-600 transition-colors hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-900/20'
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Edit2 className='h-4 w-4' />
                  Editar
                </button>
              </div>
              <div className='p-5'>
                {/* Foto de perfil */}
                <div className='mb-4 flex justify-center'>
                  <div className='relative'>
                    <div className='flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-sky-500 bg-gradient-to-br from-sky-500 to-cyan-500'>
                      {user?.image ? (
                        <Image
                          alt='Foto de perfil'
                          className='h-full w-full object-cover'
                          height={96}
                          src={user.image}
                          width={96}
                        />
                      ) : (
                        <span className='text-2xl font-bold text-white'>{initials}</span>
                      )}
                    </div>
                    <button className='absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-600 shadow-md transition-colors hover:bg-slate-50 dark:bg-slate-700 dark:text-slate-300'>
                      <Edit2 className='h-4 w-4' />
                    </button>
                  </div>
                </div>

                {/* Infos */}
                <div className='space-y-3'>
                  <div>
                    <label className='mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400'>
                      Nome
                    </label>
                    <p className='font-medium text-slate-900 dark:text-white'>{therapistData.name}</p>
                  </div>
                  <div>
                    <label className='mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400'>
                      Telefone
                    </label>
                    <p className='flex items-center gap-2 text-slate-900 dark:text-white'>
                      <Phone className='h-4 w-4 text-slate-400' />
                      {therapistData.phone}
                    </p>
                  </div>
                  <div>
                    <label className='mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400'>
                      Nascimento
                    </label>
                    <p className='flex items-center gap-2 text-slate-900 dark:text-white'>
                      <User className='h-4 w-4 text-slate-400' />
                      {therapistData.birthdate}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card: Conta */}
            <div className='rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'>
              <div className='flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-700'>
                <h2 className='flex items-center gap-2 font-semibold text-slate-900 dark:text-white'>
                  <Shield className='h-5 w-5 text-sky-500' />
                  Conta
                </h2>
              </div>
              <div className='p-5 space-y-4'>
                <div>
                  <label className='mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400'>
                    E-mail
                  </label>
                  <p className='flex items-center gap-2 text-slate-900 dark:text-white'>
                    <Mail className='h-4 w-4 text-slate-400' />
                    {therapistData.email}
                  </p>
                </div>
                <div>
                  <label className='mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400'>
                    Senha
                  </label>
                  <button className='flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'>
                    <Edit2 className='h-4 w-4' />
                    Alterar senha
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Direita - Dados da Clínica */}
          <div className='lg:col-span-2'>
            <div className='rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 h-full'>
              <div className='flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-700'>
                <h2 className='flex items-center gap-2 font-semibold text-slate-900 dark:text-white'>
                  <Building className='h-5 w-5 text-sky-500' />
                  Dados da clínica
                </h2>
                <button className='flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-sky-600 transition-colors hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-900/20'>
                  <Edit2 className='h-4 w-4' />
                  Editar
                </button>
              </div>
              <div className='p-5'>
                <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                  {/* Nome da Clínica */}
                  <div className='md:col-span-2'>
                    <label className='mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400'>
                      Nome da clínica
                    </label>
                    <p className='flex items-center gap-2 text-lg font-medium text-slate-900 dark:text-white'>
                      <Building className='h-5 w-5 text-sky-500' />
                      {therapistData.clinic.name}
                    </p>
                  </div>

                  {/* CNPJ */}
                  <div>
                    <label className='mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400'>
                      CNPJ
                    </label>
                    <p className='flex items-center gap-2 text-slate-900 dark:text-white'>
                      <FileText className='h-4 w-4 text-slate-400' />
                      {therapistData.clinic.cnpj}
                    </p>
                  </div>

                  {/* CEP */}
                  <div>
                    <label className='mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400'>
                      CEP
                    </label>
                    <p className='flex items-center gap-2 text-slate-900 dark:text-white'>
                      <MapPin className='h-4 w-4 text-slate-400' />
                      {therapistData.clinic.cep}
                    </p>
                  </div>

                  {/* Endereço */}
                  <div className='md:col-span-2'>
                    <label className='mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400'>
                      Endereço
                    </label>
                    <p className='flex items-center gap-2 text-slate-900 dark:text-white'>
                      <MapPin className='h-4 w-4 text-slate-400' />
                      {therapistData.clinic.address}
                    </p>
                  </div>

                  {/* Cidade */}
                  <div className='md:col-span-2'>
                    <label className='mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400'>
                      Cidade
                    </label>
                    <p className='flex items-center gap-2 text-slate-900 dark:text-white'>
                      <MapPin className='h-4 w-4 text-slate-400' />
                      {therapistData.clinic.city}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TherapistProfileView
