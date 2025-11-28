'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { useState } from 'react'
import superjson from 'superjson'
import { trpc } from './client'

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes - dados ficam frescos por mais tempo
            gcTime: 10 * 60 * 1000, // 10 minutes - manter cache por mais tempo
            refetchOnWindowFocus: false, // Não refetch ao focar na janela
            refetchOnReconnect: false, // Não refetch ao reconectar
            retry: 1, // Apenas 1 retry em caso de erro
          },
          mutations: {
            retry: 0, // Não retry em mutations
          },
        },
      })
  )

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url:
            typeof window !== 'undefined'
              ? '/api/trpc'
              : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/trpc`,
          transformer: superjson,
          headers() {
            return {
              'Content-Type': 'application/json',
            }
          },
        }),
      ],
    })
  )

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  )
}
