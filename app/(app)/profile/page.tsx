'use client'

import { useRouter } from 'next/navigation'
import type { Tab } from '@/types'
import { ProfileView } from '@/views/ProfileView'

export default function ProfilePage() {
  const router = useRouter()

  const handleNavigate = (tab: Tab) => {
    const routes: Record<string, string> = {
      home: '/home',
      routine: '/routine',
      add: '/journal',
      rewards: '/rewards',
      profile: '/profile',
      meditation: '/meditation',
      dashboard: '/dashboard',
    }
    const route = routes[tab]
    if (route) {
      router.push(route)
    }
  }

  return <ProfileView onNavigate={handleNavigate} />
}
