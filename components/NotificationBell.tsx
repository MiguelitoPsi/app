'use client'

import { useState } from 'react'
import { useSound } from '@/hooks/useSound'
import { trpc } from '@/lib/trpc/client'
import { getIconByKey } from '@/lib/utils/icon-map'

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const { playClick } = useSound()

  const { data: notifications = [] } = trpc.notification.getAll.useQuery()
  const { data: unreadCount = 0 } = trpc.notification.getUnreadCount.useQuery()
  const markAsReadMutation = trpc.notification.markAsRead.useMutation()
  const markAllAsReadMutation = trpc.notification.markAllAsRead.useMutation()
  const utils = trpc.useUtils()

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsReadMutation.mutateAsync({ id: notificationId })
    // Invalidate in background without blocking
    utils.notification.getAll.invalidate()
    utils.notification.getUnreadCount.invalidate()
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsReadMutation.mutateAsync()
    // Invalidate in background without blocking
    utils.notification.getAll.invalidate()
    utils.notification.getUnreadCount.invalidate()
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'badge_unlocked':
        return 'achievements'
      case 'reward_approved':
        return 'reward_gift'
      case 'streak_milestone':
        return 'fire'
      case 'level_up':
        return 'evolution'
      default:
        return 'notification'
    }
  }

  return (
    <div className='relative'>
      <button
        aria-expanded={isOpen}
        aria-haspopup='true'
        aria-label={`Notificações${unreadCount > 0 ? `, ${unreadCount} não lidas` : ''}`}
        className='relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-full'
        onClick={() => {
          playClick()
          setIsOpen(!isOpen)
        }}
        type='button'
      >
        <svg
          aria-hidden='true'
          className='h-6 w-6'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            d='M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
          />
        </svg>
        {unreadCount > 0 && (
          <span
            aria-hidden='true'
            className='absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full'
          >
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div aria-hidden='true' className='fixed inset-0 z-10' onClick={() => setIsOpen(false)} />
          <div
            aria-label='Menu de notificações'
            className='absolute right-0 z-20 mt-2 w-80 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 max-h-96 overflow-y-auto'
            role='menu'
          >
            <div className='p-4 border-b border-gray-200 flex items-center justify-between'>
              <h3 className='text-lg font-semibold text-gray-900' id='notifications-title'>
                Notificações
              </h3>
              {unreadCount > 0 && (
                <button
                  className='text-xs text-indigo-600 hover:text-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded'
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
                  aria-hidden='true'
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
              <ul aria-label='Lista de notificações' className='divide-y divide-gray-200 list-none'>
                {notifications.map((notification) => (
                  <button
                    aria-label={`${notification.isRead ? '' : 'Não lida: '}${notification.title}`}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition ${
                      notification.isRead ? '' : 'bg-indigo-50'
                    } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500`}
                    key={notification.id}
                    onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                    type='button'
                  >
                    <div className='flex items-start space-x-3'>
                      <span aria-hidden='true' className='shrink-0 mt-1'>
                        {(() => {
                          const Icon = getIconByKey(getNotificationIcon(notification.type))
                          return <Icon className='h-5 w-5 text-sky-500' />
                        })()}
                      </span>
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
                        <div aria-hidden='true' className='flex-shrink-0'>
                          <div className='h-2 w-2 bg-indigo-600 rounded-full' />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}
