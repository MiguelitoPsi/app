'use client'

import { trpc } from '@/lib/trpc/client'

/**
 * Hook to get the current therapist's subscription status, plan, and features.
 * Use in therapist-facing pages to check subscription state and feature access.
 */
export function useSubscription() {
  const { data, isLoading, error, refetch } = trpc.therapistSubscription.getMySubscription.useQuery(
    undefined,
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
      retry: 1,
    }
  )

  const isActive = data?.status === 'active' || data?.status === 'past_due'
  const isPastDue = data?.status === 'past_due'
  const isExpired = data?.status === 'expired' || data?.status === 'cancelled'
  const hasSubscription = data?.status !== 'none'

  const subscription = data?.status === 'none' ? null : data?.subscription
  const features = subscription?.features ?? null

  function checkFeature(key: string): boolean | number {
    if (!features) return false
    const value = features[key]
    if (value === undefined) return false
    return value
  }

  function hasFeature(key: string): boolean {
    const value = checkFeature(key)
    if (typeof value === 'boolean') return value
    if (typeof value === 'number') return value > 0
    return false
  }

  return {
    data,
    subscription,
    features,
    isLoading,
    error,
    refetch,
    isActive,
    isPastDue,
    isExpired,
    hasSubscription,
    checkFeature,
    hasFeature,
  }
}
