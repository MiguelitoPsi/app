'use client'

import {
  type RemixiconComponentType,
  RiAddLine,
  RiCalendarTodoLine,
  RiGift2Line,
  RiHomeHeartLine,
  RiUser3Line,
} from '@remixicon/react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type React from 'react'
import { useSound } from '@/hooks/useSound'

interface NavItem {
  path: string
  label: string
  ariaLabel: string
  allPaths?: string[] // Para destacar o item em múltiplas rotas relacionadas
  icon: RemixiconComponentType
}

const NAV_ITEMS: NavItem[] = [
  {
    path: '/home',
    label: 'Início',
    ariaLabel: 'Ir para página inicial',

    icon: RiHomeHeartLine,
  },
  {
    path: '/routine',
    allPaths: ['/routine', '/routine/new'],
    label: 'Rotina',
    ariaLabel: 'Ir para rotina de tarefas',
    icon: RiCalendarTodoLine,
  },
  // Central FAB placeholder — rendered separately
  {
    path: '/rewards',
    label: 'Prêmios',
    ariaLabel: 'Ir para loja de prêmios',
    icon: RiGift2Line,
  },
  {
    path: '/pacient/profile',
    label: 'Perfil',
    ariaLabel: 'Ir para seu perfil',
    icon: RiUser3Line,
  },
]

// Items rendered before the central FAB
const LEFT_ITEMS = NAV_ITEMS.slice(0, 2)
// Items rendered after the central FAB
const RIGHT_ITEMS = NAV_ITEMS.slice(2)

export const BottomNav: React.FC = () => {
  const router = useRouter()
  const pathname = usePathname()
  const { playNavigation } = useSound()

  const isActive = (path: string, allPaths?: string[]) => {
    if (allPaths) {
      return allPaths.includes(pathname)
    }
    return pathname === path
  }

  const fabAriaLabel =
    pathname === '/routine'
      ? 'Adicionar nova tarefa'
      : pathname === '/rewards'
        ? 'Adicionar nova recompensa'
        : 'Abrir diário de pensamentos'

  const fabSrText =
    pathname === '/routine'
      ? 'Nova tarefa'
      : pathname === '/rewards'
        ? 'Nova recompensa'
        : 'Novo registro no diário'

  const handleFabClick = () => {
    playNavigation()
    if (pathname === '/routine') {
      router.push('/routine/new')
    } else if (pathname === '/rewards') {
      window.dispatchEvent(new CustomEvent('toggleRewardsAdd'))
    } else {
      router.push('/journal')
    }
  }

  const renderNavButton = ({ path, label, ariaLabel, icon: Icon }: NavItem) => (
    <Link
      aria-current={
        isActive(path, NAV_ITEMS.find((item) => item.path === path)?.allPaths) ? 'page' : undefined
      }
      aria-label={ariaLabel}
      className='group relative flex items-center justify-center rounded-full p-2 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B87C4C] focus-visible:ring-offset-2'
      href={path}
      key={path}
      onClick={() => playNavigation()}
      prefetch
    >
      <div
        className={`flex flex-col items-center gap-1 rounded-full px-4 py-1.5 transition-all duration-300 ${
          isActive(path, NAV_ITEMS.find((item) => item.path === path)?.allPaths)
            ? 'bg-[#c7aa97]/25 '
            : ''
        }`}
      >
        <Icon
          className='transition-transform duration-300 group-active:scale-90'
          color={
            isActive(path, NAV_ITEMS.find((item) => item.path === path)?.allPaths)
              ? '#B87C4C'
              : '#C4A484'
          }
          size={22}
        />
        {isActive(path, NAV_ITEMS.find((item) => item.path === path)?.allPaths) && (
          <div className='size-1 bg-[#C4A484] rounded-full' />
        )}
      </div>
    </Link>
  )

  return (
    <nav
      aria-label='Navegação principal'
      className='fixed bottom-4 left-1/2 transform -translate-x-1/2 rounded-full z-50 h-16 w-full max-w-[428px]  bg-[#C4A484]/10 px-4 transition-colors duration-300 '
    >
      <div className='relative flex h-full items-center justify-around'>
        {LEFT_ITEMS.map(renderNavButton)}

        {/* Central Floating Action Button */}
        <div className=' group relative '>
          <div
            aria-hidden='true'
            className='absolute inset-0 rounded-full bg-[#a1c797] opacity-25 blur-xl transition-opacity duration-300 group-hover:opacity-40'
          />
          <button
            aria-label={fabAriaLabel}
            className=' relative flex h-12 w-12 items-center justify-center rounded-full  shadow-[#7f9c77]  bg-[#a1c797] text-white transition-all ring-4 ring-[#a1c797]/40 duration-300 hover:scale-105 active:scale-95  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a1c797] focus-visible:ring-offset-4'
            onClick={handleFabClick}
            type='button'
          >
            <RiAddLine aria-hidden='true' className='sm:hidden' size={26} />
            <RiAddLine aria-hidden='true' className='hidden sm:block' size={30} />
            <span className='sr-only'>{fabSrText}</span>
          </button>
        </div>

        {RIGHT_ITEMS.map(renderNavButton)}
      </div>
    </nav>
  )
}
