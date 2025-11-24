'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)

  const { data: notifications = [] } = trpc.notification.getAll.useQuery()
  const { data: unreadCount = 0 } = trpc.notification.getUnreadCount.useQuery()
  const markAsReadMutation = trpc.notification.markAsRead.useMutation()
  const markAllAsReadMutation = trpc.notification.markAllAsRead.useMutation()
  const utils = trpc.useUtils()

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsReadMutation.mutateAsync({ id: notificationId })
    await utils.notification.getAll.invalidate()
    await utils.notification.getUnreadCount.invalidate()
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsReadMutation.mutateAsync()
    await utils.notification.getAll.invalidate()
    await utils.notification.getUnreadCount.invalidate()
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'badge_unlocked':
        return '🏆'
      case 'reward_approved':
        return '🎁'
      case 'streak_milestone':
        return '🔥'
      case 'level_up':
        return '⬆️'
      default:
        return '📢'
    }
  }

  return (
    <div className='relative'>
      <button
        aria-label='Notificações'
        className='relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-full'
        onClick={() => setIsOpen(!isOpen)}
        type='button'
      >
        <svg className='h-6 w-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path
            d='M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
          />
        </svg>
        {unreadCount > 0 && (
          <span className='absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full'>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className='fixed inset-0 z-10'
            onClick={() => setIsOpen(false)}
            onKeyDown={(e) => e.key === 'Escape' && setIsOpen(false)}
          />
          <div className='absolute right-0 z-20 mt-2 w-80 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 max-h-96 overflow-y-auto'>
            <div className='p-4 border-b border-gray-200 flex items-center justify-between'>
              <h3 className='text-lg font-semibold text-gray-900'>Notificações</h3>
              {unreadCount > 0 && (
                <button
                  className='text-xs text-indigo-600 hover:text-indigo-800'
                  onClick={handleMarkAllAsRead}
                  type='button'
                >
                  Marcar todas como lidas
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className='p-8 text-center text-gray-500'>
                <svg
                  className='mx-auto h-12 w-12 text-gray-400'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    d='M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                  />
                </svg>
                <p className='mt-2'>Nenhuma notificação</p>
              </div>
            ) : (
              <div className='divide-y divide-gray-200'>
                {notifications.map((notification) => (
                  <div
                    className={`p-4 hover:bg-gray-50 transition cursor-pointer ${
                      notification.isRead ? '' : 'bg-indigo-50'
                    }`}
                    key={notification.id}
                    onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && !notification.isRead && handleMarkAsRead(notification.id)
                    }
                    role='button'
                    tabIndex={0}
                  >
                    <div className='flex items-start space-x-3'>
                      <span className='text-2xl'>{getNotificationIcon(notification.type)}</span>
                      <div className='flex-1 min-w-0'>
                        <p
                          className={`text-sm font-medium ${
                            notification.isRead ? 'text-gray-700' : 'text-gray-900'
                          }`}
                        >
                          {notification.title}
                        </p>
                        <p className='text-sm text-gray-600 mt-1'>{notification.message}</p>
                        <p className='text-xs text-gray-400 mt-1'>
                          {new Date(notification.createdAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <div className='flex-shrink-0'>
                          <div className='h-2 w-2 bg-indigo-600 rounded-full' />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
