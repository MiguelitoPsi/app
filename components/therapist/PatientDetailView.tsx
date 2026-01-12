'use client'

import {
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  HelpCircle,
  Phone,
  Play,
  XCircle,
  X,
} from 'lucide-react'
import React, { useState } from 'react'

// Icons for metrics
const PresentIcon = () => (
  <div className='flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'>
    <CheckCircle2 className='h-5 w-5' />
  </div>
)

const AbsentIcon = () => (
  <div className='flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'>
    <Clock className='h-5 w-5' />
  </div>
)

const CancelledIcon = () => (
  <div className='flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'>
    <XCircle className='h-5 w-5' />
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
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState('dashboard')

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
                    <Calendar className='h-5 w-5' />
                  </div>
                }
                label='Próxima Sessão'
                value={nextSession}
              />
            ) : (
              <MetricCard
                icon={
                  <div className='flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-700'>
                    <Calendar className='h-5 w-5' />
                  </div>
                }
                label='Próxima Sessão'
                value='Não agendada'
              />
            )}
            <MetricCard
              icon={<PresentIcon />}
              label='Sessões Presentes'
              value={presentSessions}
            />
            <MetricCard
              icon={<AbsentIcon />}
              label='Sessões Ausentes'
              value={absentSessions}
            />
            <MetricCard
              icon={<CancelledIcon />}
              label='Sessões Canceladas'
              value={cancelledSessions}
            />
            <MetricCard
              icon={
                <div className='flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'>
                  <HelpCircle className='h-5 w-5' />
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
                <span className='text-sm text-slate-600 dark:text-slate-400'>Modelo de Cobrança</span>
                <span className='text-sm font-medium text-slate-800 dark:text-white'>{billingModel}</span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-slate-600 dark:text-slate-400'>Valor da Sessão</span>
                <span className='text-sm font-bold text-sky-600 dark:text-sky-400'>{sessionValue}</span>
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
                  <User className='h-4 w-4' />
                </div>
                <div>
                  <p className='text-xs text-slate-500 dark:text-slate-400'>Nome</p>
                  <p className='text-sm font-medium text-slate-800 dark:text-white'>{patientName}</p>
                </div>
              </div>
              {patientPhone && (
                <div className='flex items-center gap-3'>
                  <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'>
                    <Phone className='h-4 w-4' />
                  </div>
                  <div>
                    <p className='text-xs text-slate-500 dark:text-slate-400'>Telefone</p>
                    <a
                      className='text-sm font-medium text-sky-600 hover:underline dark:text-sky-400'
                      href={`https://wa.me/${patientPhone.replace(/\D/g, '')}`}
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      {patientPhone}
                    </a>
                  </div>
                </div>
              )}
              <div className='flex items-center gap-3'>
                <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'>
                  <FileText className='h-4 w-4' />
                </div>
                <div>
                  <p className='text-xs text-slate-500 dark:text-slate-400'>E-mail</p>
                  <p className='text-sm font-medium text-slate-800 dark:text-white'>{patientEmail}</p>
                </div>
              </div>
              <div className='flex items-center gap-3'>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  status === 'Ativo'
                    ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  <Calendar className='h-4 w-4' />
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
                <Play className='h-8 w-8 text-slate-400' />
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
                <Settings className='h-8 w-8 text-slate-400' />
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

// Simple User icon component
const User = ({ className }: { className?: string }) => (
  <svg className={className} fill='none' height='24' stroke='currentColor' strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'>
    <path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' />
    <circle cx='12' cy='7' r='4' />
  </svg>
)

// Simple Settings icon component
const Settings = ({ className }: { className?: string }) => (
  <svg className={className} fill='none' height='24' stroke='currentColor' strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'>
    <circle cx='12' cy='12' r='3' />
    <path d='M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z' />
  </svg>
)

export default PatientDetailView
