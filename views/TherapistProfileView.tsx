'use client'

import { Edit2, Mail, MapPin, Phone, Shield, User, Building, FileText } from 'lucide-react'
import Image from 'next/image'
import { useAuth } from '@/lib/hooks/useAuth'
import { useState } from 'react'

// Item de informação com linha divisória
const InfoRow: React.FC<{ label: string; value: React.ReactNode; icon?: React.ReactNode; hasBorder?: boolean }> = ({
  label,
  value,
  icon,
  hasBorder = true,
}) => (
  <div className={`flex flex-col gap-1 pb-4 mb-0 ${hasBorder ? 'border-b border-slate-100 dark:border-slate-700' : ''}`}>
    <label className='text-xs font-medium text-slate-500 dark:text-slate-400'>
      {label}
    </label>
    <div className='flex flex-row items-center gap-2 text-slate-900 dark:text-white'>
      {icon && <span className='flex-shrink-0'>{icon}</span>}
      <span className='font-medium'>{value}</span>
    </div>
  </div>
)

// Card wrapper com flex-column
const ProfileCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; action?: React.ReactNode }> = ({
  title,
  icon,
  children,
  action,
}) => (
  <div className='flex flex-col rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800'>
    <div className='flex flex-row items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-700'>
      <h2 className='flex flex-row items-center gap-2 font-semibold text-slate-900 dark:text-white'>
        {icon}
        {title}
      </h2>
      {action}
    </div>
    <div className='flex flex-col'>
      {children}
    </div>
  </div>
)

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
    <div className='box-border h-full overflow-y-auto p-6'>
      <div className='mx-auto box-border max-w-6xl'>
        {/* Título */}
        <div className='mb-6'>
          <h1 className='box-border text-2xl font-bold text-slate-900 dark:text-white'>Perfil</h1>
          <p className='text-sm text-slate-500 dark:text-slate-400'>
            Gerencie suas informações pessoais e dados da clínica
          </p>
        </div>

        {/* Grid Layout */}
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
          {/* Coluna Esquerda - Perfil e Conta */}
          <div className='flex flex-col gap-6'>
            {/* Card: Perfil do Profissional */}
            <ProfileCard
              title='Perfil do profissional'
              icon={<User className='h-5 w-5 text-sky-500' />}
              action={
                <button
                  className='flex flex-row items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-sky-600 transition-colors hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-900/20'
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Edit2 className='h-4 w-4' />
                  Editar
                </button>
              }
            >
              {/* Foto de perfil */}
              <div className='flex flex-col items-center pb-6 mb-6 border-b border-slate-100 dark:border-slate-700'>
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
                  {/* Botão de editar posicionado com flex dentro do pai, sem absolute */}
                  <div className='absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-600 shadow-md transition-colors hover:bg-slate-50 dark:bg-slate-700 dark:text-slate-300'>
                    <Edit2 className='h-4 w-4' />
                  </div>
                </div>
              </div>

              {/* Infos com linhas divisórias */}
              <div className='flex flex-col'>
                <InfoRow
                  label='Nome'
                  value={therapistData.name}
                  hasBorder={true}
                />
                <InfoRow
                  label='Telefone'
                  value={therapistData.phone}
                  icon={<Phone className='h-4 w-4 text-slate-400' />}
                  hasBorder={true}
                />
                <InfoRow
                  label='Nascimento'
                  value={therapistData.birthdate}
                  icon={<User className='h-4 w-4 text-slate-400' />}
                  hasBorder={false}
                />
              </div>
            </ProfileCard>

            {/* Card: Conta */}
            <ProfileCard
              title='Conta'
              icon={<Shield className='h-5 w-5 text-sky-500' />}
            >
              <div className='flex flex-col'>
                <InfoRow
                  label='E-mail'
                  value={therapistData.email}
                  icon={<Mail className='h-4 w-4 text-slate-400' />}
                  hasBorder={true}
                />
                <div className='flex flex-col pt-2'>
                  <label className='mb-2 block text-xs font-medium text-slate-500 dark:text-slate-400'>
                    Senha
                  </label>
                  <button className='flex flex-row items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'>
                    <Edit2 className='h-4 w-4' />
                    Alterar senha
                  </button>
                </div>
              </div>
            </ProfileCard>
          </div>

          {/* Coluna Direita - Dados da Clínica */}
          <div className='lg:col-span-2'>
            <ProfileCard
              title='Dados da clínica'
              icon={<Building className='h-5 w-5 text-sky-500' />}
              action={
                <button className='flex flex-row items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-sky-600 transition-colors hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-900/20'>
                  <Edit2 className='h-4 w-4' />
                  Editar
                </button>
              }
            >
              <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                {/* Nome da Clínica */}
                <div className='col-span-2 border-b border-slate-100 pb-4 dark:border-slate-700'>
                  <label className='mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400'>
                    Nome da clínica
                  </label>
                  <p className='flex flex-row items-center gap-2 text-lg font-medium text-slate-900 dark:text-white'>
                    <Building className='h-5 w-5 text-sky-500' />
                    {therapistData.clinic.name}
                  </p>
                </div>

                {/* CNPJ */}
                <div className='border-b border-slate-100 pb-4 dark:border-slate-700'>
                  <label className='mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400'>
                    CNPJ
                  </label>
                  <p className='flex flex-row items-center gap-2 text-slate-900 dark:text-white'>
                    <FileText className='h-4 w-4 text-slate-400' />
                    {therapistData.clinic.cnpj}
                  </p>
                </div>

                {/* CEP */}
                <div className='border-b border-slate-100 pb-4 dark:border-slate-700'>
                  <label className='mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400'>
                    CEP
                  </label>
                  <p className='flex flex-row items-center gap-2 text-slate-900 dark:text-white'>
                    <MapPin className='h-4 w-4 text-slate-400' />
                    {therapistData.clinic.cep}
                  </p>
                </div>

                {/* Endereço */}
                <div className='col-span-2 border-b border-slate-100 pb-4 dark:border-slate-700'>
                  <label className='mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400'>
                    Endereço
                  </label>
                  <p className='flex flex-row items-center gap-2 text-slate-900 dark:text-white'>
                    <MapPin className='h-4 w-4 text-slate-400' />
                    {therapistData.clinic.address}
                  </p>
                </div>

                {/* Cidade */}
                <div className='col-span-2'>
                  <label className='mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400'>
                    Cidade
                  </label>
                  <p className='flex flex-row items-center gap-2 text-slate-900 dark:text-white'>
                    <MapPin className='h-4 w-4 text-slate-400' />
                    {therapistData.clinic.city}
                  </p>
                </div>
              </div>
            </ProfileCard>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TherapistProfileView
