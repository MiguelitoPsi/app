'use client'

import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  eachDayOfInterval,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface CalendarProps {
  selectedDate: Date
  onChange: (date: Date) => void
  tasks?: any[]
}

const Calendar: React.FC<CalendarProps> = ({ selectedDate, onChange, tasks = [] }) => {
  const [currentMonth, setCurrentMonth] = React.useState(startOfMonth(selectedDate))

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

  const renderHeader = () => {
    return (
      <div className='flex items-center justify-between px-2 py-2'>
        <div className='flex items-center gap-2'>
          <h2 className='text-lg font-semibold text-white capitalize'>
            {format(currentMonth, 'MMMM', { locale: ptBR })}
          </h2>
          <span className='text-lg font-light text-slate-500'>{format(currentMonth, 'yyyy')}</span>
        </div>
        <div className='flex gap-1'>
          <button
            className='p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors'
            onClick={prevMonth}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            className='p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors'
            onClick={nextMonth}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    )
  }

  const renderDays = () => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    return (
      <div className='grid grid-cols-7 mb-1.5 px-1'>
        {days.map((day) => (
          <div
            key={day}
            className='text-center text-[10px] font-medium text-slate-500 uppercase tracking-wider'
          >
            {day}
          </div>
        ))}
      </div>
    )
  }

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    const calendarDays = eachDayOfInterval({
      start: startDate,
      end: endDate,
    })

    return (
      <div className='grid grid-cols-7 gap-1 px-1'>
        {calendarDays.map((day) => {
          const isSelected = isSameDay(day, selectedDate)
          const isCurrentMonth = isSameMonth(day, monthStart)
          const isToday = isSameDay(day, new Date())

          // Filter tasks for this specific day
          const dayTasks = tasks.filter((task) => {
            if (!task.dueDate) return false
            const taskDate = new Date(task.dueDate)
            return isSameDay(day, taskDate)
          })

          return (
            <div
              className={`
                relative h-12 p-1.5 rounded-xl cursor-pointer transition-all border-2
                ${!isCurrentMonth ? 'opacity-25' : 'opacity-100'}
                ${
                  isSelected
                    ? 'bg-sky-500/20 border-sky-500/50'
                    : 'bg-slate-800/40 border-transparent hover:bg-slate-800/60'
                }
              `}
              key={day.toString()}
              onClick={() => onChange(day)}
            >
              <span
                className={`
                  text-xs font-medium block w-5 h-5 flex items-center justify-center rounded-full
                  ${isSelected ? 'text-sky-400' : isToday ? 'text-emerald-400' : 'text-slate-300'}
                `}
              >
                {format(day, 'd')}
              </span>

              <div className='mt-1 flex flex-col gap-0.5'>
                {dayTasks.slice(0, 2).map((task) => (
                  <div
                    key={task.id}
                    className={`h-1 rounded-full ${
                      task.type === 'session'
                        ? 'bg-sky-500'
                        : task.priority === 'high'
                          ? 'bg-red-500'
                          : task.priority === 'medium'
                            ? 'bg-orange-400'
                            : 'bg-slate-500'
                    }`}
                  />
                ))}
                {dayTasks.length > 2 && (
                  <div className='text-[9px] text-slate-500 pl-1'>+{dayTasks.length - 2}</div>
                )}
              </div>

              {isSelected && (
                <div className='absolute inset-0 rounded-xl ring-2 ring-sky-500/50 pointer-events-none' />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className='bg-slate-900/50 rounded-2xl p-3 backdrop-blur-sm border border-slate-800/50'>
      {renderHeader()}
      {renderDays()}
      {renderCells()}
    </div>
  )
}

export default Calendar
