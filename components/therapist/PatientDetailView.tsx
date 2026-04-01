'use client'

import {
  RiCalendarLine,
  RiCheckboxCircleLine,
  RiErrorWarningLine,
  RiFileTextLine,
  RiPhoneLine,
  RiPlayLine,
  RiQuestionLine,
  RiTimeLine,
  RiUserLine,
  RiSettings4Line as SettingsIcon,
} from '@remixicon/react'
import type React from 'react'
import { useState } from 'react'

// Icons for metrics
const PresentIcon = () => (
  <div className='flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'>
    <RiCheckboxCircleLine className='h-5 w-5' />
  </div>
)

const AbsentIcon = () => (
  <div className='flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'>
    <RiTimeLine className='h-5 w-5' />
  </div>
)

const CancelledIcon = () => (
  <div className='flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'>
    <RiErrorWarningLine className='h-5 w-5' />
  </div>
)

interface MetricCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  sublabel?: string
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, label, value, sublabel }) => (
  <div className='flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800'>
    {icon}
    <div>
      <p className='text-xs text-slate-500 dark:text-slate-400'>{label}</p>
      <p className='text-xl font-bold text-slate-800 dark:text-white'>{value}</p>
      {sublabel && <p className='text-[10px] text-slate-400'>{sublabel}</p>}
    </div>
  </div>
)

interface PatientDetailViewProps {
  patientName: string
  patientEmail: string
  patientPhone?: string
  patientSince: string
  status: 'Ativo' | 'Inativo'
  nextSession?: string
  sessionValue: string
  billingModel: string
  plan: string
  presentSessions: number
  absentSessions: number
  cancelledSessions: number
  missedScore: number
  onBack: () => void
}

