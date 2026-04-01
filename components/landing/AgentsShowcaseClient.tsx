'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

const AgentsShowcase = dynamic(
  () => import('./AgentsShowcase').then((m) => ({ default: m.AgentsShowcase })),
  { ssr: false }
)

export function AgentsShowcaseClient() {
  return (
    <Suspense
      fallback={
        <div className='flex h-[600px] items-center justify-center bg-white'>
          <div className='h-8 w-8 animate-spin rounded-full border-2 border-[#a1c797] border-t-transparent' />
        </div>
      }
    >
      <AgentsShowcase />
    </Suspense>
  )
}
