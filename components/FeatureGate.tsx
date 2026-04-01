'use client'

import { RiVipCrownLine } from '@remixicon/react'
import { useSubscription } from '@/hooks/useSubscription'

interface FeatureGateProps {
  /** The feature key to check against the plan's features */
  feature: string
  /** Content to render when the feature is available */
  children: React.ReactNode
  /** Optional: Custom fallback when feature is not available */
  fallback?: React.ReactNode
  /** If true, shows a disabled version with upgrade badge instead of hiding */
  showUpgradeBadge?: boolean
}

/**
 * Component that conditionally renders children based on whether a feature
 * is enabled in the therapist's current subscription plan.
 *
 * Usage:
 * ```tsx
 * <FeatureGate feature="ai_analysis">
 *   <AIAnalysisPanel />
 * </FeatureGate>
 *
 * <FeatureGate feature="transcription" showUpgradeBadge>
 *   <TranscriptionButton />
 * </FeatureGate>
 * ```
 */
export function FeatureGate({
  feature,
  children,
  fallback,
  showUpgradeBadge = false,
}: FeatureGateProps) {
  const { hasFeature, isLoading, isActive } = useSubscription()

  // While loading, show nothing to avoid layout shift
  if (isLoading) return null

  // If no active subscription, block all features
  if (!isActive) {
    if (fallback) return <>{fallback}</>
    if (showUpgradeBadge) {
      return (
        <div className='relative opacity-50 pointer-events-none select-none'>
          {children}
          <div className='absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm'>
            <RiVipCrownLine className='w-3 h-3' />
            PRO
          </div>
        </div>
      )
    }
    return null
  }

  // Check the specific feature
  if (!hasFeature(feature)) {
    if (fallback) return <>{fallback}</>
    if (showUpgradeBadge) {
      return (
        <div className='relative opacity-50 pointer-events-none select-none'>
          {children}
          <div className='absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm'>
            <RiVipCrownLine className='w-3 h-3' />
            PRO
          </div>
        </div>
      )
    }
    return null
  }

  return <>{children}</>
}
