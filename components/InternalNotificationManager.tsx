'use client'

import { Bell } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { trpc } from '@/lib/trpc/client'

export function InternalNotificationManager() {
  const router = useRouter()
  const [lastCount, setLastCount] = useState(0)
  const [activeNotification, setActiveNotification] = useState<{
    id: string
    title: string
    message: string
  } | null>(null)

  // Poll for unread count every 30 seconds
  const { data: unreadCount = 0, refetch } = trpc.notification.getUnreadCount.useQuery(undefined, {
    refetchInterval: 30_000,
  })

  // Poll for latest notification if count increased
  const { data: latestNotifications } = trpc.notification.getAll.useQuery(undefined, {
    enabled: unreadCount > lastCount,
  })

  useEffect(() => {
    if (unreadCount > lastCount && latestNotifications && latestNotifications.length > 0) {
      console.log('InternalNotificationManager: New notification detected!', {
        unreadCount,
        lastCount,
        latest: latestNotifications[0],
      })
      const newest = latestNotifications[0]
      // Only show if it's recent (created in the last minute) to avoid old notifications popping up on refresh
      const isRecent = new Date(newest.createdAt).getTime() > Date.now() - 60_000

      if (isRecent && !newest.isRead) {
        console.log('InternalNotificationManager: Displaying toast')
        setActiveNotification({
          id: newest.id,
          title: newest.title,
          message: newest.message,
        })

        // Auto-dismiss after 5 seconds
        setTimeout(() => setActiveNotification(null), 5000)
      } else {
        console.log('InternalNotificationManager: Notification too old or read', {
          isRecent,
          createdAt: newest.createdAt,
        })
      }
    }
    setLastCount(unreadCount)
  }, [unreadCount, lastCount, latestNotifications])

  if (!activeNotification) return null

  return (
    <div className='pointer-events-none fixed top-4 right-0 left-0 z-50 flex justify-center px-4'>
      <div
        className='pointer-events-auto flex w-full max-w-sm animate-in slide-in-from-top-4 flex-col gap-1 rounded-xl border border-violet-100 bg-white p-4 shadow-xl shadow-violet-100/50 dark:border-violet-900/30 dark:bg-slate-900 dark:shadow-none'
        onClick={() => {
          setActiveNotification(null)
          // Mark as read or navigate if needed
        }}
      >
        <div className='flex items-start gap-3'>
          <div className='rounded-full bg-violet-100 p-2 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400'>
            <Bell size={20} />
          </div>
          <div className='flex-1'>
            <h4 className='font-bold text-slate-900 text-sm dark:text-white'>
              {activeNotification.title}
            </h4>
            <p className='text-slate-500 text-xs dark:text-slate-400'>
              {activeNotification.message}
            </p>
          </div>
          <button
            className='-m-1 p-1 text-slate-400 hover:text-slate-600 dark:text-slate-500'
            onClick={(e) => {
              e.stopPropagation()
              setActiveNotification(null)
            }}
          >
            <span className='sr-only'>Fechar</span>
            <svg
              fill='none'
              height='16'
              stroke='currentColor'
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              viewBox='0 0 24 24'
              width='16'
              xmlns='http://www.w3.org/2000/svg'
            >
              <line x1='18' x2='6' y1='6' y2='18' />
              <line x1='6' x2='18' y1='6' y2='18' />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