export const PatientDetailView: React.FC<PatientDetailViewProps> = ({
  patientName,
  patientEmail,
  patientPhone,
  patientSince,
  status,
  nextSession,
  sessionValue,
  billingModel,
  plan,
  presentSessions,
  absentSessions,
  cancelledSessions,
  missedScore,
  onBack: _onBack,
}) => {
  const [_activeTab, _setActiveTab] = useState('dashboard')

  return (
    <div className='flex-1 overflow-auto'>
      <div className='p-4'>
        {/* Header de Métricas */}
        <div className='mb-4'>
          <h1 className='text-lg font-semibold text-slate-800 dark:text-white mb-1'>
            Dashboard do Paciente
          </h1>
          <p className='text-sm text-slate-500 dark:text-slate-400'>
            Visão geral das atividades e métricas
          </p>
        </div>

        {/* Métricas Principais */}
        <div className='mb-4 overflow-x-auto'>
          <div className='flex gap-3 min-w-max pb-2'>
            {nextSession ? (
              <MetricCard
                icon={
                  <div className='flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400'>
                    <RiCalendarLine className='h-5 w-5' />
                  </div>
                }
                label='Próxima Sessão'
                value={nextSession}
              />
            ) : (
              <MetricCard
                icon={
                  <div className='flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-700'>
                    <RiCalendarLine className='h-5 w-5' />
                  </div>
                }
                label='Próxima Sessão'
                value='Não agendada'
              />
            )}
            <MetricCard icon={<PresentIcon />} label='Sessões Presentes' value={presentSessions} />
            <MetricCard icon={<AbsentIcon />} label='Sessões Ausentes' value={absentSessions} />
            <MetricCard
              icon={<CancelledIcon />}
              label='Sessões Canceladas'
              value={cancelledSessions}
            />
            <MetricCard
              icon={
                <div className='flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'>
                  <RiQuestionLine className='h-5 w-5' />
                </div>
              }
              label='Frequência Não Pontuada'
              value={`${missedScore}%`}
            />
          </div>
        </div>

        {/* Resumo Financeiro e Cards em Grid */}
        <div className='grid gap-4 lg:grid-cols-2'>
          {/* Resumo Financeiro */}
          <div className='rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800'>
            <h2 className='mb-4 text-lg font-semibold text-slate-800 dark:text-white'>
              Resumo Financeiro
            </h2>
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-slate-600 dark:text-slate-400'>Plano Financeiro</span>
                <span className='text-sm font-medium text-slate-800 dark:text-white'>{plan}</span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-slate-600 dark:text-slate-400'>
                  Modelo de Cobrança
                </span>
                <span className='text-sm font-medium text-slate-800 dark:text-white'>
                  {billingModel}
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-slate-600 dark:text-slate-400'>Valor da Sessão</span>
                <span className='text-sm font-bold text-sky-600 dark:text-sky-400'>
                  {sessionValue}
                </span>
              </div>
            </div>
          </div>

          {/* Dados Principais */}
          <div className='rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800'>
            <h2 className='mb-4 text-lg font-semibold text-slate-800 dark:text-white'>
              Dados Principais
            </h2>
            <div className='space-y-3'>
              <div className='flex items-center gap-3'>
                <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400'>
                  <RiUserLine className='h-4 w-4' />
                </div>
                <div>
                  <p className='text-xs text-slate-500 dark:text-slate-400'>Nome</p>
                  <p className='text-sm font-medium text-slate-800 dark:text-white'>
                    {patientName}
                  </p>
                </div>
              </div>
              {patientPhone && (
                <div className='flex items-center gap-3'>
                  <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'>
                    <RiPhoneLine className='h-4 w-4' />
                  </div>
                  <div>
                    <p className='text-xs text-slate-500 dark:text-slate-400'>Telefone</p>
                    <a
                      className='text-sm font-medium text-sky-600 hover:underline dark:text-sky-400'
                      href={`https://wa.me/${patientPhone.replace(/\D/g, '')}`}
                      rel='noopener noreferrer'
                      target='_blank'
                    >
                      {patientPhone}
                    </a>
                  </div>
                </div>
              )}
              <div className='flex items-center gap-3'>
                <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'>
                  <RiFileTextLine className='h-4 w-4' />
                </div>
                <div>
                  <p className='text-xs text-slate-500 dark:text-slate-400'>E-mail</p>
                  <p className='text-sm font-medium text-slate-800 dark:text-white'>
                    {patientEmail}
                  </p>
                </div>
              </div>
              <div className='flex items-center gap-3'>
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                    status === 'Ativo'
                      ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                  }`}
                >
                  <RiCalendarLine className='h-4 w-4' />
                </div>

                <div>
                  <p className='text-xs text-slate-500 dark:text-slate-400'>Status / Desde</p>
                  <p className='text-sm font-medium text-slate-800 dark:text-white'>
                    {status} • {patientSince}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Empty States */}
        <div className='mt-4 grid gap-4 lg:grid-cols-2'>
          {/* Registro de Atividades */}
          <div className='rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800'>
            <h2 className='mb-4 text-lg font-semibold text-slate-800 dark:text-white'>
              Registro de Atividades
            </h2>
            <div className='flex flex-col items-center justify-center py-8'>
              <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700'>
                <RiPlayLine className='h-8 w-8 text-slate-400' />
              </div>
              <p className='text-sm font-medium text-slate-600 dark:text-slate-300'>
                Nenhuma atividade registrada
              </p>
              <p className='text-xs text-slate-400 dark:text-slate-500'>
                As atividades aparecerão aqui
              </p>
            </div>
          </div>

          {/* Configuração do App */}
          <div className='rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800'>
            <h2 className='mb-4 text-lg font-semibold text-slate-800 dark:text-white'>
              Configuração do App
            </h2>
            <div className='flex flex-col items-center justify-center py-8'>
              <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700'>
                <SettingsIcon className='h-8 w-8 text-slate-400' />
              </div>
              <p className='text-sm font-medium text-slate-600 dark:text-slate-300'>
                Configurações do paciente
              </p>
              <p className='text-xs text-slate-400 dark:text-slate-500'>
                Personalize a experiência do app
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PatientDetailView
