'use client'

import { AlertCircle, ChevronRight, Clock } from 'lucide-react'
import Link from 'next/link'
import type React from 'react'
import { memo, useMemo } from 'react'
import { trpc } from '@/lib/trpc/client'

// Cores para os cards de tarefas - variadas como no print de referência
const TASK_COLORS = [
  {
    bg: 'bg-violet-100 dark:bg-violet-900/30',
    border: 'border-violet-200 dark:border-violet-800',
    text: 'text-violet-700 dark:text-violet-300',
    icon: 'text-violet-500 dark:text-violet-400',
    hover: 'hover:bg-violet-200 dark:hover:bg-violet-900/50',
  },
  {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-700 dark:text-amber-300',
    icon: 'text-amber-500 dark:text-amber-400',
    hover: 'hover:bg-amber-200 dark:hover:bg-amber-900/50',
  },
  {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    border: 'border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-700 dark:text-emerald-300',
    icon: 'text-emerald-500 dark:text-emerald-400',
    hover: 'hover:bg-emerald-200 dark:hover:bg-emerald-900/50',
  },
  {
    bg: 'bg-rose-100 dark:bg-rose-900/30',
    border: 'border-rose-200 dark:border-rose-800',
    text: 'text-rose-700 dark:text-rose-300',
    icon: 'text-rose-500 dark:text-rose-400',
    hover: 'hover:bg-rose-200 dark:hover:bg-rose-900/50',
  },
  {
    bg: 'bg-cyan-100 dark:bg-cyan-900/30',
    border: 'border-cyan-200 dark:border-cyan-800',
    text: 'text-cyan-700 dark:text-cyan-300',
    icon: 'text-cyan-500 dark:text-cyan-400',
    hover: 'hover:bg-cyan-200 dark:hover:bg-cyan-900/50',
  },
  {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    border: 'border-purple-200 dark:border-purple-800',
    text: 'text-purple-700 dark:text-purple-300',
    icon: 'text-purple-500 dark:text-purple-400',
    hover: 'hover:bg-purple-200 dark:hover:bg-purple-900/50',
  },
]

const PRIORITY_LABELS: Record<string, string> = {
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
}

export const TherapistDueNowSection: React.FC = memo(function TherapistDueNowSectionComponent() {
  const { data: allTasks, isLoading } = trpc.therapistTasks.getAll.useQuery(undefined, {
    staleTime: 2 * 60 * 1000,
  })

  // Filtrar e ordenar tarefas pendentes
  const dueTasks = useMemo(() => {
    if (!allTasks) return []

    const now = new Date()
    now.setHours(0, 0, 0, 0)

    // Pegar tarefas não completadas (status !== 'completed' e status !== 'cancelled')
    const pending = allTasks
      .filter((task) => task.status !== 'completed' && task.status !== 'cancelled')
      .map((task) => {
        const dueDate = task.dueDate ? new Date(task.dueDate) : null
        const isOverdue = dueDate ? dueDate < now : false
        const isToday = dueDate ? dueDate.toDateString() === now.toDateString() : false

        return {
          ...task,
          isOverdue,
          isToday,
          sortPriority: task.priority === 'high' ? 0 : task.priority === 'medium' ? 1 : 2,
        }
      })
      // Ordenar: atrasadas primeiro, depois por prioridade
      .sort((a, b) => {
        if (a.isOverdue && !b.isOverdue) return -1
        if (!a.isOverdue && b.isOverdue) return 1
        if (a.isToday && !b.isToday) return -1
        if (!a.isToday && b.isToday) return 1
        return a.sortPriority - b.sortPriority
      })
      // Limitar a 4 tarefas para caber na tela
      .slice(0, 4)

    return pending
  }, [allTasks])

  if (isLoading) {
    return (
      <section className='space-y-1'>
        <div className='flex items-center justify-between'>
          <h2 className='font-semibold text-xs text-slate-800 dark:text-white'>Para hoje</h2>
        </div>
        <div className='grid grid-cols-2 gap-1.5 lg:grid-cols-4'>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              className='h-14 animate-pulse rounded-md bg-slate-200 dark:bg-slate-700'
              key={`skeleton-${i}`}
            />
          ))}
        </div>
      </section>
    )
  }

  if (dueTasks.length === 0) {
    return (
      <section className='space-y-1'>
        <div className='flex items-center justify-between'>
          <h2 className='font-semibold text-xs text-slate-800 dark:text-white'>Para hoje</h2>
          <Link
            className='text-[10px] font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300'
            href='/therapist-routine'
          >
            Ver rotina
          </Link>
        </div>
        <div className='rounded-md border border-dashed border-slate-300 bg-slate-50 p-2 text-center dark:border-slate-700 dark:bg-slate-800/50'>
          <p className='text-[10px] font-medium text-slate-700 dark:text-slate-300'>Tudo em dia!</p>
        </div>
      </section>
    )
  }

  return (
    <section className='space-y-1'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-1.5'>
          <h2 className='font-semibold text-xs text-slate-800 dark:text-white'>Para hoje</h2>
          {dueTasks.some((t) => t.isOverdue) && (
            <span className='flex items-center gap-0.5 rounded-full bg-red-100 px-1.5 py-0.5 text-[9px] font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400'>
              <AlertCircle className='h-2.5 w-2.5' />
              {dueTasks.filter((t) => t.isOverdue).length}
            </span>
          )}
        </div>
        <Link
          className='text-[10px] font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300'
          href='/therapist-routine'
        >
          Ver todas
        </Link>
      </div>

      <div className='grid grid-cols-2 gap-1.5 lg:grid-cols-4'>
        {dueTasks.map((task, index) => {
          const colors = TASK_COLORS[index % TASK_COLORS.length]
          const isOverdue = task.isOverdue

          return (
            <Link
              className={`group relative flex flex-col justify-between overflow-hidden rounded-md border p-2 transition-all duration-200 ${
                isOverdue
                  ? 'border-red-300 bg-red-50 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:hover:bg-red-900/30'
                  : `${colors.bg} ${colors.border} ${colors.hover}`
              }`}
              href='/therapist-routine'
              key={task.id}
            >
              {/* Badge de prioridade/status */}
              {isOverdue ? (
                <span className='absolute right-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-200 dark:bg-red-800'>
                  <Clock className='h-2 w-2 text-red-600 dark:text-red-300' />
                </span>
              ) : task.priority === 'high' ? (
                <span className='absolute right-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-orange-200 dark:bg-orange-800'>
                  <span className='text-[8px]'>!</span>
                </span>
              ) : null}

              <div className='pr-3'>
                <h3
                  className={`line-clamp-1 text-[10px] font-medium ${
                    isOverdue ? 'text-red-700 dark:text-red-300' : colors.text
                  }`}
                >
                  {task.title}
                </h3>
              </div>

              <div className='mt-1.5 flex items-center justify-between'>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[8px] font-medium ${
                    isOverdue
                      ? 'bg-red-200 text-red-700 dark:bg-red-800 dark:text-red-300'
                      : `${colors.bg} ${colors.text}`
                  }`}
                >
                  {isOverdue ? 'Atrasada' : PRIORITY_LABELS[task.priority]}
                </span>
                <ChevronRight
                  className={`h-2.5 w-2.5 transition-transform group-hover:translate-x-0.5 ${
                    isOverdue ? 'text-red-500 dark:text-red-400' : colors.icon
                  }`}
                />
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
})
