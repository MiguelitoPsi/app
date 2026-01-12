'use client'

import React from 'react'
import { format, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Clock,
  User,
  CheckCircle2,
  Circle,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from 'lucide-react'

interface AgendaSidebarProps {
  selectedDate: Date
  tasks: any[]
  onCompleteTask: (task: any) => void
  onDateChange: (direction: number) => void
  onDeleteTask?: (taskId: string) => void
}

const AgendaSidebar: React.FC<AgendaSidebarProps> = ({
  selectedDate,
  tasks,
  onCompleteTask,
  onDateChange,
  onDeleteTask,
}) => {
  const filteredTasks = tasks
    .filter((task) => {
      if (!task.dueDate) return false
      const taskDate = new Date(task.dueDate)
      return isSameDay(selectedDate, taskDate)
    })
    .sort((a, b) => {
      // Sort by priority or time if available
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return (
        (priorityOrder[a.priority as keyof typeof priorityOrder] ?? 3) -
        (priorityOrder[b.priority as keyof typeof priorityOrder] ?? 3)
      )
    })

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500'
      case 'medium':
        return 'bg-orange-400'
      default:
        return 'bg-sky-400'
    }
  }

  return (
    <div className='bg-slate-900/50 rounded-2xl p-5 backdrop-blur-sm border border-slate-800/50 flex flex-col h-full'>
      {/* Header with date navigation */}
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h3 className='text-lg font-bold text-white'>Agendado</h3>
          <p className='text-slate-400 text-sm mt-0.5'>
            {format(selectedDate, "d 'de' MMMM, yyyy", { locale: ptBR })}
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <div className='p-2 bg-slate-800/50 rounded-lg text-slate-400'>
            <CalendarIcon size={16} />
          </div>
          <div className='flex gap-0.5'>
            <button
              className='p-1.5 hover:bg-slate-800 rounded-lg transition-colors text-slate-400'
              onClick={() => onDateChange(-1)}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              className='p-1.5 hover:bg-slate-800 rounded-lg transition-colors text-slate-400'
              onClick={() => onDateChange(1)}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Tasks list */}
      <div className='flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar'>
        {filteredTasks.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-12 text-slate-500'>
            <Circle size={40} className='mb-3 opacity-20' />
            <p className='text-sm'>Nenhuma tarefa para este dia</p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div className='group transition-all' key={task.id}>
              {/* Time and intensity bar */}
              <div className='flex items-center gap-3 mb-2'>
                <span className='text-[10px] font-bold text-slate-500 tracking-tight w-10 text-right'>
                  {task.type === 'session' ? 'SESSÃO' : 'TAREFA'}
                </span>
                <div
                  className={`h-0.5 flex-1 rounded-full ${getPriorityColor(task.priority)}`}
                  style={{ opacity: task.priority === 'high' ? 1 : task.priority === 'medium' ? 0.7 : 0.5 }}
                />
              </div>

              {/* Task card */}
              <div
                className={`
                  relative p-4 rounded-xl border transition-all
                  ${
                    task.status === 'completed'
                      ? 'bg-slate-800/30 border-slate-700/50 opacity-60'
                      : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                  }
                `}
              >
                <div className='flex items-start justify-between gap-3'>
                  <div className='flex-1 min-w-0'>
                    <h4
                      className={`font-bold text-sm mb-1 truncate ${
                        task.status === 'completed' ? 'line-through text-slate-400' : 'text-white'
                      }`}
                    >
                      {task.title}
                    </h4>
                    <p className='text-xs text-slate-400 flex items-center gap-1.5'>
                      {task.type === 'session' ? (
                        <>
                          <User size={12} />
                          Consulta online
                        </>
                      ) : (
                        'Tarefa diária'
                      )}
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className='flex items-center gap-1'>
                    {/* Complete button */}
                    <button
                      className={`
                        shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                        ${
                          task.status === 'completed'
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-slate-600 hover:border-sky-500 text-transparent hover:text-sky-500/50'
                        }
                      `}
                      onClick={() => onCompleteTask(task)}
                    >
                      <CheckCircle2 size={12} />
                    </button>

                    {/* Delete button */}
                    {onDeleteTask && (
                      <button
                        className='shrink-0 w-5 h-5 rounded-full border border-slate-600 flex items-center justify-center transition-all text-slate-500 hover:border-red-500 hover:text-red-500 opacity-0 group-hover:opacity-100'
                        onClick={() => onDeleteTask(task.id)}
                        title='Excluir tarefa'
                      >
                        <Trash2 size={10} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Footer with patient and duration */}
                <div className='mt-3 flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <div className='flex -space-x-1.5'>
                      <div className='w-5 h-5 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center overflow-hidden'>
                        <User size={10} className='text-slate-400' />
                      </div>
                    </div>
                    {task.patientId && (
                      <span className='text-[10px] text-slate-500 font-medium'>Paciente</span>
                    )}
                  </div>
                  <div className='flex items-center gap-2 text-[10px] text-slate-500'>
                    <Clock size={10} />
                    <span>45 min</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default AgendaSidebar
